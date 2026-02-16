import { ChatWindow, type InlineWidget } from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  queueUserPrompt,
  setConnectionStatus,
  setConversationId,
  setStreamError,
  type TimelineItemStatus,
  upsertTimelineItem,
} from './chatSlice';
import { selectConnectionStatus, selectConversationId, selectIsStreaming, selectMessages } from './selectors';
import {
  getOrCreateConversationId,
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  type SemEventEnvelope,
  submitPrompt,
} from './webchatClient';

function eventIdFromEnvelope(envelope: SemEventEnvelope): string {
  const eventId = envelope.event?.id;
  if (typeof eventId === 'string' && eventId.length > 0) {
    return eventId;
  }
  return `evt-${Date.now()}`;
}

function eventOrDataId(envelope: SemEventEnvelope, data: Record<string, unknown>): string {
  const dataId = stringField(data, 'id');
  if (dataId && dataId.length > 0) {
    return dataId;
  }
  return eventIdFromEnvelope(envelope);
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

function recordField(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined {
  const value = record[key];
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function compactJSON(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '"<unserializable>"';
  }
}

function shortText(value: string | undefined, max = 180): string | undefined {
  if (!value) {
    return value;
  }
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...`;
}

function statusFromTimelineType(value: string | undefined): TimelineItemStatus {
  if (value === 'error') {
    return 'error';
  }
  if (value === 'success') {
    return 'success';
  }
  return 'info';
}

function formatHypercardLifecycle(
  type: string,
  data: Record<string, unknown>,
): { id: string; title: string; status: TimelineItemStatus; detail?: string } | undefined {
  const title = stringField(data, 'title');
  const itemId = stringField(data, 'itemId');

  if (type === 'hypercard.widget.start') {
    const id = itemId ?? 'unknown';
    return { id: `widget:${id}`, title: title ?? 'Widget', status: 'running', detail: 'started' };
  }
  if (type === 'hypercard.widget.update') {
    const id = itemId ?? 'unknown';
    return { id: `widget:${id}`, title: title ?? 'Widget', status: 'running', detail: 'updating' };
  }
  if (type === 'hypercard.widget.v1') {
    const payload = recordField(data, 'data');
    const artifact = payload ? recordField(payload, 'artifact') : undefined;
    const artifactId = artifact ? stringField(artifact, 'id') : undefined;
    const id = itemId ?? 'unknown';
    return {
      id: `widget:${id}`,
      title: title ?? 'Widget',
      status: 'success',
      detail: artifactId ? `ready (artifact=${artifactId})` : 'ready',
    };
  }
  if (type === 'hypercard.widget.error') {
    const id = itemId ?? 'unknown';
    return {
      id: `widget:${id}`,
      title: title ?? 'Widget',
      status: 'error',
      detail: shortText(stringField(data, 'error') ?? 'unknown error'),
    };
  }

  if (type === 'hypercard.card.start') {
    const id = itemId ?? 'unknown';
    return { id: `card:${id}`, title: title ?? 'Card', status: 'running', detail: 'started' };
  }
  if (type === 'hypercard.card.update') {
    const id = itemId ?? 'unknown';
    return { id: `card:${id}`, title: title ?? 'Card', status: 'running', detail: 'updating' };
  }
  if (type === 'hypercard.card_proposal.v1') {
    const template = stringField(data, 'template');
    const payload = recordField(data, 'data');
    const artifact = payload ? recordField(payload, 'artifact') : undefined;
    const artifactId = artifact ? stringField(artifact, 'id') : undefined;
    const id = itemId ?? 'unknown';
    return {
      id: `card:${id}`,
      title: title ?? 'Card',
      status: 'success',
      detail: shortText(
        `ready${template ? ` (template=${template})` : ''}${artifactId ? ` artifact=${artifactId}` : ''}`,
      ),
    };
  }
  if (type === 'hypercard.card.error') {
    const id = itemId ?? 'unknown';
    return {
      id: `card:${id}`,
      title: title ?? 'Card',
      status: 'error',
      detail: shortText(stringField(data, 'error') ?? 'unknown error'),
    };
  }

  return undefined;
}

function formatTimelineUpsert(
  data: Record<string, unknown>,
): { id: string; title: string; status: TimelineItemStatus; detail?: string } | undefined {
  const entity = recordField(data, 'entity');
  if (!entity) {
    return undefined;
  }
  const kind = stringField(entity, 'kind') ?? '';
  const id = stringField(entity, 'id') ?? 'unknown';
  const status = recordField(entity, 'status');
  if (status && kind === 'status') {
    const text = stringField(status, 'text');
    const statusType = stringField(status, 'type');
    const baseId = id.endsWith(':status') ? id.slice(0, -7) : id;
    const lowered = (text ?? '').toLowerCase();
    let prefix = 'timeline';
    if (lowered.includes('widget')) {
      prefix = 'widget';
    } else if (lowered.includes('card')) {
      prefix = 'card';
    }
    return {
      id: `${prefix}:${baseId}`,
      title: text ?? id,
      status: statusFromTimelineType(statusType),
      detail: shortText(`${statusType ?? 'info'} projection`),
    };
  }

  const toolResult = recordField(entity, 'toolResult');
  if (toolResult && kind === 'tool_result') {
    const customKind = stringField(toolResult, 'customKind');
    const toolCallId = stringField(toolResult, 'toolCallId') ?? id;
    if (customKind === 'hypercard.widget.v1') {
      return {
        id: `widget:${toolCallId}`,
        title: 'Widget',
        status: 'success',
        detail: 'projected',
      };
    }
    if (customKind === 'hypercard.card_proposal.v1') {
      return {
        id: `card:${toolCallId}`,
        title: 'Card',
        status: 'success',
        detail: 'projected',
      };
    }
    return {
      id: `timeline:${id}`,
      title: customKind ?? 'Tool result',
      status: 'info',
      detail: shortText('projected'),
    };
  }
  return undefined;
}

function statusGlyph(status: TimelineItemStatus): string {
  if (status === 'running') {
    return '...';
  }
  if (status === 'success') {
    return 'OK';
  }
  if (status === 'error') {
    return 'ERR';
  }
  return 'i';
}

function timelineItemsFromWidget(widget: InlineWidget) {
  const raw = (widget.props as Record<string, unknown>).items;
  if (!Array.isArray(raw)) {
    return [] as Array<{ id: string; title: string; status: TimelineItemStatus; detail?: string; updatedAt: number }>;
  }
  return raw.filter((item) => typeof item === 'object' && item !== null) as Array<{
    id: string;
    title: string;
    status: TimelineItemStatus;
    detail?: string;
    updatedAt: number;
  }>;
}

function onSemEnvelope(envelope: SemEventEnvelope, dispatch: ReturnType<typeof useDispatch>): void {
  const type = envelope.event?.type;
  const data = envelope.event?.data ?? {};
  const messageId = eventIdFromEnvelope(envelope);

  if (type === 'llm.start') {
    dispatch(applyLLMStart({ messageId }));
    return;
  }

  if (type === 'llm.delta') {
    dispatch(
      applyLLMDelta({
        messageId,
        cumulative: stringField(data, 'cumulative'),
        delta: stringField(data, 'delta'),
      }),
    );
    return;
  }

  if (type === 'llm.final') {
    dispatch(
      applyLLMFinal({
        messageId,
        text: stringField(data, 'text'),
      }),
    );
    return;
  }

  if (type === 'tool.start') {
    const toolId = eventOrDataId(envelope, data);
    const name = stringField(data, 'name') ?? 'tool';
    const input = data.input;
    const argsText = typeof input === 'undefined' ? '' : ` args=${compactJSON(input)}`;
    dispatch(
      upsertTimelineItem({
        id: `tool:${toolId}`,
        title: `Tool ${name}`,
        status: 'running',
        detail: shortText(argsText.trim()),
      }),
    );
    return;
  }

  if (type === 'tool.delta') {
    const toolId = eventOrDataId(envelope, data);
    const patch = data.patch;
    const patchText = typeof patch === 'undefined' ? 'delta' : `patch=${compactJSON(patch)}`;
    dispatch(
      upsertTimelineItem({
        id: `tool:${toolId}`,
        title: `Tool ${toolId}`,
        status: 'running',
        detail: shortText(patchText),
      }),
    );
    return;
  }

  if (type === 'tool.result') {
    const toolId = eventOrDataId(envelope, data);
    const result = typeof data.result === 'undefined' ? 'ok' : compactJSON(data.result);
    dispatch(
      upsertTimelineItem({
        id: `tool:${toolId}`,
        title: `Tool ${toolId}`,
        status: 'running',
        detail: shortText(`result=${result}`),
      }),
    );
    return;
  }

  if (type === 'tool.done') {
    const toolId = eventOrDataId(envelope, data);
    dispatch(
      upsertTimelineItem({
        id: `tool:${toolId}`,
        title: `Tool ${toolId}`,
        status: 'success',
        detail: 'done',
      }),
    );
    return;
  }

  const lifecycleText = type ? formatHypercardLifecycle(type, data) : undefined;
  if (lifecycleText) {
    dispatch(upsertTimelineItem(lifecycleText));
    return;
  }

  if (type === 'timeline.upsert') {
    const timelineUpdate = formatTimelineUpsert(data);
    if (timelineUpdate) {
      dispatch(upsertTimelineItem(timelineUpdate));
    }
    return;
  }

  if (type === 'ws.error') {
    dispatch(setStreamError({ message: stringField(data, 'message') ?? 'websocket stream error' }));
  }
}

export function InventoryChatWindow() {
  const dispatch = useDispatch();
  const conversationId = useSelector(selectConversationId);
  const connectionStatus = useSelector(selectConnectionStatus);
  const messages = useSelector(selectMessages);
  const isStreaming = useSelector(selectIsStreaming);

  const clientRef = useRef<InventoryWebChatClient | null>(null);

  useEffect(() => {
    if (conversationId) {
      return;
    }

    dispatch(setConversationId(getOrCreateConversationId()));
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const handlers: InventoryWebChatClientHandlers = {
      onEnvelope: (envelope) => onSemEnvelope(envelope, dispatch),
      onStatus: (status) => dispatch(setConnectionStatus(status)),
      onError: (error) => dispatch(setStreamError({ message: error })),
    };

    const client = new InventoryWebChatClient(conversationId, handlers);
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [conversationId, dispatch]);

  const subtitle = useMemo(() => {
    if (!conversationId) {
      return 'bootstrapping...';
    }
    return `${connectionStatus} · ${conversationId}`;
  }, [connectionStatus, conversationId]);

  const renderWidget = useCallback((widget: InlineWidget) => {
    if (widget.type !== 'inventory.timeline') {
      return null;
    }
    const items = timelineItemsFromWidget(widget);
    if (items.length === 0) {
      return (
        <div data-part="inventory-timeline-widget-empty" style={{ fontSize: 11, opacity: 0.75 }}>
          Waiting for events...
        </div>
      );
    }
    return (
      <div
        data-part="inventory-timeline-widget"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          fontSize: 11,
          border: '1px solid var(--hc-color-border-subtle, #d9d9df)',
          borderRadius: 6,
          padding: 8,
          background: 'var(--hc-color-bg-panel, #f8f8fb)',
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            data-part="inventory-timeline-item"
            data-status={item.status}
            style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 6, alignItems: 'start' }}
          >
            <span
              data-part="inventory-timeline-status"
              style={{
                fontWeight: 700,
                color:
                  item.status === 'error'
                    ? '#c0352b'
                    : item.status === 'success'
                      ? '#1b6e3a'
                      : item.status === 'running'
                        ? '#5a5f00'
                        : '#4c5671',
              }}
            >
              {statusGlyph(item.status)}
            </span>
            <div>
              <div data-part="inventory-timeline-title" style={{ fontWeight: 600 }}>
                {item.title}
              </div>
              {item.detail ? (
                <div data-part="inventory-timeline-detail" style={{ opacity: 0.82 }}>
                  {item.detail}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) {
        return;
      }

      const prompt = text.trim();
      if (prompt.length === 0) {
        return;
      }

      const convId = conversationId ?? getOrCreateConversationId();
      if (!conversationId) {
        dispatch(setConversationId(convId));
      }

      dispatch(queueUserPrompt({ text: prompt }));

      try {
        await submitPrompt(prompt, convId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'chat request failed';
        dispatch(setStreamError({ message }));
      }
    },
    [conversationId, dispatch, isStreaming],
  );

  return (
    <ChatWindow
      messages={messages}
      isStreaming={isStreaming}
      onSend={handleSend}
      renderWidget={renderWidget}
      title="Inventory Chat"
      subtitle={subtitle}
      placeholder="Ask about inventory..."
      suggestions={['Show current inventory status', 'What items are low stock?', 'Summarize today sales']}
      footer={<span>Streaming via /chat + /ws</span>}
    />
  );
}
