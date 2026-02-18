import {
  applySemTimelineOps,
  ChatWindow,
  createSemRegistry,
  registerRuntimeCard,
  selectTimelineEntities as selectTimelineEntitiesForConversation,
  type ChatWindowMessage,
  type SemRegistry,
  type TimelineEntity,
} from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import {
  emitConversationEvent,
  extractArtifactUpsertFromSem,
  upsertArtifact,
} from '@hypercard/engine';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  markStreamStart,
  mergeSuggestions,
  replaceSuggestions,
  setConnectionStatus,
  setModelName,
  setStreamError,
  setTurnStats,
  type TurnStats,
  updateStreamTokens,
} from './chatSlice';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectCurrentTurnStats,
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
  numberField,
  stringArray,
  stringField,
  stripTrailingWhitespace,
} from './semHelpers';
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';

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

function mapTimelineEntityToMessage(entity: TimelineEntity): ChatWindowMessage {
  if (entity.kind === 'message') {
    const roleRaw = typeof entity.props.role === 'string' ? entity.props.role : 'assistant';
    const role: ChatWindowMessage['role'] =
      roleRaw === 'user' ? 'user' : roleRaw === 'system' ? 'system' : 'ai';
    const text = typeof entity.props.content === 'string' ? stripTrailingWhitespace(entity.props.content) : '';
    const streaming = entity.props.streaming === true;
    return {
      id: entity.id,
      role,
      text,
      status: streaming ? 'streaming' : 'complete',
    };
  }

  if (entity.kind === 'tool_call') {
    const name = typeof entity.props.name === 'string' ? entity.props.name : 'tool';
    const done = entity.props.done === true;
    return {
      id: entity.id,
      role: 'system',
      text: done ? `Tool ${name} done` : `Tool ${name} running`,
      status: done ? 'complete' : 'streaming',
    };
  }

  if (entity.kind === 'tool_result') {
    const customKind =
      typeof entity.props.customKind === 'string' && entity.props.customKind.length > 0
        ? ` (${entity.props.customKind})`
        : '';
    const resultText =
      typeof entity.props.resultText === 'string'
        ? entity.props.resultText
        : shortText(
            typeof entity.props.result === 'string'
              ? entity.props.result
              : JSON.stringify(entity.props.result ?? {}),
          ) ?? '';
    return {
      id: entity.id,
      role: 'system',
      text: stripTrailingWhitespace(`Result${customKind}: ${resultText}`),
      status: 'complete',
    };
  }

  if (entity.kind === 'status') {
    const text = typeof entity.props.text === 'string' ? entity.props.text : 'status';
    const type = typeof entity.props.type === 'string' ? entity.props.type : 'info';
    return {
      id: entity.id,
      role: 'system',
      text: `[${type}] ${text}`,
      status: type === 'error' ? 'error' : 'complete',
    };
  }

  if (entity.kind === 'log') {
    const level = typeof entity.props.level === 'string' ? entity.props.level : 'info';
    const text = typeof entity.props.message === 'string' ? entity.props.message : 'log';
    return {
      id: entity.id,
      role: 'system',
      text: `[${level}] ${text}`,
      status: 'complete',
    };
  }

  return {
    id: entity.id,
    role: 'system',
    text: `${entity.kind}: ${shortText(JSON.stringify(entity.props ?? {})) ?? ''}`,
    status: 'complete',
  };
}

function hydrateFromTimelineSnapshot(
  snapshot: TimelineSnapshot,
  dispatch: Dispatch<UnknownAction>,
  conversationId: string,
  semRegistry: SemRegistry,
): void {
  for (const entity of snapshot.entities as TimelineEntityRecord[]) {
    const envelope: SemEventEnvelope = {
      sem: true,
      event: {
        type: 'timeline.upsert',
        id: entity.id,
        data: {
          version: snapshot.version,
          entity: entity as Record<string, unknown>,
        },
      },
    };
    const result = semRegistry.handle(envelope, {
      convId: conversationId,
      now: Date.now,
    });
    applySemTimelineOps(dispatch, conversationId, result.ops);

    const artifactUpdate = extractArtifactUpsertFromSem('timeline.upsert', {
      entity: entity as Record<string, unknown>,
    });
    if (artifactUpdate) {
      dispatch(upsertArtifact(artifactUpdate));
    }
  }
}

function onSemEnvelope(
  envelope: SemEventEnvelope,
  dispatch: Dispatch<UnknownAction>,
  conversationId: string,
  semRegistry: SemRegistry,
): void {
  const type = envelope.event?.type;
  const data = envelope.event?.data ?? {};

  const projected = semRegistry.handle(envelope, {
    convId: conversationId,
    now: Date.now,
  });
  applySemTimelineOps(dispatch, conversationId, projected.ops);

  const artifactUpdate = extractArtifactUpsertFromSem(type, data);
  if (artifactUpdate) {
    dispatch(upsertArtifact(artifactUpdate));
    if (artifactUpdate.runtimeCardId && artifactUpdate.runtimeCardCode) {
      registerRuntimeCard(artifactUpdate.runtimeCardId, artifactUpdate.runtimeCardCode);
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
  const connectionStatus = useSelector((s: ChatStateSlice) => selectConnectionStatus(s, conversationId));
  const timelineEntities = useSelector((s: ChatStateSlice) =>
    selectTimelineEntitiesForConversation(s, conversationId),
  );
  const suggestions = useSelector((s: ChatStateSlice) => selectSuggestions(s, conversationId));
  const modelName = useSelector((s: ChatStateSlice) => selectModelName(s, conversationId));
  const currentTurnStats = useSelector((s: ChatStateSlice) => selectCurrentTurnStats(s, conversationId));
  const streamStartTime = useSelector((s: ChatStateSlice) => selectStreamStartTime(s, conversationId));
  const streamOutputTokens = useSelector((s: ChatStateSlice) => selectStreamOutputTokens(s, conversationId));

  const [debugMode, setDebugMode] = useState(false);
  const clientRef = useRef<InventoryWebChatClient | null>(null);
  const semRegistryRef = useRef<SemRegistry>(createSemRegistry());

  useEffect(() => {
    const handlers: InventoryWebChatClientHandlers = {
      onRawEnvelope: (envelope) => {
        // Raw ingress stream for EventViewer/debug tooling; do not gate on projection.
        emitConversationEvent(conversationId, envelope);
      },
      onSnapshot: (snapshot) => {
        hydrateFromTimelineSnapshot(snapshot, dispatch, conversationId, semRegistryRef.current);
      },
      onEnvelope: (envelope) => {
        onSemEnvelope(envelope, dispatch, conversationId, semRegistryRef.current);
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

  const isStreaming = useMemo(
    () =>
      timelineEntities.some(
        (entity) => entity.kind === 'message' && entity.props.streaming === true,
      ),
    [timelineEntities],
  );

  const displayMessages = useMemo<ChatWindowMessage[]>(
    () =>
      timelineEntities.map(mapTimelineEntityToMessage).map((message) => {
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
    [timelineEntities, debugMode],
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
    <ChatWindow
      messages={displayMessages}
      isStreaming={isStreaming}
      onSend={handleSend}
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
