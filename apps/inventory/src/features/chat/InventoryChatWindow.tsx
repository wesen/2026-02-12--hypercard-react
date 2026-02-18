import { ChatWindow, registerRuntimeCard, type ChatWindowMessage, type InlineWidget } from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import {
  buildArtifactOpenWindowPayload,
  emitConversationEvent,
  extractArtifactUpsertFromSem,
  formatTimelineUpsert,
  HypercardCardPanelWidget as InventoryCardPanelWidget,
  HypercardGeneratedWidgetPanel as InventoryGeneratedWidgetPanel,
  HypercardTimelineWidget as InventoryTimelineWidget,
  openRuntimeCardCodeEditor as openCodeEditor,
  timelineItemsFromInlineWidget,
  type TimelineItemUpdate,
  upsertArtifact,
} from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  applyLLMDelta,
  applyLLMFinal,
  applyLLMStart,
  markStreamStart,
  mergeSuggestions,
  queueUserPrompt,
  replaceSuggestions,
  setConnectionStatus,
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
  type ChatStateSlice,
  selectConnectionStatus,
  selectCurrentTurnStats,
  selectIsStreaming,
  selectMessages,
  selectModelName,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from './selectors';
import {
  InventoryWebChatClient,
  type InventoryWebChatClientHandlers,
  type SemEventEnvelope,
  type TimelineEntityRecord,
  type TimelineSnapshot,
  submitPrompt,
} from './webchatClient';
import {
  booleanField,
  compactJSON,
  numberField,
  recordField,
  stringArray,
  stringField,
  stripTrailingWhitespace,
} from './semHelpers';

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

