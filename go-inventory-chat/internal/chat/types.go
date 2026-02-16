package chat

import (
	"context"
	"time"

	"hypercard/go-inventory-chat/internal/store"
)

type Message struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

type CompletionRequest struct {
	ConversationID string    `json:"conversationId"`
	Messages       []Message `json:"messages"`
	Model          string    `json:"model,omitempty"`
}

type CompletionResponse struct {
	ConversationID string `json:"conversationId"`
	MessageID      string `json:"messageId"`
	StreamURL      string `json:"streamUrl"`
}

type Action struct {
	Label  string         `json:"label"`
	Action map[string]any `json:"action"`
}

type Artifact struct {
	Kind       string         `json:"kind"`
	ID         string         `json:"id"`
	WidgetType string         `json:"widgetType,omitempty"`
	Label      string         `json:"label,omitempty"`
	Props      map[string]any `json:"props,omitempty"`
	CardID     string         `json:"cardId,omitempty"`
	Title      string         `json:"title,omitempty"`
	Icon       string         `json:"icon,omitempty"`
	Code       string         `json:"code,omitempty"`
	DedupeKey  string         `json:"dedupeKey,omitempty"`
	Version    int            `json:"version,omitempty"`
	Policy     map[string]any `json:"policy,omitempty"`
}

type SEMEvent struct {
	Type     string         `json:"type"`
	ID       string         `json:"id"`
	Seq      uint64         `json:"seq"`
	StreamID string         `json:"stream_id,omitempty"`
	Data     map[string]any `json:"data,omitempty"`
	Metadata map[string]any `json:"metadata,omitempty"`
}

type SEMEnvelope struct {
	SEM   bool     `json:"sem"`
	Event SEMEvent `json:"event"`
}

const (
	SEMEventMessageUser     = "chat.message.user"
	SEMEventMessageToken    = "chat.message.token"
	SEMEventMessageArtifact = "chat.message.artifact"
	SEMEventMessageDone     = "chat.message.done"
	SEMEventMessageError    = "chat.message.error"
)

type TimelineMessage struct {
	ID        string     `json:"id"`
	Role      string     `json:"role"`
	Text      string     `json:"text"`
	Status    string     `json:"status"`
	Artifacts []Artifact `json:"artifacts,omitempty"`
	Actions   []Action   `json:"actions,omitempty"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type TimelineResponse struct {
	ConversationID string            `json:"conversationId"`
	Messages       []TimelineMessage `json:"messages"`
	Events         []SEMEnvelope     `json:"events"`
	LastSeq        uint64            `json:"lastSeq"`
}

type PlannedResponse struct {
	Text      string
	Artifacts []Artifact
	Actions   []Action
}

type QueryStore interface {
	QueryLowStock(ctx context.Context, threshold int, limit int) ([]store.Item, error)
	QueryInventoryValue(ctx context.Context) (store.InventoryValueSummary, error)
	QuerySalesSummary(ctx context.Context, days int) (store.SalesSummary, error)
	QueryItemBySKU(ctx context.Context, sku string) (*store.Item, error)
	SearchItems(ctx context.Context, query string, limit int) ([]store.Item, error)
}
