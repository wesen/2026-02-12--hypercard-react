import { fromJson, type Message } from '@bufbuild/protobuf';
import type { GenMessage } from '@bufbuild/protobuf/codegenv2';
import { type AgentModeV1, AgentModeV1Schema } from './pb/proto/sem/base/agent_pb';
import { type DebuggerPauseV1, DebuggerPauseV1Schema } from './pb/proto/sem/base/debugger_pb';

import {
  type LlmDelta,
  LlmDeltaSchema,
  LlmDoneSchema,
  type LlmFinal,
  LlmFinalSchema,
  type LlmStart,
  LlmStartSchema,
} from './pb/proto/sem/base/llm_pb';
import { type LogV1, LogV1Schema } from './pb/proto/sem/base/log_pb';
import {
  type LlmInferenceMetadataV1,
  LlmInferenceMetadataV1Schema,
} from './pb/proto/sem/base/metadata_pb';
import {
  type ToolDelta,
  ToolDeltaSchema,
  ToolDoneSchema,
  type ToolResult,
  ToolResultSchema,
  type ToolStart,
  ToolStartSchema,
} from './pb/proto/sem/base/tool_pb';
import { type TimelineUpsertV2, TimelineUpsertV2Schema } from './pb/proto/sem/timeline/transport_pb';
import { chatSessionSlice, type TurnStats } from '../state/chatSessionSlice';
import { type TimelineEntity, timelineSlice } from '../state/timelineSlice';
import { timelineEntityFromProto } from './timelineMapper';

export type SemEnvelope = { sem: true; event: SemEvent };
export type SemEvent = {
  type: string;
  id: string;
  data?: unknown;
  metadata?: unknown;
  seq?: number;
  stream_id?: string;
};

export interface SemContext {
  dispatch: (action: unknown) => unknown;
  convId: string;
}

type Handler = (ev: SemEvent, ctx: SemContext) => void;
type LlmStreamKind = 'llm' | 'thinking';
type LlmStreamState = { role: string; emitted: boolean };
type TimelineMessageState = { emitted: boolean };
type UsageSnapshot = {
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};

const handlers = new Map<string, Handler>();
const llmStreamStates = new Map<string, LlmStreamState>();
const timelineMessageStates = new Map<string, TimelineMessageState>();
const activeStreamsByConv = new Map<string, Set<string>>();
const llmUsageSnapshots = new Map<string, UsageSnapshot>();

export function registerSem(type: string, handler: Handler) {
  handlers.set(type, handler);
}

export function clearSemHandlers() {
  handlers.clear();
  llmStreamStates.clear();
  timelineMessageStates.clear();
  activeStreamsByConv.clear();
  llmUsageSnapshots.clear();
}

export function handleSem(envelope: unknown, ctx: SemContext) {
  if (!envelope || typeof envelope !== 'object') return;
  const parsed = envelope as Partial<SemEnvelope>;
  if (parsed.sem !== true || !parsed.event) return;
  const ev = parsed.event as SemEvent;
  const h = handlers.get(ev.type);
  if (!h) return;
  h(ev, ctx);
}

function upsertEntity(ctx: SemContext, entity: TimelineEntity) {
  ctx.dispatch(timelineSlice.actions.upsertEntity({ convId: ctx.convId, entity }));
}

function addEntity(ctx: SemContext, entity: TimelineEntity) {
  ctx.dispatch(timelineSlice.actions.addEntity({ convId: ctx.convId, entity }));
}

function createdAtFromEvent(_ev: SemEvent): number {
  return Date.now();
}

function decodeProto<T extends Message>(schema: GenMessage<T>, raw: unknown): T | null {
  if (!raw || typeof raw !== 'object') return null;
  try {
    return fromJson(schema as any, raw as any, { ignoreUnknownFields: true }) as T;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function toNonNegativeInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value));
}

function decodeLlmMetadata(ev: SemEvent): LlmInferenceMetadataV1 | null {
  return decodeProto<LlmInferenceMetadataV1>(LlmInferenceMetadataV1Schema, ev.metadata);
}

function usageFromMetadata(meta: LlmInferenceMetadataV1 | null): UsageSnapshot | null {
  const usage = meta?.usage;
  if (!usage) return null;
  return {
    inputTokens: toNonNegativeInt(usage.inputTokens),
    outputTokens: toNonNegativeInt(usage.outputTokens),
    cachedTokens: toNonNegativeInt(usage.cachedTokens),
    cacheCreationInputTokens: toNonNegativeInt(usage.cacheCreationInputTokens),
    cacheReadInputTokens: toNonNegativeInt(usage.cacheReadInputTokens),
  };
}

function usageSnapshotKey(convId: string, messageId: string): string {
  return `${convId}:${messageId}`;
}

