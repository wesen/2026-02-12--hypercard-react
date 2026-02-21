---
Title: Chat Window Message and Timeline Widget Virtualization Performance Investigation
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
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx
      Note: Generated card/widget panel list rendering path within chat message widgets
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Chat message preparation and widget renderer wiring before ChatWindow
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryTimelineWidget.tsx
      Note: Timeline widget item rendering path, expansion, and metadata rendering
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Conversation state structure and message/timeline widget update behavior
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts
      Note: Chat selectors returning conversation message arrays to the rendering layer
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Core chat timeline rendering path that currently renders all messages each update
    - Path: 2026-02-12--hypercard-react/packages/engine/src/theme/base.css
      Note: Chat timeline style contract and possible virtualization container requirements
    - Path: apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx
      Note: Generated panel list rendering path
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Pre-render message mapping and widget renderer bridge
    - Path: apps/inventory/src/features/chat/InventoryTimelineWidget.tsx
      Note: Widget row rendering and expansion behavior
    - Path: apps/inventory/src/features/chat/chatSlice.ts
      Note: Conversation growth and timeline/panel item cap behavior
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Primary full-list chat render path targeted for virtualization
ExternalSources: []
Summary: |
    Focused performance investigation on chat window rendering with emphasis on message list virtualization/windowing and timeline widget rendering scalability. Proposes a phased architecture: immediate low-risk rendering reductions, then robust virtualized timeline rendering with streaming-safe bottom anchoring and optional nested virtualization for heavy widgets.
LastUpdated: 2026-02-17T08:55:00-05:00
WhatFor: |
    Provide an implementation-ready plan to improve chat UI responsiveness and reduce render cost under long conversations and high-frequency streaming updates.
WhenToUse: Use before implementing message list virtualization, scroll anchoring changes, or timeline widget render optimizations in chat.
---


# Chat Window Message and Timeline Widget Virtualization Performance Investigation

## Executive Summary

The current chat experience is functionally correct but will degrade as conversation length grows because the entire message list is re-rendered on each streaming or timeline update. The most expensive path is not Redux storage volume by itself; it is render fan-out from repeatedly mapping and painting all prior messages during high-frequency updates.

Current behavior in brief:

1. `InventoryChatWindow` derives `displayMessages` by mapping the entire `messages` array on each update.
2. `ChatWindow` then maps all messages again to render rows (`messages.map(...)`).
3. Streaming updates (`llm.delta`) and timeline upserts trigger frequent updates while the rendered message count is unbounded.
4. Inline widgets (timeline/cards/widgets) add nested render and syntax-highlight work that can become costly in debug-heavy sessions.

Recommendation:

1. Implement a phased strategy, not a one-shot virtualization rewrite.
2. Phase 1 (low risk): reduce avoidable re-renders and introduce bounded rendering policy for older messages.
3. Phase 2 (target): add a dedicated virtualized timeline component with variable-height support and streaming-safe bottom anchoring.
4. Phase 3 (conditional): add nested/conditional virtualization for timeline widgets only when item counts exceed practical limits.

Outcome target:

- Keep chat smooth during token streaming and long sessions.
- Preserve existing behavior (auto-scroll when pinned, debug mode, inline widget rendering, action chips).
- Avoid major architecture churn in one PR.

## Problem Statement

The chat window currently renders all accumulated messages every time any new token or timeline event arrives. This is acceptable for short sessions but scales poorly for longer sessions and rich debug views.

Primary user-facing symptoms expected at scale:

1. Noticeable input lag while stream updates are active.
2. Scroll jitter and frame drops near the bottom during long sessions.
3. Growing CPU cost from repeated DOM reconciliation over historical rows.
4. Worse behavior in debug mode due additional content rows and metadata rendering.

This investigation focuses on one explicit improvement vector: message/timeline widget windowing (virtualization), while preserving current chat semantics.

## Current Rendering and State Flow (Evidence)

### Message Rendering Path

`ChatWindow` currently renders the full timeline directly:

```tsx
<div data-part="chat-timeline" ref={timelineRef}>
  {isEmpty && <WelcomeScreen>{welcomeContent}</WelcomeScreen>}
  {messages.map((m, i) => renderMessage(m, i))}
  <div ref={endRef} />
</div>
```

