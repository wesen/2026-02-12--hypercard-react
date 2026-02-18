import type { TimelineEntity } from '../timeline/types';
import { normalizeVersion } from '../timeline/version';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function stringField(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const raw = record?.[key];
  return typeof raw === 'string' && raw.trim() ? raw : undefined;
}

function numberField(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const raw = record?.[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function booleanField(record: Record<string, unknown> | undefined, key: string): boolean | undefined {
  const raw = record?.[key];
  return typeof raw === 'boolean' ? raw : undefined;
}

function oneOfSnapshot(entity: Record<string, unknown>): { kind?: string; payload?: Record<string, unknown> } {
  const message = asRecord(entity.message);
  if (message) return { kind: 'message', payload: message };

  const toolCall = asRecord(entity.toolCall) ?? asRecord(entity.tool_call);
  if (toolCall) return { kind: 'tool_call', payload: toolCall };

  const toolResult = asRecord(entity.toolResult) ?? asRecord(entity.tool_result);
  if (toolResult) return { kind: 'tool_result', payload: toolResult };

  const status = asRecord(entity.status);
  if (status) return { kind: 'status', payload: status };

  const snapshot = asRecord(entity.snapshot);
  if (snapshot) {
    const caseValue = stringField(snapshot, 'case');
    const value = asRecord(snapshot.value);
    if (caseValue && value) {
      if (caseValue === 'toolCall') return { kind: 'tool_call', payload: value };
      if (caseValue === 'toolResult') return { kind: 'tool_result', payload: value };
      if (caseValue === 'message') return { kind: 'message', payload: value };
      if (caseValue === 'status') return { kind: 'status', payload: value };
      return { kind: caseValue, payload: value };
    }
  }

  return { payload: undefined };
}

function stringFromUnknown(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function propsFromEntity(kind: string, entity: Record<string, unknown>): Record<string, unknown> {
  const snap = oneOfSnapshot(entity);
  const payload = snap.payload;

  if (kind === 'message' && payload) {
    return {
      role: stringField(payload, 'role') ?? 'assistant',
      content: stringField(payload, 'content') ?? '',
      streaming: booleanField(payload, 'streaming') ?? false,
    };
  }

  if (kind === 'tool_call' && payload) {
    return {
      name: stringField(payload, 'name') ?? 'tool',
      input: payload.input,
      status: stringField(payload, 'status'),
      progress: numberField(payload, 'progress'),
      done: booleanField(payload, 'done') ?? false,
      output: payload.output,
    };
  }

  if (kind === 'tool_result' && payload) {
    const resultRaw = payload.resultRaw ?? payload.result_raw;
    const result = typeof resultRaw !== 'undefined' ? resultRaw : payload.result;
    return {
      toolCallId: stringField(payload, 'toolCallId') ?? stringField(payload, 'tool_call_id'),
      customKind: stringField(payload, 'customKind') ?? stringField(payload, 'custom_kind') ?? '',
      result,
      resultText: stringFromUnknown(result),
    };
  }

  if (kind === 'status' && payload) {
    return {
      text: stringField(payload, 'text') ?? '',
      type: stringField(payload, 'type') ?? 'info',
    };
  }

  return {
    raw: entity,
  };
}

export function mapTimelineEntityFromUpsert(
  data: Record<string, unknown>,
  nowMs: number,
): TimelineEntity | undefined {
  const entity = asRecord(data.entity);
  if (!entity) return undefined;

  const id = stringField(entity, 'id');
  const kind = stringField(entity, 'kind');
  if (!id || !kind) return undefined;

  const createdAt =
    numberField(entity, 'createdAtMs') ??
    numberField(entity, 'created_at_ms') ??
    numberField(entity, 'createdAt') ??
    nowMs;
  const updatedAt =
    numberField(entity, 'updatedAtMs') ??
    numberField(entity, 'updated_at_ms') ??
    numberField(entity, 'updatedAt');

  return {
    id,
    kind,
    createdAt,
    updatedAt,
    version: normalizeVersion(data.version),
    props: propsFromEntity(kind, entity),
  };
}
