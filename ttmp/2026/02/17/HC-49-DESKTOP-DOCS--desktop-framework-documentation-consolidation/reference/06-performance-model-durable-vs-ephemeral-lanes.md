---
Title: 'Performance Model: Durable vs Ephemeral Lanes'
Ticket: HC-49-DESKTOP-DOCS
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - design-system
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/dragOverlayStore.ts
      Note: Ephemeral interaction store — the primary example of the pattern
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Bridge between ephemeral overlays and durable Redux commits
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: High-frequency pointer update and commit/cancel lifecycle
    - Path: packages/engine/src/diagnostics/diagnosticsStore.ts
      Note: External diagnostics ring-buffer model (another ephemeral pattern)
    - Path: packages/engine/src/diagnostics/reduxPerfMiddleware.ts
      Note: Non-dispatching middleware measurement model
ExternalSources: []
Summary: Guide to the dual-lane state architecture — when to use Redux vs external stores for high-frequency data, and how to verify your decisions with built-in diagnostics.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Document current performance architecture and safe extension patterns for high-frequency interactions.
WhenToUse: Use when adding features that may generate high dispatch volume (chat streaming, drag-and-drop, animations, real-time events).
---

# Performance Model: Durable vs Ephemeral Lanes

## The Problem

Imagine you dispatch a Redux action on every pointer-move event during a window drag. That's roughly **60 actions per second per active interaction**. Each action triggers the full Redux cycle: reducer → every selector re-evaluates → every connected component checks for re-renders. For a desktop with 10 open windows, that's hundreds of unnecessary re-render checks per second — for data that's discarded the moment the user lifts their finger.

The desktop framework solves this by splitting state into two lanes:

```
❌  Naive approach:
    pointermove → dispatch(moveWindow) → Redux update → all selectors re-evaluate → re-render everything

✅  Dual-lane approach:
    pointermove → dragOverlayStore.update() → only the dragged window re-renders
    pointerup   → dispatch(moveWindow)      → Redux commits final position once
```

## The Two Lanes

### Durable Lane (Redux)

Redux is for state that matters long-term — state that you'd want preserved across time-travel debugging, that other features query with selectors, or that defines the business correctness of your app.

In the desktop framework, the **durable lane** holds:

- **Window state** — which windows are open, their final positions, sizes, z-order, focus
- **Session navigation** — which card each window is showing, navigation stack history
- **Desktop UI** — active menu, selected icon
- **Domain state** — your app's business data (inventory items, contacts, etc.)
- **Notifications** — toast messages

All of this lives in the `windowingReducer` and your domain reducers inside the Redux store.

### Ephemeral Lane (External Stores)

External stores are for high-frequency transient data — data that changes many times per second, is only needed for immediate visual feedback, and can be thrown away without any correctness impact.

In the desktop framework, the **ephemeral lane** holds:

- **Drag overlay positions** — window positions during an active drag (via `dragOverlayStore`)
- **Resize overlay dimensions** — window sizes during an active resize
- **Diagnostics data** — Redux perf timing, frame duration ring buffers

These use `useSyncExternalStore` for React integration — a React 18 API that subscribes to external stores without going through Redux.

## The Window Drag Lifecycle

Here's the full sequence when a user drags a window, showing exactly how the two lanes interact:

```
  pointerdown on window title bar
        │
        ▼
  useWindowInteractionController
  ├── registers global pointermove + pointerup listeners
  ├── calls dragOverlayStore.begin(windowId, 'move', initialBounds)
  └── dispatches focusWindow(windowId) → Redux (one-time, durable)

        │
        │  ╔══════════════════════════════════════════════════╗
        │  ║  EPHEMERAL LANE — runs every pointermove (~60fps) ║
        │  ╠══════════════════════════════════════════════════╣
        │  ║                                                  ║
        ├──║─▶ dragOverlayStore.update(windowId, newBounds)   ║
        │  ║     │                                            ║
        │  ║     ▼                                            ║
        │  ║   useSyncExternalStore triggers                  ║
        │  ║     │                                            ║
        │  ║     ▼                                            ║
        │  ║   Only the dragged window re-renders             ║
        │  ║   with draft position                            ║
        │  ╚══════════════════════════════════════════════════╝
        │
  pointerup
        │
        ▼
  ╔══════════════════════════════════════════════╗
  ║  DURABLE LANE — runs once on commit          ║
  ╠══════════════════════════════════════════════╣
  ║                                              ║
  ║  dispatch(moveWindow({ id, x, y }))   → Redux║
  ║  dragOverlayStore.clear(windowId)            ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
```

The result: during the drag, only one window re-renders per frame. On commit, Redux gets a single update with the final position. No wasted work.

## The Decision Flowchart

When you're adding new state to the system, use this checklist:

