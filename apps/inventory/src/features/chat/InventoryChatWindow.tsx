import {
  buildArtifactOpenWindowPayload,
  createSemRegistry,
  emitConversationEvent,
  openRuntimeCardCodeEditor as openCodeEditor,
  type ProjectedChatClientHandlers,
  type ProjectionPipelineAdapter,
  type SemEnvelope,
  type SemRegistry,
  selectTimelineEntities as selectTimelineEntitiesForConversation,
  TimelineChatRuntimeWindow,
  type TimelineWidgetItem,
} from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  type ChatConnectionStatus,
  replaceSuggestions,
  setConnectionStatus,
  setStreamError,
  type TurnStats,
} from './chatSlice';
import {
  createChatMetaProjectionAdapter,
  createInventoryArtifactProjectionAdapter,
} from './runtime/projectionAdapters';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectCurrentTurnStats,
  selectModelName,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from './selectors';
import { InventoryWebChatClient, type InventoryWebChatClientHandlers, submitPrompt } from './webchatClient';

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

function normalizeConnectionStatus(status: string): ChatConnectionStatus {
  if (status === 'connecting') return 'connecting';
  if (status === 'connected') return 'connected';
  if (status === 'closed') return 'closed';
  if (status === 'error') return 'error';
  return 'error';
}

export function InventoryChatWindow({ conversationId }: InventoryChatWindowProps) {
  const dispatch = useDispatch<Dispatch<UnknownAction>>();
  const store = useStore();
  const connectionStatus = useSelector((s: ChatStateSlice) => selectConnectionStatus(s, conversationId));
  const timelineEntities = useSelector((s: ChatStateSlice) => selectTimelineEntitiesForConversation(s, conversationId));
  const suggestions = useSelector((s: ChatStateSlice) => selectSuggestions(s, conversationId));
  const modelName = useSelector((s: ChatStateSlice) => selectModelName(s, conversationId));
  const currentTurnStats = useSelector((s: ChatStateSlice) => selectCurrentTurnStats(s, conversationId));
  const streamStartTime = useSelector((s: ChatStateSlice) => selectStreamStartTime(s, conversationId));
  const streamOutputTokens = useSelector((s: ChatStateSlice) => selectStreamOutputTokens(s, conversationId));

  const [debugMode, setDebugMode] = useState(false);
  const semRegistryRef = useRef<SemRegistry>(createSemRegistry());
  const projectionAdaptersRef = useRef<ProjectionPipelineAdapter[]>([
    createChatMetaProjectionAdapter(),
    createInventoryArtifactProjectionAdapter(),
  ]);

  const createClient = useCallback(
    (handlers: ProjectedChatClientHandlers): InventoryWebChatClient => {
      const inventoryHandlers: InventoryWebChatClientHandlers = {
        onRawEnvelope: handlers.onRawEnvelope,
        onEnvelope: handlers.onEnvelope,
        onStatus: handlers.onStatus as InventoryWebChatClientHandlers['onStatus'],
        onError: handlers.onError,
      };
      return new InventoryWebChatClient(conversationId, inventoryHandlers, {
        hydrate: false,
      });
    },
    [conversationId],
  );

  const subtitle = useMemo(() => {
    return `${connectionStatus} · ${conversationId.slice(0, 8)}…`;
  }, [connectionStatus, conversationId]);

  const isStreaming = useMemo(
    () => timelineEntities.some((entity) => entity.kind === 'message' && entity.props.streaming === true),
    [timelineEntities],
  );

  const openArtifact = useCallback(
    (item: TimelineWidgetItem) => {
      const artifactId = item.artifactId?.trim();
      if (!artifactId) {
        return;
      }
      const storeState = store.getState() as {
        artifacts?: { byId: Record<string, { runtimeCardId?: string }> };
      };
      const artifactRecord = storeState.artifacts?.byId?.[artifactId];
      const payload = buildArtifactOpenWindowPayload({
        artifactId,
        template: item.template,
        title: item.title,
        runtimeCardId: artifactRecord?.runtimeCardId,
      });
      if (!payload) {
        return;
      }
      dispatch(openWindow(payload));
    },
    [dispatch, store],
  );

  const editCard = useCallback(
    (item: TimelineWidgetItem) => {
      const artifactId = item.artifactId?.trim();
      if (!artifactId) {
        return;
      }
      const storeState = store.getState() as {
        artifacts?: {
          byId: Record<string, { runtimeCardId?: string; runtimeCardCode?: string }>;
        };
      };
      const record = storeState.artifacts?.byId?.[artifactId];
      if (record?.runtimeCardId && record.runtimeCardCode) {
        openCodeEditor(dispatch, record.runtimeCardId, record.runtimeCardCode);
      }
    },
    [dispatch, store],
  );

  const runtimeHostActions = useMemo(
    () => ({
      onOpenArtifact: openArtifact,
      onEditCard: editCard,
      onEmitRawEnvelope: (envelope: SemEnvelope) => {
        emitConversationEvent(conversationId, envelope);
      },
      onConnectionStatus: (status: string) => {
        dispatch(setConnectionStatus({ conversationId, status: normalizeConnectionStatus(status) }));
      },
      onConnectionError: (message: string) => {
        dispatch(setStreamError({ conversationId, message }));
      },
    }),
    [conversationId, dispatch, editCard, openArtifact],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (isStreaming) {
        return;
      }

      const prompt = text.trim();
      if (prompt.length === 0) {
        return;
      }

      dispatch(replaceSuggestions({ conversationId, suggestions: [] }));

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
    <TimelineChatRuntimeWindow
      conversationId={conversationId}
      dispatch={dispatch}
      semRegistry={semRegistryRef.current}
      adapters={projectionAdaptersRef.current}
      createClient={createClient}
      projectionMode="timeline-upsert-only"
      hostActions={runtimeHostActions}
      timelineEntities={timelineEntities}
      onSend={handleSend}
      widgetNamespace="inventory"
      debug={debugMode}
      title="Inventory Chat"
      subtitle={subtitle}
      placeholder="Ask about inventory..."
      suggestions={suggestions}
      showSuggestionsAlways
      headerActions={
        <>
          <button type="button" data-part="btn" onClick={openEventViewer} style={{ fontSize: 10, padding: '1px 6px' }}>
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
