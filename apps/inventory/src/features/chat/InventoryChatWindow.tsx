import { ChatWindow, type ChatWindowMessage, type InlineWidget } from '@hypercard/engine';
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
  upsertCardPanelItem,
  upsertTimelineItem,
  upsertWidgetPanelItem,
} from './chatSlice';
import { selectConnectionStatus, selectConversationId, selectIsStreaming, selectMessages } from './selectors';
import {
  getOrCreateConversationId,
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  type SemEventEnvelope,
  submitPrompt,
} from './webchatClient';
import { InventoryTimelineWidget, timelineItemsFromInlineWidget } from './InventoryTimelineWidget';
import { InventoryCardPanelWidget, InventoryGeneratedWidgetPanel } from './InventoryArtifactPanelWidgets';

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

function stripTrailingWhitespace(value: string): string {
  return value.replace(/[ \t]+$/gm, '').trimEnd();
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

function structuredRecordFromUnknown(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function artifactIdFromStructuredResult(result: Record<string, unknown> | undefined): string | undefined {
  const data = result ? recordField(result, 'data') : undefined;
  const artifact = data ? recordField(data, 'artifact') : undefined;
  return artifact ? stringField(artifact, 'id') : undefined;
}

function readyDetail(template: string | undefined, artifactId: string | undefined): string {
  const parts: string[] = [];
  if (template) {
    parts.push(`template=${template}`);
  }
  if (artifactId) {
    parts.push(`artifact=${artifactId}`);
  }
  return parts.length > 0 ? parts.join(' · ') : 'ready';
}

interface TimelineItemUpdate {
  id: string;
  title: string;
  status: TimelineItemStatus;
  detail?: string;
  kind?: 'tool' | 'widget' | 'card' | 'timeline';
  template?: string;
  artifactId?: string;
}

function fanOutArtifactPanelUpdate(update: TimelineItemUpdate, dispatch: ReturnType<typeof useDispatch>) {
  if (update.kind === 'card') {
    dispatch(upsertCardPanelItem(update));
  }
  if (update.kind === 'widget') {
    dispatch(upsertWidgetPanelItem(update));
  }
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
): TimelineItemUpdate | undefined {
  const title = stringField(data, 'title');
  const itemId = stringField(data, 'itemId');

  if (type === 'hypercard.widget.start') {
    const id = itemId ?? 'unknown';
    return {
      id: `widget:${id}`,
      title: title ?? 'Widget',
      status: 'running',
      detail: 'started',
      kind: 'widget',
      template: stringField(data, 'widgetType'),
    };
  }
  if (type === 'hypercard.widget.update') {
    const id = itemId ?? 'unknown';
    return {
      id: `widget:${id}`,
      title: title ?? 'Widget',
      status: 'running',
      detail: 'updating',
      kind: 'widget',
      template: stringField(data, 'widgetType'),
    };
  }
  if (type === 'hypercard.widget.v1') {
    const widgetType = stringField(data, 'widgetType') ?? stringField(data, 'template');
    const payload = recordField(data, 'data');
    const artifact = payload ? recordField(payload, 'artifact') : undefined;
    const artifactId = artifact ? stringField(artifact, 'id') : undefined;
    const id = itemId ?? 'unknown';
    return {
      id: `widget:${id}`,
      title: title ?? 'Widget',
      status: 'success',
      detail: shortText(readyDetail(widgetType, artifactId)),
      kind: 'widget',
      template: widgetType,
      artifactId,
    };
  }
  if (type === 'hypercard.widget.error') {
    const id = itemId ?? 'unknown';
    return {
      id: `widget:${id}`,
      title: title ?? 'Widget',
      status: 'error',
      detail: shortText(stringField(data, 'error') ?? 'unknown error'),
      kind: 'widget',
      template: stringField(data, 'widgetType'),
    };
  }

  if (type === 'hypercard.card.start') {
    const id = itemId ?? 'unknown';
    return { id: `card:${id}`, title: title ?? 'Card', status: 'running', detail: 'started', kind: 'card' };
  }
  if (type === 'hypercard.card.update') {
    const id = itemId ?? 'unknown';
    return { id: `card:${id}`, title: title ?? 'Card', status: 'running', detail: 'updating', kind: 'card' };
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
      detail: shortText(readyDetail(template, artifactId)),
      kind: 'card',
      template,
      artifactId,
    };
  }
  if (type === 'hypercard.card.error') {
    const id = itemId ?? 'unknown';
    return {
      id: `card:${id}`,
      title: title ?? 'Card',
      status: 'error',
      detail: shortText(stringField(data, 'error') ?? 'unknown error'),
      kind: 'card',
    };
  }

  return undefined;
}

function formatTimelineUpsert(
  data: Record<string, unknown>,
): TimelineItemUpdate | undefined {
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
    const timelineKind = prefix === 'widget' ? 'widget' : prefix === 'card' ? 'card' : 'timeline';
    return {
      id: `${prefix}:${baseId}`,
      title: text ?? id,
      status: statusFromTimelineType(statusType),
      detail: shortText(statusType ? `timeline status=${statusType}` : undefined),
      kind: timelineKind,
    };
  }

  const toolResult = recordField(entity, 'toolResult');
  if (toolResult && kind === 'tool_result') {
    const customKind = stringField(toolResult, 'customKind');
    const toolCallId = stringField(toolResult, 'toolCallId') ?? id;
    const resultRecord =
      structuredRecordFromUnknown(toolResult.result) ?? structuredRecordFromUnknown(toolResult.resultRaw);
    const resultTitle = resultRecord ? stringField(resultRecord, 'title') : undefined;
    const resultTemplate = resultRecord ? stringField(resultRecord, 'template') : undefined;
    const resultWidgetType = resultRecord ? stringField(resultRecord, 'type') : undefined;
    const resultArtifactId = artifactIdFromStructuredResult(resultRecord);
    if (customKind === 'hypercard.widget.v1') {
      return {
        id: `widget:${toolCallId}`,
        title: resultTitle ?? 'Widget',
        status: 'success',
        detail: shortText(readyDetail(resultWidgetType, resultArtifactId)),
        kind: 'widget',
        template: resultWidgetType,
        artifactId: resultArtifactId,
      };
    }
    if (customKind === 'hypercard.card_proposal.v1') {
      return {
        id: `card:${toolCallId}`,
        title: resultTitle ?? 'Card',
        status: 'success',
        detail: shortText(readyDetail(resultTemplate, resultArtifactId)),
        kind: 'card',
        template: resultTemplate,
        artifactId: resultArtifactId,
      };
    }
    const resultText = stringField(toolResult, 'resultRaw') ?? compactJSON(toolResult.result);
    return {
      id: `timeline:${id}`,
      title: customKind ?? 'Tool result',
      status: 'info',
      detail: shortText(resultText),
      kind: 'timeline',
    };
  }
  return undefined;
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
        kind: 'tool',
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
        kind: 'tool',
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
        kind: 'tool',
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
        kind: 'tool',
      }),
    );
    return;
  }

  const lifecycleText = type ? formatHypercardLifecycle(type, data) : undefined;
  if (lifecycleText) {
    dispatch(upsertTimelineItem(lifecycleText));
    fanOutArtifactPanelUpdate(lifecycleText, dispatch);
    return;
  }

  if (type === 'timeline.upsert') {
    const timelineUpdate = formatTimelineUpsert(data);
    if (timelineUpdate) {
      dispatch(upsertTimelineItem(timelineUpdate));
      fanOutArtifactPanelUpdate(timelineUpdate, dispatch);
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

  const displayMessages = useMemo<ChatWindowMessage[]>(
    () =>
      messages.map((message) => {
        if (message.role === 'user' || !message.text) {
          return message;
        }
        const text = stripTrailingWhitespace(message.text);
        if (text === message.text) {
          return message;
        }
        return { ...message, text };
      }),
    [messages],
  );

  const renderWidget = useCallback((widget: InlineWidget) => {
    const items = timelineItemsFromInlineWidget(widget);
    if (widget.type !== 'inventory.timeline') {
      if (widget.type === 'inventory.cards') {
        return <InventoryCardPanelWidget items={items} />;
      }
      if (widget.type === 'inventory.widgets') {
        return <InventoryGeneratedWidgetPanel items={items} />;
      }
      return null;
    }
    return <InventoryTimelineWidget items={items} />;
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
      messages={displayMessages}
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
