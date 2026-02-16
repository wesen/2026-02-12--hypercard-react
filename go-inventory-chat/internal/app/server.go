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
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"

	"hypercard/go-inventory-chat/internal/chat"
)

const (
	pendingTTL           = 2 * time.Minute
	timelineEventLimit   = 512
	timelineMessageLimit = 256
)

type ServerOptions struct {
	AllowOrigin string
	TokenDelay  time.Duration
}

type pendingStream struct {
	ConversationID   string
	AssistantMessage string
	Response         chat.PlannedResponse
	CreatedAt        time.Time
}

type conversationTimeline struct {
	NextSeq   uint64
	Events    []chat.SEMEnvelope
	Messages  []chat.TimelineMessage
	UpdatedAt time.Time
}

type Server struct {
	planner *chat.Planner
	opts    ServerOptions

	mu            sync.Mutex
	pending       map[string]pendingStream
	conversations map[string]*conversationTimeline

	upgrader websocket.Upgrader
}

func NewServer(planner *chat.Planner, opts ServerOptions) *Server {
	if planner == nil {
		panic("planner is required")
	}
	if opts.AllowOrigin == "" {
		opts.AllowOrigin = "*"
	}
	if opts.TokenDelay <= 0 {
		opts.TokenDelay = 16 * time.Millisecond
	}

	s := &Server{
		planner:       planner,
		opts:          opts,
		pending:       map[string]pendingStream{},
		conversations: map[string]*conversationTimeline{},
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
	mux.HandleFunc("/api/timeline", s.handleTimeline)
	mux.HandleFunc("/ws", s.handleWS)
	mux.HandleFunc("/healthz", s.handleHealth)
	return mux
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_, _ = w.Write([]byte(`{"ok":true}`))
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
		conversationID = "default"
	}

	snapshot := s.snapshotTimeline(conversationID)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(snapshot); err != nil {
		log.Printf("encode timeline response: %v", err)
	}
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

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	var req chat.CompletionRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil {
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

	planned, err := s.planner.Plan(ctx, prompt)
	if err != nil {
		log.Printf("planner error: %v", err)
		http.Error(w, "failed to build response", http.StatusInternalServerError)
		return
	}

	messageID := "msg-" + uuid.NewString()
	assistantMessageID := "ai-" + messageID
	s.startAssistantTurn(conversationID, prompt, assistantMessageID, messageID)
	s.storePending(messageID, pendingStream{
		ConversationID:   conversationID,
		AssistantMessage: assistantMessageID,
		Response:         planned,
		CreatedAt:        time.Now(),
	})

	streamURL, err := makeStreamURL(r, conversationID, messageID)
	if err != nil {
		http.Error(w, "failed to build stream URL", http.StatusInternalServerError)
		return
	}

	resp := chat.CompletionResponse{
		ConversationID: conversationID,
		MessageID:      messageID,
		StreamURL:      streamURL,
	}
	w.Header().Set("Content-Type", "application/json")
	enc := json.NewEncoder(w)
	if err := enc.Encode(resp); err != nil {
		log.Printf("encode completion response: %v", err)
	}
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

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	_ = conn.SetReadDeadline(time.Now().Add(30 * time.Second))
	_ = conn.SetWriteDeadline(time.Now().Add(30 * time.Second))

	for _, token := range tokenize(pending.Response.Text) {
		s.appendAssistantToken(pending.ConversationID, pending.AssistantMessage, token)
		envelope := s.appendSEMEvent(
			pending.ConversationID,
			messageID,
			chat.SEMEventMessageToken,
			map[string]any{"content": token},
			nil,
		)
		if err := conn.WriteJSON(envelope); err != nil {
			log.Printf("ws write token failed: %v", err)
			s.failAssistantMessage(pending.ConversationID, pending.AssistantMessage, "WebSocket stream closed while writing token.")
			_ = s.appendSEMEvent(
				pending.ConversationID,
				messageID,
				chat.SEMEventMessageError,
				map[string]any{"error": "websocket token write failure"},
				map[string]any{"stage": "token"},
			)
			return
		}
		time.Sleep(s.opts.TokenDelay)
	}

	for i := range pending.Response.Artifacts {
		artifact := pending.Response.Artifacts[i]
		s.appendAssistantArtifact(pending.ConversationID, pending.AssistantMessage, artifact)
		envelope := s.appendSEMEvent(
			pending.ConversationID,
			messageID,
			chat.SEMEventMessageArtifact,
			map[string]any{"artifact": artifactToMap(artifact)},
			nil,
		)
		if err := conn.WriteJSON(envelope); err != nil {
			log.Printf("ws write artifact failed: %v", err)
			s.failAssistantMessage(pending.ConversationID, pending.AssistantMessage, "WebSocket stream closed while writing artifact.")
			_ = s.appendSEMEvent(
				pending.ConversationID,
				messageID,
				chat.SEMEventMessageError,
				map[string]any{"error": "websocket artifact write failure"},
				map[string]any{"stage": "artifact"},
			)
			return
		}
	}

	s.completeAssistantMessage(pending.ConversationID, pending.AssistantMessage, pending.Response.Actions)
	doneEnvelope := s.appendSEMEvent(
		pending.ConversationID,
		messageID,
		chat.SEMEventMessageDone,
		map[string]any{"actions": actionsToMaps(pending.Response.Actions)},
		nil,
	)
	if err := conn.WriteJSON(doneEnvelope); err != nil {
		log.Printf("ws write done failed: %v", err)
		return
	}
}

func (s *Server) writeCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", s.opts.AllowOrigin)
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

func (s *Server) storePending(messageID string, data pendingStream) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.pending[messageID] = data

	// Garbage collect stale pending entries.
	cutoff := time.Now().Add(-pendingTTL)
	for key, pending := range s.pending {
		if pending.CreatedAt.Before(cutoff) {
			delete(s.pending, key)
		}
	}

	// Garbage collect old conversations to keep memory bounded.
	conversationCutoff := time.Now().Add(-24 * time.Hour)
	for key, timeline := range s.conversations {
		if timeline.UpdatedAt.Before(conversationCutoff) {
			delete(s.conversations, key)
		}
	}
}

