---
Title: Debug Pane and Introspection System Implementation Guide
Ticket: HC-018-DSL-DEBUG-BOOKAPP
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - debugging
DocType: design
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Primary shell orchestration point where debug hooks should be injected.
    - Path: packages/engine/src/components/shell/CardRenderer.tsx
      Note: UI event emission point for node-level interaction instrumentation.
    - Path: packages/engine/src/cards/runtime.ts
      Note: Expression resolution and action execution path where runtime introspection events should be emitted.
    - Path: packages/engine/src/cards/runtimeStateSlice.ts
      Note: Scoped runtime state model that debug pane needs to inspect.
    - Path: packages/engine/src/features/navigation/navigationSlice.ts
      Note: Current layout/tab model to replace with collapsible debug pane behavior in the new app.
    - Path: packages/engine/src/components/shell/TabBar.tsx
      Note: Existing 3-tab UI slated for replacement in debug-enabled shell mode.
    - Path: ttmp/2026/02/13/HC-018-DSL-DEBUG-BOOKAPP--dsl-driven-book-tracking-app-with-debug-pane-and-introspection-hooks/scripts/01-debug-event-pipeline-simulation.mjs
      Note: Prototype simulation for event retention, redaction, and filtering behavior.
ExternalSources: []
Summary: Detailed analysis and implementation guide for a DSL-driven Book Tracking app with a collapsible debug pane and engine-level introspection hooks.
LastUpdated: 2026-02-13T16:05:00-05:00
WhatFor: Define how to build a production-grade debug pane and introspection event pipeline for DSL runtime debugging.
WhenToUse: Use when implementing or reviewing debug tooling and observability in the CardDefinition DSL engine and shell.
---

# Debug Pane and Introspection System Implementation Guide

## 1. Objective

We want a new DSL-driven Book Tracking application where the top-level shell no longer uses the current 3 layout tabs (`split`, `drawer`, `cardChat`). Instead, the shell should provide a dedicated collapsible debug pane that makes runtime behavior visible in real time.

The pane must expose enough introspection to answer day-to-day debugging questions quickly:

- What UI event fired?
- Which DSL action did it trigger?
- What selector was evaluated and with what args?
- What Redux actions were dispatched?
- What card/scope state changed?
- What is the current stack/card/context state right now?

This document is a concrete implementation plan for that system.

## 2. Current Runtime Baseline

The current runtime path is robust but mostly opaque at runtime.

### 2.1 Existing flow

```text
Widget interaction -> CardRenderer.emit(nodeKey,event,payload)
                 -> HyperCardShell binding lookup
                 -> executeCommand(...)
                 -> resolveValueExpr + selector resolution
                 -> executeActionDescriptor
                 -> nav/state/shared/local action effects
                 -> Redux store updates -> re-render
```

### 2.2 Existing shell UI behavior

Today, `HyperCardShell` renders a `TabBar` with three layout options and uses navigation layout state (`split`, `drawer`, `cardChat`) to choose between `LayoutSplit`, `LayoutDrawer`, and `LayoutCardChat`.

This model is AI-panel oriented, not debugging oriented.

### 2.3 Existing observability gaps

There is no first-class event stream for:

- selector evaluations
- expression resolution outputs
- command execution timing
- local scoped state mutations
- shared action invocations
- dispatch provenance (which DSL event produced which Redux action)

You can inspect final state with Redux tools, but there is no coherent DSL runtime timeline.

## 3. Target Debug Experience

## 3.1 UX requirements

The new Book Tracker debug shell should expose:

- Collapsible debug pane on the right side (or bottom on narrow viewport).
- Realtime event timeline.
- Event details panel (payload, source node, scope, duration).
- Snapshot inspector:
  - current card
  - params
  - merged scoped state
  - raw `hypercardRuntime`
  - selected domain slices (`books`, `navigation`, `notifications`)
- Controls:
  - pause/resume capture
  - clear timeline
  - max events retention
  - filter by kind/card/action/node
  - redact sensitive fields

## 3.2 Event taxonomy

Proposed normalized event kinds:

- `ui.emit`
- `runtime.command.resolve`
- `runtime.selector.resolve`
- `runtime.action.execute`
- `runtime.localAction`
- `runtime.sharedAction`
- `runtime.state.set`
- `runtime.state.patch`
- `runtime.state.reset`
- `redux.dispatch`
- `redux.state.delta` (optional, sampled)
- `shell.nav.change`
- `shell.card.change`

