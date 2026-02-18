import { toYaml } from '../utils/yamlFormat';
import type { EventLogEntry } from './eventBus';

export interface EventLogYamlExport {
  conversationId: string;
  exportedAt: string;
  visibleCount: number;
  filters: Record<string, boolean>;
  entries: EventLogEntry[];
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

function safeToken(value: string): string {
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-');
  return cleaned.length > 0 ? cleaned : 'conversation';
}

export function buildEventLogYamlExport(
  conversationId: string,
  entries: EventLogEntry[],
  filters: Record<string, boolean>,
  nowMs = Date.now(),
): EventLogYamlExport {
  return {
    conversationId,
    exportedAt: new Date(nowMs).toISOString(),
    visibleCount: entries.length,
    filters: { ...filters },
    entries,
  };
}

export function buildEventLogYamlFilename(
  conversationId: string,
  nowMs = Date.now(),
): string {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = pad2(d.getUTCMonth() + 1);
  const day = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());
  return `event-log-${safeToken(conversationId)}-${y}${m}${day}-${hh}${mm}${ss}.yaml`;
}

export function exportEventLogYaml(
  payload: EventLogYamlExport,
  filename?: string,
): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  const yaml = toYaml(payload as unknown as Record<string, unknown>);
  const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? buildEventLogYamlFilename(payload.conversationId);
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
  return true;
}
