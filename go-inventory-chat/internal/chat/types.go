package chat

import (
	"context"

	"hypercard/go-inventory-chat/internal/store"
)

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
