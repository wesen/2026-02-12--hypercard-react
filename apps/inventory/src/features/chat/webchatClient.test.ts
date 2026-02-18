import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  InventoryWebChatClient,
  routeIncomingEnvelope,
  sortBufferedEnvelopes,
  type SemEventEnvelope,
} from './webchatClient';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static reset(): void {
    FakeWebSocket.instances = [];
  }

  readonly url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close(): void {
    // no-op for unit test fake
  }
}

const OriginalWebSocket = globalThis.WebSocket;
const OriginalWindow = (globalThis as { window?: Window }).window;

beforeEach(() => {
  FakeWebSocket.reset();
  vi.useFakeTimers();
  (globalThis as { WebSocket: typeof WebSocket }).WebSocket = FakeWebSocket as unknown as typeof WebSocket;
  Object.defineProperty(globalThis, 'window', {
    value: {
      location: { protocol: 'http:', host: 'localhost:5173' },
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  (globalThis as { WebSocket: typeof WebSocket }).WebSocket = OriginalWebSocket;
  if (OriginalWindow) {
    Object.defineProperty(globalThis, 'window', {
      value: OriginalWindow,
      configurable: true,
      writable: true,
    });
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
  vi.useRealTimers();
});

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

describe('routeIncomingEnvelope', () => {
  it('emits raw envelope and buffers while hydration is pending', () => {
    const raw: string[] = [];
    const projected: string[] = [];
    const state = { hydrated: false, buffered: [] as SemEventEnvelope[] };
    const envelope: SemEventEnvelope = {
      sem: true,
      event: { type: 'llm.delta', id: 'd1', data: {} },
    };

    routeIncomingEnvelope(state, envelope, {
      onRawEnvelope: (e) => raw.push(e.event?.id ?? ''),
      onEnvelope: (e) => projected.push(e.event?.id ?? ''),
    });

    expect(raw).toEqual(['d1']);
    expect(projected).toEqual([]);
    expect(state.buffered).toEqual([envelope]);
  });

  it('emits raw envelope and forwards for projection when hydrated', () => {
    const raw: string[] = [];
    const projected: string[] = [];
    const state = { hydrated: true, buffered: [] as SemEventEnvelope[] };
    const envelope: SemEventEnvelope = {
      sem: true,
      event: { type: 'llm.final', id: 'f1', data: {} },
    };

    routeIncomingEnvelope(state, envelope, {
      onRawEnvelope: (e) => raw.push(e.event?.id ?? ''),
      onEnvelope: (e) => projected.push(e.event?.id ?? ''),
    });

    expect(raw).toEqual(['f1']);
    expect(projected).toEqual(['f1']);
    expect(state.buffered).toEqual([]);
  });
});

describe('InventoryWebChatClient connection status', () => {
  it('ignores stale socket callbacks after reconnect', () => {
    const statuses: string[] = [];
    const client = new InventoryWebChatClient(
      'conv-1',
      {
        onEnvelope: () => {},
        onStatus: (status) => statuses.push(status),
      },
      { hydrate: false },
    );

    client.connect();
    const ws1 = FakeWebSocket.instances[0];
    ws1.onopen?.(new Event('open'));
    client.close();

    client.connect();
    const ws2 = FakeWebSocket.instances[1];
    ws1.onclose?.({} as CloseEvent);
    ws2.onopen?.(new Event('open'));

    expect(statuses).toEqual(['connecting', 'connected', 'connecting', 'connected']);
  });

  it('re-emits connected heartbeat while messages are flowing', () => {
    const statuses: string[] = [];
    const client = new InventoryWebChatClient(
      'conv-2',
      {
        onEnvelope: () => {},
        onStatus: (status) => statuses.push(status),
      },
      { hydrate: false },
    );

    client.connect();
    const ws = FakeWebSocket.instances[0];
    ws.onopen?.(new Event('open'));

    ws.onmessage?.({
      data: JSON.stringify({ sem: true, event: { type: 'llm.delta', data: { delta: 'a' } } }),
    } as MessageEvent);
    vi.advanceTimersByTime(1100);
    ws.onmessage?.({
      data: JSON.stringify({ sem: true, event: { type: 'llm.delta', data: { delta: 'b' } } }),
    } as MessageEvent);

    expect(statuses).toEqual(['connecting', 'connected', 'connected']);
  });
});
