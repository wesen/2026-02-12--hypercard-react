#!/usr/bin/env node

/**
 * Simulates a DSL runtime debug event bus with:
 * - normalized event shape
 * - ring buffer retention
 * - payload redaction
 * - simple filtering
 */

const MAX_EVENTS = 6;

class DebugEventBus {
  constructor(maxEvents = MAX_EVENTS) {
    this.maxEvents = maxEvents;
    this.seq = 0;
    this.events = [];
  }

  emit(partial) {
    const event = {
      id: ++this.seq,
      ts: new Date().toISOString(),
      kind: partial.kind,
      stackId: partial.stackId,
      cardId: partial.cardId,
      cardType: partial.cardType,
      nodeKey: partial.nodeKey,
      actionType: partial.actionType,
      selector: partial.selector,
      durationMs: partial.durationMs,
      payload: redact(partial.payload),
      meta: partial.meta ?? {},
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(this.events.length - this.maxEvents);
    }

    return event;
  }

  list(filters = {}) {
    return this.events.filter((e) => {
      if (filters.kind && e.kind !== filters.kind) return false;
      if (filters.cardId && e.cardId !== filters.cardId) return false;
      if (filters.actionType && e.actionType !== filters.actionType) return false;
      return true;
    });
  }
}

function redact(value) {
  if (value == null) return value;
  if (typeof value === 'string') {
    if (value.length > 64) return `${value.slice(0, 61)}...`;
    return value;
  }
  if (Array.isArray(value)) {
    if (value.length > 8) return `[array len=${value.length}]`;
    return value.map(redact);
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (/password|token|secret/i.test(k)) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

function assertEq(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`FAIL: ${label}`);
    console.error('  expected:', expected);
    console.error('  actual  :', actual);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${label}`);
  }
}

const bus = new DebugEventBus(6);

const common = {
  stackId: 'bookTracker',
  cardId: 'browse',
  cardType: 'list',
};

bus.emit({
  ...common,
  kind: 'ui.emit',
  nodeKey: 'browseList',
  payload: { event: 'rowClick', row: { id: 'b2', title: '1984' } },
});

bus.emit({
  ...common,
  kind: 'runtime.command.resolve',
  actionType: 'nav.go',
  payload: { card: 'bookDetail', param: 'b2' },
  durationMs: 0.5,
});

bus.emit({
  ...common,
  kind: 'runtime.action.execute',
  actionType: 'nav.go',
  payload: { card: 'bookDetail', param: 'b2' },
  durationMs: 0.1,
});

bus.emit({
  stackId: 'bookTracker',
  cardId: 'bookDetail',
  cardType: 'detail',
  kind: 'redux.dispatch',
  actionType: 'navigation/navigate',
  payload: { card: 'bookDetail', paramValue: 'b2' },
});

bus.emit({
  stackId: 'bookTracker',
  cardId: 'bookDetail',
  cardType: 'detail',
  kind: 'runtime.state.patch',
  actionType: 'state.setField',
  payload: {
    scope: 'card',
    path: 'edits.rating',
    value: 5,
    token: 'secret-token-value',
  },
});

bus.emit({
  stackId: 'bookTracker',
  cardId: 'bookDetail',
  cardType: 'detail',
  kind: 'runtime.sharedAction',
  actionType: 'books.save',
  durationMs: 1.8,
  payload: {
    id: 'b2',
    edits: { rating: 5 },
    password: 'super-secret',
  },
});

bus.emit({
  stackId: 'bookTracker',
  cardId: 'bookDetail',
  cardType: 'detail',
  kind: 'redux.dispatch',
  actionType: 'books/saveBook',
  payload: {
    id: 'b2',
    edits: { rating: 5 },
    notes: 'x'.repeat(120),
  },
});

assertEq(bus.events.length, 6, 'ring buffer keeps max 6 latest events');
assertEq(bus.events[0].kind, 'runtime.command.resolve', 'oldest event was evicted');
assertEq(bus.events[3].payload.token, '[REDACTED]', 'token fields are redacted');
assertEq(bus.events[4].payload.password, '[REDACTED]', 'password fields are redacted');
assertEq(
  bus.events[5].payload.notes,
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...',
  'long strings are truncated'
);

const dispatchEvents = bus.list({ kind: 'redux.dispatch' });
assertEq(dispatchEvents.length, 2, 'kind filter returns expected count');

const navEvents = bus.list({ actionType: 'nav.go' });
assertEq(navEvents.length, 2, 'actionType filter returns expected count');

if (process.exitCode !== 1) {
  console.log('\nDebug event pipeline simulation passed.');
  console.log(`Retained events: ${bus.events.length}`);
}
