package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	defaultTimelineEventLimit   = 1024
	defaultTimelineMessageLimit = 512
)

type TimelineMessageUpsert struct {
	ConversationID string
	MessageID      string
	Role           string
	Text           string
	Status         string
	ArtifactsJSON  string
	ActionsJSON    string
	UpdatedAt      time.Time
}

type TimelineEventAppend struct {
	ConversationID string
	EventID        string
	EventType      string
	StreamID       string
	Data           map[string]any
	Metadata       map[string]any
	CreatedAt      time.Time
}

type TimelineEventRecord struct {
	ConversationID string
	Seq            uint64
	EventID        string
	EventType      string
	StreamID       string
	Data           map[string]any
	Metadata       map[string]any
	CreatedAt      time.Time
}

type TimelineMessageRecord struct {
	MessageID     string
	Role          string
	Text          string
	Status        string
	ArtifactsJSON string
	ActionsJSON   string
	UpdatedAt     time.Time
}

type TimelineSnapshot struct {
	ConversationID string
	LastSeq        uint64
	Messages       []TimelineMessageRecord
	Events         []TimelineEventRecord
}

func (s *SQLiteStore) UpsertTimelineMessage(ctx context.Context, upsert TimelineMessageUpsert) error {
	if s == nil || s.db == nil {
		return errors.New("store is nil")
	}
	convID := strings.TrimSpace(upsert.ConversationID)
	messageID := strings.TrimSpace(upsert.MessageID)
	if convID == "" || messageID == "" {
		return errors.New("conversation id and message id are required")
	}
	role := strings.TrimSpace(upsert.Role)
	if role == "" {
		role = "ai"
	}
	status := strings.TrimSpace(upsert.Status)
	if status == "" {
		status = "streaming"
	}
	updatedAt := upsert.UpdatedAt.UTC()
	if updatedAt.IsZero() {
		updatedAt = time.Now().UTC()
	}
	artifactsJSON := strings.TrimSpace(upsert.ArtifactsJSON)
	if artifactsJSON == "" {
		artifactsJSON = "[]"
	}
	actionsJSON := strings.TrimSpace(upsert.ActionsJSON)
	if actionsJSON == "" {
		actionsJSON = "[]"
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin timeline message tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if err = ensureConversationRow(ctx, tx, convID, updatedAt); err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO timeline_messages (
			conversation_id, message_id, role, text, status, artifacts_json, actions_json, updated_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(conversation_id, message_id) DO UPDATE SET
			role = excluded.role,
			text = excluded.text,
			status = excluded.status,
			artifacts_json = excluded.artifacts_json,
			actions_json = excluded.actions_json,
			updated_at = excluded.updated_at
	`, convID, messageID, role, upsert.Text, status, artifactsJSON, actionsJSON, updatedAt.Format(time.RFC3339Nano))
	if err != nil {
		return fmt.Errorf("upsert timeline message: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE timeline_conversations
		SET updated_at = ?
		WHERE conversation_id = ?
	`, updatedAt.Format(time.RFC3339Nano), convID)
	if err != nil {
		return fmt.Errorf("touch timeline conversation: %w", err)
	}

	if err = tx.Commit(); err != nil {
		return fmt.Errorf("commit timeline message tx: %w", err)
	}
	return nil
}

func (s *SQLiteStore) AppendTimelineEvent(ctx context.Context, appendReq TimelineEventAppend) (TimelineEventRecord, error) {
	if s == nil || s.db == nil {
		return TimelineEventRecord{}, errors.New("store is nil")
	}

	convID := strings.TrimSpace(appendReq.ConversationID)
	eventType := strings.TrimSpace(appendReq.EventType)
	if convID == "" || eventType == "" {
		return TimelineEventRecord{}, errors.New("conversation id and event type are required")
	}
	eventID := strings.TrimSpace(appendReq.EventID)
	if eventID == "" {
		eventID = "sem-" + uuid.NewString()
	}
	createdAt := appendReq.CreatedAt.UTC()
	if createdAt.IsZero() {
		createdAt = time.Now().UTC()
	}
	data := cloneMap(appendReq.Data)
	if data == nil {
		data = map[string]any{}
	}
	metadata := cloneMap(appendReq.Metadata)
	if metadata == nil {
		metadata = map[string]any{}
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return TimelineEventRecord{}, fmt.Errorf("marshal timeline event data: %w", err)
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return TimelineEventRecord{}, fmt.Errorf("marshal timeline event metadata: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return TimelineEventRecord{}, fmt.Errorf("begin timeline event tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	if err = ensureConversationRow(ctx, tx, convID, createdAt); err != nil {
		return TimelineEventRecord{}, err
	}

	lastSeq, err := currentConversationSeq(ctx, tx, convID)
	if err != nil {
		return TimelineEventRecord{}, err
	}
	nextSeq := lastSeq + 1

	_, err = tx.ExecContext(ctx, `
		INSERT INTO timeline_events (
			conversation_id, seq, event_id, event_type, stream_id, data_json, metadata_json, created_at
		)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, convID, nextSeq, eventID, eventType, strings.TrimSpace(appendReq.StreamID), string(dataJSON), string(metadataJSON), createdAt.Format(time.RFC3339Nano))
	if err != nil {
		return TimelineEventRecord{}, fmt.Errorf("insert timeline event: %w", err)
	}

	_, err = tx.ExecContext(ctx, `
		UPDATE timeline_conversations
		SET last_seq = ?, updated_at = ?
		WHERE conversation_id = ?
	`, nextSeq, createdAt.Format(time.RFC3339Nano), convID)
	if err != nil {
		return TimelineEventRecord{}, fmt.Errorf("update timeline conversation seq: %w", err)
	}

	if err = pruneTimelineLocked(ctx, tx, convID, defaultTimelineEventLimit, defaultTimelineMessageLimit); err != nil {
		return TimelineEventRecord{}, err
	}

	if err = tx.Commit(); err != nil {
		return TimelineEventRecord{}, fmt.Errorf("commit timeline event tx: %w", err)
	}

	return TimelineEventRecord{
		ConversationID: convID,
		Seq:            uint64(nextSeq),
		EventID:        eventID,
		EventType:      eventType,
		StreamID:       strings.TrimSpace(appendReq.StreamID),
		Data:           data,
		Metadata:       metadata,
		CreatedAt:      createdAt,
	}, nil
}

func (s *SQLiteStore) GetTimelineSnapshot(ctx context.Context, conversationID string, sinceSeq uint64, limit int) (TimelineSnapshot, error) {
	if s == nil || s.db == nil {
		return TimelineSnapshot{}, errors.New("store is nil")
	}
	convID := strings.TrimSpace(conversationID)
	if convID == "" {
		convID = "default"
	}

	snapshot := TimelineSnapshot{
		ConversationID: convID,
		Messages:       []TimelineMessageRecord{},
		Events:         []TimelineEventRecord{},
	}

	var lastSeq int64
	err := s.db.QueryRowContext(ctx, `
		SELECT last_seq
		FROM timeline_conversations
		WHERE conversation_id = ?
	`, convID).Scan(&lastSeq)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return TimelineSnapshot{}, fmt.Errorf("read timeline conversation seq: %w", err)
	}
	if err == nil && lastSeq > 0 {
		snapshot.LastSeq = uint64(lastSeq)
	}

	msgRows, err := s.db.QueryContext(ctx, `
		SELECT message_id, role, text, status, artifacts_json, actions_json, updated_at
		FROM timeline_messages
		WHERE conversation_id = ?
		ORDER BY updated_at ASC, message_id ASC
	`, convID)
	if err != nil {
		return TimelineSnapshot{}, fmt.Errorf("query timeline messages: %w", err)
	}
	defer msgRows.Close()

	for msgRows.Next() {
		var (
			row          TimelineMessageRecord
			updatedAtRaw string
		)
		if err := msgRows.Scan(&row.MessageID, &row.Role, &row.Text, &row.Status, &row.ArtifactsJSON, &row.ActionsJSON, &updatedAtRaw); err != nil {
			return TimelineSnapshot{}, fmt.Errorf("scan timeline message row: %w", err)
		}
		row.UpdatedAt = parseRFC3339(updatedAtRaw)
		if strings.TrimSpace(row.ArtifactsJSON) == "" {
			row.ArtifactsJSON = "[]"
		}
		if strings.TrimSpace(row.ActionsJSON) == "" {
			row.ActionsJSON = "[]"
		}
		snapshot.Messages = append(snapshot.Messages, row)
	}
	if err := msgRows.Err(); err != nil {
		return TimelineSnapshot{}, fmt.Errorf("iterate timeline message rows: %w", err)
	}

	query := `
		SELECT seq, event_id, event_type, stream_id, data_json, metadata_json, created_at
		FROM timeline_events
		WHERE conversation_id = ? AND seq > ?
		ORDER BY seq ASC
	`
	args := []any{convID, int64(sinceSeq)}
	if limit > 0 {
		query += " LIMIT ?"
		args = append(args, limit)
	}

	eventRows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return TimelineSnapshot{}, fmt.Errorf("query timeline events: %w", err)
	}
	defer eventRows.Close()

	for eventRows.Next() {
		var (
			row          TimelineEventRecord
			seq          int64
			dataJSON     string
			metadataJSON string
			createdAtRaw string
		)
		if err := eventRows.Scan(&seq, &row.EventID, &row.EventType, &row.StreamID, &dataJSON, &metadataJSON, &createdAtRaw); err != nil {
			return TimelineSnapshot{}, fmt.Errorf("scan timeline event row: %w", err)
		}
		if seq > 0 {
			row.Seq = uint64(seq)
		}
		row.ConversationID = convID
		row.CreatedAt = parseRFC3339(createdAtRaw)
		row.Data = mapFromJSON(dataJSON)
		row.Metadata = mapFromJSON(metadataJSON)
		snapshot.Events = append(snapshot.Events, row)
	}
	if err := eventRows.Err(); err != nil {
		return TimelineSnapshot{}, fmt.Errorf("iterate timeline event rows: %w", err)
	}

	return snapshot, nil
}

func ensureConversationRow(ctx context.Context, tx *sql.Tx, conversationID string, now time.Time) error {
	_, err := tx.ExecContext(ctx, `
		INSERT INTO timeline_conversations (conversation_id, last_seq, updated_at)
		VALUES (?, 0, ?)
		ON CONFLICT(conversation_id) DO NOTHING
	`, conversationID, now.UTC().Format(time.RFC3339Nano))
	if err != nil {
		return fmt.Errorf("ensure timeline conversation row: %w", err)
	}
	return nil
}

func currentConversationSeq(ctx context.Context, tx *sql.Tx, conversationID string) (int64, error) {
	var lastSeq int64
	err := tx.QueryRowContext(ctx, `
		SELECT last_seq
		FROM timeline_conversations
		WHERE conversation_id = ?
	`, conversationID).Scan(&lastSeq)
	if err != nil {
		return 0, fmt.Errorf("read timeline conversation seq: %w", err)
	}
	return lastSeq, nil
}

func pruneTimelineLocked(ctx context.Context, tx *sql.Tx, conversationID string, maxEvents int, maxMessages int) error {
	if maxEvents > 0 {
		_, err := tx.ExecContext(ctx, `
			DELETE FROM timeline_events
			WHERE conversation_id = ?
			  AND seq <= COALESCE((
				SELECT seq
				FROM timeline_events
				WHERE conversation_id = ?
				ORDER BY seq DESC
				LIMIT 1 OFFSET ?
			  ), -1)
		`, conversationID, conversationID, maxEvents-1)
		if err != nil {
			return fmt.Errorf("prune timeline events: %w", err)
		}
	}
	if maxMessages > 0 {
		_, err := tx.ExecContext(ctx, `
			DELETE FROM timeline_messages
			WHERE conversation_id = ?
			  AND message_id NOT IN (
				SELECT message_id
				FROM timeline_messages
				WHERE conversation_id = ?
				ORDER BY updated_at DESC, message_id DESC
				LIMIT ?
			  )
		`, conversationID, conversationID, maxMessages)
		if err != nil {
			return fmt.Errorf("prune timeline messages: %w", err)
		}
	}
	return nil
}

func mapFromJSON(raw string) map[string]any {
	out := map[string]any{}
	if strings.TrimSpace(raw) == "" {
		return out
	}
	if err := json.Unmarshal([]byte(raw), &out); err != nil {
		return map[string]any{}
	}
	return out
}

func parseRFC3339(raw string) time.Time {
	t, err := time.Parse(time.RFC3339Nano, strings.TrimSpace(raw))
	if err != nil {
		return time.Time{}
	}
	return t.UTC()
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
