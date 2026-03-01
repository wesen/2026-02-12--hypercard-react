import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import {
  ingestRuntimeIntent,
  pluginCardRuntimeReducer,
  registerRuntimeSession,
  removeRuntimeSession,
} from '../features/pluginCardRuntime';

function createStore() {
  return configureStore({
    reducer: {
      pluginCardRuntime: pluginCardRuntimeReducer,
    },
  });
}

describe('pluginCardRuntime reducer', () => {
  it('tracks applied/denied/ignored outcomes and queues routed intents', () => {
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-1',
        stackId: 'inventory',
        status: 'ready',
        capabilities: {
          domain: ['inventory'],
          system: ['nav.go'],
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-1',
        cardId: 'lowStock',
        intent: {
          scope: 'card',
          actionType: 'patch',
          payload: { count: 2 },
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-1',
        cardId: 'lowStock',
        intent: {
          scope: 'card',
          actionType: 'unknown-op',
          payload: {},
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-1',
        cardId: 'lowStock',
        intent: {
          scope: 'domain',
          domain: 'billing',
          actionType: 'charge',
          payload: { id: 'ch_1' },
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-1',
        cardId: 'lowStock',
        intent: {
          scope: 'domain',
          domain: 'inventory',
          actionType: 'reserve-item',
          payload: { sku: 'A-1' },
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-1',
        cardId: 'lowStock',
        intent: {
          scope: 'system',
          command: 'notify',
          payload: { message: 'reserved' },
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-1',
        cardId: 'lowStock',
        intent: {
          scope: 'system',
          command: 'nav.go',
          payload: { cardId: 'detail' },
        },
      })
    );

    const state = store.getState().pluginCardRuntime;

    expect(state.sessions['session-1'].cardState.lowStock).toEqual({ count: 2 });
    expect(state.pendingDomainIntents).toHaveLength(1);
    expect(state.pendingSystemIntents).toHaveLength(1);
    expect(state.pendingNavIntents).toHaveLength(1);

    const outcomes = state.timeline.map((entry) => ({
      scope: entry.scope,
      actionType: entry.actionType,
      command: entry.command,
      outcome: entry.outcome,
      reason: entry.reason,
    }));

    expect(outcomes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ scope: 'card', actionType: 'patch', outcome: 'applied' }),
        expect.objectContaining({ scope: 'card', actionType: 'unknown-op', outcome: 'ignored' }),
        expect.objectContaining({ scope: 'domain', actionType: 'charge', outcome: 'denied' }),
        expect.objectContaining({ scope: 'domain', actionType: 'reserve-item', outcome: 'applied' }),
        expect.objectContaining({ scope: 'system', command: 'notify', outcome: 'denied' }),
        expect.objectContaining({ scope: 'system', command: 'nav.go', outcome: 'applied' }),
      ])
    );
  });

  it('cleans up session-owned pending intents on session removal', () => {
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-cleanup',
        stackId: 'inventory',
        capabilities: {
          domain: 'all',
          system: 'all',
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-cleanup',
        cardId: 'home',
        intent: {
          scope: 'domain',
          domain: 'inventory',
          actionType: 'reserve-item',
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-cleanup',
        cardId: 'home',
        intent: {
          scope: 'system',
          command: 'nav.go',
          payload: { cardId: 'detail' },
        },
      })
    );

    let state = store.getState().pluginCardRuntime;
    expect(state.pendingDomainIntents).toHaveLength(1);
    expect(state.pendingSystemIntents).toHaveLength(1);

    store.dispatch(removeRuntimeSession({ sessionId: 'session-cleanup' }));

    state = store.getState().pluginCardRuntime;
    expect(state.sessions['session-cleanup']).toBeUndefined();
    expect(state.pendingDomainIntents.find((intent) => intent.sessionId === 'session-cleanup')).toBeUndefined();
    expect(state.pendingSystemIntents.find((intent) => intent.sessionId === 'session-cleanup')).toBeUndefined();
    expect(state.pendingNavIntents.find((intent) => intent.sessionId === 'session-cleanup')).toBeUndefined();
  });

  it('routes nav.* commands to nav queue while keeping all allowed system intents in system queue', () => {
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-nav',
        stackId: 'inventory',
        capabilities: {
          system: ['nav.go', 'window.close'],
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-nav',
        cardId: 'home',
        intent: {
          scope: 'system',
          command: 'nav.go',
          payload: { cardId: 'detail' },
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-nav',
        cardId: 'home',
        intent: {
          scope: 'system',
          command: 'window.close',
          payload: { windowId: 'w1' },
        },
      })
    );

    store.dispatch(
      ingestRuntimeIntent({
        sessionId: 'session-nav',
        cardId: 'home',
        intent: {
          scope: 'system',
          command: 'nav.back',
          payload: {},
        },
      })
    );

    const state = store.getState().pluginCardRuntime;

    expect(state.pendingSystemIntents.map((intent) => intent.command)).toEqual(['nav.go', 'window.close']);
    expect(state.pendingNavIntents.map((intent) => intent.command)).toEqual(['nav.go']);

    const deniedNavBack = state.timeline.find(
      (entry) => entry.scope === 'system' && entry.command === 'nav.back'
    );
    expect(deniedNavBack?.outcome).toBe('denied');
    expect(deniedNavBack?.reason).toContain('nav.back');
  });
});