func (s *Server) popPending(messageID string) (pendingStream, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	pending, ok := s.pending[messageID]
	if ok {
		delete(s.pending, messageID)
	}
	return pending, ok
}

func (s *Server) startAssistantTurn(conversationID, userPrompt, assistantMessageID, streamID string) {
	now := time.Now().UTC()

	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	userMessageID := "user-" + uuid.NewString()
	timeline.Messages = append(timeline.Messages, chat.TimelineMessage{
		ID:        userMessageID,
		Role:      "user",
		Text:      userPrompt,
		Status:    "complete",
		UpdatedAt: now,
	})
	timeline.Messages = trimTimelineMessages(timeline.Messages)

	timeline.Messages = append(timeline.Messages, chat.TimelineMessage{
		ID:        assistantMessageID,
		Role:      "ai",
		Text:      "",
		Status:    "streaming",
		UpdatedAt: now,
	})
	timeline.Messages = trimTimelineMessages(timeline.Messages)

	_ = s.appendSEMEventLocked(
		timeline,
		conversationID,
		streamID,
		chat.SEMEventMessageUser,
		map[string]any{
			"messageId": userMessageID,
			"role":      "user",
			"text":      userPrompt,
		},
		map[string]any{"source": "http.completions"},
	)
}

func (s *Server) appendAssistantToken(conversationID, assistantMessageID, token string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	msg := findOrCreateAssistantMessage(timeline, assistantMessageID)
	msg.Text += token
	msg.Status = "streaming"
	msg.UpdatedAt = time.Now().UTC()
	timeline.Messages = trimTimelineMessages(timeline.Messages)
}

func (s *Server) appendAssistantArtifact(conversationID, assistantMessageID string, artifact chat.Artifact) {
	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	msg := findOrCreateAssistantMessage(timeline, assistantMessageID)
	msg.Artifacts = append(msg.Artifacts, cloneArtifact(artifact))
	msg.Status = "streaming"
	msg.UpdatedAt = time.Now().UTC()
	timeline.Messages = trimTimelineMessages(timeline.Messages)
}

func (s *Server) completeAssistantMessage(conversationID, assistantMessageID string, actions []chat.Action) {
	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	msg := findOrCreateAssistantMessage(timeline, assistantMessageID)
	msg.Status = "complete"
	msg.Actions = cloneActions(actions)
	msg.UpdatedAt = time.Now().UTC()
	timeline.Messages = trimTimelineMessages(timeline.Messages)
}

func (s *Server) failAssistantMessage(conversationID, assistantMessageID, errorMessage string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	msg := findOrCreateAssistantMessage(timeline, assistantMessageID)
	msg.Status = "error"
	if strings.TrimSpace(msg.Text) == "" {
		msg.Text = errorMessage
	}
	msg.UpdatedAt = time.Now().UTC()
	timeline.Messages = trimTimelineMessages(timeline.Messages)
}

func (s *Server) appendSEMEvent(
	conversationID string,
	streamID string,
	eventType string,
	data map[string]any,
	metadata map[string]any,
) chat.SEMEnvelope {
	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	return s.appendSEMEventLocked(timeline, conversationID, streamID, eventType, data, metadata)
}

func (s *Server) appendSEMEventLocked(
	timeline *conversationTimeline,
	conversationID string,
	streamID string,
	eventType string,
	data map[string]any,
	metadata map[string]any,
) chat.SEMEnvelope {
	if timeline == nil {
		timeline = s.getOrCreateTimelineLocked(conversationID)
	}

	now := time.Now().UTC()
	timeline.NextSeq++
	eventMetadata := cloneMap(metadata)
	if eventMetadata == nil {
		eventMetadata = map[string]any{}
	}
	eventMetadata["conversationId"] = conversationID
	eventMetadata["emittedAt"] = now.Format(time.RFC3339Nano)

	envelope := chat.SEMEnvelope{
		SEM: true,
		Event: chat.SEMEvent{
			Type:     eventType,
			ID:       "sem-" + uuid.NewString(),
			Seq:      timeline.NextSeq,
			StreamID: streamID,
			Data:     cloneMap(data),
			Metadata: eventMetadata,
		},
	}

	timeline.Events = append(timeline.Events, envelope)
	timeline.Events = trimTimelineEvents(timeline.Events)
	timeline.UpdatedAt = now
	return envelope
}

