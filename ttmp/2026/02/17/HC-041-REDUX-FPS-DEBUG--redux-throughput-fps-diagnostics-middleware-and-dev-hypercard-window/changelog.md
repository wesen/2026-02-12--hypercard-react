# Changelog

## 2026-02-17

- Initial workspace created


## 2026-02-17

Initialized HC-041 with detailed implementation plan, developer handoff map, and comprehensive task breakdown for generic Redux throughput/FPS diagnostics middleware and dev HyperCard window integration.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/design-doc/01-implementation-plan-redux-throughput-fps-diagnostics-middleware-and-dev-window.md — Implementation design and rollout phases
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/reference/01-developer-handoff-file-map-hypercard-window-integration-and-middleware-wiring.md — Context handoff and integration snippets
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/tasks.md — Detailed execution checklist


## 2026-02-17

Phase 1: Created diagnostics module with types, ring buffer, middleware, frame monitor, slice, and selectors (commit c285f0d)

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/diagnostics/index.ts — New diagnostics module barrel


## 2026-02-17

Design review: identified that storing diagnostics data in Redux (reduxPerfSlice, recordPerfEvent/recordFrameEvent actions) causes ~120 dispatches/sec overhead from frame monitoring alone, pollutes top-action-rates, and invalidates all useSelector calls app-wide. Added 12 refactor tasks (52–63) to move all diagnostics state to module-level plain ring buffers with a polling hook.


## 2026-02-17

Refactor complete (tasks 52–63, commit 02d5496): moved all diagnostics out of Redux. Deleted reduxPerfSlice.ts + selectors.ts. Added diagnosticsStore.ts (module-level ring buffers) + useDiagnosticsSnapshot.ts (polling hook). Middleware and frame monitor no longer dispatch. Zero Redux overhead from diagnostics.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/diagnostics/diagnosticsStore.ts — New module-level diagnostics storage (replaces reduxPerfSlice)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/diagnostics/useDiagnosticsSnapshot.ts — New polling hook (replaces useSelector)


## 2026-02-17

Unit tests complete (25 tests, commit 740b435). Docs updated: design doc with deviations, reference doc with final file map, enablement guide, and manual verification runbook.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/diagnostics.test.ts — 25 unit tests for diagnostics


## 2026-02-17

Sparklines, peak rates, and linger behavior added (tasks 64–70, commit 3763009). Action types now stay visible for 15s after going idle, with a dimmed sparkline showing their recent history. Peak column tracks all-time max rate.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/debug/ReduxPerfWindow.tsx — Sparkline SVG + 4-column table
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/diagnostics/useDiagnosticsSnapshot.ts — accumulateHistory + linger logic


## 2026-02-17

Action type pinning added (tasks 71–74, commit 5df2884). Pinned types survive linger pruning, sort to the top, and stay visible indefinitely until unpinned.

