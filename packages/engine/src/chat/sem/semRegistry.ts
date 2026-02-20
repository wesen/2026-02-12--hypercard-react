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
  type ToolDelta,
  ToolDeltaSchema,
  ToolDoneSchema,
  type ToolResult,
  ToolResultSchema,
  type ToolStart,
  ToolStartSchema,
} from './pb/proto/sem/base/tool_pb';
import { type TimelineUpsertV2, TimelineUpsertV2Schema } from './pb/proto/sem/timeline/transport_pb';
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

const handlers = new Map<string, Handler>();

export function registerSem(type: string, handler: Handler) {
  handlers.set(type, handler);
}

export function clearSemHandlers() {
  handlers.clear();
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

export function registerDefaultSemHandlers() {
  clearSemHandlers();

  registerSem('timeline.upsert', (ev, ctx) => {
    const data = decodeProto<TimelineUpsertV2>(TimelineUpsertV2Schema, ev.data);
    const entity = data?.entity;
    if (!entity) return;
    const mapped = timelineEntityFromProto(entity, data?.version);
    if (!mapped) return;
    upsertEntity(ctx, mapped);
  });

  registerSem('llm.start', (ev, ctx) => {
    const data = decodeProto<LlmStart>(LlmStartSchema, ev.data);
    const role = data?.role || 'assistant';
    addEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      props: { role, content: '', streaming: true },
    });
  });

  registerSem('llm.delta', (ev, ctx) => {
    const data = decodeProto<LlmDelta>(LlmDeltaSchema, ev.data);
    const cumulative = data?.cumulative;
    // Backend emits cumulative; prefer it to keep handlers idempotent.
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { content: typeof cumulative === 'string' ? cumulative : '', streaming: true },
    });
  });

  registerSem('llm.final', (ev, ctx) => {
    const data = decodeProto<LlmFinal>(LlmFinalSchema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { content: data?.text ?? '', streaming: false },
    });
  });

  registerSem('llm.thinking.start', (ev, ctx) => {
    const data = decodeProto<LlmStart>(LlmStartSchema, ev.data);
    const role = data?.role || 'thinking';
    addEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      props: { role, content: '', streaming: true },
    });
  });

  registerSem('llm.thinking.delta', (ev, ctx) => {
    const data = decodeProto<LlmDelta>(LlmDeltaSchema, ev.data);
    const cumulative = data?.cumulative;
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { content: typeof cumulative === 'string' ? cumulative : '', streaming: true },
    });
  });

  registerSem('llm.thinking.final', (ev, ctx) => {
    const _data = decodeProto(LlmDoneSchema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { streaming: false },
    });
  });

  registerSem('llm.thinking.summary', (ev, ctx) => {
    const data = decodeProto<LlmFinal>(LlmFinalSchema, ev.data);
    upsertEntity(ctx, {
      id: ev.id,
      kind: 'message',
      createdAt: createdAtFromEvent(ev),
      updatedAt: Date.now(),
      props: { content: data?.text ?? '', streaming: false },
    });
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
