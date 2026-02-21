import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSemHandlers } from '../sem/semRegistry';
import {
  ensureChatModulesRegistered,
  resetChatModulesRegistrationForTest,
} from '../runtime/registerChatModules';
import { chatSessionSlice } from '../state/chatSessionSlice';
import { timelineSlice } from '../state/timelineSlice';
import { WsManager } from './wsManager';

class MockWebSocket {
  public onopen: (() => void) | null = null;
  public onclose: (() => void) | null = null;
  public onerror: (() => void) | null = null;
  public onmessage: ((event: { data: string }) => void) | null = null;
  public readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  emitOpen() {
    this.onopen?.();
  }

  emitMessage(payload: unknown) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }

  close() {
    this.onclose?.();
  }
}

function createStore() {
  return configureStore({
    reducer: {
      timeline: timelineSlice.reducer,
      chatSession: chatSessionSlice.reducer,
    },
  });
}

describe('wsManager', () => {
  beforeEach(() => {
    clearSemHandlers();
    resetChatModulesRegistrationForTest();
    ensureChatModulesRegistered();
  });

  it('dispatches SEM frames into timeline entities after connect', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    const connectPromise = manager.connect({
      convId: 'conv-live',
      dispatch: store.dispatch,
      hydrate: false,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();
    await connectPromise;

    sockets[0].emitMessage({
      sem: true,
      event: {
        type: 'llm.delta',
        id: 'msg-1',
        data: {
          cumulative: 'hello',
        },
      },
    });

    const state = store.getState();
    expect(state.chatSession.byConvId['conv-live'].connectionStatus).toBe('connected');
    expect(state.timeline.byConvId['conv-live'].order).toEqual(['msg-1']);
    expect(state.timeline.byConvId['conv-live'].byId['msg-1'].kind).toBe('message');

    manager.disconnect();
  });

  it('buffers frames during hydrate and replays them after snapshot apply', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    let resolveFetch!: (response: unknown) => void;
    const fetchPromise = new Promise<unknown>((resolve) => {
      resolveFetch = resolve as (response: unknown) => void;
    });
    const fetchImpl = vi.fn(() => fetchPromise as Promise<Response>);

    const connectPromise = manager.connect({
      convId: 'conv-hydrate',
      dispatch: store.dispatch,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      fetchImpl,
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();

    // Arrives before hydrate completes -> should be buffered.
    sockets[0].emitMessage({
      sem: true,
      event: {
        type: 'llm.delta',
        id: 'msg-buffered',
        data: {
          cumulative: 'buffered',
        },
      },
    });

    resolveFetch({
      ok: true,
      json: async () => ({
        convId: 'conv-hydrate',
        version: '1',
        serverTimeMs: '0',
        entities: [],
      }),
    });

    await connectPromise;

    const state = store.getState();
    expect(fetchImpl).toHaveBeenCalledWith('/api/timeline?conv_id=conv-hydrate');
    expect(state.timeline.byConvId['conv-hydrate'].order).toEqual(['msg-buffered']);

    manager.disconnect();
  });
});