function applyConversationUsageDelta(ctx: SemContext, messageId: string, usage: UsageSnapshot) {
  const key = usageSnapshotKey(ctx.convId, messageId);
  const prev = llmUsageSnapshots.get(key);
  const inputDelta = Math.max(0, usage.inputTokens - (prev?.inputTokens ?? 0));
  const outputDelta = Math.max(0, usage.outputTokens - (prev?.outputTokens ?? 0));
  const cachedDelta = Math.max(0, usage.cachedTokens - (prev?.cachedTokens ?? 0));
  llmUsageSnapshots.set(key, usage);

  if (inputDelta === 0 && outputDelta === 0 && cachedDelta === 0) {
    return;
  }

  ctx.dispatch(
    chatSessionSlice.actions.addConversationUsage({
      convId: ctx.convId,
      inputTokens: inputDelta,
      outputTokens: outputDelta,
      cachedTokens: cachedDelta,
    })
  );
}

function estimateOutputTokensFromText(text: unknown): number {
  if (typeof text !== 'string') return 0;
  if (text.trim().length === 0) return 0;
  return Math.max(1, Math.round(text.length / 4));
}

function turnStatsFromMetadata(meta: LlmInferenceMetadataV1 | null): TurnStats | null {
  if (!meta) return null;
  const usage = usageFromMetadata(meta);
  const durationRaw = meta.durationMs;
  const durationMs =
    typeof durationRaw === 'bigint' ? Number(durationRaw) : toNonNegativeInt(durationRaw);
  const safeDuration = Number.isFinite(durationMs) ? durationMs : 0;
  const outputTokens = usage?.outputTokens ?? 0;
  const tps =
    safeDuration > 0 && outputTokens > 0
      ? Math.round((outputTokens / (safeDuration / 1000)) * 10) / 10
      : undefined;

  if (!usage && safeDuration <= 0) return null;

  return {
    inputTokens: usage?.inputTokens,
    outputTokens: usage?.outputTokens,
    cachedTokens: usage?.cachedTokens,
    cacheCreationInputTokens: usage?.cacheCreationInputTokens,
    cacheReadInputTokens: usage?.cacheReadInputTokens,
    durationMs: safeDuration > 0 ? safeDuration : undefined,
    tps,
  };
}

function ensureActiveStreamSet(convId: string): Set<string> {
  let set = activeStreamsByConv.get(convId);
  if (!set) {
    set = new Set<string>();
    activeStreamsByConv.set(convId, set);
  }
  return set;
}

function markStreamStarted(ctx: SemContext, streamId: string) {
  const set = ensureActiveStreamSet(ctx.convId);
  const wasIdle = set.size === 0;
  set.add(streamId);
  if (wasIdle) {
    ctx.dispatch(chatSessionSlice.actions.markStreamStart({ convId: ctx.convId }));
  }
  ctx.dispatch(chatSessionSlice.actions.setIsStreaming({ convId: ctx.convId, isStreaming: true }));
}

function markStreamEnded(ctx: SemContext, streamId: string) {
  const set = activeStreamsByConv.get(ctx.convId);
  if (!set) {
    ctx.dispatch(chatSessionSlice.actions.setIsStreaming({ convId: ctx.convId, isStreaming: false }));
    return;
  }
  set.delete(streamId);
  if (set.size === 0) {
    activeStreamsByConv.delete(ctx.convId);
    ctx.dispatch(chatSessionSlice.actions.setIsStreaming({ convId: ctx.convId, isStreaming: false }));
    return;
  }
  ctx.dispatch(chatSessionSlice.actions.setIsStreaming({ convId: ctx.convId, isStreaming: true }));
}

function applyLlmMetadata(
  ctx: SemContext,
  ev: SemEvent,
  options?: { finalize?: boolean; textForEstimate?: unknown; addToConversationTotals?: boolean }
) {
  const meta = decodeLlmMetadata(ev);
  if (!meta) return;

  if (typeof meta.model === 'string' && meta.model.trim().length > 0) {
    ctx.dispatch(
      chatSessionSlice.actions.setModelName({
        convId: ctx.convId,
        modelName: meta.model,
      })
    );
  }

  const usage = usageFromMetadata(meta);
  const streamOutputTokens = usage?.outputTokens ?? estimateOutputTokensFromText(options?.textForEstimate);
  if (streamOutputTokens > 0) {
    ctx.dispatch(
      chatSessionSlice.actions.updateStreamTokens({
        convId: ctx.convId,
        streamOutputTokens,
      })
    );
  }

  if (options?.finalize) {
    const turnStats = turnStatsFromMetadata(meta);
    if (turnStats) {
      ctx.dispatch(chatSessionSlice.actions.setTurnStats({ convId: ctx.convId, turnStats }));
    }
  }

  if (options?.addToConversationTotals && usage) {
    applyConversationUsageDelta(ctx, ev.id, usage);
  }
}

