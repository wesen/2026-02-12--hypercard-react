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
RelatedFiles: []
ExternalSources: []
Summary: "Step-by-step implementation diary for HC-041: Redux throughput/FPS diagnostics middleware and dev HyperCard window."
LastUpdated: 2026-02-17T08:41:40.019504409-05:00
WhatFor: "Track implementation progress, decisions, issues, and review instructions for HC-041."
WhenToUse: "Use when reviewing, continuing, or onboarding on HC-041 diagnostics work."
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
