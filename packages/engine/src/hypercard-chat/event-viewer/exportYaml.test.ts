import { describe, expect, it } from 'vitest';
import type { EventLogEntry } from './eventBus';
import {
  buildEventLogYamlExport,
  buildEventLogYamlFilename,
} from './exportYaml';

function sampleEntry(id: string, eventType: string): EventLogEntry {
  return {
    id,
    timestamp: 1700000000000,
    eventType,
    eventId: `${id}-event`,
    family: 'llm',
    summary: 'sample',
    rawPayload: { event: { type: eventType } },
  };
}

describe('event viewer yaml export helpers', () => {
  it('builds export payload from visible entries and active filters', () => {
    const entries = [sampleEntry('1', 'llm.start'), sampleEntry('2', 'llm.final')];
    const filters = { llm: true, tool: false };
    const payload = buildEventLogYamlExport(
      'conv-1',
      entries,
      filters,
      Date.UTC(2026, 1, 18, 21, 30, 0),
    );

    expect(payload.conversationId).toBe('conv-1');
    expect(payload.exportedAt).toBe('2026-02-18T21:30:00.000Z');
    expect(payload.visibleCount).toBe(2);
    expect(payload.filters).toEqual(filters);
    expect(payload.entries).toEqual(entries);
  });

  it('creates deterministic yaml filename using safe conversation token', () => {
    const name = buildEventLogYamlFilename(
      'conv id / with spaces',
      Date.UTC(2026, 1, 18, 21, 30, 0),
    );
    expect(name).toBe('event-log-conv-id-with-spaces-20260218-213000.yaml');
  });
});
