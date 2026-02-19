package pinoweb

import (
	"encoding/json"
	"strings"

	hypercardpb "github.com/go-go-golems/hypercard-inventory-chat/internal/pinoweb/pb/sem/hypercard"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/types/known/structpb"
)

func decodeWidgetLifecyclePayload(raw json.RawMessage, fallbackItemID string, fallbackPhase string) (*hypercardpb.WidgetLifecycleV1, error) {
	pb := &hypercardpb.WidgetLifecycleV1{}
	if err := (protojson.UnmarshalOptions{DiscardUnknown: true}).Unmarshal(raw, pb); err != nil {
		return nil, err
	}
	if pb.ItemId == "" {
		pb.ItemId = strings.TrimSpace(fallbackItemID)
	}
	if pb.Phase == "" {
		pb.Phase = strings.TrimSpace(fallbackPhase)
	}
	return pb, nil
}

func decodeCardLifecyclePayload(raw json.RawMessage, fallbackItemID string, fallbackPhase string) (*hypercardpb.CardLifecycleV1, error) {
	pb := &hypercardpb.CardLifecycleV1{}
	if err := (protojson.UnmarshalOptions{DiscardUnknown: true}).Unmarshal(raw, pb); err != nil {
		return nil, err
	}
	if pb.ItemId == "" {
		pb.ItemId = strings.TrimSpace(fallbackItemID)
	}
	if pb.Phase == "" {
		pb.Phase = strings.TrimSpace(fallbackPhase)
	}
	return pb, nil
}

func propsFromWidgetLifecycle(pb *hypercardpb.WidgetLifecycleV1) map[string]any {
	if pb == nil {
		return map[string]any{"schemaVersion": 1}
	}
	return map[string]any{
		"schemaVersion": 1,
		"itemId":        strings.TrimSpace(pb.GetItemId()),
		"title":         strings.TrimSpace(pb.GetTitle()),
		"widgetType":    strings.TrimSpace(pb.GetWidgetType()),
		"phase":         strings.TrimSpace(pb.GetPhase()),
		"error":         strings.TrimSpace(pb.GetError()),
		"data":          mapFromStruct(pb.GetData()),
	}
}

func propsFromCardLifecycle(pb *hypercardpb.CardLifecycleV1) map[string]any {
	if pb == nil {
		return map[string]any{"schemaVersion": 1}
	}
	return map[string]any{
		"schemaVersion": 1,
		"itemId":        strings.TrimSpace(pb.GetItemId()),
		"title":         strings.TrimSpace(pb.GetTitle()),
		"name":          strings.TrimSpace(pb.GetName()),
		"phase":         strings.TrimSpace(pb.GetPhase()),
		"error":         strings.TrimSpace(pb.GetError()),
		"data":          mapFromStruct(pb.GetData()),
	}
}

func mapFromStruct(st *structpb.Struct) map[string]any {
	if st == nil {
		return map[string]any{}
	}
	m := st.AsMap()
	if m == nil {
		return map[string]any{}
	}
	return m
}
