package pinoweb

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestDecodeWidgetLifecyclePayload_AppliesFallbacks(t *testing.T) {
	raw := json.RawMessage(`{"title":"Low stock","widgetType":"table","data":{"rows":3}}`)
	pb, err := decodeWidgetLifecyclePayload(raw, "item-1", "ready")
	require.NoError(t, err)
	require.Equal(t, "item-1", pb.GetItemId())
	require.Equal(t, "ready", pb.GetPhase())
	require.Equal(t, "table", pb.GetWidgetType())
}

func TestDecodeCardLifecyclePayload_InvalidJSONFails(t *testing.T) {
	raw := json.RawMessage(`{"title":"broken"`)
	_, err := decodeCardLifecyclePayload(raw, "item-1", "ready")
	require.Error(t, err)
}

func TestPropsFromWidgetLifecycle_MapsStructData(t *testing.T) {
	raw := json.RawMessage(`{"itemId":"item-2","title":"Widget","widgetType":"chart","phase":"update","data":{"k":"v"}}`)
	pb, err := decodeWidgetLifecyclePayload(raw, "", "")
	require.NoError(t, err)
	props := propsFromWidgetLifecycle(pb)
	require.Equal(t, "item-2", props["itemId"])
	require.Equal(t, "chart", props["widgetType"])
	data, ok := props["data"].(map[string]any)
	require.True(t, ok)
	require.Equal(t, "v", data["k"])
}
