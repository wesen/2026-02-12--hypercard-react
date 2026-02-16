package app

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-go-golems/geppetto/pkg/events"
	"github.com/go-go-golems/geppetto/pkg/inference/engine"
	geptools "github.com/go-go-golems/geppetto/pkg/inference/tools"
	"github.com/go-go-golems/geppetto/pkg/steps/ai/settings"
	aitypes "github.com/go-go-golems/geppetto/pkg/steps/ai/types"
	"github.com/go-go-golems/geppetto/pkg/turns"
	"github.com/go-go-golems/glazed/pkg/cmds/values"
	infruntime "github.com/go-go-golems/pinocchio/pkg/inference/runtime"
	chatstore "github.com/go-go-golems/pinocchio/pkg/persistence/chatstore"
	webchat "github.com/go-go-golems/pinocchio/pkg/webchat"
	webhttp "github.com/go-go-golems/pinocchio/pkg/webchat/http"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"

	"hypercard/go-inventory-chat/internal/chat"
)

const (
	defaultSystemPrompt = "You are the inventory operations assistant. Always call the inventory_query tool before answering inventory questions. Keep answers concise and factual."
	defaultRuntimeKey   = "inventory"
	inventoryToolName   = "inventory_query"
)

type RuntimeConfig struct {
	Enabled      bool
	Provider     string
	Model        string
	APIKey       string
	BaseURL      string
	SystemPrompt string
}

type ServerConfig struct {
	Addr            string
	AllowOrigin     string
	Runtime         RuntimeConfig
	TimelineStore   chatstore.TimelineStore
	TurnStore       chatstore.TurnStore
	DebugRoutes     bool
	DefaultConvID   string
	DefaultToolList []string
}

type inventoryRuntimeComposer struct {
	stepSettings *settings.StepSettings
	planner      *chat.Planner
	llmEnabled   bool
	systemPrompt string
	allowedTools []string
}

func newInventoryRuntimeComposer(stepSettings *settings.StepSettings, planner *chat.Planner, llmEnabled bool, systemPrompt string, allowedTools []string) *inventoryRuntimeComposer {
	if strings.TrimSpace(systemPrompt) == "" {
		systemPrompt = defaultSystemPrompt
	}
	if len(allowedTools) == 0 {
		allowedTools = []string{inventoryToolName}
	}
	return &inventoryRuntimeComposer{
		stepSettings: stepSettings,
		planner:      planner,
		llmEnabled:   llmEnabled,
		systemPrompt: systemPrompt,
		allowedTools: append([]string(nil), allowedTools...),
	}
}

func (c *inventoryRuntimeComposer) Compose(ctx context.Context, req infruntime.RuntimeComposeRequest) (infruntime.RuntimeArtifacts, error) {
	if c == nil {
		return infruntime.RuntimeArtifacts{}, fmt.Errorf("runtime composer is nil")
	}
	systemPrompt := c.systemPrompt
	allowedTools := append([]string(nil), c.allowedTools...)
	if req.Overrides != nil {
		if v, ok := req.Overrides["system_prompt"].(string); ok && strings.TrimSpace(v) != "" {
			systemPrompt = strings.TrimSpace(v)
		}
		if raw, ok := req.Overrides["tools"].([]any); ok {
			custom := make([]string, 0, len(raw))
			for _, item := range raw {
				name, ok := item.(string)
				if !ok {
					continue
				}
				name = strings.TrimSpace(name)
				if name == "" {
					continue
				}
				custom = append(custom, name)
			}
			if len(custom) > 0 {
				allowedTools = custom
			}
		}
	}

	runtimeKey := strings.TrimSpace(req.RuntimeKey)
	if runtimeKey == "" {
		runtimeKey = defaultRuntimeKey
	}

	if c.llmEnabled && c.stepSettings != nil {
		eng, err := infruntime.ComposeEngineFromSettings(ctx, c.stepSettings.Clone(), systemPrompt, nil, nil)
		if err == nil {
			return infruntime.RuntimeArtifacts{
				Engine:             eng,
				RuntimeKey:         runtimeKey,
				RuntimeFingerprint: runtimeFingerprint(runtimeKey, systemPrompt, true, c.stepSettings.GetMetadata(), allowedTools),
				SeedSystemPrompt:   systemPrompt,
				AllowedTools:       allowedTools,
			}, nil
		}
		log.Warn().Err(err).Msg("inventory-chat llm engine init failed; falling back to deterministic planner engine")
	}

	fallback := &plannerEngine{planner: c.planner}
	return infruntime.RuntimeArtifacts{
		Engine:             fallback,
		RuntimeKey:         runtimeKey,
		RuntimeFingerprint: runtimeFingerprint(runtimeKey, systemPrompt, false, nil, allowedTools),
		SeedSystemPrompt:   systemPrompt,
		AllowedTools:       allowedTools,
	}, nil
}

