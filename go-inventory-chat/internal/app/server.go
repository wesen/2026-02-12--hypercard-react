package app

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"hypercard/go-inventory-chat/internal/chat"
	"hypercard/go-inventory-chat/internal/store"
)

const (
	pendingTTL      = 2 * time.Minute
	maxRequestBytes = 1 << 20
)

type plannerRunner func(ctx context.Context, prompt string) (chat.PlannedResponse, error)

type PlannerMiddleware func(next plannerRunner) plannerRunner

type HTTPMiddleware func(next http.Handler) http.Handler

type ServerOptions struct {
	AllowOrigin       string
	TokenDelay        time.Duration
	TimelineStore     *store.SQLiteStore
	HTTPMiddlewares   []HTTPMiddleware
	PlannerMiddleware []PlannerMiddleware
}

type pendingStream struct {
	ConversationID     string
	MessageID          string
	UserMessageID      string
	AssistantMessageID string
	Response           chat.PlannedResponse
	CreatedAt          time.Time
}

type Server struct {
	plan     plannerRunner
	opts     ServerOptions
	timeline *store.SQLiteStore

	mu      sync.Mutex
	pending map[string]pendingStream

	upgrader websocket.Upgrader
}

type chatRequestBody struct {
	ConvID string `json:"conv_id"`
	Prompt string `json:"prompt"`
}

type chatResponseBody struct {
	ConvID    string `json:"conv_id"`
	RequestID string `json:"request_id"`
	Status    string `json:"status"`
	StreamURL string `json:"stream_url"`
}

