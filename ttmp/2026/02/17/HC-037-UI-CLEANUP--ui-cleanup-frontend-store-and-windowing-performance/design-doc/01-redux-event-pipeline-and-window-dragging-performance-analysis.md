---
Title: Redux Event Pipeline and Window Dragging Performance Analysis
Ticket: HC-037-UI-CLEANUP
Status: active
Topics:
    - frontend
    - redux
    - performance
    - ux
    - debugging
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/EventViewerWindow.tsx
      Note: |-
        Debug event window implementation and retention behavior
        Event debug window retention/render behavior
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: |-
        WebSocket envelope ingestion, event fan-out, and Redux dispatch path
        Primary SEM envelope dispatch/orchestration path analyzed
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: |-
        Conversation state, timeline/panel upsert reducers, and streaming message reducers
        Reducer hot paths for timeline/message upserts
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/eventBus.ts
      Note: |-
        Raw event bus used by the event viewer window
        Raw event debug bus behavior and constraints
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/timelineProjection.ts
      Note: |-
        Timeline entity -> UI timeline item projection logic
        Timeline projection semantics used in option analysis
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: |-
        Drag/resize dispatch wiring and window rendering topology
        Window dispatch wiring and render topology
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: |-
        Pointermove-driven drag/resize interaction controller
        Pointermove-to-dispatch drag path
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: |-
        Message rendering path that re-renders during stream updates
        Streaming message render fan-out path
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/selectors.ts
      Note: |-
        Window list selectors and sort path invoked on each move
        Window selector sorting behavior under drag
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts
      Note: |-
        Window move/resize reducers and window lifecycle state
        Window move/resize reducer behavior
ExternalSources: []
Summary: |
    Deep analysis of frontend performance pressure in two high-frequency paths: LLM/SEM event ingestion and desktop window dragging. Proposes multiple architecture options that preserve existing behavior (including events debugging) while reducing Redux dispatch volume, reducer churn, and render fan-out.
LastUpdated: 2026-02-17T08:31:00-05:00
WhatFor: |
    Guide implementation decisions for UI cleanup work focused on event-stream throughput and window interaction responsiveness without losing observability.
WhenToUse: Use before changing chat event ingestion, timeline projection, event debugging, or window interaction/dragging behavior.
---


# Redux Event Pipeline and Window Dragging Performance Analysis

## Executive Summary

The current frontend already avoids one major anti-pattern: raw incoming SEM events are not appended into a Redux "events" list. The events debugging window is fed by an in-memory conversation bus (`apps/inventory/src/features/chat/eventBus.ts:73`) and keeps its own local retained entries (`apps/inventory/src/features/chat/EventViewerWindow.tsx:35`).

The main performance issue is different: high-frequency envelopes still trigger many Redux actions and broad re-render fan-out. In the chat path, one envelope may dispatch 1-3 Redux actions, each reducer call walks and mutates nested message structures, and `ChatWindow` re-renders the full message timeline on every stream update (`packages/engine/src/components/widgets/ChatWindow.tsx:266`). In windowing, pointermove dispatches `moveWindow` or `resizeWindow` on every event (`packages/engine/src/components/shell/windowing/useWindowInteractionController.ts:72-93`), causing repeated selector sorting, window list remapping, and broad shell updates.

Recommended direction:

1. Keep Redux as the durable source of truth for user-visible conversation/window state.
2. Introduce an explicit high-frequency "ephemeral lane" outside Redux for raw envelopes and in-flight drag positions.
3. Flush coalesced updates into Redux at a bounded cadence (frame or short interval), preserving final behavior but reducing dispatch/reducer/render load.
4. Keep the event viewer wired to raw envelope flow, but move it to a bounded ring buffer store with optional pre-open replay.

## Problem Statement

The user goal is to reduce store and state-management pressure while preserving current behavior:

1. Chat and timeline behavior must remain intact.
2. Event debugging window must continue to show raw incoming events.
3. Window state should remain in Redux, but drag/resize should not hammer the store.

Two hotspots were analyzed:

