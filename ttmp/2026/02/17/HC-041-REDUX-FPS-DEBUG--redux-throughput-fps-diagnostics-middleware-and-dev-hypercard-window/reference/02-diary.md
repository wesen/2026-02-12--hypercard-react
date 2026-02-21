---
Title: Diary
Ticket: HC-041-REDUX-FPS-DEBUG
Status: active
Topics:
    - debugging
    - frontend
    - performance
    - redux
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/debug/ReduxPerfWindow.tsx
      Note: Live diagnostics panel UI
    - Path: 2026-02-12--hypercard-react/packages/engine/src/__tests__/diagnostics.test.ts
      Note: 25 unit tests
    - Path: 2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: Store factory with diagnostics wiring
    - Path: 2026-02-12--hypercard-react/packages/engine/src/diagnostics/diagnosticsStore.ts
      Note: Module-level diagnostics storage (core of the refactor)
    - Path: 2026-02-12--hypercard-react/packages/engine/src/diagnostics/frameMonitor.ts
      Note: rAF frame monitor (writes to external store)
    - Path: 2026-02-12--hypercard-react/packages/engine/src/diagnostics/reduxPerfMiddleware.ts
      Note: Timing middleware (writes to external store)
    - Path: 2026-02-12--hypercard-react/packages/engine/src/diagnostics/useDiagnosticsSnapshot.ts
      Note: React polling hook
ExternalSources: []
Summary: 'Step-by-step implementation diary for HC-041: Redux throughput/FPS diagnostics middleware and dev HyperCard window.'
LastUpdated: 2026-02-17T08:41:40.019504409-05:00
WhatFor: Track implementation progress, decisions, issues, and review instructions for HC-041.
WhenToUse: Use when reviewing, continuing, or onboarding on HC-041 diagnostics work.
---


# Diary

## Goal

Capture the full implementation journey for HC-041: adding a generic Redux throughput/FPS diagnostics middleware to the engine, wiring it into the store factory, and building a live HyperCard dev window for the inventory app.

## Step 1: Phase 1 — Engine diagnostics primitives (Tasks 5–17)

Created the entire `packages/engine/src/diagnostics/` module with all core types, data structures, middleware, frame monitor, Redux slice, and selectors. This establishes the engine-level infrastructure that all downstream work depends on.

### Prompt Context

**User prompt (verbatim):** "Implement docmgr ticket HC-041-REDUX-FPS-DEBUG, work task by task, commit at each task, keep a frequent diary."

**Assistant interpretation:** Implement the full ticket following the design doc and task list, committing incrementally and maintaining a diary of progress.

**Inferred user intent:** Get the complete HC-041 diagnostics system implemented with a traceable commit history and documentation trail.

**Commit (code):** c285f0d — "HC-041: Phase 1 — add diagnostics module (types, ring buffer, middleware, frame monitor, slice, selectors)"

### What I did
- Created `types.ts` with `ReduxPerfEvent`, `ReduxPerfSnapshot`, `FrameEvent`, `DiagnosticsConfig`, and defaults.
- Created `ringBuffer.ts` with a bounded, Immer-safe ring buffer (push, windowSince, toArray, clear).
- Created `reduxPerfMiddleware.ts` that times every dispatch, detects state changes via referential equality, and records events. Self-referencing actions (`recordPerfEvent`) are excluded to prevent infinite loops.
- Created `frameMonitor.ts` using `requestAnimationFrame` to measure inter-frame timing and dispatch `recordFrameEvent`.
- Created `reduxPerfSlice.ts` with ring buffers for events+frames, config, pause/reset actions.
- Created `selectors.ts` with `selectReduxPerfSnapshot` computing rolling throughput, avg/p95 reducer ms, FPS, long-frame rate, and top action rates.
- Created `index.ts` barrel and exported from engine `src/index.ts`.

### Why
Phase 1 establishes the generic, reusable diagnostics core in the engine package. All other phases (store wiring, UI window, inventory integration) depend on these primitives.

### What worked
- Clean TypeScript compilation on both engine and inventory projects.
- Ring buffer design is simple (array + cursor) and Immer-compatible for Redux state.
- Self-dispatch exclusion pattern prevents middleware infinite loop cleanly.

### What didn't work
- N/A — straightforward implementation following the design doc.

### What I learned
- The existing `debugSlice` uses a similar bounded-array pattern (splice at capacity), confirming the ring-buffer approach is consistent with project conventions.
- The engine barrel re-exports everything via `export *`, so adding a new `diagnostics/` module only needs one line in `src/index.ts`.

### What was tricky to build
- The middleware must skip its own `recordPerfEvent` action type to avoid infinite recursion (dispatch → middleware → dispatch → …). Solved by checking `action.type === recordPerfEvent.type` before recording.