func NewServer(planner *chat.Planner, opts ServerOptions) *Server {
	if planner == nil {
		panic("planner is required")
	}
	if opts.TimelineStore == nil {
		panic("timeline store is required")
	}
	if strings.TrimSpace(opts.AllowOrigin) == "" {
		opts.AllowOrigin = "*"
	}
	if opts.TokenDelay <= 0 {
		opts.TokenDelay = 16 * time.Millisecond
	}

	plannerMiddlewares := append([]PlannerMiddleware{
		StructuredExtractionMiddleware(),
		ArtifactValidationMiddleware(),
	}, opts.PlannerMiddleware...)

	s := &Server{
		plan: chainPlanner(func(ctx context.Context, prompt string) (chat.PlannedResponse, error) {
			return planner.Plan(ctx, prompt)
		}, plannerMiddlewares...),
		opts:     opts,
		timeline: opts.TimelineStore,
		pending:  map[string]pendingStream{},
	}

	allowOrigin := strings.TrimSpace(opts.AllowOrigin)
	s.upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			if allowOrigin == "*" {
				return true
			}
			origin := strings.TrimSpace(r.Header.Get("Origin"))
			if origin == "" {
				return true
			}
			return origin == allowOrigin
		},
	}
	return s
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/chat/completions", s.handleCompletions)
	mux.HandleFunc("/chat", s.handleChat)
	mux.HandleFunc("/api/timeline", s.handleTimeline)
	mux.HandleFunc("/ws", s.handleWS)
	mux.HandleFunc("/healthz", s.handleHealth)

	defaultMws := []HTTPMiddleware{
		recoveryMiddleware(),
		requestLogMiddleware(),
	}
	return chainHTTPMiddlewares(mux, append(defaultMws, s.opts.HTTPMiddlewares...)...)
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"ok":true}`))
}

func (s *Server) handleChat(w http.ResponseWriter, r *http.Request) {
	s.writeCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req chatRequestBody
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBytes)).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	conversationID := strings.TrimSpace(req.ConvID)
	if conversationID == "" {
		conversationID = "default"
	}
	prompt := strings.TrimSpace(req.Prompt)
	if prompt == "" {
		http.Error(w, "missing prompt", http.StatusBadRequest)
		return
	}

	resp, err := s.submitPrompt(r.Context(), r, conversationID, prompt)
	if err != nil {
		log.Printf("submit prompt failed: %v", err)
		http.Error(w, "failed to prepare completion", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(chatResponseBody{
		ConvID:    resp.ConversationID,
		RequestID: resp.MessageID,
		Status:    "queued",
		StreamURL: resp.StreamURL,
	})
}

func (s *Server) handleCompletions(w http.ResponseWriter, r *http.Request) {
	s.writeCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req chat.CompletionRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxRequestBytes)).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	conversationID := strings.TrimSpace(req.ConversationID)
	if conversationID == "" {
		conversationID = "default"
	}
	prompt := lastUserPrompt(req.Messages)
	if strings.TrimSpace(prompt) == "" {
		http.Error(w, "at least one user message is required", http.StatusBadRequest)
		return
	}

	resp, err := s.submitPrompt(r.Context(), r, conversationID, prompt)
	if err != nil {
		log.Printf("submit prompt failed: %v", err)
		http.Error(w, "failed to prepare completion", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func (s *Server) submitPrompt(ctx context.Context, r *http.Request, conversationID string, prompt string) (chat.CompletionResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	planned, err := s.plan(ctx, prompt)
	if err != nil {
		return chat.CompletionResponse{}, err
	}

	messageID := "msg-" + uuid.NewString()
	userMessageID := "user-" + uuid.NewString()
	assistantMessageID := "ai-" + messageID

	now := time.Now().UTC()

	if err := s.timeline.UpsertTimelineMessage(ctx, store.TimelineMessageUpsert{
		ConversationID: conversationID,
		MessageID:      userMessageID,
		Role:           "user",
		Text:           prompt,
		Status:         "complete",
		UpdatedAt:      now,
	}); err != nil {
		return chat.CompletionResponse{}, err
	}

	if err := s.timeline.UpsertTimelineMessage(ctx, store.TimelineMessageUpsert{
		ConversationID: conversationID,
		MessageID:      assistantMessageID,
		Role:           "ai",
		Text:           "",
		Status:         "streaming",
		UpdatedAt:      now,
	}); err != nil {
		return chat.CompletionResponse{}, err
	}

	if _, err := s.appendEvent(ctx, conversationID, messageID, chat.SEMEventMessageUser, map[string]any{
		"messageId": userMessageID,
		"role":      "user",
		"text":      prompt,
	}, map[string]any{"source": "api.chat.completions"}); err != nil {
		return chat.CompletionResponse{}, err
	}

	s.storePending(messageID, pendingStream{
		ConversationID:     conversationID,
		MessageID:          messageID,
		UserMessageID:      userMessageID,
		AssistantMessageID: assistantMessageID,
		Response:           planned,
		CreatedAt:          now,
	})

	streamURL, err := makeStreamURL(r, conversationID, messageID)
	if err != nil {
		return chat.CompletionResponse{}, err
	}
	return chat.CompletionResponse{
		ConversationID: conversationID,
		MessageID:      messageID,
		StreamURL:      streamURL,
	}, nil
}

func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	messageID := strings.TrimSpace(r.URL.Query().Get("message_id"))
	if messageID == "" {
		http.Error(w, "missing message_id", http.StatusBadRequest)
		return
	}

	pending, ok := s.popPending(messageID)
	if !ok {
		http.Error(w, "unknown message_id", http.StatusNotFound)
		return
	}

	if conversationID := strings.TrimSpace(r.URL.Query().Get("conversation_id")); conversationID != "" && conversationID != pending.ConversationID {
		http.Error(w, "conversation mismatch", http.StatusBadRequest)
		return
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade failed: %v", err)
		return
	}
	defer conn.Close()
	_ = conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	_ = conn.SetWriteDeadline(time.Now().Add(60 * time.Second))

	ctx := r.Context()
	textSoFar := ""
	artifacts := []chat.Artifact{}

	for _, token := range tokenize(pending.Response.Text) {
		textSoFar += token
		if err := s.timeline.UpsertTimelineMessage(ctx, store.TimelineMessageUpsert{
			ConversationID: pending.ConversationID,
			MessageID:      pending.AssistantMessageID,
			Role:           "ai",
			Text:           textSoFar,
			Status:         "streaming",
			ArtifactsJSON:  mustJSON(artifacts),
			UpdatedAt:      time.Now().UTC(),
		}); err != nil {
			s.writeWSError(ctx, conn, pending, "failed to persist assistant token")
			return
		}

		envelope, err := s.appendEvent(ctx, pending.ConversationID, pending.MessageID, chat.SEMEventMessageToken, map[string]any{
			"content":   token,
			"messageId": pending.AssistantMessageID,
		}, map[string]any{"stage": "token"})
		if err != nil {
			s.writeWSError(ctx, conn, pending, "failed to append token event")
			return
		}
		if err := conn.WriteJSON(envelope); err != nil {
			s.writeWSError(ctx, conn, pending, "websocket token write failure")
			return
		}
		time.Sleep(s.opts.TokenDelay)
	}

	for i := range pending.Response.Artifacts {
		artifact := pending.Response.Artifacts[i]
		if err := validateArtifact(artifact); err != nil {
			s.writeWSError(ctx, conn, pending, "artifact validation failed: "+err.Error())
			continue
		}

		artifacts = append(artifacts, artifact)
		if err := s.timeline.UpsertTimelineMessage(ctx, store.TimelineMessageUpsert{
			ConversationID: pending.ConversationID,
			MessageID:      pending.AssistantMessageID,
			Role:           "ai",
			Text:           textSoFar,
			Status:         "streaming",
			ArtifactsJSON:  mustJSON(artifacts),
			UpdatedAt:      time.Now().UTC(),
		}); err != nil {
			s.writeWSError(ctx, conn, pending, "failed to persist artifact")
			return
		}

		envelope, err := s.appendEvent(ctx, pending.ConversationID, pending.MessageID, chat.SEMEventMessageArtifact, map[string]any{
			"messageId": pending.AssistantMessageID,
			"artifact":  artifactToMap(artifact),
		}, map[string]any{"stage": "artifact"})
		if err != nil {
			s.writeWSError(ctx, conn, pending, "failed to append artifact event")
			return
		}
		if err := conn.WriteJSON(envelope); err != nil {
			s.writeWSError(ctx, conn, pending, "websocket artifact write failure")
			return
		}
	}

	if err := s.timeline.UpsertTimelineMessage(ctx, store.TimelineMessageUpsert{
		ConversationID: pending.ConversationID,
		MessageID:      pending.AssistantMessageID,
		Role:           "ai",
		Text:           textSoFar,
		Status:         "complete",
		ArtifactsJSON:  mustJSON(artifacts),
		ActionsJSON:    mustJSON(pending.Response.Actions),
		UpdatedAt:      time.Now().UTC(),
	}); err != nil {
		s.writeWSError(ctx, conn, pending, "failed to persist done state")
		return
	}

	doneEnvelope, err := s.appendEvent(ctx, pending.ConversationID, pending.MessageID, chat.SEMEventMessageDone, map[string]any{
		"messageId": pending.AssistantMessageID,
		"actions":   actionsToMaps(pending.Response.Actions),
	}, map[string]any{"stage": "done"})
	if err != nil {
		s.writeWSError(ctx, conn, pending, "failed to append done event")
		return
	}
	if err := conn.WriteJSON(doneEnvelope); err != nil {
		log.Printf("ws write done failed: %v", err)
	}
}

func (s *Server) writeWSError(ctx context.Context, conn *websocket.Conn, pending pendingStream, errMessage string) {
	_ = s.timeline.UpsertTimelineMessage(ctx, store.TimelineMessageUpsert{
		ConversationID: pending.ConversationID,
		MessageID:      pending.AssistantMessageID,
		Role:           "ai",
		Text:           errMessage,
		Status:         "error",
		UpdatedAt:      time.Now().UTC(),
	})
	envelope, err := s.appendEvent(ctx, pending.ConversationID, pending.MessageID, chat.SEMEventMessageError, map[string]any{
		"messageId": pending.AssistantMessageID,
		"error":     errMessage,
	}, map[string]any{"stage": "error"})
	if err != nil {
		return
	}
	_ = conn.WriteJSON(envelope)
}

func (s *Server) handleTimeline(w http.ResponseWriter, r *http.Request) {
	s.writeCORSHeaders(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	conversationID := strings.TrimSpace(r.URL.Query().Get("conversation_id"))
	if conversationID == "" {
		conversationID = strings.TrimSpace(r.URL.Query().Get("conv_id"))
	}
	if conversationID == "" {
		conversationID = "default"
	}

	sinceSeq := uint64(0)
	if raw := strings.TrimSpace(r.URL.Query().Get("since_seq")); raw != "" {
		if parsed, err := strconv.ParseUint(raw, 10, 64); err == nil {
			sinceSeq = parsed
		}
	}
	limit := 0
	if raw := strings.TrimSpace(r.URL.Query().Get("limit")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	snapshot, err := s.timeline.GetTimelineSnapshot(r.Context(), conversationID, sinceSeq, limit)
	if err != nil {
		http.Error(w, "failed to load timeline", http.StatusInternalServerError)
		return
	}

	messages := make([]chat.TimelineMessage, 0, len(snapshot.Messages))
	for _, row := range snapshot.Messages {
		artifacts := []chat.Artifact{}
		actions := []chat.Action{}
		_ = json.Unmarshal([]byte(row.ArtifactsJSON), &artifacts)
		_ = json.Unmarshal([]byte(row.ActionsJSON), &actions)
		messages = append(messages, chat.TimelineMessage{
			ID:        row.MessageID,
			Role:      row.Role,
			Text:      row.Text,
			Status:    row.Status,
			Artifacts: artifacts,
			Actions:   actions,
			UpdatedAt: row.UpdatedAt,
		})
	}

	events := make([]chat.SEMEnvelope, 0, len(snapshot.Events))
	for _, row := range snapshot.Events {
		events = append(events, chat.SEMEnvelope{
			SEM: true,
			Event: chat.SEMEvent{
				Type:     row.EventType,
				ID:       row.EventID,
				Seq:      row.Seq,
				StreamID: row.StreamID,
				Data:     cloneMap(row.Data),
				Metadata: cloneMap(row.Metadata),
			},
		})
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(chat.TimelineResponse{
		ConversationID: conversationID,
		Messages:       messages,
		Events:         events,
		LastSeq:        snapshot.LastSeq,
	})
}

func (s *Server) appendEvent(ctx context.Context, conversationID, streamID, eventType string, data, metadata map[string]any) (chat.SEMEnvelope, error) {
	metadata = cloneMap(metadata)
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadata["conversationId"] = conversationID
	metadata["emittedAt"] = time.Now().UTC().Format(time.RFC3339Nano)

	record, err := s.timeline.AppendTimelineEvent(ctx, store.TimelineEventAppend{
		ConversationID: conversationID,
		EventType:      eventType,
		StreamID:       streamID,
		Data:           cloneMap(data),
		Metadata:       metadata,
		CreatedAt:      time.Now().UTC(),
	})
	if err != nil {
		return chat.SEMEnvelope{}, err
	}
	return chat.SEMEnvelope{
		SEM: true,
		Event: chat.SEMEvent{
			Type:     record.EventType,
			ID:       record.EventID,
			Seq:      record.Seq,
			StreamID: record.StreamID,
			Data:     cloneMap(record.Data),
			Metadata: cloneMap(record.Metadata),
		},
	}, nil
}

func (s *Server) writeCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", s.opts.AllowOrigin)
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-Idempotency-Key, X-Request-ID")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

func (s *Server) storePending(messageID string, data pendingStream) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pending[messageID] = data
	cutoff := time.Now().Add(-pendingTTL)
	for key, item := range s.pending {
		if item.CreatedAt.Before(cutoff) {
			delete(s.pending, key)
		}
	}
}

func (s *Server) popPending(messageID string) (pendingStream, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	item, ok := s.pending[messageID]
	if ok {
		delete(s.pending, messageID)
	}
	return item, ok
}

func lastUserPrompt(messages []chat.Message) string {
	for i := len(messages) - 1; i >= 0; i-- {
		if strings.EqualFold(strings.TrimSpace(messages[i].Role), "user") {
			return messages[i].Text
		}
	}
	return ""
}

func makeStreamURL(r *http.Request, conversationID, messageID string) (string, error) {
	if r == nil {
		return "", errors.New("request is nil")
	}
	host := strings.TrimSpace(r.Host)
	if host == "" {
		return "", errors.New("request host is empty")
	}

	scheme := "ws"
	if r.TLS != nil || strings.EqualFold(strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")), "https") {
		scheme = "wss"
	}

	q := url.Values{}
	q.Set("conversation_id", conversationID)
	q.Set("message_id", messageID)
	return fmt.Sprintf("%s://%s/ws?%s", scheme, host, q.Encode()), nil
}

var tokenRe = regexp.MustCompile(`\S+\s*`)

func tokenize(text string) []string {
	trimmed := strings.TrimSpace(text)
	if trimmed == "" {
		return nil
	}
	tokens := tokenRe.FindAllString(trimmed, -1)
	if len(tokens) == 0 {
		return []string{trimmed}
	}
	return tokens
}

func mustJSON(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		return "[]"
	}
	return string(b)
}

func actionsToMaps(actions []chat.Action) []map[string]any {
	if len(actions) == 0 {
		return nil
	}
	out := make([]map[string]any, 0, len(actions))
	for _, action := range actions {
		out = append(out, map[string]any{
			"label":  action.Label,
			"action": cloneMap(action.Action),
		})
	}
	return out
}

func artifactToMap(artifact chat.Artifact) map[string]any {
	out := map[string]any{
		"kind": artifact.Kind,
		"id":   artifact.ID,
	}
	if artifact.WidgetType != "" {
		out["widgetType"] = artifact.WidgetType
	}
	if artifact.Label != "" {
		out["label"] = artifact.Label
	}
	if artifact.Props != nil {
		out["props"] = cloneMap(artifact.Props)
	}
	if artifact.CardID != "" {
		out["cardId"] = artifact.CardID
	}
	if artifact.Title != "" {
		out["title"] = artifact.Title
	}
	if artifact.Icon != "" {
		out["icon"] = artifact.Icon
	}
	if artifact.Code != "" {
		out["code"] = artifact.Code
	}
	if artifact.DedupeKey != "" {
		out["dedupeKey"] = artifact.DedupeKey
	}
	if artifact.Version > 0 {
		out["version"] = artifact.Version
	}
	if artifact.Policy != nil {
		out["policy"] = cloneMap(artifact.Policy)
	}
	return out
}

func cloneMap(input map[string]any) map[string]any {
	if len(input) == 0 {
		return nil
	}
	out := make(map[string]any, len(input))
	for k, v := range input {
		out[k] = v
	}
	return out
}

func chainPlanner(base plannerRunner, mws ...PlannerMiddleware) plannerRunner {
	out := base
	for i := len(mws) - 1; i >= 0; i-- {
		out = mws[i](out)
	}
	return out
}

func chainHTTPMiddlewares(h http.Handler, mws ...HTTPMiddleware) http.Handler {
	out := h
	for i := len(mws) - 1; i >= 0; i-- {
		out = mws[i](out)
	}
	return out
}

func recoveryMiddleware() HTTPMiddleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					log.Printf("panic recovered: %v", rec)
					http.Error(w, "internal server error", http.StatusInternalServerError)
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}

func requestLogMiddleware() HTTPMiddleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			requestID := strings.TrimSpace(r.Header.Get("X-Request-ID"))
			if requestID == "" {
				requestID = "req-" + uuid.NewString()
			}
			start := time.Now()
			r2 := r.WithContext(context.WithValue(r.Context(), requestIDContextKey{}, requestID))
			w.Header().Set("X-Request-ID", requestID)
			next.ServeHTTP(w, r2)
			log.Printf("request id=%s method=%s path=%s duration=%s", requestID, r.Method, r.URL.Path, time.Since(start))
		})
	}
}

type requestIDContextKey struct{}
