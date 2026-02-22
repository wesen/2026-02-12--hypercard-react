import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSemHandlers } from '../sem/semRegistry';
import {
  ensureChatModulesRegistered,
  resetChatModulesRegistrationForTest,
} from '../runtime/registerChatModules';
import { STARTER_SUGGESTIONS_ENTITY_ID } from '../state/suggestions';
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

  it('hydrates by merging snapshot without clearing existing timeline order', async () => {
    const store = createStore();
    const manager = new WsManager();
    const sockets: MockWebSocket[] = [];

    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-focus',
        entity: {
          id: STARTER_SUGGESTIONS_ENTITY_ID,
          kind: 'suggestions',
          createdAt: 10,
          version: 1,
          props: { source: 'starter', items: ['Summarize today sales'], consumedAt: 20 },
        },
      })
    );
    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-focus',
        entity: {
          id: 'user-1',
          kind: 'message',
          createdAt: 11,
          version: 1,
          props: { role: 'user', content: 'Summarize today sales' },
        },
      })
    );
    store.dispatch(
      timelineSlice.actions.addEntity({
        convId: 'conv-focus',
        entity: {
          id: 'assistant-1',
          kind: 'message',
          createdAt: 12,
          version: 1,
          props: { role: 'assistant', content: 'Initial summary' },
        },
      })
    );

    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        convId: 'conv-focus',
        version: '99',
        serverTimeMs: '0',
        entities: [
          {
            id: 'assistant-1',
            kind: 'message',
            createdAtMs: '12',
            updatedAtMs: '13',
            props: { role: 'assistant', content: 'Hydrated summary' },
          },
          {
            id: 'status-1',
            kind: 'status',
            createdAtMs: '14',
            updatedAtMs: '14',
            props: { text: 'Updating widget' },
          },
        ],
      }),
    }));

    const connectPromise = manager.connect({
      convId: 'conv-focus',
      dispatch: store.dispatch,
      wsFactory: (url) => {
        const socket = new MockWebSocket(url);
        sockets.push(socket);
        return socket as unknown as WebSocket;
      },
      fetchImpl: fetchImpl as unknown as typeof fetch,
      location: { protocol: 'http:', host: 'localhost' },
    });

    expect(sockets).toHaveLength(1);
    sockets[0].emitOpen();
    await connectPromise;

    const conv = store.getState().timeline.byConvId['conv-focus'];
    expect(conv.order).toEqual([STARTER_SUGGESTIONS_ENTITY_ID, 'user-1', 'assistant-1', 'status-1']);
    expect(conv.byId[STARTER_SUGGESTIONS_ENTITY_ID]).toBeDefined();
    expect(conv.byId['assistant-1'].props).toEqual({
      role: 'assistant',
      content: 'Hydrated summary',
    });
    expect(fetchImpl).toHaveBeenCalledWith('/api/timeline?conv_id=conv-focus');

    manager.disconnect();
  });
});