func runtimeFingerprint(runtimeKey, systemPrompt string, llmEnabled bool, metadata map[string]any, tools []string) string {
	payload := map[string]any{
		"runtime_key":   runtimeKey,
		"system_prompt": systemPrompt,
		"llm_enabled":   llmEnabled,
		"tools":         tools,
	}
	if len(metadata) > 0 {
		payload["step_metadata"] = metadata
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return runtimeKey
	}
	return string(b)
}

type plannerEngine struct {
	planner *chat.Planner
}

func (e *plannerEngine) RunInference(ctx context.Context, t *turns.Turn) (*turns.Turn, error) {
	if t == nil {
		return nil, fmt.Errorf("turn is nil")
	}
	out := t.Clone()
	prompt := latestUserPrompt(out)
	planned := chat.PlannedResponse{
		Text: "I can answer inventory questions. Ask about low stock, sales, or inventory value.",
	}
	if e != nil && e.planner != nil && strings.TrimSpace(prompt) != "" {
		p, err := e.planner.Plan(ctx, prompt)
		if err != nil {
			return nil, err
		}
		planned = NormalizePlannedResponse(p)
	}
	text := serializePlannedResponse(planned)

	md := eventMetadataFromTurn(out)
	events.PublishEventToContext(ctx, events.NewStartEvent(md))
	events.PublishEventToContext(ctx, events.NewPartialCompletionEvent(md, text, text))
	events.PublishEventToContext(ctx, events.NewFinalEvent(md, text))

	turns.AppendBlock(out, turns.NewAssistantTextBlock(text))
	return out, nil
}

func eventMetadataFromTurn(t *turns.Turn) events.EventMetadata {
	md := events.EventMetadata{
		ID: uuid.New(),
	}
	if t == nil {
		return md
	}
	if t.ID != "" {
		md.TurnID = t.ID
	}
	if sid, ok, err := turns.KeyTurnMetaSessionID.Get(t.Metadata); err == nil && ok {
		md.SessionID = sid
	}
	if iid, ok, err := turns.KeyTurnMetaInferenceID.Get(t.Metadata); err == nil && ok {
		md.InferenceID = iid
	}
	return md
}

func latestUserPrompt(t *turns.Turn) string {
	if t == nil {
		return ""
	}
	for i := len(t.Blocks) - 1; i >= 0; i-- {
		b := t.Blocks[i]
		if b.Kind != turns.BlockKindUser {
			continue
		}
		if raw, ok := b.Payload[turns.PayloadKeyText].(string); ok {
			return strings.TrimSpace(raw)
		}
	}
	return ""
}