function fanOutArtifactPanelUpdate(update: TimelineItemUpdate, dispatch: ReturnType<typeof useDispatch>, conversationId: string) {
  if (update.kind === 'card') {
    dispatch(upsertCardPanelItem({ ...update, conversationId }));
  }
  if (update.kind === 'widget') {
    dispatch(upsertWidgetPanelItem({ ...update, conversationId }));
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
      rawData: data,
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
      rawData: data,
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
      rawData: data,
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
      rawData: data,
    };
  }

  if (type === 'hypercard.card.start') {
    const id = itemId ?? 'unknown';
    const name = stringField(data, 'name') ?? title ?? 'Card';
    return { id: `card:${id}`, title: name, status: 'running', detail: 'started', kind: 'card', rawData: data };
  }
  if (type === 'hypercard.card.update') {
    const id = itemId ?? 'unknown';
    const name = stringField(data, 'name') ?? title ?? 'Card';
    return { id: `card:${id}`, title: name, status: 'running', detail: 'updating', kind: 'card', rawData: data };
  }
  if (type === 'hypercard.card.v2') {
    const name = stringField(data, 'name');
    const payload = recordField(data, 'data');
    const artifact = payload ? recordField(payload, 'artifact') : undefined;
    const artifactId = artifact ? stringField(artifact, 'id') : undefined;
    const cardData = payload ? recordField(payload, 'card') : undefined;
    const cardId = cardData ? stringField(cardData, 'id') : undefined;
    const id = itemId ?? 'unknown';
    return {
      id: `card:${id}`,
      title: name ?? title ?? 'Card',
      status: 'success',
      detail: shortText(readyDetail(cardId, artifactId)),
      kind: 'card',
      artifactId,
      rawData: data,
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

function hydrateEntity(entity: TimelineEntityRecord, dispatch: ReturnType<typeof useDispatch>, conversationId: string): void {
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
        conversationId,
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
    dispatch(upsertTimelineItem({ ...timelineUpdate, conversationId }));
    fanOutArtifactPanelUpdate(timelineUpdate, dispatch, conversationId);
  }
}

function hydrateFromTimelineSnapshot(snapshot: TimelineSnapshot, dispatch: ReturnType<typeof useDispatch>, conversationId: string): void {
  const sorted = [...snapshot.entities].sort((a, b) => {
    const aCreated = parseTimelineMs(a.createdAtMs);
    const bCreated = parseTimelineMs(b.createdAtMs);
    if (aCreated !== bCreated) {
      return aCreated - bCreated;
    }
    return parseTimelineMs(a.updatedAtMs) - parseTimelineMs(b.updatedAtMs);
  });
  for (const entity of sorted) {
    hydrateEntity(entity, dispatch, conversationId);
  }
}

function onSemEnvelope(envelope: SemEventEnvelope, dispatch: ReturnType<typeof useDispatch>, conversationId: string): void {
  const type = envelope.event?.type;
  const data = envelope.event?.data ?? {};
  const messageId = eventIdFromEnvelope(envelope);

  const artifactUpdate = extractArtifactUpsertFromSem(type, data);
  if (artifactUpdate) {
    dispatch(upsertArtifact(artifactUpdate));
    // Register runtime card code into the global registry for injection into plugin sessions
    if (artifactUpdate.runtimeCardId && artifactUpdate.runtimeCardCode) {
      console.log('[HC-036] registerRuntimeCard', artifactUpdate.runtimeCardId, 'code length:', artifactUpdate.runtimeCardCode.length);
      registerRuntimeCard(artifactUpdate.runtimeCardId, artifactUpdate.runtimeCardCode);
    } else if (type === 'hypercard.card.v2') {
      console.warn('[HC-036] card.v2 artifact missing runtime card fields:', {
        id: artifactUpdate.id,
        hasRuntimeCardId: !!artifactUpdate.runtimeCardId,
        hasRuntimeCardCode: !!artifactUpdate.runtimeCardCode,
        dataKeys: Object.keys(data),
      });
    }
  }

  if (type === 'llm.start') {
    const metadata = extractMetadata(envelope);
    if (metadata) {
      const model = stringField(metadata, 'model');
      if (model) {
        dispatch(setModelName({ conversationId, model }));
      }
    }
    dispatch(markStreamStart({ conversationId, time: Date.now() }));
    dispatch(applyLLMStart({ conversationId, messageId }));
    return;
  }

  if (type === 'llm.delta') {
    const metadata = extractMetadata(envelope);
    if (metadata) {
      const usage = extractUsage(metadata);
      if (usage) {
        const outputTokens = numberField(usage, 'outputTokens');
        if (outputTokens !== undefined) {
          dispatch(updateStreamTokens({ conversationId, outputTokens }));
        }
      }
    }
    dispatch(
      applyLLMDelta({
        conversationId,
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
        dispatch(setModelName({ conversationId, model }));
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
        dispatch(setTurnStats({ conversationId, ...stats }));
      }
    }
    dispatch(
      applyLLMFinal({
        conversationId,
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
        conversationId,
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
        conversationId,
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
        conversationId,
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
        conversationId,
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
      dispatch(mergeSuggestions({ conversationId, suggestions }));
    }
    return;
  }

  if (type === 'hypercard.suggestions.v1') {
    const suggestions = stringArray(data.suggestions);
    if (suggestions.length > 0) {
      dispatch(replaceSuggestions({ conversationId, suggestions }));
    }
    return;
  }

  const lifecycleText = type ? formatHypercardLifecycle(type, data) : undefined;
  if (lifecycleText) {
    dispatch(upsertTimelineItem({ ...lifecycleText, conversationId }));
    fanOutArtifactPanelUpdate(lifecycleText, dispatch, conversationId);
    return;
  }

  if (type === 'timeline.upsert') {
    const timelineUpdate = formatTimelineUpsert(data);
    if (timelineUpdate) {
      dispatch(upsertTimelineItem({ ...timelineUpdate, conversationId }));
      fanOutArtifactPanelUpdate(timelineUpdate, dispatch, conversationId);
    }
    return;
  }

  if (type === 'ws.error') {
    dispatch(setStreamError({ conversationId, message: stringField(data, 'message') ?? 'websocket stream error' }));
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

export interface InventoryChatWindowProps {
  conversationId: string;
}

export function InventoryChatWindow({ conversationId }: InventoryChatWindowProps) {
  const dispatch = useDispatch();
  const store = useStore();
  const connectionStatus = useSelector((s: ChatStateSlice) => selectConnectionStatus(s, conversationId));
  const messages = useSelector((s: ChatStateSlice) => selectMessages(s, conversationId));
  const suggestions = useSelector((s: ChatStateSlice) => selectSuggestions(s, conversationId));
  const isStreaming = useSelector((s: ChatStateSlice) => selectIsStreaming(s, conversationId));
  const modelName = useSelector((s: ChatStateSlice) => selectModelName(s, conversationId));
  const currentTurnStats = useSelector((s: ChatStateSlice) => selectCurrentTurnStats(s, conversationId));
  const streamStartTime = useSelector((s: ChatStateSlice) => selectStreamStartTime(s, conversationId));
  const streamOutputTokens = useSelector((s: ChatStateSlice) => selectStreamOutputTokens(s, conversationId));

  const [debugMode, setDebugMode] = useState(false);
  const clientRef = useRef<InventoryWebChatClient | null>(null);

  useEffect(() => {
    const handlers: InventoryWebChatClientHandlers = {
      onRawEnvelope: (envelope) => {
        // Raw ingress stream for EventViewer/debug tooling; do not gate on projection.
        emitConversationEvent(conversationId, envelope);
      },
      onSnapshot: (snapshot) => {
        hydrateFromTimelineSnapshot(snapshot, dispatch, conversationId);
      },
      onEnvelope: (envelope) => {
        onSemEnvelope(envelope, dispatch, conversationId);
      },
      onStatus: (status) => dispatch(setConnectionStatus({ conversationId, status })),
      onError: (error) => dispatch(setStreamError({ conversationId, message: error })),
    };

    const client = new InventoryWebChatClient(conversationId, handlers, {
      hydrate: true,
    });
    clientRef.current = client;
    client.connect();

    return () => {
      client.close();
      if (client && clientRef.current === client) {
        clientRef.current = null;
      }
    };
  }, [conversationId, dispatch]);

  const subtitle = useMemo(() => {
    return `${connectionStatus} · ${conversationId.slice(0, 8)}…`;
  }, [connectionStatus, conversationId]);

  const displayMessages = useMemo<ChatWindowMessage[]>(
    () =>
      messages.map((message) => {
        let msg = message;
        if (msg.role !== 'user' && msg.text) {
          const text = stripTrailingWhitespace(msg.text);
          if (text !== msg.text) {
            msg = { ...msg, text };
          }
        }
        if (debugMode && msg.id) {
          const badge = `[${msg.id} | ${msg.status ?? '—'} | ${msg.role}]`;
          const existingContent = msg.content ?? (msg.text ? [{ kind: 'text' as const, text: msg.text }] : []);
          return {
            ...msg,
            content: [
              { kind: 'text' as const, text: badge },
              ...existingContent,
            ],
          };
        }
        return msg;
      }),
    [messages, debugMode],
  );

  const renderWidget = useCallback((widget: InlineWidget) => {
    const items = timelineItemsFromInlineWidget(widget);
    const openArtifact = (item: TimelineWidgetItem) => {
      const artifactId = item.artifactId?.trim();
      if (!artifactId) {
        return;
      }
      // Look up artifact record for runtime card info
      const storeState = store.getState() as { artifacts?: { byId: Record<string, { runtimeCardId?: string }> } };
      const artifactRecord = storeState.artifacts?.byId?.[artifactId];
      console.log('[HC-036] openArtifact', { artifactId, runtimeCardId: artifactRecord?.runtimeCardId, hasRecord: !!artifactRecord, allArtifactIds: Object.keys(storeState.artifacts?.byId ?? {}) });
      const payload = buildArtifactOpenWindowPayload({
        artifactId,
        template: item.template,
        title: item.title,
        runtimeCardId: artifactRecord?.runtimeCardId,
      });
      if (!payload) {
        return;
      }
      console.log('[HC-036] openWindow cardId:', payload.content?.card?.cardId);
      dispatch(openWindow(payload));
    };
    const editCard = (item: TimelineWidgetItem) => {
      const artifactId = item.artifactId?.trim();
      if (!artifactId) return;
      const storeState = store.getState() as { artifacts?: { byId: Record<string, { runtimeCardId?: string; runtimeCardCode?: string }> } };
      const rec = storeState.artifacts?.byId?.[artifactId];
      if (rec?.runtimeCardId && rec?.runtimeCardCode) {
        openCodeEditor(dispatch, rec.runtimeCardId, rec.runtimeCardCode);
      }
    };
    if (widget.type !== 'inventory.timeline') {
      if (widget.type === 'inventory.cards') {
        return <InventoryCardPanelWidget items={items} onOpenArtifact={openArtifact} onEditCard={editCard} debug={debugMode} />;
      }
      if (widget.type === 'inventory.widgets') {
        return <InventoryGeneratedWidgetPanel items={items} onOpenArtifact={openArtifact} debug={debugMode} />;
      }
      return null;
    }
    return <InventoryTimelineWidget items={items} debug={debugMode} />;
  }, [dispatch, debugMode]);

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) {
        return;
      }

      const prompt = text.trim();
      if (prompt.length === 0) {
        return;
      }

      dispatch(queueUserPrompt({ conversationId, text: prompt }));

      try {
        await submitPrompt(prompt, conversationId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'chat request failed';
        dispatch(setStreamError({ conversationId, message }));
      }
    },
    [conversationId, dispatch, isStreaming],
  );

  const openEventViewer = useCallback(() => {
    dispatch(
      openWindow({
        id: `window:event-viewer:${conversationId}`,
        title: `📡 Events — ${conversationId.slice(0, 8)}…`,
        icon: '📡',
        bounds: { x: 600 + Math.round(Math.random() * 40), y: 60 + Math.round(Math.random() * 30), w: 580, h: 400 },
        content: { kind: 'app', appKey: `event-viewer:${conversationId}` },
        dedupeKey: `event-viewer:${conversationId}`,
      }),
    );
  }, [dispatch, conversationId]);

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
      headerActions={
        <>
          <button
            type="button"
            data-part="btn"
            onClick={openEventViewer}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            📡 Events
          </button>
          <button
            type="button"
            data-part="btn"
            data-state={debugMode ? 'active' : undefined}
            onClick={() => setDebugMode((d) => !d)}
            style={{ fontSize: 10, padding: '1px 6px' }}
          >
            {debugMode ? '🔍 Debug ON' : '🔍 Debug'}
          </button>
        </>
      }
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