```
  Is this state needed after page refresh or time-travel replay?
  │
  ├── YES ──▶ Redux (durable lane)
  │
  └── NO
      │
      Is this state updated more than ~10 times per second?
      │
      ├── YES ──▶ External store (ephemeral lane)
      │
      └── NO
          │
          Is this state part of business logic correctness?
          │
          ├── YES ──▶ Redux (durable lane)
          │
          └── NO
              │
              Is this state needed by multiple features/selectors?
              │
              ├── YES ──▶ Redux (durable lane)
              │
              └── NO ──▶ External store OR local component state
```

### Concrete Examples

| State | Lane | Why |
|-------|------|-----|
| Window final position | Redux | Persisted, queried by selectors, needed for tile/cascade |
| Window position during drag | External store | Updated 60fps, only for visual feedback, discarded on commit |
| Chat message history | Redux | Business data, queryable, persistent |
| Streaming chat token buffer | External store (or local state) | Updated per-token (~20–60/sec), only for immediate display |
| Active menu ID | Redux | Needed for keyboard navigation, accessibility |
| Diagnostics timing data | External store | High-frequency measurement, would cause observer effect in Redux |
| Form input value | Local state or Redux | Depends on whether other components need it |

## Writing Your Own Ephemeral Store

The `useSyncExternalStore` pattern is straightforward but has specific requirements. Here's a minimal template:

```ts
// 1. Define your store
interface MySnapshot {
  value: number;
}

function createMyStore() {
  let snapshot: MySnapshot = { value: 0 };
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const fn of listeners) fn();
  };

  return {
    update(newValue: number) {
      if (snapshot.value === newValue) return;  // skip no-ops
      snapshot = { value: newValue };           // new reference = new snapshot
      notify();
    },

    reset() {
      snapshot = { value: 0 };
      notify();
    },

    // Required by useSyncExternalStore
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

// 2. Create a singleton instance
export const myStore = createMyStore();

// 3. Hook for React components
import { useSyncExternalStore } from 'react';

export function useMyStoreSnapshot() {
  return useSyncExternalStore(
    myStore.subscribe,
    myStore.getSnapshot,
    myStore.getSnapshot,  // SSR fallback (same for client-only apps)
  );
}

// 4. Update from event handlers (NOT from React render phase)
element.addEventListener('pointermove', (e) => {
  myStore.update(e.clientX);
});
```

**Key rules:**

- **Always create a new snapshot object** when data changes. `useSyncExternalStore` uses reference equality (`===`) to detect changes. Mutating the existing object won't trigger a re-render.
- **Skip no-ops.** If the value hasn't changed, don't create a new snapshot — this prevents unnecessary re-renders.
- **Update from event handlers**, not from React's render phase. The store is for bridging imperative events (pointer, keyboard, WebSocket) into React's declarative world.

## Diagnostics: Verifying Your Decisions

The framework includes built-in diagnostics to help you spot Redux pressure problems:

### Enabling Diagnostics

```ts
// In your store setup
const { store } = createAppStore(
  { inventory: inventoryReducer },
  {
    enableReduxDiagnostics: import.meta.env.DEV,
    diagnosticsWindowMs: 5000,  // aggregate over 5-second windows
  },
);
```

### What Gets Measured

When diagnostics are enabled, the system tracks (without dispatching any Redux actions — to avoid observer effect):

- **Redux dispatch timing** — how long each action + reducer cycle takes
- **Frame duration** — how long each animation frame takes (via `requestAnimationFrame`)
- **Ring buffers** — recent events are kept in fixed-size circular buffers, not unbounded arrays

### Reading Diagnostics

```ts
import { useDiagnosticsSnapshot } from '@hypercard/engine';

function PerfPanel() {
  const diag = useDiagnosticsSnapshot();
  // diag.redux: { actionCount, totalMs, avgMs, maxMs, slowActions }
  // diag.frames: { frameCount, avgMs, maxMs, droppedFrames }
}
```

### What to Watch For

- **High action count** during interactions — if you see 60+ actions/sec during a drag, something is dispatching to Redux when it should use an external store.
- **Growing avgMs** — if reducer time is climbing, a selector or reducer may be doing too much work per dispatch.
- **Dropped frames** — if `droppedFrames` is non-zero during normal interaction, rendering is too expensive.

The inventory app includes a `ReduxPerfWindow` (available in dev mode via the Debug menu) that displays these metrics in real time.

## The Diagnostics Store Itself Is Ephemeral

This is worth calling out: the diagnostics system follows its own advice. Redux perf middleware (`createReduxPerfMiddleware`) writes timing events to a module-level ring buffer — not to Redux. The frame monitor (`startFrameMonitor`) does the same. `useDiagnosticsSnapshot` polls these ring buffers using `useSyncExternalStore`.

No diagnostics actions are ever dispatched into Redux. If they were, the act of measuring would change what you're measuring (the observer effect).

## Related Docs

| Topic | Link |
|-------|------|
| Getting started with the shell | [Quickstart](./02-desktop-framework-quickstart.md) |
| Overall architecture and data flow | [Architecture Overview](./07-desktop-framework-architecture-overview.md) |
| How the controller bridges both lanes | [Contribution API Reference](./03-desktop-contribution-api-reference.md) |