func serializePlannedResponse(planned chat.PlannedResponse) string {
	text := strings.TrimSpace(planned.Text)
	blocks := make([]string, 0, len(planned.Artifacts))
	for _, artifact := range planned.Artifacts {
		payload := map[string]any{
			"id": artifact.ID,
		}
		switch artifact.Kind {
		case "widget":
			payload["widgetType"] = artifact.WidgetType
			if artifact.Label != "" {
				payload["label"] = artifact.Label
			}
			if artifact.Props != nil {
				payload["props"] = artifact.Props
			}
		case "card-proposal":
			payload["cardId"] = artifact.CardID
			payload["title"] = artifact.Title
			payload["icon"] = artifact.Icon
			payload["code"] = artifact.Code
			if artifact.DedupeKey != "" {
				payload["dedupeKey"] = artifact.DedupeKey
			}
			if artifact.Version > 0 {
				payload["version"] = artifact.Version
			}
			if artifact.Policy != nil {
				payload["policy"] = artifact.Policy
			}
		default:
			continue
		}
		jsonPayload, err := json.Marshal(payload)
		if err != nil {
			continue
		}
		tagKind := "widget"
		if artifact.Kind == "card-proposal" {
			tagKind = "card"
		}
		blocks = append(blocks, fmt.Sprintf("<hypercard:%s:1>%s</hypercard:%s:1>", tagKind, string(jsonPayload), tagKind))
	}
	if len(blocks) == 0 {
		if len(planned.Actions) == 0 {
			return text
		}
		actionsJSON, err := json.Marshal(planned.Actions)
		if err != nil {
			return text
		}
		if text == "" {
			return fmt.Sprintf("<hypercard:actions:1>%s</hypercard:actions:1>", string(actionsJSON))
		}
		return text + "\n\n" + fmt.Sprintf("<hypercard:actions:1>%s</hypercard:actions:1>", string(actionsJSON))
	}
	if len(planned.Actions) > 0 {
		actionsJSON, err := json.Marshal(planned.Actions)
		if err == nil {
			blocks = append(blocks, fmt.Sprintf("<hypercard:actions:1>%s</hypercard:actions:1>", string(actionsJSON)))
		}
	}
	if text == "" {
		return strings.Join(blocks, "\n")
	}
	return text + "\n\n" + strings.Join(blocks, "\n")
}

type inventoryRequestResolver struct {
	defaultRuntimeKey string
	defaultOverrides  map[string]any
	defaultConvID     string
}

func newInventoryRequestResolver(runtimeKey string, systemPrompt string, defaultConvID string) *inventoryRequestResolver {
	if strings.TrimSpace(runtimeKey) == "" {
		runtimeKey = defaultRuntimeKey
	}
	if strings.TrimSpace(systemPrompt) == "" {
		systemPrompt = defaultSystemPrompt
	}
	overrides := map[string]any{
		"system_prompt": systemPrompt,
		"tools":         []any{inventoryToolName},
	}
	return &inventoryRequestResolver{
		defaultRuntimeKey: runtimeKey,
		defaultOverrides:  overrides,
		defaultConvID:     strings.TrimSpace(defaultConvID),
	}
}

func (r *inventoryRequestResolver) Resolve(req *http.Request) (webhttp.ConversationRequestPlan, error) {
	if req == nil {
		return webhttp.ConversationRequestPlan{}, &webhttp.RequestResolutionError{Status: http.StatusBadRequest, ClientMsg: "bad request"}
	}
	switch req.Method {
	case http.MethodGet:
		convID := strings.TrimSpace(req.URL.Query().Get("conv_id"))
		if convID == "" {
			return webhttp.ConversationRequestPlan{}, &webhttp.RequestResolutionError{Status: http.StatusBadRequest, ClientMsg: "missing conv_id"}
		}
		return webhttp.ConversationRequestPlan{
			ConvID:     convID,
			RuntimeKey: r.defaultRuntimeKey,
			Overrides:  cloneOverrides(r.defaultOverrides),
		}, nil
	case http.MethodPost:
		var body webhttp.ChatRequestBody
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			return webhttp.ConversationRequestPlan{}, &webhttp.RequestResolutionError{Status: http.StatusBadRequest, ClientMsg: "bad request", Err: err}
		}
		if body.Prompt == "" && body.Text != "" {
			body.Prompt = body.Text
		}
		convID := strings.TrimSpace(body.ConvID)
		if convID == "" {
			if r.defaultConvID != "" {
				convID = r.defaultConvID
			} else {
				convID = uuid.NewString()
			}
		}
		overrides := cloneOverrides(r.defaultOverrides)
		for k, v := range body.Overrides {
			overrides[k] = v
		}
		return webhttp.ConversationRequestPlan{
			ConvID:         convID,
			RuntimeKey:     r.defaultRuntimeKey,
			Overrides:      overrides,
			Prompt:         strings.TrimSpace(body.Prompt),
			IdempotencyKey: strings.TrimSpace(body.IdempotencyKey),
		}, nil
	default:
		return webhttp.ConversationRequestPlan{}, &webhttp.RequestResolutionError{Status: http.StatusMethodNotAllowed, ClientMsg: "method not allowed"}
	}
}