function defaultRoleForStream(kind: LlmStreamKind): string {
  return kind === 'thinking' ? 'thinking' : 'assistant';
}

function llmStreamKey(ctx: SemContext, ev: SemEvent, kind: LlmStreamKind): string {
  return `${ctx.convId}:${kind}:${ev.id}`;
}

function ensureLlmStreamState(ctx: SemContext, ev: SemEvent, kind: LlmStreamKind): {
  key: string;
  state: LlmStreamState;
} {
  const key = llmStreamKey(ctx, ev, kind);
  const existing = llmStreamStates.get(key);
  if (existing) {
    return { key, state: existing };
  }
  const state: LlmStreamState = { role: defaultRoleForStream(kind), emitted: false };
  llmStreamStates.set(key, state);
  return { key, state };
}

function isNonEmptyText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function setLlmStreamRole(ctx: SemContext, ev: SemEvent, kind: LlmStreamKind, role: unknown) {
  const { state } = ensureLlmStreamState(ctx, ev, kind);
  if (isNonEmptyText(role)) {
    state.role = role;
  }
}

function upsertLlmStreamText(
  ctx: SemContext,
  ev: SemEvent,
  kind: LlmStreamKind,
  text: unknown,
  streaming: boolean
) {
  const { key, state } = ensureLlmStreamState(ctx, ev, kind);
  if (!isNonEmptyText(text)) {
    if (!streaming) {
      if (state.emitted) {
        upsertEntity(ctx, {
          id: ev.id,
          kind: 'message',
          createdAt: createdAtFromEvent(ev),
          updatedAt: Date.now(),
          props: { role: state.role, streaming: false },
        });
      }
      llmStreamStates.delete(key);
    }
    return;
  }

  upsertEntity(ctx, {
    id: ev.id,
    kind: 'message',
    createdAt: createdAtFromEvent(ev),
    updatedAt: Date.now(),
    props: { role: state.role, content: text, streaming },
  });
  state.emitted = true;
  if (!streaming) {
    llmStreamStates.delete(key);
  }
}

function closeLlmStream(ctx: SemContext, ev: SemEvent, kind: LlmStreamKind) {
  const { key, state } = ensureLlmStreamState(ctx, ev, kind);
  if (state.emitted) {
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { role: state.role, streaming: false },
    });
  }
  llmStreamStates.delete(key);
}

function timelineMessageStateKey(convId: string, entityId: string): string {
  return `${convId}:${entityId}`;
}

function pruneEmptyTimelineMessageUpsert(
  ctx: SemContext,
  entity: TimelineEntity,
): TimelineEntity | null {
  if (entity.kind !== 'message') return entity;
  const props = asRecord(entity.props);
  const content = props.content;
  const hasText = typeof content === 'string' && content.trim().length > 0;
  const streaming = props.streaming === true;
  const stateKey = timelineMessageStateKey(ctx.convId, entity.id);
  const state = timelineMessageStates.get(stateKey);

  if (hasText) {
    timelineMessageStates.set(stateKey, { emitted: true });
    return entity;
  }

  if (!state?.emitted) {
    if (!streaming) {
      timelineMessageStates.delete(stateKey);
    }
    return null;
  }

  const nextProps = { ...props };
  delete nextProps.content;

  if (!streaming) {
    timelineMessageStates.delete(stateKey);
  }

  return {
    ...entity,
    props: nextProps,
  };
}

function applyTimelineMessageStreamSignal(ctx: SemContext, entity: TimelineEntity) {
  if (entity.kind !== 'message') return;
  const props = asRecord(entity.props);
  const role = typeof props.role === 'string' ? props.role : 'assistant';
  if (role === 'user') return;
  const streaming = props.streaming === true;
  if (streaming) {
    markStreamStarted(ctx, entity.id);
    return;
  }
  markStreamEnded(ctx, entity.id);
}