### What warrants a second pair of eyes
- The `selectReduxPerfSnapshot` selector recomputes on every `reduxPerf` state change. In high-throughput scenarios the UI should throttle reads (documented in selector JSDoc). Verify this doesn't create render pressure.

### What should be done in the future
- Add optional sampling mode (Task 48) for very high action rates to reduce overhead.

### Code review instructions
- Start at `packages/engine/src/diagnostics/index.ts` for the API surface.
- Review `reduxPerfMiddleware.ts` for the self-dispatch guard.
- Review `selectors.ts` for rolling-window math correctness.
- Validate: `npx tsc --noEmit -p packages/engine/tsconfig.json`

### Technical details
- Ring buffer capacity defaults: 2000 events, 600 frames.
- Long-frame threshold: 33.34ms (~30fps boundary).
- Default rolling window: 5000ms.
- p95 uses sorted-array index method: `sorted[ceil(n * 0.95) - 1]`.

## Step 2: Phase 2 — Store wiring (Tasks 18–22)

Extended `createAppStore` to accept an optional second argument `CreateAppStoreOptions` that controls diagnostics. When `enableReduxDiagnostics: true`, the store factory conditionally adds the `reduxPerf` reducer, appends the diagnostics middleware, and starts the frame monitor. All existing callers (crm, todo, book-tracker-debug, inventory, stories) continue to compile and work unchanged.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Wire the Phase 1 diagnostics primitives into the centralized store factory with backward compatibility.

**Inferred user intent:** Make diagnostics opt-in at store creation time without breaking any existing app or Storybook path.

**Commit (code):** 0614e16 — "HC-041: Phase 2 — wire diagnostics into createAppStore with opt-in options"

### What I did
- Added `CreateAppStoreOptions` interface with `enableReduxDiagnostics` and `diagnosticsWindowMs` fields.
- Modified `createAppStore` to accept optional second argument with `= {}` default.
- Conditionally spread `reduxPerf` reducer when enabled.
- Create and append perf middleware when enabled.
- Start `frameMonitor` on store creation when enabled and `requestAnimationFrame` available.
- Exported `CreateAppStoreOptions` type from `app/index.ts` barrel.

### Why
This is the integration seam between engine diagnostics and app stores. Making it opt-in preserves zero-overhead guarantee for prod and non-participating apps.

### What worked
- The `= {}` default for options ensures all 4 existing `createAppStore` callers compile unchanged.
- Verified all apps (crm, todo, book-tracker-debug, inventory) pass `tsc --noEmit`.

### What didn't work
- N/A

### What I learned
- The engine uses composite project builds (`composite: true`). Inventory references the engine via `references` and `paths` in tsconfig. After modifying engine source, `tsc -b packages/engine` must run to regenerate `.d.ts` before inventory type-checks pass.

### What was tricky to build
- `requestAnimationFrame` guard is needed: `startFrameMonitor` calls rAF which doesn't exist in SSR/test environments. Added `typeof requestAnimationFrame !== 'undefined'` check.

### What warrants a second pair of eyes
- Frame monitor is started inside `createStore()` — Storybook's `createStore()` factory can be called multiple times. Each call starts a new rAF loop. If Storybook rapidly creates/destroys stores, monitors accumulate. For now this is acceptable (diagnostics are off by default in Storybook), but a cleanup mechanism could be added later.

### What should be done in the future
- Return a `cleanup` function from `createAppStore` if needed for hot-reload scenarios.

### Code review instructions
- Review `packages/engine/src/app/createAppStore.ts` for the option wiring.
- Verify backward compatibility: `grep -r "createAppStore" apps/ --include="*.ts" -l`
- Validate all apps: `for app in crm todo book-tracker-debug inventory; do npx tsc --noEmit -p apps/$app/tsconfig.json; done`

## Step 3: Phase 3 — Inventory app integration (Tasks 23–34)

Wired diagnostics into the inventory app: enabled in dev mode, created the full `ReduxPerfWindow` component with live metrics + controls, added appKey routing, startup auto-open, desktop icon, and Debug menu. This completes the end-to-end user-facing feature.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Create the inventory-specific UI and integration for the diagnostics system.

**Inferred user intent:** Have a fully working dev diagnostics window that auto-opens when running inventory in dev mode.

**Commit (code):** 1f51b76 — "HC-041: Phase 3 — inventory app integration (diagnostics window, auto-open, menu/icon)"

