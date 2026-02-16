import { ChatWindow, openWindow, type ChatWindowMessage, type InlineWidget } from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { buildArtifactOpenWindowPayload, extractArtifactUpsertFromSem } from './artifactRuntime';
import { upsertArtifact } from './artifactsSlice';
import {
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  markStreamStart,
  mergeSuggestions,
  queueUserPrompt,
  replaceSuggestions,
  setConnectionStatus,
  setConversationId,
  setModelName,
  setStreamError,
  setTurnStats,
  type TimelineWidgetItem,
  type TurnStats,
  updateStreamTokens,
  upsertHydratedMessage,
  upsertCardPanelItem,
  upsertTimelineItem,
  upsertWidgetPanelItem,
} from './chatSlice';
import {
  selectConnectionStatus,
  selectConversationId,
  selectCurrentTurnStats,
  selectIsStreaming,
  selectMessages,
  selectModelName,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from './selectors';
import {
  fetchTimelineSnapshot,
  getOrCreateConversationId,
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  type SemEventEnvelope,
  type TimelineEntityRecord,
  type TimelineSnapshot,
  submitPrompt,
} from './webchatClient';
import { InventoryTimelineWidget, timelineItemsFromInlineWidget } from './InventoryTimelineWidget';
import { InventoryCardPanelWidget, InventoryGeneratedWidgetPanel } from './InventoryArtifactPanelWidgets';
import { formatTimelineUpsert, type TimelineItemUpdate } from './timelineProjection';

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

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

function booleanField(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  if (typeof value === 'boolean') {
    return value;
  }
  return undefined;
}

function stripTrailingWhitespace(value: string): string {
  return value.replace(/[ \t]+$/gm, '').trimEnd();
}

function numberField(record: Record<string, unknown>, key: string): number | undefined {
  const value = record[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return undefined;
}

function extractMetadata(envelope: SemEventEnvelope): Record<string, unknown> | undefined {
  const meta = (envelope as Record<string, unknown>).event;
  if (!meta || typeof meta !== 'object') return undefined;
  const eventObj = meta as Record<string, unknown>;
  const metadata = eventObj.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  return metadata as Record<string, unknown>;
}

function extractUsage(metadata: Record<string, unknown>): Record<string, unknown> | undefined {
  const usage = metadata.usage;
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) return undefined;
  return usage as Record<string, unknown>;
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

function fanOutArtifactPanelUpdate(update: TimelineItemUpdate, dispatch: ReturnType<typeof useDispatch>) {
  if (update.kind === 'card') {
    dispatch(upsertCardPanelItem(update));
  }
  if (update.kind === 'widget') {
    dispatch(upsertWidgetPanelItem(update));
  }
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
function parseTimelineMs(value: string | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function hydrateEntity(entity: TimelineEntityRecord, dispatch: ReturnType<typeof useDispatch>): void {
  const kind = typeof entity.kind === 'string' ? entity.kind : '';
  const id = typeof entity.id === 'string' ? entity.id : '';

  if (kind === 'message') {
    const message = recordField(entity, 'message');
    if (!message) {
      return;
    }
    const role = stringField(message, 'role');
    if (!role) {
      return;
    }
    const content = stringField(message, 'content');
    const streaming = booleanField(message, 'streaming') ?? false;
    dispatch(
      upsertHydratedMessage({
        id,
        role,
        text: content,
        status: streaming ? 'streaming' : 'complete',
      }),
    );
    return;
  }

  const eventData: Record<string, unknown> = { entity };
  const artifactUpdate = extractArtifactUpsertFromSem('timeline.upsert', eventData);
  if (artifactUpdate) {
    dispatch(upsertArtifact(artifactUpdate));
  }
  const timelineUpdate = formatTimelineUpsert(eventData);
  if (timelineUpdate) {
    dispatch(upsertTimelineItem(timelineUpdate));
    fanOutArtifactPanelUpdate(timelineUpdate, dispatch);
  }
}

function hydrateFromTimelineSnapshot(snapshot: TimelineSnapshot, dispatch: ReturnType<typeof useDispatch>): void {
  const sorted = [...snapshot.entities].sort((a, b) => {
    const aCreated = parseTimelineMs(a.createdAtMs);
    const bCreated = parseTimelineMs(b.createdAtMs);
    if (aCreated !== bCreated) {
      return aCreated - bCreated;
    }
    return parseTimelineMs(a.updatedAtMs) - parseTimelineMs(b.updatedAtMs);
  });
  for (const entity of sorted) {
    hydrateEntity(entity, dispatch);
  }
}

function onSemEnvelope(envelope: SemEventEnvelope, dispatch: ReturnType<typeof useDispatch>): void {
  const type = envelope.event?.type;
  const data = envelope.event?.data ?? {};
  const messageId = eventIdFromEnvelope(envelope);

  const artifactUpdate = extractArtifactUpsertFromSem(type, data);
  if (artifactUpdate) {
    dispatch(upsertArtifact(artifactUpdate));
  }

  if (type === 'llm.start') {
    const metadata = extractMetadata(envelope);
    if (metadata) {
      const model = stringField(metadata, 'model');
      if (model) {
        dispatch(setModelName(model));
      }
    }
    dispatch(markStreamStart({ time: Date.now() }));
    dispatch(applyLLMStart({ messageId }));
    return;
  }

  if (type === 'llm.delta') {
    const metadata = extractMetadata(envelope);
    if (metadata) {
      const usage = extractUsage(metadata);
      if (usage) {
        const outputTokens = numberField(usage, 'outputTokens');
        if (outputTokens !== undefined) {
          dispatch(updateStreamTokens({ outputTokens }));
        }
      }
    }
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
    const metadata = extractMetadata(envelope);
    if (metadata) {
      const model = stringField(metadata, 'model');
      if (model) {
        dispatch(setModelName(model));
      }
      const usage = extractUsage(metadata);
      const stats: TurnStats = {};
      if (usage) {
        stats.inputTokens = numberField(usage, 'inputTokens');
        stats.outputTokens = numberField(usage, 'outputTokens');
        stats.cachedTokens = numberField(usage, 'cachedTokens');
        stats.cacheCreationInputTokens = numberField(usage, 'cacheCreationInputTokens');
        stats.cacheReadInputTokens = numberField(usage, 'cacheReadInputTokens');
      }
      stats.durationMs = numberField(metadata, 'durationMs');
      if (stats.inputTokens !== undefined || stats.outputTokens !== undefined || stats.durationMs !== undefined) {
        dispatch(setTurnStats(stats));
      }
    }
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
    const rawData: Record<string, unknown> = { name };
    if (typeof input !== 'undefined') {
      rawData.input = input;
    }
    dispatch(
      upsertTimelineItem({
        id: `tool:${toolId}`,
        title: `Tool ${name}`,
        status: 'running',
        detail: shortText(argsText.trim()),
        kind: 'tool',
        rawData,
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
        rawData: typeof patch !== 'undefined' ? { patch } : undefined,
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
        rawData: typeof data.result !== 'undefined' ? { result: data.result } : undefined,
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

  if (type === 'hypercard.suggestions.start' || type === 'hypercard.suggestions.update') {
    const suggestions = stringArray(data.suggestions);
    if (suggestions.length > 0) {
      dispatch(mergeSuggestions({ suggestions }));
    }
    return;
  }

  if (type === 'hypercard.suggestions.v1') {
    const suggestions = stringArray(data.suggestions);
    if (suggestions.length > 0) {
      dispatch(replaceSuggestions({ suggestions }));
    }
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

function formatNumber(n: number): string {
  if (n >= 1000) {
    return n.toLocaleString('en-US');
  }
  return String(n);
}

function StatsFooter({
  modelName,
  turnStats,
  isStreaming,
  streamStartTime,
  streamOutputTokens,
}: {
  modelName: string | null;
  turnStats: TurnStats | null;
  isStreaming: boolean;
  streamStartTime: number | null;
  streamOutputTokens: number;
}) {
  const parts: string[] = [];

  if (modelName) {
    parts.push(modelName);
  }

  if (isStreaming && streamStartTime) {
    const elapsed = (Date.now() - streamStartTime) / 1000;
    if (streamOutputTokens > 0 && elapsed > 0) {
      const liveTps = Math.round((streamOutputTokens / elapsed) * 10) / 10;
      parts.push(`streaming: ${formatNumber(streamOutputTokens)} tok · ${liveTps} tok/s`);
    } else {
      parts.push('streaming...');
    }
  } else if (turnStats) {
    const tokenParts: string[] = [];
    if (turnStats.inputTokens !== undefined) {
      tokenParts.push(`In:${formatNumber(turnStats.inputTokens)}`);
    }
    if (turnStats.outputTokens !== undefined) {
      tokenParts.push(`Out:${formatNumber(turnStats.outputTokens)}`);
    }
    if (turnStats.cachedTokens !== undefined && turnStats.cachedTokens > 0) {
      tokenParts.push(`Cache:${formatNumber(turnStats.cachedTokens)}`);
    }
    if (turnStats.cacheCreationInputTokens !== undefined && turnStats.cacheCreationInputTokens > 0) {
      tokenParts.push(`CacheWrite:${formatNumber(turnStats.cacheCreationInputTokens)}`);
    }
    if (tokenParts.length > 0) {
      parts.push(tokenParts.join(' '));
    }
    if (turnStats.durationMs !== undefined) {
      parts.push(`${(turnStats.durationMs / 1000).toFixed(1)}s`);
    }
    if (turnStats.tps !== undefined) {
      parts.push(`${turnStats.tps} tok/s`);
    }
  }

  if (parts.length === 0) {
    return <span>Streaming via /chat + /ws</span>;
  }

  return <span>{parts.join(' · ')}</span>;
}

export function InventoryChatWindow() {
  const dispatch = useDispatch();
  const conversationId = useSelector(selectConversationId);
  const connectionStatus = useSelector(selectConnectionStatus);
  const messages = useSelector(selectMessages);
  const suggestions = useSelector(selectSuggestions);
  const isStreaming = useSelector(selectIsStreaming);
  const modelName = useSelector(selectModelName);
  const currentTurnStats = useSelector(selectCurrentTurnStats);
  const streamStartTime = useSelector(selectStreamStartTime);
  const streamOutputTokens = useSelector(selectStreamOutputTokens);

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

    let cancelled = false;
    let client: InventoryWebChatClient | null = null;

    const bootstrap = async () => {
      try {
        const snapshot = await fetchTimelineSnapshot(conversationId);
        if (!cancelled) {
          hydrateFromTimelineSnapshot(snapshot, dispatch);
        }
      } catch (error) {
        if (!cancelled) {
          dispatch(
            upsertTimelineItem({
              id: `timeline:bootstrap:${conversationId}`,
              title: 'Timeline bootstrap',
              status: 'error',
              detail: shortText(error instanceof Error ? error.message : 'timeline bootstrap failed'),
              kind: 'timeline',
            }),
          );
        }
      }
      if (cancelled) {
        return;
      }
      client = new InventoryWebChatClient(conversationId, handlers);
      clientRef.current = client;
      client.connect();
    };

    void bootstrap();

    return () => {
      cancelled = true;
      client?.close();
      if (client && clientRef.current === client) {
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
    const openArtifact = (item: TimelineWidgetItem) => {
      const artifactId = item.artifactId?.trim();
      if (!artifactId) {
        return;
      }
      const payload = buildArtifactOpenWindowPayload({
        artifactId,
        template: item.template,
        title: item.title,
      });
      if (!payload) {
        return;
      }
      dispatch(openWindow(payload));
    };
    if (widget.type !== 'inventory.timeline') {
      if (widget.type === 'inventory.cards') {
        return <InventoryCardPanelWidget items={items} onOpenArtifact={openArtifact} />;
      }
      if (widget.type === 'inventory.widgets') {
        return <InventoryGeneratedWidgetPanel items={items} onOpenArtifact={openArtifact} />;
      }
      return null;
    }
    return <InventoryTimelineWidget items={items} />;
  }, [dispatch]);

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
      suggestions={suggestions}
      showSuggestionsAlways
      footer={
        <StatsFooter
          modelName={modelName}
          turnStats={currentTurnStats}
          isStreaming={isStreaming}
          streamStartTime={streamStartTime}
          streamOutputTokens={streamOutputTokens}
        />
      }
    />
  );
}
