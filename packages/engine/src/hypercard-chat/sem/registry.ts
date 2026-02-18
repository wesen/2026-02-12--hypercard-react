import {
  addEntity,
  clearConversation,
  rekeyEntity,
  upsertEntity,
} from '../timeline/timelineSlice';
import type { TimelineEntity } from '../timeline/types';
import { mapTimelineEntityFromUpsert } from './timelineMapper';
import type {
  RuntimeEffect,
  SemContext,
  SemEnvelope,
  SemEvent,
  SemHandler,
  SemHandlerResult,
  SemTimelineOp,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function stringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function eventId(event: SemEvent | undefined, fallbackPrefix: string): string {
  if (event?.id && event.id.trim()) return event.id;
  return `${fallbackPrefix}-${Date.now()}`;
}

function upsert(entity: TimelineEntity): SemHandlerResult {
  return { ops: [{ type: 'upsertEntity', entity }], effects: [] };
}

function add(entity: TimelineEntity): SemHandlerResult {
  return { ops: [{ type: 'addEntity', entity }], effects: [] };
}

function emptyResult(): SemHandlerResult {
  return { ops: [], effects: [] };
}

export class SemRegistry {
  private handlers = new Map<string, SemHandler>();

  register(type: string, handler: SemHandler) {
    this.handlers.set(type, handler);
  }

  clear() {
    this.handlers.clear();
  }

  handle(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
    if (!envelope || envelope.sem !== true || !envelope.event) {
      return emptyResult();
    }
    const ev = envelope.event;
    const type = ev.type;
    if (!type) return emptyResult();

    const handler = this.handlers.get(type);
    if (!handler) return emptyResult();

    return handler(envelope, ctx);
  }
}

function timelineUpsertHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  const entity = mapTimelineEntityFromUpsert(data, ctx.now());
  if (!entity) return emptyResult();
  return upsert(entity);
}

function llmStartHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  return add({
    id: eventId(envelope.event, 'llm-start'),
    kind: 'message',
    createdAt: ctx.now(),
    props: {
      role: stringField(data, 'role') ?? 'assistant',
      content: '',
      streaming: true,
    },
  });
}

function llmDeltaHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  const cumulative = stringField(data, 'cumulative');
  const delta = stringField(data, 'delta');
  return upsert({
    id: eventId(envelope.event, 'llm-delta'),
    kind: 'message',
    createdAt: ctx.now(),
    updatedAt: ctx.now(),
    props: {
      role: 'assistant',
      content: cumulative ?? delta ?? '',
      streaming: true,
    },
  });
}

function llmFinalHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  return upsert({
    id: eventId(envelope.event, 'llm-final'),
    kind: 'message',
    createdAt: ctx.now(),
    updatedAt: ctx.now(),
    props: {
      role: 'assistant',
      content: stringField(data, 'text') ?? stringField(data, 'cumulative') ?? '',
      streaming: false,
    },
  });
}

function toolStartHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  return add({
    id: eventId(envelope.event, 'tool-start'),
    kind: 'tool_call',
    createdAt: ctx.now(),
    props: {
      name: stringField(data, 'name') ?? 'tool',
      input: data.input,
      done: false,
    },
  });
}

function toolDeltaHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  const patch = asRecord(data.patch);
  return upsert({
    id: eventId(envelope.event, 'tool-delta'),
    kind: 'tool_call',
    createdAt: ctx.now(),
    updatedAt: ctx.now(),
    props: {
      ...patch,
      done: false,
    },
  });
}

function toolResultHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  const customKind = stringField(data, 'customKind') ?? '';
  const base = eventId(envelope.event, 'tool-result');
  return upsert({
    id: customKind ? `${base}:custom` : `${base}:result`,
    kind: 'tool_result',
    createdAt: ctx.now(),
    updatedAt: ctx.now(),
    props: {
      customKind,
      result: data.result,
      resultText:
        typeof data.result === 'string'
          ? data.result
          : JSON.stringify(data.result ?? {}),
    },
  });
}

function toolDoneHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  return upsert({
    id: eventId(envelope.event, 'tool-done'),
    kind: 'tool_call',
    createdAt: ctx.now(),
    updatedAt: ctx.now(),
    props: { done: true },
  });
}

function logHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  return add({
    id: eventId(envelope.event, 'log'),
    kind: 'log',
    createdAt: ctx.now(),
    props: {
      level: stringField(data, 'level') ?? 'info',
      message: stringField(data, 'message') ?? '',
      fields: asRecord(data.fields),
    },
  });
}

function wsErrorHandler(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
  const data = asRecord(envelope.event?.data);
  return upsert({
    id: eventId(envelope.event, 'ws-error'),
    kind: 'status',
    createdAt: ctx.now(),
    updatedAt: ctx.now(),
    props: {
      type: 'error',
      text: stringField(data, 'message') ?? 'websocket stream error',
    },
  });
}

export function registerDefaultSemHandlers(registry: SemRegistry): void {
  registry.clear();
  registry.register('timeline.upsert', timelineUpsertHandler);

  registry.register('llm.start', llmStartHandler);
  registry.register('llm.delta', llmDeltaHandler);
  registry.register('llm.final', llmFinalHandler);

  registry.register('llm.thinking.start', llmStartHandler);
  registry.register('llm.thinking.delta', llmDeltaHandler);
  registry.register('llm.thinking.final', llmFinalHandler);

  registry.register('tool.start', toolStartHandler);
  registry.register('tool.delta', toolDeltaHandler);
  registry.register('tool.result', toolResultHandler);
  registry.register('tool.done', toolDoneHandler);

  registry.register('log', logHandler);
  registry.register('ws.error', wsErrorHandler);
}

export function createSemRegistry(): SemRegistry {
  const registry = new SemRegistry();
  registerDefaultSemHandlers(registry);
  return registry;
}

export function applySemTimelineOps(
  dispatch: (action: unknown) => void,
  convId: string,
  ops: SemTimelineOp[],
): void {
  for (const op of ops) {
    if (op.type === 'addEntity') {
      dispatch(addEntity({ convId, entity: op.entity }));
      continue;
    }
    if (op.type === 'upsertEntity') {
      dispatch(upsertEntity({ convId, entity: op.entity }));
      continue;
    }
    if (op.type === 'rekeyEntity') {
      dispatch(rekeyEntity({ convId, fromId: op.fromId, toId: op.toId }));
      continue;
    }
    dispatch(clearConversation({ convId }));
  }
}

export function mergeEffects(
  primary: RuntimeEffect[],
  secondary: RuntimeEffect[],
): RuntimeEffect[] {
  if (primary.length === 0) return secondary;
  if (secondary.length === 0) return primary;
  return [...primary, ...secondary];
}
