import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it, vi } from 'vitest';
import { createCardContext, createSelectorResolver, executeCommand } from '../cards/runtime';
import { ensureCardRuntime, hypercardRuntimeReducer } from '../cards/runtimeStateSlice';
import type {
  ActionDescriptor,
  CardStackDefinition,
  SharedActionRegistry,
  SharedSelectorRegistry,
} from '../cards/types';
import { navigate, navigationReducer } from '../features/navigation/navigationSlice';
import { notificationsReducer } from '../features/notifications/notificationsSlice';

/**
 * Integration test: simulates a realistic card action execution
 * with selectors, params, event payloads, and shared actions.
 */
describe('integration: card command execution', () => {
  // Define a mini inventory stack
  const stack: CardStackDefinition<any> = {
    id: 'inv',
    name: 'Inventory',
    icon: '📦',
    homeCard: 'browse',
    cards: {
      browse: {
        id: 'browse',
        type: 'list',
        ui: { t: 'text', text: 'Browse' },
        selectors: {
          itemCount: (state: any) => state.items?.length ?? 0,
        },
        bindings: {
          list: {
            select: {
              $: 'act',
              type: 'nav.go',
              args: { card: 'detail', param: { $: 'event', name: 'id' } },
            },
          },
        },
      },
      detail: {
        id: 'detail',
        type: 'detail',
        ui: { t: 'text', text: 'Detail' },
        actions: {
          'item.update': (ctx, args: any) => {
            ctx.patchScopedState('card', { lastUpdate: args.name });
          },
        },
      },
    },
  };

  const sharedSelectors: SharedSelectorRegistry<any> = {
    totalValue: (state: any) => (state.items ?? []).reduce((s: number, i: any) => s + i.value, 0),
  };

  const sharedActions: SharedActionRegistry<any> = {
    'log.activity': vi.fn(),
  };

  function createTestStore() {
    return configureStore({
      reducer: {
        hypercardRuntime: hypercardRuntimeReducer,
        navigation: navigationReducer,
        notifications: notificationsReducer,
        items: (
          state = [
            { id: 'a', name: 'Widget', value: 100 },
            { id: 'b', name: 'Gadget', value: 50 },
          ],
        ) => state,
      },
    });
  }

  it('executes a builtin nav.go command with event-resolved args', () => {
    const store = createTestStore();
    store.dispatch(
      ensureCardRuntime({
        stackId: 'inv',
        cardId: 'browse',
        cardType: 'list',
        defaults: {},
      }),
    );

    const state = store.getState();
    const ctx = createCardContext(
      { hypercardRuntime: state.hypercardRuntime },
      {
        stackId: 'inv',
        cardId: 'browse',
        cardType: 'list',
        mode: 'interactive',
        params: {},
        getState: () => store.getState(),
        dispatch: (a: any) => store.dispatch(a),
        nav: {
          go: (card, param) => store.dispatch(navigate({ card, paramValue: param })),
          back: vi.fn(),
        },
      },
    );

    const cardDef = stack.cards.browse;
    const lookup = { cardDef, stackDef: stack };

    // Simulate clicking a row — event payload has { id: 'a' }
    executeCommand(
      {
        command: cardDef.bindings!.list.select,
        event: { name: 'select', payload: { id: 'a' } },
      },
      store.getState(),
      ctx,
      lookup,
      sharedSelectors,
      sharedActions,
      { showToast: vi.fn() },
    );

    const nav = store.getState().navigation;
    expect(nav.stack).toHaveLength(2);
    expect(nav.stack[1]).toEqual({ card: 'detail', param: 'a' });
  });

  it('resolves shared selector via createSelectorResolver', () => {
    const store = createTestStore();
    store.dispatch(
      ensureCardRuntime({
        stackId: 'inv',
        cardId: 'browse',
        cardType: 'list',
        defaults: {},
      }),
    );

    const state = store.getState();
    const ctx = createCardContext(
      { hypercardRuntime: state.hypercardRuntime },
      {
        stackId: 'inv',
        cardId: 'browse',
        cardType: 'list',
        mode: 'interactive',
        params: {},
        getState: () => store.getState(),
        dispatch: (a: any) => store.dispatch(a),
        nav: { go: vi.fn(), back: vi.fn() },
      },
    );

    const resolve = createSelectorResolver(
      store.getState(),
      ctx,
      { cardDef: stack.cards.browse, stackDef: stack },
      sharedSelectors,
    );

    // Card-level selector
    expect(resolve('itemCount', undefined, undefined)).toBe(2);
    // Shared selector
    expect(resolve('totalValue', undefined, undefined)).toBe(150);
  });

  it('executes local card action handler', () => {
    const store = createTestStore();
    store.dispatch(
      ensureCardRuntime({
        stackId: 'inv',
        cardId: 'detail',
        cardType: 'detail',
        defaults: {},
      }),
    );

    const state = store.getState();
    const ctx = createCardContext(
      { hypercardRuntime: state.hypercardRuntime },
      {
        stackId: 'inv',
        cardId: 'detail',
        cardType: 'detail',
        mode: 'interactive',
        params: { param: 'a' },
        getState: () => store.getState(),
        dispatch: (a: any) => store.dispatch(a),
        nav: { go: vi.fn(), back: vi.fn() },
      },
    );

    const cardDef = stack.cards.detail;
    const lookup = { cardDef, stackDef: stack };

    executeCommand(
      {
        command: { $: 'act', type: 'item.update', args: { name: 'Updated Widget' } },
      },
      store.getState(),
      ctx,
      lookup,
      sharedSelectors,
      sharedActions,
      { showToast: vi.fn() },
    );

    // The action handler calls ctx.patchScopedState which dispatches to store.
    // Verify the scoped state was updated in the runtime.
    const updatedRuntime = store.getState().hypercardRuntime;
    const cardState = updatedRuntime.stacks['inv']?.cards['detail']?.state ?? {};
    expect(cardState).toHaveProperty('lastUpdate', 'Updated Widget');
  });

  it('executes shared action handler', () => {
    const store = createTestStore();
    store.dispatch(
      ensureCardRuntime({
        stackId: 'inv',
        cardId: 'browse',
        cardType: 'list',
        defaults: {},
      }),
    );

    const state = store.getState();
    const ctx = createCardContext(
      { hypercardRuntime: state.hypercardRuntime },
      {
        stackId: 'inv',
        cardId: 'browse',
        cardType: 'list',
        mode: 'interactive',
        params: {},
        getState: () => store.getState(),
        dispatch: (a: any) => store.dispatch(a),
        nav: { go: vi.fn(), back: vi.fn() },
      },
    );

    executeCommand(
      {
        command: { $: 'act', type: 'log.activity', args: { note: 'test' } },
      },
      store.getState(),
      ctx,
      { cardDef: stack.cards.browse, stackDef: stack },
      sharedSelectors,
      sharedActions,
      { showToast: vi.fn() },
    );

    expect(sharedActions['log.activity']).toHaveBeenCalled();
  });
});
