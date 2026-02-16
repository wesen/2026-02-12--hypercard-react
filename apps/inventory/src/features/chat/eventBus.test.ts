import { describe, expect, it } from 'vitest';
import { emitConversationEvent, subscribeConversationEvents, type EventLogEntry } from './eventBus';

describe('eventBus', () => {
  it('delivers events to subscribers', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-test-1', (e) => received.push(e));

    emitConversationEvent('bus-test-1', {
      event: { type: 'llm.start', id: 'e1', data: {} },
    });

    expect(received).toHaveLength(1);
    expect(received[0].eventType).toBe('llm.start');
    expect(received[0].family).toBe('llm');
    expect(received[0].summary).toBe('inference started');
    unsub();
  });

  it('isolates conversations', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-iso-1', (e) => received.push(e));

    emitConversationEvent('bus-iso-2', {
      event: { type: 'tool.start', id: 't1', data: { name: 'lookup' } },
    });

    expect(received).toHaveLength(0);
    unsub();
  });

  it('stops delivering after unsubscribe', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-unsub', (e) => received.push(e));

    emitConversationEvent('bus-unsub', { event: { type: 'llm.delta', data: {} } });
    expect(received).toHaveLength(1);

    unsub();
    emitConversationEvent('bus-unsub', { event: { type: 'llm.final', data: {} } });
    expect(received).toHaveLength(1);
  });

  it('classifies event families correctly', () => {
    const received: EventLogEntry[] = [];
    const unsub = subscribeConversationEvents('bus-family', (e) => received.push(e));

    const types = ['tool.start', 'hypercard.ready', 'timeline.upsert', 'ws.error', 'custom.thing'];
    for (const type of types) {
      emitConversationEvent('bus-family', { event: { type, data: {} } });
    }

    expect(received.map((e) => e.family)).toEqual(['tool', 'hypercard', 'timeline', 'ws', 'other']);
    unsub();
  });
});