File: `packages/engine/src/components/widgets/ChatWindow.tsx`

Implication: any change to `messages` triggers reconciliation for every row.

### Pre-render Mapping Cost

Before `ChatWindow` receives data, `InventoryChatWindow` transforms every message again:

```tsx
const displayMessages = useMemo(
  () => messages.map((message) => { ... }),
  [messages, debugMode],
);
```

File: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

This doubles the top-level iteration work on update-heavy paths.

### Update Frequency Drivers

High-frequency update actions include:

- `applyLLMDelta`
- `updateStreamTokens`
- timeline upserts (`upsertTimelineItem`, `upsertCardPanelItem`, `upsertWidgetPanelItem`)

Files:

- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/chatSlice.ts`

### Message Growth Characteristics

`chatSlice` caps timeline widget item counts per widget (`MAX_TIMELINE_ITEMS=24`, `MAX_PANEL_ITEMS=16`) but **does not cap total message history**. Messages continue to accumulate across rounds and hydration.

File: `apps/inventory/src/features/chat/chatSlice.ts`

This means top-level row count can still become large over time even if widget internals are bounded.

### Widget Rendering Hotspots

1. `InventoryTimelineWidget` loops all items and supports expandable YAML payload rendering.
2. `InventoryArtifactPanelWidgets` loops all items and may render metadata tables and YAML.
3. `SyntaxHighlight` is used for YAML/JS blocks and can become expensive if many blocks are expanded.

Files:

- `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx`
- `apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx`
- `apps/inventory/src/features/chat/utils/SyntaxHighlight.tsx`

## Performance Goals and Non-Goals

### Goals

1. Keep 60fps-feeling interaction during streaming for realistic long chat histories.
2. Bound render cost mostly to visible rows, not full history.
3. Preserve existing UX behaviors:
   - pinned-bottom auto-scroll
   - manual scroll-up inspection without forced snapping
   - inline widgets and actions
   - debug mode overlays.
4. Minimize migration risk with staged rollout.

### Non-Goals

1. No chat schema rewrite in this effort.
2. No backend protocol changes required.
3. No immediate replacement of widget model in chat content blocks.

## Design Options

## Option A: Soft Windowing Without External Virtualization Library (Phase 1)

### Idea

Render only the latest N rows (for example 120), with an “older messages collapsed” separator and explicit expand controls.

### Pros

1. Very low implementation risk.
2. Simple mental model.
3. Fast immediate win for heavy sessions.

### Cons

1. Not true virtualization; still expensive when expanded.
2. UX tradeoff: hidden history by default.
3. Less elegant for infinite scroll and arbitrary jumps.

### Suggested Policy

- Default: show newest 120 rows.
- Show “Load older 100” control above viewport.
- Auto-expand chunk if user scrolls near top.

### Pseudocode

```tsx
const [visibleStart, setVisibleStart] = useState(Math.max(0, messages.length - 120));
const visible = messages.slice(visibleStart);

return (
  <div>
    {visibleStart > 0 && <LoadOlder onClick={() => setVisibleStart(Math.max(0, visibleStart - 100))} />}
    {visible.map(renderMessage)}
  </div>
);
```

## Option B: Full Virtualized Message Timeline (Recommended Target, Phase 2)

### Idea

Replace direct `messages.map` with a virtualized list component that renders only visible rows + overscan.

### Library choices

1. `@tanstack/react-virtual` (recommended): flexible, variable-height friendly, well-suited for custom chat behavior.
2. `react-window`: simple but harder for dynamic/variable-height chat rows with expanding widgets.

Recommendation: use `@tanstack/react-virtual` because row heights vary significantly across message types and expanded widgets.

### Key Requirements for Chat Virtualization

1. Variable-height rows (plain text, widgets, expanded YAML).
2. Bottom-pinned behavior during streaming.
3. Stable anchor when prepending or revealing older rows.
4. Deterministic keys by message id where available.

### Proposed Component Split

```txt
packages/engine/src/components/widgets/
  ChatWindow.tsx                    // shell/header/composer/footer
  ChatTimelineVirtualized.tsx       // new virtualized row layer
  ChatMessageRow.tsx                // isolated row renderer
  useChatScrollAnchor.ts            // pinned-bottom and anchor logic