1. Chat event ingestion and timeline projection (`InventoryChatWindow` + `chatSlice`).
2. Desktop window dragging/resizing (`DesktopShell` + `useWindowInteractionController` + `windowingSlice`).

## Current Runtime Flow (Evidence)

### A. Incoming SEM Event Path

1. WebSocket frame is parsed in `InventoryWebChatClient` and passed to handler (`apps/inventory/src/features/chat/webchatClient.ts:121-132`).
2. `InventoryChatWindow` receives envelope and does two synchronous operations:
- Emit to event bus: `emitConversationEvent(...)` (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:615`)
- Process state updates: `onSemEnvelope(...)` (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:616`)
3. `onSemEnvelope` dispatches one or more Redux actions depending on type (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:329-525`).
4. `chatSlice` reducers mutate per-conversation arrays and nested widget payloads (`apps/inventory/src/features/chat/chatSlice.ts:345-606`).
5. Selectors feed `InventoryChatWindow`, which maps all messages into `displayMessages`, and `ChatWindow` renders entire message list (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:668-692`, `packages/engine/src/components/widgets/ChatWindow.tsx:266`).

### B. Event Viewer Path

The event viewer is already non-Redux and bounded:

- Bus delivery: `apps/inventory/src/features/chat/eventBus.ts:73-93`
- Viewer local retention: `MAX_ENTRIES = 500` and local state updates (`apps/inventory/src/features/chat/EventViewerWindow.tsx:6`, `apps/inventory/src/features/chat/EventViewerWindow.tsx:53-56`)

This is a strong baseline to preserve.

### C. Drag/Resize Path

1. Pointer down starts interaction in hook (`packages/engine/src/components/shell/windowing/useWindowInteractionController.ts:49-71`).
2. Each pointermove calls `onMoveWindow` or `onResizeWindow` immediately (`packages/engine/src/components/shell/windowing/useWindowInteractionController.ts:72-93`).
3. `DesktopShell` maps those callbacks to Redux dispatches (`packages/engine/src/components/shell/windowing/DesktopShell.tsx:176-184`).
4. Reducers update bounds (`packages/engine/src/features/windowing/windowingSlice.ts:112-129`).
5. Selector and render path recomputes windows list/sorts and re-renders shell/window tree (`packages/engine/src/features/windowing/selectors.ts:26-34`, `packages/engine/src/components/shell/windowing/DesktopShell.tsx:169-172`, `packages/engine/src/components/shell/windowing/WindowLayer.tsx:23-38`).

## High-Impact Findings

## Event Pipeline

### Issue E1: High-frequency event types are dispatched 1:1 into Redux

Problem: `llm.delta`, tool lifecycle events, and timeline upserts dispatch directly from `onSemEnvelope` with no coalescing.

Where to look:
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx:364-383`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx:417-488`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx:513-519`

Example:

```ts
if (type === 'llm.delta') {
  dispatch(updateStreamTokens({ conversationId, outputTokens }));
  dispatch(applyLLMDelta({ conversationId, messageId, cumulative, delta }));
  return;
}
```

Why it matters: frequent envelopes amplify reducer cost and component update pressure. This is especially costly during long streamed responses and active tool loops.

Cleanup sketch:

```ts
enqueueEnvelope(convId, envelope)
scheduleFrameFlush(convId)

flush(convId):
  coalesce by type/id
  dispatch compact action set (latest delta, merged tool state, merged timeline items)
```

### Issue E2: Timeline item upsert scans/sorts per action

Problem: each timeline/panel upsert locates message via linear search and sorts items.

Where to look:
- `apps/inventory/src/features/chat/chatSlice.ts:134-136`
- `apps/inventory/src/features/chat/chatSlice.ts:296-337`
- `apps/inventory/src/features/chat/chatSlice.ts:510-539`

Example:

```ts
const message = ensureTimelineWidgetMessage(conv);
applyTimelineItemUpsert(message, payload, MAX_TIMELINE_ITEMS);
// applyTimelineItemUpsert does findIndex + sort on every upsert
```

Why it matters: repeated O(message-count) + sort work in high-frequency action streams increases CPU and GC churn.

Cleanup sketch:

```ts
state.timelineByConv[convId].itemsById[id] = merged
state.timelineByConv[convId].order = lazyRecomputeAtFlush()
```

### Issue E3: Full message-list rendering on incremental stream updates

Problem: streaming updates trigger re-render of entire chat timeline.

Where to look:
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx:668-692`
- `packages/engine/src/components/widgets/ChatWindow.tsx:266`

