# Changelog

## 2026-02-21

- Initial workspace created


## 2026-02-21

Added comprehensive root-cause bug report with evidence, mitigation summary, unresolved hypotheses, and an intern-ready investigation/test plan; this ticket supersedes HC-54 for lifecycle root-cause closure.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md — Primary handoff artifact for root-cause investigation


## 2026-02-21

Uploaded bug report PDF to reMarkable folder /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE for intern handoff.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md — Uploaded to reMarkable as handoff packet


## 2026-02-22

Expanded HC-55 analysis with a full Go vs frontend timeline-path breakdown: websocket live SEM path, `/api/timeline` hydration path, backend projection ordering (`version ASC` by entity last write), frontend merge/order semantics, suggestions persistence gap, and ring-buffer usage boundaries.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md — Added detailed architecture/discrepancy analysis and intern-ready implementation guidance
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/tasks.md — Replaced placeholder tasks with concrete follow-up work items and checkboxes

## 2026-02-22

Added HC-55 diary entry documenting investigation commands, path-resolution failure, conclusions, and review guidance for continuation.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/reference/01-diary.md — Detailed step log for this analysis expansion

## 2026-02-22

Uploaded refreshed HC-55 handoff bundle (updated analysis + diary) to reMarkable for intern onboarding continuity.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md — Included in refreshed upload bundle
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/reference/01-diary.md — Included in refreshed upload bundle

## 2026-02-22

Locked implementation contracts from user decisions and replaced exploratory TODOs with executable tasks for sequential implementation.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/tasks.md — Updated tasks to reflect chosen architecture contracts and implementation order

## 2026-02-22

Implemented canonical first-seen ordering in backend timeline stores (SQLite and in-memory), changing hydration snapshots to return entities in chronological creation order rather than last-update version order.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go — Switched snapshot query ordering to `created_at_ms ASC, entity_id ASC`
- /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_memory.go — Mirrored first-seen ordering in in-memory snapshot sorting
- /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite_test.go — Updated ordering expectations
- /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_memory_test.go — Updated ordering expectations

## 2026-02-22

Added inventory backend timeline projection for `hypercard.suggestions.*` events, upserting a single `suggestions:assistant` entity so suggestions persist through hydration and converge on latest-block semantics.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Added suggestions timeline handlers and canonical props payload
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_timeline_handlers_test.go — Added projection regression test for suggestions handlers

## 2026-02-22

Made frontend persisted timeline entities backend-authoritative by relying on `timeline.upsert` for message/tool/hypercard timeline materialization, while retaining LLM metadata/session telemetry updates.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.ts — Removed local persisted entity projection from direct llm/tool SEM handlers
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts — Stopped registering direct hypercard SEM timeline mutators
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.test.ts — Updated tests and added suggestion re-visibility regression for backend-driven upserts
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/registerChatModules.test.ts — Updated module test expectations for backend-driven suggestions
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardWidget.test.ts — Updated to assert timeline.upsert mapping path
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardCard.test.ts — Updated to assert timeline.upsert mapping path

## 2026-02-22

Added explicit websocket lifecycle instrumentation hooks and regression coverage for the StrictMode-style remount path (`connect -> disconnect -> reconnect -> hydrate`) to verify post-contract behavior and buffered replay ordering.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Added `onLifecycle` tracing hooks for connect/hydrate/replay/disconnect phases
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.test.ts — Added remount lifecycle regression test and aligned live/buffered frame tests with backend-authoritative `timeline.upsert`
- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/tasks.md — Marked final instrumentation task complete

## 2026-02-22

Ticket status set to `complete` per user directive after execution tasks were finished.

### Related Files

- /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/index.md — Ticket closure status updated