func cloneOverrides(in map[string]any) map[string]any {
	if len(in) == 0 {
		return nil
	}
	out := make(map[string]any, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}

func wrapCORS(next http.Handler, allowOrigin string) http.Handler {
	origin := strings.TrimSpace(allowOrigin)
	if origin == "" {
		origin = "*"
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", origin)
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Idempotency-Key, X-Idempotency-Key, X-Request-ID")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

type InventoryToolRequest struct {
	Mode      string `json:"mode" jsonschema:"required,description=Query mode,enum=low_stock,enum=sales_summary,enum=inventory_value,enum=item_lookup,enum=search,enum=help"`
	Threshold int    `json:"threshold,omitempty" jsonschema:"description=Low stock threshold for low_stock mode,default=3"`
	Days      int    `json:"days,omitempty" jsonschema:"description=Rolling day window for sales_summary mode,default=7"`
	SKU       string `json:"sku,omitempty" jsonschema:"description=SKU for item_lookup mode"`
	Query     string `json:"query,omitempty" jsonschema:"description=Search query for search mode"`
	Limit     int    `json:"limit,omitempty" jsonschema:"description=Optional result cap"`
}

type InventoryToolResponse struct {
	Mode      string          `json:"mode"`
	Summary   string          `json:"summary"`
	Artifacts []chat.Artifact `json:"artifacts,omitempty"`
	Actions   []chat.Action   `json:"actions,omitempty"`
}

func RegisterInventoryQueryTool(registry geptools.ToolRegistry, planner *chat.Planner) error {
	im, ok := registry.(*geptools.InMemoryToolRegistry)
	if ok {
		return registerInventoryQueryToolInMemory(im, planner)
	}

	tmp := geptools.NewInMemoryToolRegistry()
	if err := registerInventoryQueryToolInMemory(tmp, planner); err != nil {
		return err
	}
	for _, td := range tmp.ListTools() {
		if err := registry.RegisterTool(td.Name, td); err != nil {
			return err
		}
	}
	return nil
}

func registerInventoryQueryToolInMemory(registry *geptools.InMemoryToolRegistry, planner *chat.Planner) error {
	if registry == nil {
		return fmt.Errorf("tool registry is nil")
	}
	if planner == nil {
		return fmt.Errorf("planner is nil")
	}
	def, err := geptools.NewToolFromFunc(
		inventoryToolName,
		"Run inventory SQLite-backed queries and return UI-ready artifacts (report-view/data-table/card-proposal) with actions.",
		func(ctx context.Context, req InventoryToolRequest) (InventoryToolResponse, error) {
			prompt := toolPromptFromRequest(req)
			planned, err := planner.Plan(ctx, prompt)
			if err != nil {
				return InventoryToolResponse{}, err
			}
			planned = NormalizePlannedResponse(planned)
			return InventoryToolResponse{
				Mode:      strings.TrimSpace(req.Mode),
				Summary:   planned.Text,
				Artifacts: planned.Artifacts,
				Actions:   planned.Actions,
			}, nil
		},
	)
	if err != nil {
		return err
	}
	return registry.RegisterTool(inventoryToolName, *def)
}

func toolPromptFromRequest(req InventoryToolRequest) string {
	mode := strings.ToLower(strings.TrimSpace(req.Mode))
	switch mode {
	case "low_stock":
		threshold := req.Threshold
		if threshold <= 0 {
			threshold = 3
		}
		return fmt.Sprintf("Show low stock below %d", threshold)
	case "sales_summary":
		days := req.Days
		if days <= 0 {
			days = 7
		}
		return fmt.Sprintf("Show sales last %d days", days)
	case "inventory_value":
		return "What is total inventory value?"
	case "item_lookup":
		sku := strings.TrimSpace(req.SKU)
		if sku == "" {
			return "Find A-1002"
		}
		return "Find " + sku
	case "search":
		q := strings.TrimSpace(req.Query)
		if q == "" {
			return "Search mug"
		}
		return "Search " + q
	default:
		return "Help with inventory chat queries"
	}
}

func BuildStepSettings(cfg RuntimeConfig) (*settings.StepSettings, bool, error) {
	if !cfg.Enabled {
		return nil, false, nil
	}
	provider := strings.ToLower(strings.TrimSpace(cfg.Provider))
	if provider == "" {
		provider = string(aitypes.ApiTypeOpenAI)
	}
	model := strings.TrimSpace(cfg.Model)
	if model == "" {
		model = "gpt-4.1-mini"
	}
	apiKey := strings.TrimSpace(cfg.APIKey)
	if apiKey == "" {
		return nil, false, nil
	}

	st, err := settings.NewStepSettings()
	if err != nil {
		return nil, false, err
	}
	apiType := aitypes.ApiType(provider)
	st.Chat.ApiType = &apiType
	st.Chat.Engine = &model
	st.API.APIKeys[provider+"-api-key"] = apiKey
	if provider == string(aitypes.ApiTypeOpenAIResponses) {
		st.API.APIKeys[string(aitypes.ApiTypeOpenAI)+"-api-key"] = apiKey
	}
	if baseURL := strings.TrimSpace(cfg.BaseURL); baseURL != "" {
		st.API.BaseUrls[provider+"-base-url"] = baseURL
	}
	return st, true, nil
}

func NewServer(ctx context.Context, planner *chat.Planner, cfg ServerConfig) (*webchat.Server, error) {
	if planner == nil {
		return nil, fmt.Errorf("planner is required")
	}

	stepSettings, llmEnabled, err := BuildStepSettings(cfg.Runtime)
	if err != nil {
		return nil, err
	}
	if cfg.Runtime.Enabled && !llmEnabled {
		log.Warn().Msg("inventory-chat llm runtime disabled because API key is missing; using deterministic planner engine")
	}

	systemPrompt := cfg.Runtime.SystemPrompt
	if strings.TrimSpace(systemPrompt) == "" {
		systemPrompt = defaultSystemPrompt
	}
	composer := newInventoryRuntimeComposer(stepSettings, planner, llmEnabled, systemPrompt, cfg.DefaultToolList)

	routerOpts := []webchat.RouterOption{
		webchat.WithRuntimeComposer(composer),
		webchat.WithDebugRoutesEnabled(cfg.DebugRoutes),
	}
	if cfg.TimelineStore != nil {
		routerOpts = append(routerOpts, webchat.WithTimelineStore(cfg.TimelineStore))
	}
	if cfg.TurnStore != nil {
		routerOpts = append(routerOpts, webchat.WithTurnStore(cfg.TurnStore))
	}

	srv, err := webchat.NewServer(ctx, values.New(), nil, routerOpts...)
	if err != nil {
		return nil, err
	}
	srv.RegisterTool(inventoryToolName, func(reg geptools.ToolRegistry) error {
		return RegisterInventoryQueryTool(reg, planner)
	})

	resolver := newInventoryRequestResolver(defaultRuntimeKey, systemPrompt, cfg.DefaultConvID)
	chatHandler := webhttp.NewChatHandler(srv.ChatService(), resolver)
	wsHandler := webhttp.NewWSHandler(
		srv.StreamHub(),
		resolver,
		websocket.Upgrader{CheckOrigin: func(*http.Request) bool { return true }},
	)
	timelineLogger := log.With().Str("component", "inventory-chat").Str("route", "/api/timeline").Logger()
	timelineHandler := webhttp.NewTimelineHandler(srv.TimelineService(), timelineLogger)

	mux := http.NewServeMux()
	mux.HandleFunc("/chat", chatHandler)
	mux.HandleFunc("/chat/", chatHandler)
	mux.HandleFunc("/ws", wsHandler)
	mux.HandleFunc("/api/timeline", timelineHandler)
	mux.HandleFunc("/api/timeline/", timelineHandler)
	mux.Handle("/api/", srv.APIHandler())
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"ok":true}`))
	})

	httpSrv := srv.HTTPServer()
	if httpSrv == nil {
		return nil, fmt.Errorf("http server is not initialized")
	}
	if strings.TrimSpace(cfg.Addr) != "" {
		httpSrv.Addr = cfg.Addr
	}
	httpSrv.Handler = wrapCORS(mux, cfg.AllowOrigin)
	return srv, nil
}

var _ engine.Engine = (*plannerEngine)(nil)
