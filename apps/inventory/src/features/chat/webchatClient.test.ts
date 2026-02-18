import { describe, expect, it } from 'vitest';
import { sortBufferedEnvelopes, type SemEventEnvelope } from './webchatClient';

describe('sortBufferedEnvelopes', () => {
  it('orders by stream_id when present', () => {
    const envelopes: SemEventEnvelope[] = [
      { sem: true, event: { type: 'llm.delta', id: '2', stream_id: '1700-2', data: {} } },
      { sem: true, event: { type: 'llm.delta', id: '1', stream_id: '1700-1', data: {} } },
    ];

    const sorted = sortBufferedEnvelopes(envelopes);
    expect(sorted.map((e) => e.event?.id)).toEqual(['1', '2']);
  });

  it('falls back to seq ordering when stream_id missing', () => {
    const envelopes: SemEventEnvelope[] = [
      { sem: true, event: { type: 'tool.start', id: 'b', seq: '101', data: {} } },
      { sem: true, event: { type: 'tool.start', id: 'a', seq: '100', data: {} } },
    ];

    const sorted = sortBufferedEnvelopes(envelopes);
    expect(sorted.map((e) => e.event?.id)).toEqual(['a', 'b']);
  });
});