export function registerDefaultSemHandlers() {
  // Intentionally additive: callers that need a clean slate must call
  // clearSemHandlers() explicitly (tests do this in beforeEach).
  // This prevents default registration from wiping extension handlers.

  registerSem('timeline.upsert', (ev, ctx) => {
    const data = decodeProto<TimelineUpsertV2>(TimelineUpsertV2Schema, ev.data);
    const entity = data?.entity;
    if (!entity) return;
    const mapped = timelineEntityFromProto(entity, data?.version);
    if (!mapped) return;
    applyTimelineMessageStreamSignal(ctx, mapped);
    const normalized = pruneEmptyTimelineMessageUpsert(ctx, mapped);
    if (!normalized) return;
    upsertEntity(ctx, normalized);
  });

  registerSem('llm.start', (ev, ctx) => {
    const data = decodeProto<LlmStart>(LlmStartSchema, ev.data);
    setLlmStreamRole(ctx, ev, 'llm', data?.role);
    markStreamStarted(ctx, ev.id);
    applyLlmMetadata(ctx, ev);
  });

  registerSem('llm.delta', (ev, ctx) => {
    const data = decodeProto<LlmDelta>(LlmDeltaSchema, ev.data);
    markStreamStarted(ctx, ev.id);
    upsertLlmStreamText(ctx, ev, 'llm', data?.cumulative, true);
    applyLlmMetadata(ctx, ev, { textForEstimate: data?.cumulative });
  });

  registerSem('llm.final', (ev, ctx) => {
    const data = decodeProto<LlmFinal>(LlmFinalSchema, ev.data);
    upsertLlmStreamText(ctx, ev, 'llm', data?.text, false);
    markStreamEnded(ctx, ev.id);
    applyLlmMetadata(ctx, ev, {
      finalize: true,
      textForEstimate: data?.text,
      addToConversationTotals: true,
    });
  });

  registerSem('llm.thinking.start', (ev, ctx) => {
    const data = decodeProto<LlmStart>(LlmStartSchema, ev.data);
    setLlmStreamRole(ctx, ev, 'thinking', data?.role);
    markStreamStarted(ctx, ev.id);
    applyLlmMetadata(ctx, ev);
  });

  registerSem('llm.thinking.delta', (ev, ctx) => {
    const data = decodeProto<LlmDelta>(LlmDeltaSchema, ev.data);
    markStreamStarted(ctx, ev.id);
    upsertLlmStreamText(ctx, ev, 'thinking', data?.cumulative, true);
    applyLlmMetadata(ctx, ev, { textForEstimate: data?.cumulative });
  });

  registerSem('llm.thinking.final', (ev, ctx) => {
    const _data = decodeProto(LlmDoneSchema, ev.data);
    closeLlmStream(ctx, ev, 'thinking');
    markStreamEnded(ctx, ev.id);
    applyLlmMetadata(ctx, ev);
  });

  registerSem('llm.thinking.summary', (ev, ctx) => {
    const data = decodeProto<LlmFinal>(LlmFinalSchema, ev.data);
    upsertLlmStreamText(ctx, ev, 'thinking', data?.text, false);
    markStreamEnded(ctx, ev.id);
    applyLlmMetadata(ctx, ev, { finalize: true, textForEstimate: data?.text });
  });

  registerSem('tool.start', (ev, ctx) => {
    const data = decodeProto<ToolStart>(ToolStartSchema, ev.data);
    addEntity(ctx, {
      id: ev.id,
      kind: 'tool_call',
      createdAt: createdAtFromEvent(ev),
      props: { name: data?.name, input: data?.input },
    });
  });

  registerSem('tool.delta', (ev, ctx) => {
    const data = decodeProto<ToolDelta>(ToolDeltaSchema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'tool_call',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { ...(data?.patch ?? {}) },
    });
  });

  registerSem('tool.result', (ev, ctx) => {
    const data = decodeProto<ToolResult>(ToolResultSchema, ev.data);
    const customKind = data?.customKind;
    const id = customKind ? `${ev.id}:custom` : `${ev.id}:result`;
    upsertEntity(ctx, {
      id,
      kind: 'tool_result',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { result: data?.result, customKind },
    });
  });

  registerSem('tool.done', (ev, ctx) => {
    const _data = decodeProto(ToolDoneSchema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'tool_call',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { done: true },
    });
  });

  registerSem('log', (ev, ctx) => {
    const data = decodeProto<LogV1>(LogV1Schema, ev.data);
    addEntity(ctx, {
      id: ev.id,
      kind: 'log',
      createdAt: createdAtFromEvent(ev),
      props: { level: data?.level, message: data?.message, fields: data?.fields ?? {} },
    });
  });

  registerSem('agent.mode', (ev, ctx) => {
    const data = decodeProto<AgentModeV1>(AgentModeV1Schema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'agent_mode',
      createdAt: createdAtFromEvent(ev),
      props: { title: data?.title, data: data?.data ?? {} },
    });
  });

  registerSem('debugger.pause', (ev, ctx) => {
    const data = decodeProto<DebuggerPauseV1>(DebuggerPauseV1Schema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'debugger_pause',
      createdAt: createdAtFromEvent(ev),
      props: {
        pauseId: data?.pauseId,
        phase: data?.phase,
        summary: data?.summary,
        deadlineMs: data?.deadlineMs?.toString?.() ?? '',
        extra: data?.extra ?? {},
      },
    });
  });
}
