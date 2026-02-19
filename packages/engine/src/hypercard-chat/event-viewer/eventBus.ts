/**
 * Per-conversation in-memory event bus for high-frequency SEM envelopes.
 *
 * This intentionally lives outside Redux so debug/event inspection can consume
 * raw events without increasing store churn.
 */

import type { SemEventEnvelope } from '../types';

export interface EventLogEntry {
  id: string;
  timestamp: number;
  eventType: string;
  eventId: string;
  family: string;
  summary: string;
  rawPayload: unknown;
}

type Listener = (entry: EventLogEntry) => void;

const busMap = new Map<string, Set<Listener>>();
let seqCounter = 0;

function nextSeq(): string {
  seqCounter += 1;
  return `evt-${seqCounter}`;
}

function eventFamily(type: string): string {
  const dot = type.indexOf('.');
  if (dot < 0) {
    return 'other';
  }
  const prefix = type.slice(0, dot);
  if (['llm', 'tool', 'hypercard', 'timeline', 'ws'].includes(prefix)) {
    return prefix;
  }
  return 'other';
}

function summarize(type: string, data: Record<string, unknown>): string {
  if (type === 'llm.delta') {
    const delta = typeof data.delta === 'string' ? data.delta : '';
    const cumulativeLength =
      typeof data.cumulative === 'string' ? data.cumulative.length : 0;
    if (cumulativeLength > 0) {
      return `+${delta.length} chars (${cumulativeLength} total)`;
    }
    if (delta.length > 0) {
      return `+${delta.length} chars`;
    }
    return 'delta';
  }

  if (type === 'llm.start') return 'inference started';
  if (type === 'llm.final') return 'inference complete';

  if (type === 'tool.start') {
    const name = typeof data.name === 'string' ? data.name : 'tool';
    return `start ${name}`;
  }

  if (type === 'tool.done') return 'tool done';
  if (type === 'tool.result') return 'tool result';
  if (type === 'tool.delta') return 'tool delta';

  if (type === 'timeline.upsert') {
    const entity = data.entity as Record<string, unknown> | undefined;
    const kind = typeof entity?.kind === 'string' ? entity.kind : '';
    return kind ? `upsert ${kind}` : 'upsert';
  }

  if (type === 'ws.error') {
    const msg = typeof data.message === 'string' ? data.message : 'error';
    return msg.slice(0, 60);
  }

  return type;
}

export function emitConversationEvent(
  conversationId: string,
  envelope: SemEventEnvelope,
): void {
  const listeners = busMap.get(conversationId);
  if (!listeners || listeners.size === 0) {
    return;
  }

  const type = envelope.event?.type ?? 'unknown';
  const eventId = envelope.event?.id ?? '';
  const data = envelope.event?.data ?? {};

  const entry: EventLogEntry = {
    id: nextSeq(),
    timestamp: Date.now(),
    eventType: type,
    eventId,
    family: eventFamily(type),
    summary: summarize(type, data),
    rawPayload: envelope,
  };

  for (const listener of listeners) {
    listener(entry);
  }
}

export function subscribeConversationEvents(
  conversationId: string,
  callback: Listener,
): () => void {
  if (!busMap.has(conversationId)) {
    busMap.set(conversationId, new Set());
  }

  busMap.get(conversationId)?.add(callback);

  return () => {
    busMap.get(conversationId)?.delete(callback);
    if (busMap.get(conversationId)?.size === 0) {
      busMap.delete(conversationId);
    }
  };
}
