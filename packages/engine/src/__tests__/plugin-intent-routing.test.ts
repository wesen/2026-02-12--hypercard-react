import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { notificationsReducer } from '../features/notifications/notificationsSlice';
import { pluginCardRuntimeReducer, registerRuntimeSession } from '../features/pluginCardRuntime';
import { windowingReducer } from '../desktop/core/state/windowingSlice';
import { openWindow } from '../desktop/core/state';
import { dispatchRuntimeIntent } from '../components/shell/windowing/pluginIntentRouting';

function inventoryReducer(state = { events: [] as unknown[] }, action: { type: string; payload?: unknown }) {
  if (action.type === 'inventory/reserve-item') {
    return {
      ...state,
      events: [...state.events, action.payload],
    };
  }

  return state;
}

describe('dispatchRuntimeIntent', () => {
  it('routes domain and system intents to reducers while preserving nav behavior', () => {
    const sessionId = 'session-routing';
    const windowId = 'window:home:session-routing';

    const store = configureStore({
      reducer: {
        pluginCardRuntime: pluginCardRuntimeReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        inventory: inventoryReducer,
      },
    });

    store.dispatch(
      openWindow({
        id: windowId,
        title: 'Home',
        bounds: { x: 100, y: 30, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: {
            stackId: 'inventory',
            cardId: 'home',
            cardSessionId: sessionId,
          },
        },
      })
    );

    store.dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: 'inventory',
        status: 'ready',
        capabilities: {
          domain: ['inventory'],
          system: ['nav.go', 'nav.back', 'notify', 'window.close'],
        },
      })
    );

    dispatchRuntimeIntent(
      {
        scope: 'domain',
        domain: 'inventory',
        actionType: 'reserve-item',
        payload: { sku: 'A-1' },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      }
    );

    dispatchRuntimeIntent(
      {
        scope: 'system',
        command: 'nav.go',
        payload: { cardId: 'detail', param: 'A-1' },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      }
    );

    dispatchRuntimeIntent(
      {
        scope: 'system',
        command: 'nav.back',
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'detail',
        windowId,
      }
    );

    dispatchRuntimeIntent(
      {
        scope: 'system',
        command: 'notify',
        payload: { message: 'Reserved A-1' },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      }
    );

    let state = store.getState();

    expect(state.inventory.events).toEqual([{ sku: 'A-1' }]);
    expect(state.windowing.sessions[sessionId].nav).toEqual([{ card: 'home' }]);
    expect(state.notifications.toast).toBe('Reserved A-1');

    dispatchRuntimeIntent(
      {
        scope: 'system',
        command: 'window.close',
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      }
    );

    state = store.getState();

    expect(state.windowing.windows[windowId]).toBeUndefined();
    expect(state.windowing.sessions[sessionId]).toBeUndefined();
  });

  it('does not route denied system intents to downstream reducers', () => {
    const sessionId = 'session-denied';
    const windowId = 'window:home:session-denied';

    const store = configureStore({
      reducer: {
        pluginCardRuntime: pluginCardRuntimeReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        inventory: inventoryReducer,
      },
    });

    store.dispatch(
      openWindow({
        id: windowId,
        title: 'Home',
        bounds: { x: 100, y: 30, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: {
            stackId: 'inventory',
            cardId: 'home',
            cardSessionId: sessionId,
          },
        },
      })
    );

    store.dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: 'inventory',
        status: 'ready',
        capabilities: {
          system: ['nav.go'],
        },
      })
    );

    dispatchRuntimeIntent(
      {
        scope: 'system',
        command: 'window.close',
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      }
    );

    const state = store.getState();

    expect(state.windowing.windows[windowId]).toBeDefined();
    const deniedEntry = state.pluginCardRuntime.timeline.find(
      (entry) => entry.scope === 'system' && entry.command === 'window.close'
    );
    expect(deniedEntry?.outcome).toBe('denied');
  });

  it('emits canonical domain action type and runtime correlation metadata', () => {
    const sessionId = 'session-domain';
    const windowId = 'window:domain:session-domain';
    const observedActions: Array<{ type?: string; meta?: Record<string, unknown> }> = [];

    const store = configureStore({
      reducer: {
        pluginCardRuntime: pluginCardRuntimeReducer,
        windowing: windowingReducer,
        notifications: notificationsReducer,
        inventory: inventoryReducer,
      },
      middleware: (getDefault) =>
        getDefault().concat((_) => (next) => (action) => {
          if (typeof action === 'object' && action && 'type' in action) {
            observedActions.push(action as { type?: string; meta?: Record<string, unknown> });
          }
          return next(action);
        }),
    });

    store.dispatch(
      registerRuntimeSession({
        sessionId,
        stackId: 'domain-demo',
        status: 'ready',
        capabilities: {
          domain: ['domain-demo'],
        },
      }),
    );

    dispatchRuntimeIntent(
      {
        scope: 'domain',
        domain: 'domain-demo',
        actionType: 'command.request',
        payload: {
          op: 'create-session',
          requestId: 'req-routing',
          args: {},
        },
      },
      {
        dispatch: (action) => store.dispatch(action as never),
        getState: () => store.getState(),
        sessionId,
        cardId: 'home',
        windowId,
      },
    );

    const actions = store.getState().pluginCardRuntime.timeline;
    const applied = actions.find((entry) => entry.scope === 'domain' && entry.domain === 'domain-demo');
    expect(applied?.outcome).toBe('applied');

    const emitted = observedActions.find((action) => action.type === 'domain-demo/command.request');
    expect(emitted).toBeDefined();
    expect(emitted?.meta?.source).toBe('plugin-runtime');
    expect(emitted?.meta?.runtimeSessionId).toBe(sessionId);
    expect(emitted?.meta?.cardId).toBe('home');
  });
});