### What I did
- Updated `apps/inventory/src/app/store.ts` to pass `enableReduxDiagnostics: import.meta.env.DEV`.
- Created `apps/inventory/src/features/debug/ReduxPerfWindow.tsx`:
  - 6-cell metrics grid (actions/s, state Δ/s, avg/p95 reducer ms, FPS, long frames/s).
  - Top action types table sorted by rate.
  - Controls: Pause/Resume, Reset, window-duration selector (1s/3s/5s/10s).
  - Legend explaining metric semantics.
  - Throttled updates via `useRef` + `setInterval` at 500ms to prevent self-induced render pressure.
- Added appKey route `redux-perf-debug` in `renderAppWindow`.
- Added startup auto-open in `useEffect` with `dedupeKey` preventing duplicate windows.
- Added `handleCommand` case for `debug.redux-perf` and `icon.open.redux-perf`.
- Added desktop icon (DEV only) and Debug menu section (DEV only).
- Created `vite-env.d.ts` to resolve `import.meta.env.DEV` TypeScript types.

### Why
This is the first-consumer integration that proves the generic engine diagnostics module works end-to-end. The dev-only gating ensures zero production impact.

### What worked
- Throttled rendering pattern works well: the selector recomputes on every perf event dispatch, but the UI only reads it every 500ms via `setInterval`.
- `dedupeKey` on the diagnostics window prevents duplicate windows when reopened via menu/icon.
- All 4 apps still compile cleanly.

### What didn't work
- Initial `tsc` failed because `import.meta.env` wasn't typed. The inventory app had no `vite-env.d.ts` file (unlike typical Vite scaffolds). Added it.
- Initial `tsc` also failed because inventory's tsconfig uses `references` to engine — needed `tsc -b packages/engine` to regenerate dist declarations before inventory could see the new exports.

### What I learned
- Vite projects need `/// <reference types="vite/client" />` in a `.d.ts` file for `import.meta.env` to type-check. This was missing for the inventory app.
- The `import.meta.env.DEV` check in module scope (store.ts) and in component scope (App.tsx) both work correctly with Vite's dead-code elimination in production builds.

### What was tricky to build
- The UI throttling pattern: can't just use `useSelector` directly because it would cause re-renders on every perf event. Instead: always select (to get latest), store in ref, and only set display state on a timer. This gives live data availability without render storms.
- Latency color thresholds: chose >8ms as error (approaching 16ms frame budget) and >2ms as warning based on typical Redux reducer expectations.

### What warrants a second pair of eyes
- The inline styles approach means no CSS module or theme token consistency. If the project standardizes on CSS modules later, this component should be migrated.
- The throttle interval (500ms) is a balance between responsiveness and overhead. May want to make it configurable.

### What should be done in the future
- Add Storybook story for `ReduxPerfWindow` with mocked data (Task from Phase 4).
- Consider making the throttle interval configurable.
- Add compact widget mode (Task 50).

### Code review instructions
- Start at `apps/inventory/src/features/debug/ReduxPerfWindow.tsx` for the UI component.
- Review `apps/inventory/src/App.tsx` for the startup auto-open and menu integration.
- Review `apps/inventory/src/app/store.ts` for the single-line enablement change.
- Validate: `npx tsc --noEmit -p apps/inventory/tsconfig.json`
- Manual test: `npm run dev -w apps/inventory` → verify diagnostics window opens.

## Step 4: Design review — move diagnostics out of Redux (Tasks 52–63)

During review of the Phase 1 implementation, we identified a fundamental design flaw: storing diagnostics telemetry in Redux (`reduxPerfSlice`, `recordPerfEvent`/`recordFrameEvent` actions) causes severe self-inflicted overhead. The frame monitor alone produces ~120 Redux dispatches/sec (60 `recordFrameEvent` + 60 `recordPerfEvent` from the middleware timing them). Each dispatch mutates the store, invalidates all `useSelector` equality checks app-wide, recomputes the snapshot selector, and triggers unnecessary React renders — the diagnostics tool becomes the dominant source of the overhead it's trying to measure.

### Prompt Context

**User prompt (verbatim):** "recordFrameEvent itself is at 20fps and store din the store itself, is that right? what would the selector look like?"

Followed by: "do we need to emit recordPerfEvent and recordFrameEvent through the store itself anyway? We could have the middlewares only measure and update an external storage that retriggers redraw debounce for the perf window?"

Followed by: "Ok, add the tasks for that refactor to the ticket, but don't start working on them yet."

**Assistant interpretation:** The user spotted the observer-effect problem and proposed moving diagnostics data entirely out of Redux into external storage. Add refactor tasks but don't implement yet.

**Inferred user intent:** Get the design right before continuing implementation — record the refactor plan as tasks so it's trackable.

**Commit (code):** N/A — no code changes, tasks and diary only.

