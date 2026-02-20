import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import type { SemRegistry } from '../sem/registry';
import type { SemEnvelope } from '../sem/types';
import {
  hydrateTimelineSnapshot,
  type ProjectionPipelineAdapter,
  projectSemEnvelope,
  type TimelineSnapshotPayload,
} from '../runtime/projectionPipeline';
import { timelineReducer } from '../timeline/timelineSlice';
import type {
  ConversationConnectionStatus,
  ConversationRuntime,
  ConversationRuntimeClient,
  ConversationRuntimeClientFactory,
  ConversationRuntimeListener,
  ConversationRuntimeState,
} from './types';

const EMPTY_IDS: string[] = [];
const EMPTY_BY_ID: ConversationRuntimeState['timeline']['byId'] = {};
type RuntimeTurnStats = NonNullable<ConversationRuntimeState['meta']['turnStats']>;

function normalizeConnectionStatus(value: string): ConversationConnectionStatus {
  if (value === 'idle') return 'idle';
  if (value === 'connecting') return 'connecting';
  if (value === 'connected') return 'connected';
  if (value === 'closed') return 'closed';
  if (value === 'error') return 'error';
  return 'error';
}

function normalizeSeq(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value).toString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function streamId(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function recordField(
  record: Record<string, unknown> | undefined,
  key: string,
): Record<string, unknown> | undefined {
  if (!record) return undefined;
  const value = record[key];
  return isRecord(value) ? value : undefined;
}

function stringField(
  record: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  if (!record) return undefined;
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function numberField(
  record: Record<string, unknown> | undefined,
  key: string,
): number | undefined {
  if (!record) return undefined;
  const value = record[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return value;
}

function sameTurnStats(
  a: ConversationRuntimeState['meta']['turnStats'],
  b: ConversationRuntimeState['meta']['turnStats'],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.inputTokens === b.inputTokens &&
    a.outputTokens === b.outputTokens &&
    a.cachedTokens === b.cachedTokens &&
    a.cacheCreationInputTokens === b.cacheCreationInputTokens &&
    a.cacheReadInputTokens === b.cacheReadInputTokens &&
    a.durationMs === b.durationMs &&
    a.tps === b.tps
  );
}

export interface CreateConversationRuntimeOptions {
  conversationId: string;
  semRegistry: SemRegistry;
  createClient: ConversationRuntimeClientFactory;
  dispatch?: Dispatch<UnknownAction>;
  adapters?: ProjectionPipelineAdapter[];
  getAdapters?: () => ProjectionPipelineAdapter[];
  waitForHydration?: boolean;
  onRawEnvelope?: (envelope: SemEnvelope) => void;
  onStatus?: (status: ConversationConnectionStatus) => void;
  onError?: (error: string) => void;
}

function seqAsBigInt(value: unknown): bigint | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      return BigInt(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function compareBufferedEnvelopes(a: SemEnvelope, b: SemEnvelope): number {
  const aStream = streamId(a.event?.stream_id);
  const bStream = streamId(b.event?.stream_id);
  if (aStream && bStream) {
    if (aStream < bStream) return -1;
    if (aStream > bStream) return 1;
  }

  const aSeq = seqAsBigInt(a.event?.seq);
  const bSeq = seqAsBigInt(b.event?.seq);
  if (aSeq !== undefined && bSeq !== undefined) {
    if (aSeq < bSeq) return -1;
    if (aSeq > bSeq) return 1;
  }
  if (aSeq !== undefined && bSeq === undefined) return -1;
  if (aSeq === undefined && bSeq !== undefined) return 1;
  return 0;
}

export function createConversationRuntime(
  options: CreateConversationRuntimeOptions,
): ConversationRuntime {
  const {
    conversationId,
    semRegistry,
    createClient,
    dispatch: externalDispatch,
    adapters = [],
    getAdapters,
    waitForHydration = false,
    onRawEnvelope,
    onStatus,
    onError,
  } = options;

  let disposed = false;
  let connectionClaims = 0;
  let hydrated = !waitForHydration;
  let buffered: SemEnvelope[] = [];
  let client: ConversationRuntimeClient | null = null;
  const listeners = new Set<ConversationRuntimeListener>();
  let timelineState = timelineReducer(undefined, { type: '@@INIT' } as UnknownAction);

  let state: ConversationRuntimeState = {
    conversationId,
    connection: { status: 'idle' },
    timeline: {
      ids: EMPTY_IDS,
      byId: EMPTY_BY_ID,
    },
    meta: {},
  };

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (next: ConversationRuntimeState) => {
    if (next === state) return;
    state = next;
    notify();
  };

  const syncTimelineFromReducer = () => {
    const conversation = timelineState.conversations[conversationId];
    const nextIds = conversation?.order ?? EMPTY_IDS;
    const nextById = conversation?.byId ?? EMPTY_BY_ID;

    if (state.timeline.ids === nextIds && state.timeline.byId === nextById) {
      return;
    }

    setState({
      ...state,
      timeline: {
        ids: nextIds,
        byId: nextById,
      },
    });
  };

  const timelineDispatch: Dispatch<UnknownAction> = (action) => {
    timelineState = timelineReducer(timelineState, action as UnknownAction);
    syncTimelineFromReducer();
    return action;
  };

  const pipelineDispatch: Dispatch<UnknownAction> = (action) => {
    timelineDispatch(action);
    externalDispatch?.(action);
    return action;
  };

  const activeAdapters = (): ProjectionPipelineAdapter[] => {
    return getAdapters?.() ?? adapters;
  };

  const updateMeta = (
    patch: Partial<ConversationRuntimeState['meta']>,
  ): void => {
    let changed = false;
    const nextMeta: ConversationRuntimeState['meta'] = {
      ...state.meta,
    };

    if ('modelName' in patch && nextMeta.modelName !== patch.modelName) {
      nextMeta.modelName = patch.modelName;
      changed = true;
    }
    if (
      'streamStartTime' in patch &&
      nextMeta.streamStartTime !== patch.streamStartTime
    ) {
      nextMeta.streamStartTime = patch.streamStartTime;
      changed = true;
    }
    if (
      'streamOutputTokens' in patch &&
      nextMeta.streamOutputTokens !== patch.streamOutputTokens
    ) {
      nextMeta.streamOutputTokens = patch.streamOutputTokens;
      changed = true;
    }
    if ('lastError' in patch && nextMeta.lastError !== patch.lastError) {
      nextMeta.lastError = patch.lastError;
      changed = true;
    }
    if ('turnStats' in patch && !sameTurnStats(nextMeta.turnStats, patch.turnStats)) {
      nextMeta.turnStats = patch.turnStats;
      changed = true;
    }

    if (!changed) return;
    setState({
      ...state,
      meta: nextMeta,
    });
  };

  const applyEnvelopeMeta = (envelope: SemEnvelope) => {
    const event = envelope.event;
    if (!event?.type) return;
    const eventRecord = isRecord(event) ? event : undefined;
    const metadata = recordField(eventRecord, 'metadata');
    const usage = recordField(metadata, 'usage');

    if (event.type === 'llm.start') {
      updateMeta({
        modelName: stringField(metadata, 'model') ?? state.meta.modelName,
        streamStartTime: Date.now(),
        streamOutputTokens: 0,
        turnStats: undefined,
      });
      return;
    }

    if (event.type === 'llm.delta') {
      const outputTokens = numberField(usage, 'outputTokens');
      if (outputTokens !== undefined) {
        updateMeta({
          streamOutputTokens: outputTokens,
        });
      }
      return;
    }

    if (event.type === 'llm.final') {
      const inputTokens = numberField(usage, 'inputTokens');
      const outputTokens = numberField(usage, 'outputTokens');
      const cachedTokens = numberField(usage, 'cachedTokens');
      const cacheCreationInputTokens = numberField(
        usage,
        'cacheCreationInputTokens',
      );
      const cacheReadInputTokens = numberField(usage, 'cacheReadInputTokens');
      const durationMs = numberField(metadata, 'durationMs');
      const hasTurnStats =
        inputTokens !== undefined ||
        outputTokens !== undefined ||
        cachedTokens !== undefined ||
        cacheCreationInputTokens !== undefined ||
        cacheReadInputTokens !== undefined ||
        durationMs !== undefined;

      let turnStats: RuntimeTurnStats | undefined;
      if (hasTurnStats) {
        turnStats = {
          inputTokens,
          outputTokens,
          cachedTokens,
          cacheCreationInputTokens,
          cacheReadInputTokens,
          durationMs,
        };
        if (
          turnStats.outputTokens !== undefined &&
          turnStats.durationMs !== undefined &&
          turnStats.durationMs > 0
        ) {
          turnStats.tps =
            Math.round((turnStats.outputTokens / (turnStats.durationMs / 1000)) * 10) /
            10;
        }
      }

      updateMeta({
        modelName: stringField(metadata, 'model') ?? state.meta.modelName,
        turnStats,
        streamStartTime: undefined,
        streamOutputTokens: 0,
      });
      return;
    }

    if (event.type === 'ws.error') {
      const data = isRecord(event.data) ? event.data : undefined;
      updateMeta({
        lastError: stringField(data, 'message') ?? 'websocket stream error',
      });
    }
  };

  const applyEnvelopeCursor = (envelope: SemEnvelope) => {
    const seq = normalizeSeq(envelope.event?.seq);
    const nextStreamId = streamId(envelope.event?.stream_id);
    const hasSeqChange = seq && state.connection.lastSeq !== seq;
    const hasStreamChange =
      nextStreamId && state.connection.lastStreamId !== nextStreamId;

    if (!hasSeqChange && !hasStreamChange) {
      return;
    }

    setState({
      ...state,
      connection: {
        ...state.connection,
        lastSeq: seq ?? state.connection.lastSeq,
        lastStreamId: nextStreamId ?? state.connection.lastStreamId,
      },
    });
  };

  const projectEnvelope = (envelope: SemEnvelope) => {
    projectSemEnvelope({
      conversationId,
      dispatch: pipelineDispatch,
      envelope,
      semRegistry,
      adapters: activeAdapters(),
    });
  };

  const replayBuffered = () => {
    if (buffered.length === 0) return;
    const replay = [...buffered].sort(compareBufferedEnvelopes);
    buffered = [];
    for (const envelope of replay) {
      projectEnvelope(envelope);
    }
  };

  const ensureConnected = () => {
    ensureClient();
    runtime.setConnectionStatus('connecting');
    client?.connect();
  };

  const maybeDisconnect = () => {
    if (connectionClaims > 0) return;
    client?.close();
    client = null;
    runtime.setConnectionStatus('closed');
  };

  const ensureClient = () => {
    if (client) return;
    client = createClient({
      onEnvelope: (envelope) => {
        runtime.ingestEnvelope(envelope);
      },
      onRawEnvelope: (envelope) => {
        onRawEnvelope?.(envelope);
      },
      onSnapshot: (snapshot) => {
        runtime.hydrateSnapshot(snapshot);
      },
      onStatus: (status) => {
        runtime.setConnectionStatus(normalizeConnectionStatus(status));
      },
      onError: (error) => {
        onError?.(error);
        runtime.setConnectionStatus('error', error);
      },
    });
  };

  const runtime: ConversationRuntime = {
    getState: () => state,
    subscribe: (listener) => {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    claimConnection: () => {
      if (disposed) return () => {};

      let released = false;
      connectionClaims += 1;
      if (connectionClaims === 1) {
        ensureConnected();
      }

      return () => {
        if (released || disposed) return;
        released = true;
        connectionClaims = Math.max(0, connectionClaims - 1);
        maybeDisconnect();
      };
    },
    ingestEnvelope: (envelope) => {
      if (disposed) return;
      applyEnvelopeCursor(envelope);
      applyEnvelopeMeta(envelope);
      if (!hydrated) {
        buffered.push(envelope);
        return;
      }
      projectEnvelope(envelope);
    },
    hydrateSnapshot: (snapshot: TimelineSnapshotPayload) => {
      if (disposed) return;
      hydrateTimelineSnapshot({
        conversationId,
        dispatch: pipelineDispatch,
        semRegistry,
        snapshot,
        adapters: activeAdapters(),
      });
      const version = normalizeSeq(snapshot.version);
      hydrated = true;
      replayBuffered();
      if (version && state.connection.hydratedVersion !== version) {
        setState({
          ...state,
          connection: {
            ...state.connection,
            hydratedVersion: version,
          },
        });
      }
    },
    setConnectionStatus: (status, error) => {
      if (disposed) return;
      const nextMeta =
        status === 'error' && error
          ? {
              ...state.meta,
              lastError: error,
            }
          : state.meta;
      if (
        state.connection.status === status &&
        state.connection.error === error &&
        nextMeta === state.meta
      ) {
        return;
      }

      setState({
        ...state,
        connection: {
          ...state.connection,
          status,
          error,
        },
        meta: nextMeta,
      });
      onStatus?.(status);
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      connectionClaims = 0;
      hydrated = true;
      buffered = [];
      client?.close();
      client = null;
      listeners.clear();
    },
  };

  return runtime;
}
