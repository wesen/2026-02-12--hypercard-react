#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  createCardContext,
  createSelectorResolver,
  executeCommand,
} from '../../../../../../packages/engine/src/cards/runtime.ts';
import {
  debugReducer,
  ingestEvent,
  selectFilteredDebugEvents,
  setKindFilter,
  setTextFilter,
} from '../../../../../../apps/book-tracker-debug/src/debug/debugSlice.ts';
import { sanitizeDebugValue } from '../../../../../../apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts';

function makeDebugEvent(id, overrides = {}) {
  return {
    id,
    ts: new Date(2026, 1, 13, 12, 0, id).toISOString(),
    kind: 'selector.resolve',
    stackId: 'stack1',
    cardId: 'card1',
    cardType: 'book',
    ...overrides,
  };
}

function testRuntimeHookEmission() {
  const emitted = [];
  const dispatched = [];

  const runtimeRoot = {
    hypercardRuntime: {
      global: {},
      stacks: {
        stack1: {
          state: {},
          backgrounds: {},
          cardTypes: {
            book: { state: {} },
          },
          cards: {
            card1: {
              type: 'book',
              state: { count: 1 },
            },
          },
        },
      },
    },
  };

  const ctx = createCardContext(runtimeRoot, {
    stackId: 'stack1',
    cardId: 'card1',
    cardType: 'book',
    mode: 'interactive',
    params: {},
    getState: () => ({}),
    dispatch: (action) => {
      dispatched.push(action);
      return action;
    },
    nav: {
      go: () => undefined,
      back: () => undefined,
    },
  });

  const cardDef = {
    id: 'card1',
    type: 'book',
    ui: { t: 'screen' },
    selectors: {
      cardCount: (_state, _args, context) => context.getScopedState('card').count,
    },
  };

  const stackDef = {
    id: 'stack1',
    name: 'Debug Stack',
    icon: 'D',
    homeCard: 'card1',
    cards: {
      card1: cardDef,
    },
  };

  const hooks = {
    onEvent: (event) => emitted.push(event),
    shouldCapture: () => true,
    sanitize: (payload) => payload,
  };

  const selectorResolver = createSelectorResolver({}, ctx, { cardDef, stackDef }, {}, hooks);
  const selectorValue = selectorResolver('cardCount', 'card', undefined);

  assert.equal(selectorValue, 1, 'selector should resolve scoped card state');
  assert.ok(
    emitted.some((event) => event.kind === 'selector.resolve' && event.selectorName === 'cardCount' && event.scope === 'card'),
    'selector.resolve event should be emitted with scope',
  );

  executeCommand(
    {
      command: {
        $: 'act',
        type: 'state.set',
        args: { scope: 'card', path: 'draft.title', value: 'New Title' },
      },
    },
    {},
    ctx,
    { cardDef, stackDef },
    {},
    {},
    { showToast: () => undefined },
    hooks,
  );

  assert.ok(
    emitted.some((event) => event.kind === 'action.execute.start' && event.actionType === 'state.set'),
    'action.execute.start should be emitted for state.set',
  );
  assert.ok(
    emitted.some((event) => event.kind === 'state.mutation' && event.actionType === 'state.set'),
    'state.mutation should be emitted for state.set',
  );
  assert.ok(
    emitted.some((event) => event.kind === 'action.execute' && event.actionType === 'state.set'),
    'action.execute should be emitted after state.set',
  );
  assert.ok(dispatched.length > 0, 'state.set should dispatch scoped-state reducer action');

  console.log('PASS runtime-hook-emission');
}

function testRingBufferRetentionAndFiltering() {
  let state = {
    ...debugReducer(undefined, { type: '@@INIT' }),
    capacity: 3,
  };

  state = debugReducer(state, ingestEvent(makeDebugEvent(1, { kind: 'selector.resolve', selectorName: 'books.all' })));
  state = debugReducer(state, ingestEvent(makeDebugEvent(2, { kind: 'action.execute', actionType: 'books.save' })));
  state = debugReducer(state, ingestEvent(makeDebugEvent(3, { kind: 'selector.resolve', selectorName: 'books.byParam' })));
  state = debugReducer(state, ingestEvent(makeDebugEvent(4, { kind: 'action.execute', actionType: 'books.delete' })));
  state = debugReducer(state, ingestEvent(makeDebugEvent(5, { kind: 'redux.dispatch', payload: { action: { type: 'books/save' } } })));

  assert.equal(state.events.length, 3, 'ring buffer should retain only latest N events');
  assert.deepEqual(state.events.map((event) => event.id), [3, 4, 5], 'oldest events should be discarded first');

  state = debugReducer(state, setKindFilter('action.execute'));
  let filtered = selectFilteredDebugEvents({ debug: state });
  assert.deepEqual(filtered.map((event) => event.id), [4], 'kind filter should keep only matching kind');

  state = debugReducer(state, setKindFilter('all'));
  state = debugReducer(state, setTextFilter('books.delete'));
  filtered = selectFilteredDebugEvents({ debug: state });
  assert.deepEqual(filtered.map((event) => event.id), [4], 'text filter should match payload/action strings');

  console.log('PASS ring-buffer-retention-and-filtering');
}

function testRedactionAndTruncation() {
  const longText = 'x'.repeat(280);
  const longArray = Array.from({ length: 55 }, (_, i) => i + 1);
  const sanitized = sanitizeDebugValue({
    token: 'abc123',
    nested: {
      password: 'secret',
      authorization: 'Bearer value',
      notes: longText,
      list: longArray,
    },
  });

  assert.equal(sanitized.token, '<redacted>', 'token should be redacted');
  assert.equal(sanitized.nested.password, '<redacted>', 'password should be redacted');
  assert.equal(sanitized.nested.authorization, '<redacted>', 'authorization should be redacted');
  assert.ok(
    String(sanitized.nested.notes).includes('<truncated:'),
    'long strings should be truncated with marker',
  );
  assert.equal(sanitized.nested.list.length, 51, 'long arrays should keep head + truncation marker');
  assert.equal(
    sanitized.nested.list[sanitized.nested.list.length - 1],
    '<truncated:5 items>',
    'truncation marker should reflect discarded array count',
  );

  console.log('PASS redaction-and-truncation');
}

function main() {
  testRuntimeHookEmission();
  testRingBufferRetentionAndFiltering();
  testRedactionAndTruncation();
  console.log('All HC-018 Task 4 checks passed.');
}

main();