func (s *Server) snapshotTimeline(conversationID string) chat.TimelineResponse {
	s.mu.Lock()
	defer s.mu.Unlock()

	timeline := s.getOrCreateTimelineLocked(conversationID)
	messages := make([]chat.TimelineMessage, 0, len(timeline.Messages))
	for _, message := range timeline.Messages {
		messages = append(messages, cloneTimelineMessage(message))
	}
	events := make([]chat.SEMEnvelope, 0, len(timeline.Events))
	for _, event := range timeline.Events {
		events = append(events, cloneSEMEnvelope(event))
	}

	return chat.TimelineResponse{
		ConversationID: conversationID,
		Messages:       messages,
		Events:         events,
		LastSeq:        timeline.NextSeq,
	}
}

func (s *Server) getOrCreateTimelineLocked(conversationID string) *conversationTimeline {
	timeline, ok := s.conversations[conversationID]
	if !ok {
		timeline = &conversationTimeline{
			Events:    []chat.SEMEnvelope{},
			Messages:  []chat.TimelineMessage{},
			UpdatedAt: time.Now().UTC(),
		}
		s.conversations[conversationID] = timeline
	}
	timeline.UpdatedAt = time.Now().UTC()
	return timeline
}

func lastUserPrompt(messages []chat.Message) string {
	for i := len(messages) - 1; i >= 0; i-- {
		if strings.EqualFold(strings.TrimSpace(messages[i].Role), "user") {
			return messages[i].Text
		}
	}
	return ""
}

var tokenRe = regexp.MustCompile(`\S+\s*`)

func tokenize(text string) []string {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}
	tokens := tokenRe.FindAllString(text, -1)
	if len(tokens) == 0 {
		return []string{text}
	}
	return tokens
}

func trimTimelineMessages(messages []chat.TimelineMessage) []chat.TimelineMessage {
	if len(messages) <= timelineMessageLimit {
		return messages
	}
	out := make([]chat.TimelineMessage, timelineMessageLimit)
	copy(out, messages[len(messages)-timelineMessageLimit:])
	return out
}

func trimTimelineEvents(events []chat.SEMEnvelope) []chat.SEMEnvelope {
	if len(events) <= timelineEventLimit {
		return events
	}
	out := make([]chat.SEMEnvelope, timelineEventLimit)
	copy(out, events[len(events)-timelineEventLimit:])
	return out
}

func findOrCreateAssistantMessage(timeline *conversationTimeline, messageID string) *chat.TimelineMessage {
	idx := findMessageIndex(timeline.Messages, messageID)
	if idx < 0 {
		timeline.Messages = append(timeline.Messages, chat.TimelineMessage{
			ID:        messageID,
			Role:      "ai",
			Text:      "",
			Status:    "streaming",
			UpdatedAt: time.Now().UTC(),
		})
		idx = len(timeline.Messages) - 1
	}
	return &timeline.Messages[idx]
}

func findMessageIndex(messages []chat.TimelineMessage, messageID string) int {
	for i := len(messages) - 1; i >= 0; i-- {
		if messages[i].ID == messageID {
			return i
		}
	}
	return -1
}

func cloneTimelineMessage(message chat.TimelineMessage) chat.TimelineMessage {
	out := message
	out.Artifacts = cloneArtifacts(message.Artifacts)
	out.Actions = cloneActions(message.Actions)
	return out
}

func cloneSEMEnvelope(envelope chat.SEMEnvelope) chat.SEMEnvelope {
	out := envelope
	out.Event.Data = cloneMap(envelope.Event.Data)
	out.Event.Metadata = cloneMap(envelope.Event.Metadata)
	return out
}

func cloneArtifacts(artifacts []chat.Artifact) []chat.Artifact {
	if len(artifacts) == 0 {
		return nil
	}
	out := make([]chat.Artifact, len(artifacts))
	for i, artifact := range artifacts {
		out[i] = cloneArtifact(artifact)
	}
	return out
}

func cloneArtifact(artifact chat.Artifact) chat.Artifact {
	out := artifact
	out.Props = cloneMap(artifact.Props)
	return out
}

func cloneActions(actions []chat.Action) []chat.Action {
	if len(actions) == 0 {
		return nil
	}
	out := make([]chat.Action, len(actions))
	for i := range actions {
		out[i] = chat.Action{
			Label:  actions[i].Label,
			Action: cloneMap(actions[i].Action),
		}
	}
	return out
}

func cloneMap(input map[string]any) map[string]any {
	if len(input) == 0 {
		return nil
	}
	out := make(map[string]any, len(input))
	for key, value := range input {
		out[key] = value
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
	return out
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