Example:

```tsx
const displayMessages = useMemo(() => messages.map(...), [messages, debugMode]);
...
{messages.map((m, i) => renderMessage(m, i))}
```

Why it matters: a small delta in one streaming message still traverses and renders all historical messages and widgets.

Cleanup sketch:

```tsx
<MessageList messages={stableIds}>
  <MessageRow memoized by message.id and revision>
```

### Issue E4: Timeline hydration dispatches one action per entity

Problem: bootstrap snapshot iterates entities and dispatches repeatedly.

Where to look:
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx:315-327`

Example:

```ts
for (const entity of sorted) {
  hydrateEntity(entity, dispatch, conversationId);
}
```

Why it matters: large historical timelines cause startup burst of reducer and render work.

Cleanup sketch:

```ts
const batchedProjection = projectSnapshot(sorted)
dispatch(applyHydrationBatch({ convId, batchedProjection }))
```

### Issue E5: Event viewer is decoupled from Redux but still synchronous per-event setState

Problem: when viewer is open, each event updates local state immediately.

Where to look:
- `apps/inventory/src/features/chat/EventViewerWindow.tsx:51-56`

Example:

```ts
setEntries((prev) => {
  const next = [...prev, entry];
  return next.length > MAX_ENTRIES ? next.slice(...) : next;
});
```

Why it matters: event viewer can add extra per-event React work exactly when event rate is high.

Cleanup sketch:

```ts
push entry to ring buffer ref
flush viewer state via requestAnimationFrame
```

### Issue E6: Default RTK middleware in development amplifies high-frequency action cost

Problem: store uses plain `configureStore({ reducer })` with default middleware checks.

Where to look:
- `packages/engine/src/app/createAppStore.ts:30-32`

Example:

```ts
function createStore() {
  return configureStore({ reducer });
}
```

Why it matters: serializable/immutability checks and DevTools action capture are expensive under delta-heavy streams.

Cleanup sketch:

```ts
configureStore({
  reducer,
  middleware: (gdm) => gdm({
    serializableCheck: { ignoredActions: highFreqActions },
    immutableCheck: { ignoredPaths: highChurnPaths },
  }),
  devTools: { actionSanitizer: sanitizeHighFreq },
})
```

## Windowing / Dragging

### Issue W1: Pointermove dispatches directly to Redux at raw event rate

Problem: every move/resize event dispatches immediately.

Where to look:
- `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts:72-93`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx:176-184`

Example:

```ts
const onMove = (moveEvent) => {
  onMoveWindow(windowId, { x: ..., y: ... });
};
```

Why it matters: raw pointer frequency (often 60-120Hz+) can overrun reducer/render budget.

Cleanup sketch:

```ts
buffer latest pointer position
requestAnimationFrame flush -> dispatch moveWindow at most once/frame
```

### Issue W2: Broad render fan-out on each drag update

Problem: moving one window re-renders shell-derived arrays and window list.

Where to look:
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx:169-172`
- `packages/engine/src/components/shell/windowing/WindowLayer.tsx:23-38`

Example:

```tsx
const windowDefs = useMemo(() => windows.map(...), [windows, focusedWin?.id]);
{ordered.map((window) => <WindowSurface ... />)}
```

Why it matters: heavy window contents (plugin card hosts) are unnecessarily reevaluated while dragging any single window.

Cleanup sketch:

```tsx
<WindowSurfaceMemo id=... geometry=...>
  <WindowBodyMemo windowId=... />
