package pinoweb

import (
	"context"
	"encoding/json"
	"testing"

	chatstore "github.com/go-go-golems/pinocchio/pkg/persistence/chatstore"
	webchat "github.com/go-go-golems/pinocchio/pkg/webchat"
	"github.com/stretchr/testify/require"
)

func semFrameForHypercardTest(t *testing.T, eventType, id string, seq uint64, data map[string]any) []byte {
	t.Helper()
	raw, err := json.Marshal(map[string]any{
		"sem": true,
		"event": map[string]any{
			"type":      eventType,
			"id":        id,
			"seq":       seq,
			"stream_id": "stream-1",
			"data":      data,
		},
	})
	require.NoError(t, err)
	return raw
}

func TestHypercardTimelineProjection_UsesDedicatedWidgetKind(t *testing.T) {
	RegisterInventoryHypercardExtensions()

	store := chatstore.NewInMemoryTimelineStore(100)
	projector := webchat.NewTimelineProjector("conv-widget", store, nil)

	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForHypercardTest(t, "hypercard.widget.start", "w-1", 1, map[string]any{
		"itemId":     "w-1",
		"title":      "Low stock",
		"widgetType": "table",
	})))
	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForHypercardTest(t, "hypercard.widget.v1", "w-1", 2, map[string]any{
		"itemId":     "w-1",
		"title":      "Low stock",
		"widgetType": "table",
		"data": map[string]any{
			"artifact": map[string]any{"id": "low-stock-items"},
		},
	})))

	snap, err := store.GetSnapshot(context.Background(), "conv-widget", 0, 100)
	require.NoError(t, err)
	require.NotNil(t, snap)
	require.Equal(t, uint64(2), snap.Version)
	require.Len(t, snap.Entities, 1)

	entity := snap.Entities[0]
	require.Equal(t, "w-1:widget", entity.GetId())
	require.Equal(t, "hypercard_widget", entity.GetKind())
	props := entity.GetProps().AsMap()
	require.Equal(t, "w-1", props["itemId"])
	require.Equal(t, "ready", props["phase"])
	require.Equal(t, "table", props["widgetType"])
}

func TestHypercardTimelineProjection_UsesDedicatedCardKind(t *testing.T) {
	RegisterInventoryHypercardExtensions()

	store := chatstore.NewInMemoryTimelineStore(100)
	projector := webchat.NewTimelineProjector("conv-card", store, nil)

	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForHypercardTest(t, "hypercard.card.start", "c-1", 5, map[string]any{
		"itemId": "c-1",
		"title":  "Low Stock Drilldown",
		"name":   "lowStockDrilldown",
	})))
	require.NoError(t, projector.ApplySemFrame(context.Background(), semFrameForHypercardTest(t, "hypercard.card.v2", "c-1", 6, map[string]any{
		"itemId": "c-1",
		"title":  "Low Stock Drilldown",
		"name":   "lowStockDrilldown",
		"data": map[string]any{
			"card": map[string]any{"id": "lowStockDrilldown"},
		},
	})))

	snap, err := store.GetSnapshot(context.Background(), "conv-card", 0, 100)
	require.NoError(t, err)
	require.NotNil(t, snap)
	require.Equal(t, uint64(6), snap.Version)
	require.Len(t, snap.Entities, 1)

	entity := snap.Entities[0]
	require.Equal(t, "c-1:card", entity.GetId())
	require.Equal(t, "hypercard_card", entity.GetKind())
	props := entity.GetProps().AsMap()
	require.Equal(t, "c-1", props["itemId"])
	require.Equal(t, "ready", props["phase"])
	require.Equal(t, "lowStockDrilldown", props["name"])
}
