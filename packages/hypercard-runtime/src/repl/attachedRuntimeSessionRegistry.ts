import { useSyncExternalStore } from 'react';
import type { SessionId } from '../plugin-runtime/contracts';
import type { RuntimeSessionHandle, RuntimeSessionSummary } from './runtimeBroker';

export interface AttachedRuntimeSessionEntry {
  handle: RuntimeSessionHandle;
  summary: RuntimeSessionSummary;
}

const entries = new Map<SessionId, AttachedRuntimeSessionEntry>();
const listeners = new Set<() => void>();
let snapshot: AttachedRuntimeSessionEntry[] = [];

function refreshSnapshot() {
  snapshot = Array.from(entries.values()).sort((left, right) =>
    left.summary.sessionId.localeCompare(right.summary.sessionId),
  );
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function refreshAndEmit() {
  refreshSnapshot();
  emitChange();
}

export function registerAttachedRuntimeSession(entry: AttachedRuntimeSessionEntry): void {
  if (!entry?.summary?.sessionId || !entry.handle) {
    return;
  }
  entries.set(entry.summary.sessionId, entry);
  refreshAndEmit();
}

export function unregisterAttachedRuntimeSession(sessionId: SessionId): void {
  if (!entries.has(sessionId)) {
    return;
  }
  entries.delete(sessionId);
  refreshAndEmit();
}

export function clearAttachedRuntimeSessions(): void {
  if (entries.size === 0) {
    return;
  }
  entries.clear();
  refreshAndEmit();
}

export function listAttachedRuntimeSessions(): AttachedRuntimeSessionEntry[] {
  return snapshot;
}

export function getAttachedRuntimeSession(sessionId: SessionId): AttachedRuntimeSessionEntry | null {
  return entries.get(sessionId) ?? null;
}

export function subscribeAttachedRuntimeSessions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAttachedRuntimeSessions(): AttachedRuntimeSessionEntry[] {
  return useSyncExternalStore(
    subscribeAttachedRuntimeSessions,
    listAttachedRuntimeSessions,
    listAttachedRuntimeSessions,
  );
}