```

### Issue W3: Repeated sorting in selectors and component layer

Problem: windows are sorted in selector and sorted again in `WindowLayer`.

Where to look:
- `packages/engine/src/features/windowing/selectors.ts:32-34`
- `packages/engine/src/components/shell/windowing/WindowLayer.tsx:23`

Example:

```ts
selectWindowsByZ -> [...windows].sort(...)
const ordered = [...windows].sort(...)
```

Why it matters: duplicate work on each move frame is avoidable.

Cleanup sketch:

```ts
single sorted source, pass through as-is
```

### Issue W4: Duplicate focus dispatch opportunity on drag start

Problem: focus may be triggered by surface mouse down and drag pointer down path.

Where to look:
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx:39`
- `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts:53`

Example:

```tsx
onMouseDown={() => onFocusWindow?.(window.id)}
...
onFocusWindow?.(windowId) // in beginInteraction
```

Why it matters: extra dispatches at drag start and avoidable z-counter churn.

Cleanup sketch:

```ts
focus once per interaction start (dedupe by current focused id)
```

### Issue W5: `renderWindowBody` does repeated linear searches during render

Problem: for each rendered window, body rendering does `windows.find(...)`.

Where to look:
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx:264-266`

Example:

```ts
const winInstance = windows.find((w) => w.id === winDef.id);
```

Why it matters: avoidable O(n^2)-style behavior when many windows are open and move updates are frequent.

Cleanup sketch:

```ts
const windowMap = useMemo(() => indexById(windows), [windows])
renderWindowBody -> windowMap[winDef.id]
```

## Proposed Solutions

## Part I: Event Stream / Redux Load

### Design A: Coalescing Ingestion Queue + Frame Flush (Recommended Phase 1)

Summary: Keep current `onSemEnvelope` semantics, but route high-frequency envelopes through a per-conversation queue and flush compacted Redux actions at most once per frame (or every N ms).

Core mechanics:

1. Raw envelope immediately emits to event bus (debug window unchanged).
2. Envelope is appended to per-conversation queue (outside Redux).
3. Scheduler flushes queue periodically.
4. Flush applies compaction rules:
- `llm.delta`: keep latest cumulative text per message
- `tool.*`: keep latest state per tool id
- `timeline.upsert`: keep latest projected item per timeline id
- suggestions: merge per flush
5. Dispatch minimal action set.

Pros:

- Lowest migration risk.
- Preserves reducer/action model and existing tests mostly intact.
- Immediate dispatch count drop in high-frequency streams.

Cons:

- Adds ingestion complexity and timing semantics.
- Requires care to keep perceived streaming smoothness.

Debug window compatibility:

- No change. It remains wired to raw envelope flow before compaction.

### Design B: Dual-Lane State Model (Ephemeral Stream Store + Durable Redux)

Summary: split state by lifecycle. Durable conversation output stays in Redux; transient high-frequency stream state (raw events, partial deltas, in-progress tool patches) lives in an external store (`useSyncExternalStore`, Zustand, or lightweight custom store).

Core mechanics:

1. Raw envelopes go to ephemeral store + event ring buffer.
2. Projector emits durable checkpoints into Redux:
- stream start/final
- tool done/error
- stable timeline transitions
3. Chat streaming UI reads ephemeral current text directly.

Pros:

- Significant Redux load reduction.
- Clean conceptual separation between transient and durable data.

Cons:

- More architectural change.
- Requires careful synchronization guarantees.

Debug window compatibility:

- Strong fit. Debug window can consume the same ephemeral ring buffer.

### Design C: Worker-Based Projection Pipeline

Summary: offload envelope normalization/projection to a Web Worker and send batched projections to main thread.

Core mechanics:

1. Main thread forwards raw envelopes to worker.
2. Worker projects to compact "projection patches".
3. Main thread dispatches small patch actions.

Pros:

- Reduces main-thread CPU/GC pressure.
- Better scalability for richer projection logic.

Cons:

- Worker protocol complexity.
- Serialization cost and debugging complexity.

Debug window compatibility:

- Either mirror raw envelopes to UI for viewer, or expose worker-maintained ring buffer snapshots.

### Design D: Normalized Redux with Listener Middleware and Entity Adapters

Summary: keep in Redux but reduce reducer work by normalizing conversation/timeline structures and centralizing envelope handling in listener middleware.

Core mechanics:

1. Introduce `receiveEnvelope` action.
2. Listener middleware parses and emits domain actions.
3. Messages/timeline stored in entity maps + ids.

Pros:

- Better reducer complexity characteristics.
- Maintains single-store architecture.

Cons:

- Still many actions unless combined with coalescing.
- Broader reducer/selectors rewrite.

Debug window compatibility:

- Keep existing non-Redux event bus; do not move all raw events into main store.

### Design E: Server-Coalesced Timeline Stream (Protocol-level)

Summary: ask backend to emit lower-frequency semantic aggregates rather than every micro-step.

Pros:

- Frontend simplification.
- System-level throughput gains.

Cons:

- Requires backend protocol change.
- Loss of granular live detail unless dual channel is kept.

Debug window compatibility:

- Keep raw debug channel separately if full event trace is required.

## Event Pipeline Option Comparison

| Option | Redux Load Reduction | Risk | Complexity | Time-to-Value | Debug Window Fit |
|---|---:|---:|---:|---:|---|
| A. Queue + frame flush | High | Low-Med | Med | Fast | Native |
| B. Dual-lane state | Very High | Med | High | Medium | Native |
| C. Worker projection | High | Med-High | High | Medium | Good |
| D. Normalized Redux | Med | Med | Med-High | Medium | Good |
| E. Server coalescing | High | High | High | Slow | Needs dual channel |

### Recommended Event Strategy

Phase recommendation:

1. Start with A (queue + frame flush) to quickly cap action rate.
2. Add selective pieces of D (normalization for timeline and message indexes).
3. Evaluate B or C if stream complexity/frequency grows further.

## Part II: Window Dragging While Keeping Redux as Source of Truth

### Drag Option W-A: requestAnimationFrame Dispatch Throttling (Recommended Phase 1)

Summary: keep state in Redux but dispatch at most once per animation frame.

Implementation shape:

```ts
onPointerMove -> store latest pointer in ref
if (!scheduled) requestAnimationFrame(flush)
flush -> dispatch(moveWindow/resizeWindow with latest)
```

Pros:

- Preserves Redux truth model.
- Major drop from raw pointer event count to frame rate.

Cons:

- Slight increase in interaction code complexity.

### Drag Option W-B: Local Drag Shadow + Commit-on-End

Summary: during drag, update local visual transform only; commit final geometry to Redux on pointerup (optional periodic commits).

Pros:

- Maximum Redux relief during drag.
- Very smooth interaction.

Cons:

- Potential mismatch if other UI needs real-time geometry from store.
- More edge cases for cancel/interrupt behavior.

### Drag Option W-C: Hybrid Live Preview State (Ephemeral Overlay)

Summary: keep persisted window bounds in Redux, but keep active interaction geometry in ephemeral overlay keyed by window id. Renderer composes `effectiveBounds = dragOverlay ?? reduxBounds`.

Pros:

- Redux remains source of truth for settled state.
- Keeps real-time visuals responsive.
- Avoids flooding main reducers.

Cons:

- Requires clear merge precedence and cleanup semantics.

### Drag Option W-D: Render Isolation and Memoization Pass

Summary: reduce per-drag render fan-out even if dispatch frequency remains moderate.

Changes:

1. Remove double sorting.
2. Memoize `WindowSurface` and separate `WindowBody` from geometry shell.
3. Index windows by id for O(1) lookup in body rendering.
4. Dispatch focus once per interaction start.

Pros:

- Improves responsiveness regardless of chosen drag state strategy.

Cons:

- Does not alone solve dispatch flooding.

### Drag Option W-E: Store-level Geometry Channel

Summary: separate `windowing.interaction` substate with high-frequency geometry and reduced subscriber scope.

Pros:

- Keeps Redux-only model.
- Limits subscription invalidation with finer selectors.

Cons:

- More state shape complexity and selector work.

## Window Option Comparison

| Option | Redux Pressure | UX Smoothness | Risk | Complexity | Keeps Redux Source-of-Truth |
|---|---:|---:|---:|---:|---|
| W-A rAF throttle | High relief | High | Low | Low-Med | Yes |
| W-B local shadow commit-end | Very high relief | Very high | Med | Med | Yes (settled state) |
| W-C hybrid overlay | Very high relief | Very high | Med | Med-High | Yes |
| W-D render isolation | Medium relief | Medium-High | Low | Med | Yes |
| W-E redux geometry channel | Medium-High | High | Med | Med-High | Yes |

### Recommended Window Strategy

Use W-A + W-D first, then evaluate W-C if additional smoothness is needed.

1. W-A immediately cuts dispatch frequency.
2. W-D cuts render work per dispatch.
3. W-C is a targeted second step for very heavy windows.

## Unified Architecture Proposal (Keeping Current Behavior)

### Proposed Data Lanes

1. Durable lane (Redux):
- Conversation messages (finalized or user-visible)
- Stable timeline/card/widget panel state
- Window lifecycle + settled geometry

2. Ephemeral lane (outside Redux):
- Raw SEM envelopes (bounded ring buffers per conversation)
- Coalescing queues / in-flight delta maps
- Active drag/resize latest pointer + optional preview geometry

3. Projection lane:
- deterministic projector that converts ephemeral events into compact Redux actions
- bounded flush cadence

### Why this keeps behavior intact

1. Timeline/card/widget UI remains Redux-driven and deterministic.
2. Event viewer remains raw-event oriented, now with better retention controls.
3. Window state stays in Redux as requested, but drag path is rate-limited and render-isolated.

## Implementation Plan

## Phase 0: Instrumentation and Baseline

1. Add action-rate counters for key action types (`applyLLMDelta`, `upsertTimelineItem`, `moveWindow`, `resizeWindow`).
2. Add render-count probes for `InventoryChatWindow`, `ChatWindow`, `DesktopShell`, `WindowLayer`, `WindowSurface`.
3. Capture baseline scenarios:
- 1 long streaming response
- tool-heavy timeline sequence
- drag one window for 5 seconds with 6 windows open

## Phase 1: Low-risk Throughput Controls

1. Event queue + frame flush for SEM ingestion (Design A).
2. rAF throttling for drag/resize dispatch (W-A).
3. remove duplicate window sorting and duplicate focus dispatch.

Expected impact:

- Large drop in action count.
- Noticeable drag smoothness improvements.

## Phase 2: Render Isolation

1. Memoize window surfaces and window bodies separately.
2. Replace repeated `find` lookups with id-index map.
3. Add selective memoization for chat message rows.

Expected impact:

- Lower CPU spikes during drag and stream bursts.

## Phase 3: Optional Structural Upgrades

1. Normalize timeline/message entities in Redux (part of Design D).
2. Evaluate hybrid drag overlay (W-C) if needed.
3. Consider worker projection (Design C) if envelope rates continue growing.

## Validation Plan

### Functional invariants

1. Event viewer still receives raw event types and payloads.
2. Streamed AI text remains correct and in-order.
3. Timeline/card/widget panels preserve round behavior and upsert semantics.
4. Window focus/z-order/session behavior unchanged.

### Performance acceptance targets (proposed)

1. `llm.delta` scenario: reduce Redux action count by >= 60% during streaming.
2. Drag scenario: cap move/resize dispatch to frame rate (<= 60 per second on 60Hz displays).
3. Drag scenario: keep interaction responsive with no visible stutter under 6-10 open windows.

### Test additions

1. Queue flush/coalescing unit tests for event ingestion.
2. Drag throttling unit tests for hook behavior.
3. Integration tests for event viewer correctness with coalesced Redux writes.

## Open Questions

1. Should the event viewer show historical events that happened before the viewer window opens? Current behavior is live-only.
2. Do we need strict per-event replay guarantees for debugging, or is bounded ring-buffer retention enough?
3. Is render smoothness target 60 FPS or best-effort under load?
4. Should development mode keep full Redux DevTools payloads for high-frequency actions, or sanitize/truncate them?

## References

- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/eventBus.ts`
- `apps/inventory/src/features/chat/EventViewerWindow.tsx`
- `apps/inventory/src/features/chat/timelineProjection.ts`
- `packages/engine/src/components/widgets/ChatWindow.tsx`
- `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/WindowLayer.tsx`
- `packages/engine/src/components/shell/windowing/WindowSurface.tsx`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/selectors.ts`