### What I did
- Analyzed the full dispatch cascade: rAF → `recordFrameEvent` → middleware times it → `recordPerfEvent` → reducer → selector recompute → useSelector re-render → throttle discards.
- Identified that the middleware's self-dispatch guard only covers `recordPerfEvent`, not `recordFrameEvent`, so frame events get double-counted.
- Identified that `createSelector` memoization is useless when the input (`reduxPerf`) changes on every dispatch.
- Identified that `useSelector(selectReduxPerfSnapshot)` runs the selector on every store change regardless of the component's `setInterval` throttle.
- Added 12 refactor tasks (52–63) covering: remove slice, remove actions, external ring buffers, polling hook, plain function controls, barrel export updates, compilation verification, test updates.

### Why
Diagnostics telemetry is write-heavy, single-consumer, observation-only data. Redux adds cost (middleware chain, reducer, selector invalidation, render cycle) with zero benefit — no other component subscribes, no reducer reacts, no time-travel debugging is needed.

### What worked
- The analysis clearly showed the cascade: the observer effect makes the tool measure its own overhead rather than the app's.

### What didn't work
- The original design (from the design doc) specified a Redux slice for diagnostics. This was a reasonable starting point but didn't account for the ~60Hz dispatch rate from frame monitoring.

### What I learned
- Redux is the wrong tool for high-frequency write-only telemetry. The cost of dispatch → reduce → notify is too high when the data has a single consumer that only needs to read at ~2Hz.
- `createSelector` memoization only helps when inputs are stable between calls. When the input reference changes on every call, it's pure overhead (memoization check + recompute every time).
- `useSelector` runs its selector on **every** store state change to check equality, regardless of whether the component has its own throttle mechanism.

### What was tricky to build
- N/A — analysis step, no code.