```

### ChatWindow API additions (backward compatible)

```ts
interface ChatWindowProps {
  ...
  virtualization?: {
    enabled?: boolean;
    overscan?: number;
    estimateRowHeight?: number;
  };
}
```

Default keeps existing behavior (`enabled=false`) until rollout flag flips.

### Virtualized Rendering Sketch

```tsx
const rowVirtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => timelineRef.current,
  estimateSize: () => estimateRowHeight,
  overscan,
});

return (
  <div ref={timelineRef} data-part="chat-timeline">
    <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
      {rowVirtualizer.getVirtualItems().map((v) => {
        const m = messages[v.index];
        return (
          <div
            key={m.id ?? v.index}
            style={{ transform: `translateY(${v.start}px)`, position: 'absolute', width: '100%' }}
            ref={rowVirtualizer.measureElement}
          >
            <ChatMessageRow message={m} ... />
          </div>
        );
      })}
    </div>
  </div>
);
```

### Streaming-safe bottom anchoring

Need explicit pinned-bottom state:

- If user is at (or near) bottom and new content arrives, keep pinned.
- If user scrolls up, do not force snap.
- Provide “Jump to latest” affordance.

Pseudocode:

```ts
const pinned = useRef(true);

function onScroll() {
  pinned.current = isNearBottom(scrollEl, 24);
}

