# Changelog

## 2026-02-22

- Initial workspace created


## 2026-02-22

Closed HC-01 and HC-55 per user directive and opened HC-56 for focused little-bug follow-up on widget error projection/remap behavior.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-01-QOL-IMPROVEMENTS--hypercard-react-qol-improvements-analysis/index.md — Status changed to complete
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/index.md — Status changed to complete
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/22/HC-56-LITTLE-BUGS--little-bugs-follow-up-widget-error-timeline-handling/analysis/01-hypercard-widget-error-timeline-handling-gap.md — New focused analysis

## 2026-02-22

Implemented widget-error projection/remap fix: backend now projects `hypercard.widget.error` to canonical widget timeline kind, frontend remapper surfaces error status/detail, and regression tests cover Go projector + TS mapper behavior (commit 460db7b).

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Added `hypercard.widget.error` result projection and error field propagation
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_timeline_handlers_test.go — Added widget error projection regression test
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts — Map widget/card errors to `status=error` and detailed message
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.test.ts — Added widget error remap regression test
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/22/HC-56-LITTLE-BUGS--little-bugs-follow-up-widget-error-timeline-handling/tasks.md — Marked implementation tasks complete

## 2026-02-22

Fixed widget open/edit UX and hydration artifact projection mismatch (commit 23e6a8d): widget `Edit` now opens code editor window, and artifact projection middleware now handles `timeline.mergeSnapshot` so hydrated artifacts are available to report/item viewers.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardWidget.tsx — Split Open vs Edit behavior for widgets
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.ts — Added `mergeSnapshot` projection path
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts — Added mergeSnapshot regression test
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/22/HC-56-LITTLE-BUGS--little-bugs-follow-up-widget-error-timeline-handling/analysis/02-widget-open-edit-behavior-and-hydration-artifact-projection-gap.md — Added focused bug analysis