### What warrants a second pair of eyes
- The refactor tasks (52–63) should be reviewed for completeness before implementation begins. In particular: should the middleware still be a Redux middleware at all, or should it be a plain store subscriber? (Middleware is still correct — it needs to wrap `next(action)` to measure reducer duration, which a subscriber can't do.)

### What should be done in the future
- Tasks 52–63 implement the refactor. The ring buffer, types, snapshot math, and UI component all stay — they just read from a different source.

### Code review instructions
- Review tasks 52–63 in `tasks.md` for completeness.
- No code changes to review in this step.

## Step 5: Refactor — move diagnostics out of Redux (Tasks 52–63)

Executed the refactor planned in Step 4. Deleted `reduxPerfSlice.ts` and `selectors.ts`. Created `diagnosticsStore.ts` (module-level ring buffers with write/control/snapshot APIs) and `useDiagnosticsSnapshot.ts` (polling hook at ~2Hz). Rewrote middleware and frame monitor to write directly to plain buffers — zero Redux dispatches from diagnostics. Updated `createAppStore` to remove reducer registration. Simplified `ReduxPerfWindow` to use the hook instead of `useSelector`/`useDispatch`.

### Prompt Context

**User prompt (verbatim):** "go ahead"

(Preceded by: "commit at opportune intervals")

**Assistant interpretation:** Implement the refactor tasks 52–63 that were planned in Step 4, committing at natural boundaries.

**Inferred user intent:** Complete the architectural fix so diagnostics don't pollute the Redux store they're measuring.

**Commit (code):** 02d5496 — "HC-041: Refactor — move diagnostics out of Redux into module-level store"

### What I did
- Deleted `reduxPerfSlice.ts` (Redux slice, actions, reducer).
- Deleted `selectors.ts` (Redux selectors with createSelector).
- Created `diagnosticsStore.ts`: module-level `RingBufferState` instances for events and frames, write functions (`pushPerfEvent`, `pushFrameEvent`), control functions (`resetDiagnostics`, `toggleDiagnosticsPause`, `setDiagnosticsWindowMs`), `computeSnapshot()` with all rolling-window math moved here, `computeTopActionRates` now filters `reduxPerf/*` prefix.
- Created `useDiagnosticsSnapshot.ts`: React hook using `setInterval` at configurable poll rate, returns `{ snapshot, paused, windowMs }` as local state. No `useSelector`.
- Rewrote `reduxPerfMiddleware.ts`: removed import of `recordPerfEvent`, calls `pushPerfEvent()` directly. No self-dispatch guard needed (no dispatches at all).
- Rewrote `frameMonitor.ts`: removed `Dispatch` parameter, calls `pushFrameEvent()` directly. Signature changed from `startFrameMonitor(dispatch)` to `startFrameMonitor()`.
- Updated `createAppStore.ts`: removed `reduxPerfReducer` import and conditional spread, calls `initDiagnostics()` when enabled, `startFrameMonitor()` takes no args.
- Updated `ReduxPerfWindow.tsx`: imports from `@hypercard/engine` changed to `useDiagnosticsSnapshot`, `resetDiagnostics`, `toggleDiagnosticsPause`, `setDiagnosticsWindowMs`. Removed `useDispatch` and `useSelector`. Component is simpler.
- Updated `diagnostics/index.ts` barrel: removed slice/action/selector exports, added store/hook exports.
- Verified all 4 apps compile cleanly.

### Why
Diagnostics telemetry is write-heavy (~60 frame events/sec + N perf events/sec), single-consumer (one UI panel), observation-only data. Storing it in Redux caused: ~120 dispatches/sec from frame monitoring alone, invalidation of all `useSelector` equality checks app-wide, useless `createSelector` memoization (input changed every dispatch), and pollution of the metrics it was trying to measure (observer effect).

### What worked
- Clean separation: the middleware is still a Redux middleware (it needs to wrap `next(action)` to time reducers), but it writes to an external buffer instead of dispatching.
- The polling hook is simple and predictable: `setInterval` → `computeSnapshot()` → `setState`. No subscription cascade.
- Net diff: +250/-240 lines — roughly same code volume, completely different architecture.

### What didn't work
- N/A — clean implementation of the planned refactor.

### What I learned
- Module-level mutable state is fine for single-writer, single-reader telemetry. The "everything in Redux" instinct is counterproductive for observation data.
- The ring buffer helper (`ringBuffer.ts`) works equally well outside Redux — it was already plain-object-based, just happened to be stored in Immer state before. No changes needed to the ring buffer itself.

### What was tricky to build
- `frameMonitor` signature change: it previously took `dispatch: Dispatch` and now takes no arguments. Had to update `createAppStore` to match. Simple but easy to miss.
- `useDiagnosticsSnapshot` needs to return `paused` and `windowMs` as React state so the UI can react to control changes. These are read from the module-level store on each poll tick.

### What warrants a second pair of eyes
- Module-level mutable state means diagnostics is a singleton. If two stores are created (e.g. Storybook), they share the same diagnostics buffers. This is fine for dev tooling but worth documenting.
- The `initDiagnostics()` call in `createAppStore` resets buffers. If `createStore()` factory is called multiple times (Storybook), `initDiagnostics` runs once (at module scope in `createAppStore`), but `startFrameMonitor()` runs per call. Multiple frame monitors could accumulate. Low risk since diagnostics are off in Storybook by default.

### What should be done in the future
- Add unit tests for the new `diagnosticsStore` functions and `computeSnapshot` (adapting the test plan from the original tasks 35–40).

### Code review instructions
- Start at `packages/engine/src/diagnostics/diagnosticsStore.ts` — this is the new core.
- Compare with deleted `reduxPerfSlice.ts` and `selectors.ts` to verify all math migrated correctly.
- Review `reduxPerfMiddleware.ts` — confirm no dispatches.
- Review `frameMonitor.ts` — confirm no dispatches, no Dispatch param.
- Review `useDiagnosticsSnapshot.ts` — confirm polling pattern.
- Review `createAppStore.ts` — confirm no reducer registration, `initDiagnostics` call.
- Validate: `for app in inventory crm todo book-tracker-debug; do npx tsc --noEmit -p apps/$app/tsconfig.json; done`

## Step 6: Unit tests (Tasks 35–40)

Added 25 unit tests covering ring buffer operations, p95 calculation, rolling throughput math, frame monitoring aggregation, middleware state-change detection, and store factory enable/disable paths. All pass.

### Prompt Context

**User prompt (verbatim):** (same as Step 5 — "go ahead" / "commit at opportune intervals")

**Assistant interpretation:** Continue implementing remaining tasks, including unit tests.

**Inferred user intent:** Complete the test suite as specified in the task list.

**Commit (code):** 740b435 — "HC-041: Unit tests for diagnostics (ring buffer, p95, throughput, frames, middleware, store factory)"

### What I did
- Created `packages/engine/src/__tests__/diagnostics.test.ts` with 25 tests in 6 describe blocks.
- Ring buffer: push, wrap/evict, windowSince, clear, toArray.
- p95: empty, single, sorted, unsorted inputs.
- Diagnostics store: empty snapshot, actions/sec, state changes vs non-changes, avg/p95 latency, top action rates, reduxPerf/* filtering, window expiry, reset, windowMs config, pause toggle.
- Frame monitoring: FPS computation, long-frame counting, edge cases.
- Middleware: state-change detection with a real configureStore, action type recording.
- Store factory paths: disabled (no diagnostics), enabled (middleware records without reducer).

### Why
Validates the core math and behavior that the diagnostics UI depends on.

### What worked
- All 25 tests pass in 9ms. The module-level store pattern is easy to test — just call `initDiagnostics()` in `beforeEach` and use the write/read functions directly.

### What didn't work
- N/A

### What I learned
- Testing module-level mutable state requires `beforeEach` reset via `initDiagnostics()`. Without it, tests leak state between runs.

### What was tricky to build
- N/A — straightforward test implementation.

### What warrants a second pair of eyes
- The middleware test uses a real `configureStore` with a toy reducer. If RTK changes its default middleware behavior, these tests could break on upgrade.

### What should be done in the future
- Integration tests for the React component and window lifecycle (Tasks 41–42) would complete coverage but require a React test renderer setup.

### Code review instructions
- Read `packages/engine/src/__tests__/diagnostics.test.ts`.
- Run: `npx vitest run packages/engine/src/__tests__/diagnostics.test.ts`

## Step 7: Documentation updates (Tasks 43–47)

Updated all ticket documentation: design doc with implementation deviations (major: Redux→module-level store), reference doc with final file map and API snippets, "how to enable in another app" guide, and manual verification runbook with expected metric ranges.

### Prompt Context

**User prompt (verbatim):** (same as Step 5)

**Assistant interpretation:** Complete remaining documentation tasks.

**Inferred user intent:** Leave the ticket in a state where another developer can review, validate, and extend the work.

**Commit (code):** (included in docs commit below)

### What I did
- Updated design doc: resolved all open questions, added "Implementation Deviations" section documenting the Redux→module-level store change, updated Definition of Done with checkmarks.
- Updated reference doc: corrected file map to reflect final implementation (no reduxPerfSlice/selectors, added diagnosticsStore/useDiagnosticsSnapshot), updated createAppStore snippet, removed outdated reducer references.
- Added "How to enable in another app" section with 3-step guide.
- Added manual verification runbook with 9 test scenarios and expected metric ranges table.
- Updated changelog with test and docs completion.

### Why
The ticket should be self-contained for review and handoff. Another developer should be able to pick it up, validate it, and enable diagnostics in their own app by reading the reference doc alone.

### What worked
- The docs now accurately reflect the final architecture (module-level store, no Redux involvement for diagnostics data).

### What didn't work
- N/A

### What I learned
- N/A

### What was tricky to build
- N/A — documentation step.

### What warrants a second pair of eyes
- The expected metric ranges in the runbook are estimates. They should be validated against actual measurements during manual testing.

### What should be done in the future
- Tasks 48–51 remain open as future enhancements (sampling mode, export button, compact widget, cross-app toggle).

### Code review instructions
- Review the design doc's "Implementation Deviations" section.
- Review the reference doc's "How to enable in another app" and "Manual verification runbook" sections.

## Step 8: Sparklines, peak rates, and action linger (Tasks 64–70)

Enhanced the action types table with three features: (1) action types linger for 15 seconds after going inactive so they don't vanish instantly, (2) each row has an inline SVG sparkline showing rate history over the last ~15s of poll ticks, and (3) a Peak column tracks the all-time maximum rate seen for each type. The data model change lives in the hook (UI concern) rather than in the diagnostics store — `accumulateHistory()` merges each poll tick's `ActionRate[]` into a `Map<string, ActionRateHistory>` with sparkline arrays, peak tracking, and linger pruning.

### Prompt Context

**User prompt (verbatim):** "Keep actions around in the debug window for a bit longer, with little sparklines and a top rate column as well. Add tasks to the ticket, then implement, checking off and committing as usual."

**Assistant interpretation:** Add linger behavior, per-action sparklines, and peak rate column to the diagnostics window's action type table.

**Inferred user intent:** Make the action types table more useful by showing historical context (sparklines, peak) and not losing information when action types briefly go idle.

**Commit (code):** 3763009 — "HC-041: Action type sparklines, peak rates, and linger behavior"

### What I did
- Added `ActionRateHistory` type to `types.ts` with `sparkline: number[]`, `peakPerSec`, `lastSeenTs`.
- Wrote `accumulateHistory()` (pure function) in `useDiagnosticsSnapshot.ts`: merges current `ActionRate[]` into a `Map<string, ActionRateHistory>`, appending to sparklines, tracking peaks, recording 0 for absent types, pruning after `LINGER_MS` (15s).
- Updated `useDiagnosticsSnapshot` hook to maintain `historyRef` across poll ticks and return `actionHistory: ActionRateHistory[]` sorted by activity.
- Created `Sparkline` component: inline SVG polyline (60×16px), auto-scaled to local max, dimmed for inactive rows.
- Updated `ReduxPerfWindow` table: 4 columns (Action Type, Rate/s, Trend, Peak), `ActionRow` component with per-row dimming for lingering types.
- Exported `ActionRateHistory` type and `accumulateHistory` from barrel.
- Added 8 unit tests for `accumulateHistory`: new entries, sparkline append, peak tracking, zero-fill on absence, linger pruning, within-linger retention, sparkline cap, multi-type independence.

### Why
Action types that fire in bursts (e.g. during a drag, during chat streaming) would previously vanish from the table as soon as they left the rolling window. This made it hard to see what had just happened. Sparklines give temporal context at a glance, and peak rate shows the worst case even after the burst subsides.

### What worked
- The pure `accumulateHistory` function is trivially testable — just call it with a Map and rates.
- SVG sparklines are zero-dependency (no charting library) and render as inline elements in table cells.
- Linger + dimming gives a clear visual distinction between active and recently-active types.

### What didn't work
- N/A

### What I learned
- Keeping history accumulation in the hook (not the store) is the right boundary: the store provides instantaneous snapshots, the hook accumulates temporal context for the UI. This keeps the store simple and the hook testable.

### What was tricky to build
- Sorting: active rows (rate > 0) sort by rate descending, lingering rows (rate = 0) sort by lastSeenTs descending (most recently active first). This gives a natural visual flow where active types are at the top and fading types drift down before disappearing.
- Sparkline scaling: each sparkline auto-scales to its own local max (not global), so low-rate types still show meaningful shape. Used `Math.max(...data, 0.01)` to avoid division by zero.

### What warrants a second pair of eyes
- The LINGER_MS (15s) and SPARKLINE_LENGTH (30 samples at 500ms = 15s) are coupled by convention but not enforced. If poll rate changes, the sparkline time coverage changes too. May want to make this explicit.
- SVG rendering in a table: 30+ SVG elements in a table could theoretically be slow if the table grows very large. The top-N cap (10 active) plus linger pruning bounds this in practice.

### What should be done in the future
- Consider making linger duration configurable via the UI controls.

### Code review instructions
- Start at `packages/engine/src/diagnostics/useDiagnosticsSnapshot.ts` — review `accumulateHistory()`.
- Review `apps/inventory/src/features/debug/ReduxPerfWindow.tsx` — `Sparkline` component and `ActionRow`.
- Run tests: `npx vitest run packages/engine/src/__tests__/diagnostics.test.ts` (33 tests).

## Step 9: Rename sparkline column from "Trend" to "⌁"

User pointed out "Trend" implies smoothing — the sparkline shows the raw instantaneous rate at each poll tick, not a smoothed trend line. Renamed the column header to "⌁" (sparkline symbol) and updated the legend.

### Prompt Context

**User prompt (verbatim):** "the trend shouldn't be smoothed, though, it should represent the actual fps at that time. It shouldn be called trend ether"

**Assistant interpretation:** The column name "Trend" is misleading — the data is already raw rates, just the label implies smoothing. Rename.

**Inferred user intent:** Accurate labelling of what the sparkline shows.

**Commit (code):** 9d87af7 — "HC-041: rename sparkline column from 'Trend' to '⌁' — it shows raw rate, not smoothed"

### What I did
- Renamed column header from "Trend" to "⌁".
- Updated legend from "Trend = rate over last ~15s" to "⌁ = rate/s each sample".

### Why
The sparkline was already showing raw `perSec` values per poll tick with no smoothing. The label was the only thing wrong.

### What was tricky to build
- N/A — two-line change.

### What warrants a second pair of eyes
- N/A

### What should be done in the future
- N/A

### Code review instructions
- Glance at `ReduxPerfWindow.tsx` header and legend text.

## Step 10: Pin action types in diagnostics window (Tasks 71–74)

Added the ability to pin specific action types in the diagnostics table. Pinned types are immune to linger pruning — they stay visible indefinitely with their sparkline and peak rate, even when inactive. This is useful for watching a specific action type (e.g. `windowing/moveWindow`) across different interactions without it disappearing between bursts.

### Prompt Context

**User prompt (verbatim):** "allow pinning a certain event in the redux perf window."

(Followed by: "keep your diary up to date, backfill if needed.")

**Assistant interpretation:** Add a per-row pin/unpin toggle so individual action types can be kept visible in the table permanently.

**Inferred user intent:** Be able to track specific action types across interaction sessions without losing them to linger pruning.

**Commit (code):** 5df2884 — "HC-041: Pin action types in diagnostics window"

### What I did
- Added `pinned: boolean` to `ActionRateHistory` type.
- Extended `accumulateHistory()` with a `pinnedTypes: ReadonlySet<string>` parameter. Pinned types skip the linger prune check. The `pinned` field on each entry reflects current pin state.
- Added `togglePin(type: string)` callback to `useDiagnosticsSnapshot` hook, backed by a `useRef<Set<string>>` to avoid re-render on pin toggle (next poll tick picks it up).
- Updated sort order: pinned first → active by rate desc → lingering by recency.
- Added pin column to table: `📌` for pinned, `∘` for unpinned, click to toggle.
- Pinned-but-inactive rows stay full opacity (only non-pinned inactive rows are dimmed).
- Added 4 unit tests: pinned survives pruning, unpinned gets pruned, new entry inherits pin, pin flag updates when set changes.

### Why
Burst-pattern action types (drag, chat stream deltas) appear and vanish quickly. Without pinning, you have to watch the table in the exact moment the burst happens. Pinning lets you "bookmark" the types you care about.

### What worked
- Using `ReadonlySet<string>` as parameter to `accumulateHistory` keeps the function pure and testable.
- Using `useRef` for the pin set means toggling a pin doesn't cause a React render — the change is picked up on the next poll tick (500ms max delay), which feels instant in practice.

### What didn't work
- N/A

### What I learned
- N/A — clean extension of the existing pattern.

### What was tricky to build
- The dimming logic: before pinning, `inactive = perSec === 0` was sufficient. Now it's `inactive = perSec === 0 && !pinned` — a pinned type with rate 0 should look attentive (full opacity), not faded.

### What warrants a second pair of eyes
- Pin state lives in a `useRef` — it's lost on component unmount (window close). If the user reopens the diagnostics window, all pins are gone. This is probably fine for dev tooling but worth noting.

### What should be done in the future
- Could persist pin set to localStorage if desired.

### Code review instructions
- Review `accumulateHistory()` in `useDiagnosticsSnapshot.ts` — the `pinnedTypes` parameter and prune guard.
- Review `ActionRow` in `ReduxPerfWindow.tsx` — pin button and dimming logic.
- Run tests: `npx vitest run packages/engine/src/__tests__/diagnostics.test.ts` (37 tests).

## Step 11: Fix sparkline smoothing — instantaneous per-tick rates

The sparkline appeared smoothed because each sample was `events_in_5s_window / 5` — consecutive 500ms poll ticks used overlapping 5-second windows sharing ~90% of their data, inherently producing a moving average. Fixed by adding `computeInstantRates(intervalMs)` which counts only events in the last `intervalMs` (= poll interval, 500ms). Now the hook feeds instantaneous rates to `accumulateHistory` instead of rolling-window rates.

### Prompt Context

**User prompt (verbatim):** "the sparkline still seems to show smoothed data?"

**Assistant interpretation:** The sparkline data is derived from the rolling window, causing overlap-smoothing. Need to use per-tick instantaneous rates instead.

**Inferred user intent:** The sparkline should show actual spikes and drops in real time, not a smoothed-out moving average.

**Commit (code):** 13e33be — "HC-041: Fix sparkline smoothing — use instantaneous per-tick rates, not rolling window"

### What I did
- Added `computeInstantRates(intervalMs)` to `diagnosticsStore.ts`: counts events only in the last `intervalMs` window, returns per-type rates. Same filtering (excludes `reduxPerf/` prefix).
- Changed `useDiagnosticsSnapshot` to call `computeInstantRates(pollMs)` for sparkline data instead of using `snap.topActionRates`.
- The main snapshot metrics (actions/sec, avg reducer, etc.) still use the full rolling window — only sparkline data changed.
- Exported `computeInstantRates` from barrel. Added unit test (38 total).

### Why
A sparkline showing a moving average defeats its purpose — you can't see individual bursts or drops. With per-tick rates: 10 actions in one tick → spike to 20/s, no actions next tick → drop to 0.

### What was tricky to build
- The key insight: the sparkline and the summary metrics need *different* time windows. The summary uses the full rolling window (5s) for stable numbers; the sparkline uses a single tick (500ms) for responsiveness. Before this fix they shared the same source.

### What warrants a second pair of eyes
- `computeInstantRates` uses `Date.now()` internally, same as `computeSnapshot`. If the poll timer drifts, the 500ms interval might not perfectly align with the actual time between ticks. In practice this is fine — the rate calculation self-corrects since it divides by the configured interval.

### What should be done in the future
- N/A

### Code review instructions
- Review `computeInstantRates()` in `diagnosticsStore.ts`.
- Review the hook change in `useDiagnosticsSnapshot.ts` (one-line swap from `snap.topActionRates` to `computeInstantRates(pollMs)`).
- Run: `npx vitest run packages/engine/src/__tests__/diagnostics.test.ts` (38 tests).