## 4. Proposed Engine Introspection API

We need an explicit, optional instrumentation interface in engine runtime.

## 4.1 Core types

```ts
export interface DebugEvent {
  id: number;
  ts: string;
  kind: string;
  stackId: string;
  cardId: string;
  cardType: string;
  nodeKey?: string;
  eventName?: string;
  actionType?: string;
  selectorName?: string;
  scope?: 'card' | 'cardType' | 'background' | 'stack' | 'global' | 'shared';
  durationMs?: number;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

export interface RuntimeDebugHooks {
  onEvent?: (event: DebugEvent) => void;
  shouldCapture?: (event: Omit<DebugEvent, 'id' | 'ts'>) => boolean;
  sanitize?: (payload: unknown, context: { kind: string }) => unknown;
}
```

## 4.2 Integration location

Add optional debug hook entrypoint to shell runtime wiring:

```ts
export interface HyperCardShellProps {
  ...
  debugHooks?: RuntimeDebugHooks;
}
```

This keeps introspection opt-in and non-breaking for existing consumers.

## 4.3 Emission points

Emit at these points in `packages/engine/src/cards/runtime.ts` and `packages/engine/src/components/shell/*`:

- Before and after selector resolution.
- Before and after action execution.
- Around built-in state mutation commands.
- At widget emit boundary (`CardRenderer.emit`).
- Around `dispatch` calls inside shell context wrapper.

## 4.4 Why callback hooks first

Two approaches are possible:

- A. Redux-only middleware-based instrumentation.
- B. Runtime callback hooks injected at source.

Recommendation: start with callback hooks (B), then optionally mirror into Redux middleware.

Reason:

- middleware sees only Redux actions, but DSL runtime semantics occur before dispatch.
- hooks can capture DSL concepts directly: node key, selector name, expression source, scope.

## 5. Debug Data Pipeline Design

## 5.1 Collection pipeline

```text
Runtime emit point -> DebugHookAdapter -> sanitizer -> ring buffer reducer -> DebugPane UI
```

## 5.2 Buffer and retention

Use fixed-size ring buffer with default 300 events.

- deterministic memory profile
- low overhead in long sessions
- stable UI rendering when virtualized

## 5.3 Redaction and truncation

Sanitize at ingress, not render time.

- redact keys matching: `password`, `token`, `secret`, `authorization`
- truncate long strings (for example 256 chars)
- collapse oversized arrays to summary placeholders

The prototype script in `scripts/01-debug-event-pipeline-simulation.mjs` validates this behavior.

## 5.4 Filtering model

Pane-level filter state should include:

- `kind[]`
- `cardId[]`
- `actionType[]`
- `selectorName[]`
- free-text search over compact JSON

Filtering should be pure UI projection over retained events.

## 6. Debug Pane UI Architecture

## 6.1 Shell layout replacement

In the new Book Tracker app shell profile:

- remove top `TabBar`
- always render single main content layout
- add `DebugPaneContainer` with collapse toggle

```text
+--------------------------------------------------------------+
| Title bar                                                    |
+------------------------------+-------------------------------+
| main app content             | debug pane (collapsed/open)   |
| (NavBar + CardRenderer)      | timeline + details + state    |
+------------------------------+-------------------------------+
| footer                                                       |
+--------------------------------------------------------------+
```

## 6.2 Component breakdown

Recommended components:

- `DebugPaneContainer`
- `DebugPaneToggle`
- `DebugEventTimeline`
- `DebugEventDetails`
- `DebugStateInspector`
- `DebugControls`

## 6.3 State model for UI

Add local reducer state in debug pane module:

- `collapsed: boolean`
- `paused: boolean`
- `selectedEventId: number | null`
- `filters`
- `maxEvents`

## 7. Engine + App Integration Plan

## 7.1 Phase 1: engine hook scaffolding

Files:

- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/shell/CardRenderer.tsx`

Steps:

1. Add `RuntimeDebugHooks` type in cards runtime exports.
2. Thread optional `debugHooks` through shell and runtime helpers.
3. Add minimal event emits at high-value points:
   - `ui.emit`
   - `runtime.command.resolve`
   - `runtime.action.execute`
   - `redux.dispatch`

## 7.2 Phase 2: debug event store and pane UI

Create app-facing debug module (recommended in app layer, not core engine):

- `apps/book-tracker-debug/src/debug/debugSlice.ts`
- `apps/book-tracker-debug/src/debug/DebugPane.tsx`
- `apps/book-tracker-debug/src/debug/useRuntimeDebugHooks.ts`

Why app layer first:

- avoids coupling engine to a specific debug UI design
- engine emits events, app decides storage and rendering

## 7.3 Phase 3: richer introspection

Add optional events and diagnostics:

- selector timing
- scoped state snapshots before/after built-in state commands
- command failure events (try/catch around handler execution)
- shared/local action duration

## 7.4 Phase 4: DSL-driven debug overlays (optional)

Later, if desired, expose debug information itself through DSL cards.

Example:

- `debugTimeline` card authored in DSL
- `debugState` report card from debug selectors

Keep this out of v1 to avoid overloading initial implementation.

## 8. Pseudocode: Hook Injection

## 8.1 Emitting from `CardRenderer`

```ts
function emit(node: UINode, eventName: string, payload: unknown) {
  runtime.debug?.onEvent?.({
    kind: 'ui.emit',
    stackId: runtime.ctx.stackId,
    cardId: runtime.ctx.cardId,
    cardType: runtime.ctx.cardType,
    nodeKey: node.key,
    eventName,
    payload,
  });
  runtime.emit(node.key, eventName, payload);
}
```

## 8.2 Emitting from `executeCommand`

```ts
const t0 = performance.now();
const resolvedArgs = resolveValueExpr(...);
debug?.onEvent?.({
  kind: 'runtime.command.resolve',
  actionType: input.command.type,
  payload: resolvedArgs,
  durationMs: performance.now() - t0,
});

