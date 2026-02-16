package app

import (
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"

	"hypercard/go-inventory-chat/internal/chat"
)

var (
	structuredBlockRe = regexp.MustCompile(`(?s)<hypercard:(widget|card):1>\s*(\{.*?\})\s*</hypercard:(?:widget|card):1>`)
	validCardIDRe     = regexp.MustCompile(`^[a-z][a-z0-9_-]{2,63}$`)
)

// NormalizePlannedResponse extracts inline structured artifacts, validates all artifacts,
// and appends a warning text when invalid payloads are dropped.
func NormalizePlannedResponse(planned chat.PlannedResponse) chat.PlannedResponse {
	cleanedText, extracted := extractStructuredArtifacts(planned.Text)
	planned.Text = cleanedText
	if len(extracted) > 0 {
		planned.Artifacts = append(planned.Artifacts, extracted...)
	}

	valid := make([]chat.Artifact, 0, len(planned.Artifacts))
	rejected := make([]string, 0)
	for _, artifact := range planned.Artifacts {
		if err := validateArtifact(artifact); err != nil {
			rejected = append(rejected, fmt.Sprintf("%s(%s): %v", artifact.Kind, artifact.ID, err))
			continue
		}
		valid = append(valid, artifact)
	}
	planned.Artifacts = valid
	if len(rejected) > 0 {
		suffix := "Some generated artifacts were filtered by validation: " + strings.Join(rejected, "; ")
		if strings.TrimSpace(planned.Text) == "" {
			planned.Text = suffix
		} else {
			planned.Text = strings.TrimSpace(planned.Text) + "\n\n" + suffix
		}
	}
	return planned
}

func extractStructuredArtifacts(text string) (string, []chat.Artifact) {
	if strings.TrimSpace(text) == "" {
		return text, nil
	}
	matches := structuredBlockRe.FindAllStringSubmatchIndex(text, -1)
	if len(matches) == 0 {
		return text, nil
	}

	artifacts := make([]chat.Artifact, 0, len(matches))
	var builder strings.Builder
	lastEnd := 0

	for _, m := range matches {
		if len(m) < 6 {
			continue
		}
		start, end := m[0], m[1]
		kindStart, kindEnd := m[2], m[3]
		jsonStart, jsonEnd := m[4], m[5]

		builder.WriteString(text[lastEnd:start])
		lastEnd = end

		kind := text[kindStart:kindEnd]
		payloadRaw := strings.TrimSpace(text[jsonStart:jsonEnd])

		var payload map[string]any
		if err := json.Unmarshal([]byte(payloadRaw), &payload); err != nil {
			continue
		}
		artifact := artifactFromStructuredPayload(kind, payload)
		if artifact.ID == "" {
			artifact.ID = "artifact-" + uuid.NewString()
		}
		artifacts = append(artifacts, artifact)
	}

	builder.WriteString(text[lastEnd:])
	cleaned := strings.TrimSpace(builder.String())
	return cleaned, artifacts
}

func artifactFromStructuredPayload(kind string, payload map[string]any) chat.Artifact {
	getString := func(key string) string {
		if v, ok := payload[key].(string); ok {
			return strings.TrimSpace(v)
		}
		return ""
	}

	artifact := chat.Artifact{
		ID:        getString("id"),
		Label:     getString("label"),
		CardID:    getString("cardId"),
		Title:     getString("title"),
		Icon:      getString("icon"),
		Code:      getString("code"),
		DedupeKey: getString("dedupeKey"),
	}
	if v, ok := payload["version"].(float64); ok {
		artifact.Version = int(v)
	}
	if props, ok := payload["props"].(map[string]any); ok {
		artifact.Props = cloneMap(props)
	}
	if policy, ok := payload["policy"].(map[string]any); ok {
		artifact.Policy = cloneMap(policy)
	}

	switch kind {
	case "widget":
		artifact.Kind = "widget"
		artifact.WidgetType = getString("widgetType")
	case "card":
		artifact.Kind = "card-proposal"
	default:
		artifact.Kind = "widget"
	}

	return artifact
}

func validateArtifact(artifact chat.Artifact) error {
	switch strings.TrimSpace(artifact.Kind) {
	case "widget":
		if strings.TrimSpace(artifact.ID) == "" {
			return errors.New("missing widget id")
		}
		if strings.TrimSpace(artifact.WidgetType) == "" {
			return errors.New("missing widgetType")
		}
		switch artifact.WidgetType {
		case "data-table":
			if artifact.Props == nil {
				return errors.New("missing props")
			}
			if _, ok := artifact.Props["items"].([]map[string]any); !ok {
				if _, ok2 := artifact.Props["items"].([]any); !ok2 {
					return errors.New("data-table requires props.items array")
				}
			}
			if _, ok := artifact.Props["columns"].([]map[string]any); !ok {
				if _, ok2 := artifact.Props["columns"].([]any); !ok2 {
					return errors.New("data-table requires props.columns array")
				}
			}
		case "report-view":
			if artifact.Props == nil {
				return errors.New("missing props")
			}
			if _, ok := artifact.Props["sections"].([]map[string]any); !ok {
				if _, ok2 := artifact.Props["sections"].([]any); !ok2 {
					return errors.New("report-view requires props.sections array")
				}
			}
		}
		return nil
	case "card-proposal":
		if strings.TrimSpace(artifact.ID) == "" {
			return errors.New("missing proposal id")
		}
		cardID := strings.TrimSpace(artifact.CardID)
		if cardID == "" {
			return errors.New("missing cardId")
		}
		if !validCardIDRe.MatchString(cardID) {
			return fmt.Errorf("invalid cardId %q", cardID)
		}
		code := strings.TrimSpace(artifact.Code)
		if code == "" {
			return errors.New("missing code")
		}
		if !strings.Contains(code, "render") || !strings.Contains(code, "ui.") {
			return errors.New("code does not look like a HyperCard plugin definition")
		}
		return nil
	default:
		return fmt.Errorf("unsupported artifact kind %q", artifact.Kind)
	}
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