useLayoutEffect(() => {
  if (pinned.current) scrollToBottomInstant();
}, [scrollKey]);
```

### Row memoization strategy

Use `React.memo` for `ChatMessageRow`, with equality check based on message id + mutable fields (`text`, `status`, `content`, debug decoration hash).

Benefits:

- Non-updated rows do not re-render even if parent container updates.

## Option C: Hybrid Windowing + Segment Caching

### Idea

Combine a small virtualized active segment with serialized older “frozen segments” rendered as static HTML blocks.

Pros:

- Very low active render cost.

Cons:

- Complex, custom, and brittle.

Decision: not recommended for first pass due complexity and maintenance burden.

## Timeline Widget Virtualization: What Is Actually Needed?

A key nuance: timeline widget item arrays are currently capped (`24` and `16`), so widget **item count** is not the main scaling risk today. Top-level message count is the larger cost driver.

Still, widget rendering can become expensive due expanded metadata/highlight rendering and debug mode.

### Recommended widget strategy

1. Do not prioritize nested widget virtualization in initial pass.
2. Add lightweight render safeguards:
   - memoize item rows
   - lazy-render heavy metadata/highlight only when expanded
   - keep expansion state stable by item id.
3. Add threshold-triggered nested virtualization only if caps increase or debug flows expand significantly.

### Conditional nested virtualization design (future)

If `items.length > 40` (future threshold), use widget-local virtualizer for rows.

Pseudocode:

```tsx
const shouldVirtualize = items.length > 40;
return shouldVirtualize ? <VirtualizedItemList items={items} /> : <PlainItemList items={items} />;
```

## Required Supporting Refactors

## R1: Isolate Message Row Renderer

Current `ChatWindow` has nested render helper functions in component scope. Extracting `ChatMessageRow` enables memoization and cleaner virtualization integration.

### Proposed API

```ts
interface ChatMessageRowProps {
  message: ChatWindowMessage;
  onAction?: (action: unknown) => void;
  renderWidget?: (widget: InlineWidget) => ReactNode;
  showThinking: boolean;
}
```

## R2: Move Debug Decoration Out of Full Array Map

`displayMessages` currently maps every message to inject debug badges. Replace with row-level decoration logic so only rendered rows process debug overlays.

Approach:

- Pass `debugMode` into row component.
- Generate badge at row render time for that row only.

## R3: Add Stable Message Keys and Optional Local Row Cache

Where possible, ensure all messages have deterministic ids to maximize memoization and virtualization stability.

Potential helper in `chatSlice` for system rows that currently rely on generated counters can remain, but avoid id-less rows.

## R4: Add Diagnostics Hooks

Add dev-only metrics to evaluate improvement and prevent regressions:

1. messages rendered per update
2. average update duration
3. dropped frames during streaming windows
4. scroll correction events (anchor adjustments)

## Migration and Rollout Plan

### Phase 1: Low-risk render reduction

1. Extract `ChatMessageRow` and memoize.
2. Remove full-array `displayMessages` mapping in `InventoryChatWindow` for debug decoration.
3. Introduce optional soft windowing of old messages behind feature flag.
4. Add telemetry counters.

Acceptance check:

- No UX regressions in scrolling/actions/debug mode.
- Noticeable reduction in render count during streaming.

### Phase 2: Virtualized timeline rollout

1. Implement `ChatTimelineVirtualized` with feature flag.
2. Wire pinned-bottom behavior and jump-to-latest affordance.
3. Validate variable-height behavior with widget expansion/collapse.
4. Run stress scenario: long hydrated history + active stream + debug mode.

Acceptance check:

- Visible rows only re-render.
- Smooth streaming at high token cadence.
- No scroll-jump bugs.

### Phase 3: Widget-focused hardening

1. Add memoization for timeline/artifact widget rows.
2. Add conditional nested virtualization path (disabled by default).
3. Evaluate whether current item caps make nested virtualization unnecessary long-term.

Acceptance check:

- No measurable degradation from expanded YAML-heavy rows.

## Risks and Edge Cases

1. Scroll-anchor bugs during stream updates.

Mitigation:

- Dedicated `useChatScrollAnchor` hook with exhaustive tests.

2. Variable-height row measurement jitter.

Mitigation:

- Measure on content changes only.
- Conservative overscan.

3. Debug mode layout changes causing row thrash.

Mitigation:

- Stable debug badge rendering and memoized row boundaries.

4. Accessibility regressions in virtualized lists.

Mitigation:

- Preserve semantic roles and keyboard focus behavior for row actions.

## Test Plan

1. Unit tests

- row memoization equality behavior
- anchor/pinned-bottom hook logic
- “jump to latest” control state

2. Integration tests

- long message list + active streaming + manual scroll up/down
- expanding/collapsing widget rows in virtualized mode
- debug mode toggles while streaming

3. Storybook scenarios

- 20, 200, 2000 message scenarios
- mixed row heights (text + widgets + expanded metadata)
- pinned vs unpinned streaming states

## Suggested Story Additions

1. `ChatWindow/Performance/LongHistoryStreaming`
2. `ChatWindow/Performance/MixedHeights`
3. `ChatWindow/Performance/DebugModeHeavy`
4. `ChatWindow/Performance/UnpinnedScrollRecovery`

## Alternatives Considered

### Alternative 1: Do nothing, rely on current list sizes

Rejected because conversation history is unbounded and streaming frequency is high.

### Alternative 2: Hard cap message history in Redux

Partial value, but rejected as primary fix because it discards context and does not solve render cost for still-large active windows.

### Alternative 3: Only optimize selectors/reducers

Important but insufficient. The largest visible bottleneck is DOM render fan-out in chat timeline.

### Alternative 4: Fully move history to server and render paged snapshots only

Could work long-term, but out of scope and higher product complexity.

## Design Decisions

1. Prioritize top-level message virtualization before nested widget virtualization.
2. Ship in phases with feature flags and telemetry.
3. Keep chat API surface backward-compatible while adding optional virtualization config.
4. Preserve existing behavior contracts (pinned-bottom semantics, inline widgets, debug mode).

## Open Questions

1. Should soft windowing (collapse older rows) remain as a permanent fallback even after full virtualization?
2. Should virtualization be engine-default or app opt-in during transition?
3. Do we need persistent client-side preference for “always pinned” vs manual scroll mode?
4. Should expanded widget state survive across message data refreshes by default?

## Implementation Checklist

1. Extract `ChatMessageRow` from `ChatWindow`.
2. Add `ChatTimelineVirtualized` and feature flag.
3. Implement `useChatScrollAnchor`.
4. Remove full-history `displayMessages.map(...)` transform pattern.
5. Add story and test coverage for long-history behavior.
6. Roll out to inventory app first, then engine defaults after validation.

## References

- `packages/engine/src/components/widgets/ChatWindow.tsx`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx`
- `apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx`
- `apps/inventory/src/features/chat/selectors.ts`