const t1 = performance.now();
executeActionDescriptor(...);
debug?.onEvent?.({
  kind: 'runtime.action.execute',
  actionType: input.command.type,
  durationMs: performance.now() - t1,
});
```

## 8.3 Wrapping dispatch in context

```ts
dispatch: (a) => {
  debug?.onEvent?.({
    kind: 'redux.dispatch',
    actionType: (a as any)?.type,
    payload: (a as any)?.payload,
    stackId,
    cardId,
    cardType,
  });
  return dispatch(a as any);
}
```

## 9. DSL-Driven Book Tracking App Shape

## 9.1 App structure

Create new app workspace (suggested):

- `apps/book-tracker-debug/`
  - `src/domain/stack.ts` (CardDefinition stack)
  - `src/domain/bookSlice.ts`
  - `src/app/cardRuntime.ts` (shared selectors/actions)
  - `src/debug/*` (pane/event slice/components)
  - `src/App.tsx` (shell + pane composition)

## 9.2 Stack guidance

Reuse BookTracker card topology and add one debug-focused card:

- `home`
- `browse`
- `bookDetail`
- `addBook`
- `readingNow`
- `readingReport`
- optional: `debugSummary`

All core app behavior remains DSL-authored; debug pane is orthogonal shell instrumentation.

## 9.3 Example debug selector

```ts
const debugSelectors = {
  'debug.latestActions': (state) =>
    state.debug.events
      .filter((e) => e.kind === 'runtime.action.execute')
      .slice(-20),
};
```

## 10. Replacement of 3 Tabs

The user request is explicit: no layout tabs, use collapsible debug pane instead.

## 10.1 Minimum changes

In debug app shell variant:

- do not render `TabBar`
- do not use `navigation.layout` as UI mode switch
- render one fixed content layout + `DebugPaneContainer`

## 10.2 Compatibility strategy

Do not remove existing tab behavior globally yet.

Implement one of:

- `HyperCardShell` prop: `layoutMode?: 'legacyTabs' | 'debugPane'`
- or wrapper component `HyperCardShellWithDebugPane` in app layer.

Recommendation: wrapper first. It keeps engine baseline stable while proving UX.

## 11. Observability Schema Reference

Recommended event schema fields and semantics:

- `id`: monotonic sequence
- `ts`: ISO timestamp
- `kind`: event category
- `stackId/cardId/cardType`: runtime context
- `nodeKey/eventName`: UI-origin metadata
- `actionType/selectorName`: execution metadata
- `durationMs`: measured duration for expensive steps
- `payload`: sanitized payload
- `meta`: free-form diagnostics

## 12. Performance, Safety, and Privacy

## 12.1 Performance guardrails

- capture disabled by default in production build
- ring buffer cap
- avoid deep clone of full store per event
- optional sampling for high-frequency events

## 12.2 Safety

- redaction at ingress
- pane hidden by default for non-debug profile
- never persist raw debug stream unless explicitly enabled

## 12.3 Failure isolation

Debug pipeline must not break app runtime.

- wrap `onEvent` callback in try/catch
- if debug pipeline fails, runtime continues without debug output

## 13. Implementation Checklist

## 13.1 Engine tasks

- [ ] Add hook interface types and exports.
- [ ] Thread `debugHooks` through shell/runtime.
- [ ] Emit v1 event set at source points.
- [ ] Add unit tests for emission behavior and no-op when hooks absent.

## 13.2 App tasks

- [ ] Scaffold new DSL-driven Book Tracker app workspace.
- [ ] Add debug event reducer and controls.
- [ ] Build collapsible debug pane components.
- [ ] Integrate debug hooks adapter with shell.
- [ ] Replace legacy 3-tab surface in this app profile.

## 13.3 Validation tasks

- [ ] Interaction flow emits expected timeline entries.
- [ ] Redaction works for sensitive keys.
- [ ] Pause/resume and clear are deterministic.
- [ ] Event retention cap holds under burst load.
- [ ] No measurable regressions in normal interaction latency.

## 14. Test Plan

## 14.1 Unit tests

- runtime hook call coverage around:
  - `resolveValueExpr`
  - `executeCommand`
  - `executeActionDescriptor`
- reducer tests for ring buffer and filters
- sanitizer/redaction tests

## 14.2 Integration tests

- mount shell with debug hooks and simulate row click -> detail -> save/delete
- assert event sequence includes expected action kinds/order

## 14.3 Manual smoke script

1. Open app at home card.
2. Collapse/expand debug pane.
3. Navigate to browse card.
4. Click row to open detail.
5. Edit and save.
6. Delete one book.
7. Verify event stream shows UI emit, command resolve, action execute, redux dispatch.
8. Verify state inspector reflects updated counts.

## 15. Risks and Mitigations

## 15.1 Risk: instrumentation overhead

Mitigation:

- keep payload shallow and sanitized
- allow event kind filtering at source
- avoid expensive derived computations in hot path

## 15.2 Risk: unstable event contracts

Mitigation:

- publish `DebugEvent` schema and keep versioned field compatibility
- add fixture-based tests for event shape

## 15.3 Risk: debugging UI bleeds into production UX

Mitigation:

- gate debug pane by app profile/build flag
- keep engine hooks inert when disabled

## 16. Prototype Evidence

The script

- `scripts/01-debug-event-pipeline-simulation.mjs`

and output

- `scripts/01-debug-event-pipeline-simulation.out.txt`

demonstrate that the proposed pipeline behavior is practical:

- bounded retention (ring buffer)
- deterministic filtering
- key-based redaction
- long-string truncation

## 17. Reference Section

## 17.1 Files and responsibilities

- `packages/engine/src/components/shell/HyperCardShell.tsx`
  - Orchestrates card runtime, context wiring, command execution.
- `packages/engine/src/components/shell/CardRenderer.tsx`
  - Converts DSL nodes into widgets and emits interaction events.
- `packages/engine/src/cards/runtime.ts`
  - Selector resolution, value expression evaluation, action execution.
- `packages/engine/src/cards/runtimeStateSlice.ts`
  - Scoped runtime state and reducers.
- `packages/engine/src/features/navigation/navigationSlice.ts`
  - Existing 3-layout tab model (to be bypassed in debug-pane app profile).
- `packages/engine/src/components/shell/TabBar.tsx`
  - Existing tabs UI targeted for replacement in this app.

## 17.2 Suggested new symbols

- `RuntimeDebugHooks`
- `DebugEvent`
- `createRuntimeDebugAdapter(...)`
- `DebugPaneContainer`
- `debugEventReducer`
- `selectDebugEvents(...)`

## 18. Final Recommendation

Implement the debug pane as a first-class app shell feature backed by explicit engine runtime hooks. Keep hooks optional and lightweight, keep the pane app-scoped, and preserve existing non-debug shell behavior until the new workflow is proven.

This gives you immediate debugging leverage for DSL behavior without destabilizing the core runtime.
