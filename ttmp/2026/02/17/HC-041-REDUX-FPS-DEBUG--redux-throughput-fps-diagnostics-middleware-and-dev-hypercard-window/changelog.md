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

