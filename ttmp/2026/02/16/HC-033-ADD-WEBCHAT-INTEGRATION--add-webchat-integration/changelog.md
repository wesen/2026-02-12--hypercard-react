# Changelog

## 2026-02-16

- Initial workspace created.

- Completed planning-only validation pass: imported design checked against current codebase, hard-cutover implementation plan authored, and detailed phased task breakdown added.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md — Primary validated architecture and phased plan
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Step-by-step planning diary
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Detailed dependency-aware implementation checklist

## 2026-02-16

Uploaded planning bundle to reMarkable after dry-run validation (HC-033 Planning Package -> /ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/changelog.md — Upload event recorded
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Diary updated with upload and hygiene details

## 2026-02-16

Revised planning artifacts to enforce Glazed command composition, maximum Pinocchio `pkg/webchat` reuse, middleware-driven artifact/card generation, and Pinocchio-owned timeline/turn persistence.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md — Updated architecture and phased plan with new framework constraints
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Updated detailed task breakdown for Glazed/Pinocchio/middleware execution
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Added detailed planning revision step and validation notes

## 2026-02-16

Uploaded refreshed planning package to reMarkable so the remote copy matches the revised Glazed/Pinocchio/middleware plan.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md — Included in uploaded v2 bundle
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Included in uploaded v2 bundle
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Included in uploaded v2 bundle

## 2026-02-16

Locked planning decisions for strict no-fallback artifact/card behavior and progressive YAML lifecycle events with title-gated start emission, and updated design/tasks/index accordingly.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md — Updated event contract, timeline projection plan, and locked decisions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Added lifecycle/timeline tasks and marked decision locks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/index.md — Updated pending vs locked decisions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Added detailed Step 5 planning log

## 2026-02-16

Added an explicit Phase 2.5 early frontend cutover milestone for minimal streaming round-trip validation, and re-scoped later frontend work as artifact-aware expansion.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md — Added Phase 2.5 and adjusted downstream phase descriptions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Added `F2.5.*` task block and split later frontend tasks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/index.md — Added overview note for early round-trip checkpoint
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Added detailed Step 7 planning log

## 2026-02-16

Implemented Phase 2.5 frontend hard cutover to real /chat + /ws streaming, added reducer tests + Playwright smoke script, and validated round-trip with tmux backend/frontend sessions (commit 42a085d).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Desktop app-window cutover to InventoryChatWindow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Streaming reducer for llm events
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts — Real transport with conv_id persistence and ws attach
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/vite.config.ts — Proxy /chat /ws /api to backend
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/scripts/smoke-roundtrip-playwright.mjs — Round-trip smoke automation


## 2026-02-16

Implemented Phase 3/4 backend slice: SQLite inventory domain + deterministic seed/reset path + inventory tool suite registration with allowed-tools lock; validated with go tests and refreshed tmux+Playwright smoke flow (commit 5c489c5).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-seed/main.go — Reset/seed utility command
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-server/main.go — Server bootstrap wiring for DB + tools + allowed-tools
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-server/tools_inventory.go — Inventory tool definitions and factories
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-server/tools_inventory_test.go — Tool contract and validation tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/inventorydb/store.go — SQLite domain store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/inventorydb/store_test.go — Migration/seed idempotency and mutation tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/scripts/reset-seed-inventory-db.sh — Operator reset/seed script

## 2026-02-16

Improved chat event rendering for tool lifecycle visibility: tool start events now include structured arguments, tool delta patches are displayed, and tool done events are rendered in the chat stream (commit 86f04bd).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Added tool args/delta/done rendering

## 2026-02-16

Implemented backend Phases 5/6 end-to-end: middleware-driven artifact policy/generator, strict no-fallback missing/malformed error surfacing, structured sink extractors, custom event factory+SEM mappings, timeline projection handlers, and websocket lifecycle integration tests (commit d31dc7c).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_middleware.go — Artifact policy + generator middleware implementations
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_extractors.go — Widget/cardproposal progressive YAML extractors + sink wrapper
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Custom event types, factory registration, SEM mappings, timeline handlers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/runtime_composer.go — Middleware factory/runtime wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-server/main.go — Registered extensions and sink wrapper in server bootstrap
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_extractors_test.go — Extractor + middleware unit tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-server/main_integration_test.go — Websocket progressive lifecycle integration test

## 2026-02-16

Replaced event-spam system lines with a persistent in-chat timeline widget (`inventory.timeline`) that upserts tool/hypercard/timeline states in place, including tool call args and success/error transitions (commit 43751e6). Restarted tmux backend/frontend sessions and verified live round-trip behavior with Playwright.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Added timeline widget message model and `upsertTimelineItem` reducer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Routed SEM events into timeline upserts and added `renderWidget` for timeline display
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts — Updated selector typing for `ChatWindowMessage`
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.test.ts — Added reducer test ensuring single timeline widget message with in-place item updates

## 2026-02-16

Improved timeline widget richness and display hygiene: AI/system messages now strip trailing whitespace before render, and timeline card/widget projections now include structured metadata (kind/template/artifact) instead of generic `projected` labels. Added standalone Storybook stories for the new timeline widget component.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Richer SEM->timeline mapping and display-message whitespace normalization
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Timeline item metadata fields and trailing-whitespace sanitization for finalized/system text
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryTimelineWidget.tsx — Reusable rich timeline widget renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/stories/InventoryTimelineWidget.stories.tsx — New timeline widget stories
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.test.ts — Added trimming and metadata-preservation reducer tests

## 2026-02-16

Authored a textbook-style onboarding playbook for widget/timeline/event integration (5+ pages) covering architecture, API signatures, lifecycle contracts, timeline projection semantics, frontend renderer behavior, end-to-end extension cookbook, testing workflows, and operational guardrails for new developers.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/02-widget-timeline-event-integration-playbook.md — New comprehensive integration playbook
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/index.md — Added playbook to index links and related files

## 2026-02-16

Added separate in-chat artifact panels for generated cards and generated widgets (in addition to the run timeline), wired panel updates from lifecycle/timeline event mapping, and added Storybook coverage for the new panel widgets.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Added `upsertCardPanelItem` and `upsertWidgetPanelItem` reducers plus dedicated widget message IDs
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Fan-out mapping from card/widget lifecycle events into dedicated panel upserts and widget render switch
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx — New card/widget panel renderer components
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/stories/InventoryArtifactPanelWidgets.stories.tsx — Storybook stories for card/widget panel widgets
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.test.ts — Added reducer test validating dedicated card/widget panel messages

## 2026-02-16

Removed runtime enforcement that emitted \"missing structured widget/card block\" errors on assistant turns without structured tags. The runtime now allows non-structured replies without forcing error events, while keeping normal structured lifecycle parsing when tags are present.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/runtime_composer.go — Removed `inventory_artifact_generator` middleware from active runtime chain
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Recorded decision lock for no mandatory structured-block enforcement

## 2026-02-16

Added optional model-authored suggestion chips end-to-end: runtime suggestions policy middleware, progressive `hypercard.suggestions.*` structured events, and frontend incremental chip updates wired into the existing `chat-suggestions` widget. Also updated the integration playbook/tasks to reflect the no-mandatory-structured-block policy and the new suggestions event flow.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_middleware.go — Added `inventory_suggestions_policy` middleware and shared system-block upsert helper
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_extractors.go — Added `hypercard:suggestions:v1` extractor with progressive parse sessions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — Added suggestions event types + SEM mappings
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Mapped `hypercard.suggestions.*` events to suggestion-chip reducer actions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Added suggestions state and merge/replace normalization
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Added `showSuggestionsAlways` support for streaming-time suggestion updates
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/02-widget-timeline-event-integration-playbook.md — Updated playbook for suggestions + no mandatory structured blocks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Checked off suggestions-related backend/frontend tasks

## 2026-02-16

Locked remaining Phase 0 decisions (runtime override policy, single assistant surface, dedupe behavior, schema freezes) and completed Phase 9 artifact/card runtime integration: added artifact state keyed by `artifactId`, wired upserts from structured lifecycle events, introduced report/item viewer template cards, and wired card-panel open actions to deduped card windows with `artifactId` nav param (commit `fe56bb3`).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactsSlice.ts — New artifact state domain keyed by artifact id
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.ts — SEM artifact extraction + template mapping + open-window payload builder
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Artifact upsert dispatch and open-card action wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx — Added per-row Open action for generated card/widget artifacts
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts — Added `reportViewer` and `itemViewer` template card ids
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js — Added plugin card implementations for report/item artifact viewers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.test.ts — Tests for open-window payload and artifact extraction behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactsSlice.test.ts — Artifact reducer tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Marked `D0.1..D0.5` and `F9.1..F9.5` complete
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/index.md — Updated locked decision list and execution focus
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md — Converted open decisions to resolved decisions

## 2026-02-16

Completed Phase 10 timeline hydration + persistence validation: frontend now bootstraps from `/api/timeline` before websocket attach, hydration merges cleanly with live frames by message/tool ids, timeline projection mapping has dedicated unit coverage for `status`/`tool_result`, reload-hydration smoke script passes, and backend integration now asserts durable turn snapshot persistence via SQLite turn store (commit pending).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Added timeline bootstrap/hydration flow and merged projection wiring via shared mapper
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts — Added `/api/timeline` snapshot client
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Added `upsertHydratedMessage` merge behavior for hydrate/live convergence
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.test.ts — Added hydrate/live merge policy tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/timelineProjection.ts — New pure timeline projection mapper for `timeline.upsert` entities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts — New status/tool_result projection tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/cmd/hypercard-inventory-server/main_integration_test.go — Added turn store persistence integration test
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/scripts/smoke-reload-hydration-playwright.mjs — Added reload/hydration Playwright smoke script
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Marked `F10.1..F10.6` complete

## 2026-02-16

Completed Phase 11 hard-cut cleanup and final verification pass: removed remaining plugin-side AI assistant surface (single chat surface policy), confirmed no fake-stream runtime path remains in inventory app wiring, re-ran backend/frontend validations and both Playwright smokes, and documented the final operator runbook + known limitations in backend README.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts — Removed legacy `assistant` card metadata entry
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js — Removed `assistant` card implementation/state and home "Ask AI" nav action
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/stories/CardPages.stories.tsx — Removed assistant story export to match hard-cut surface policy
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/README.md — Added end-to-end runbook and known-limitation section
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Marked `C11.1..C11.5` complete

## 2026-02-16

Reconciled remaining non-deferred checklist items with delivered implementation/tests: marked `F7.4` and `F8.1..F8.5` complete based on existing reducer/projection tests, app-window cutover wiring, and smoke coverage already present in the codebase.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md — Marked `F7.4` and `F8.1..F8.5` complete
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/index.md — Updated execution-focus summary after non-deferred phase completion

## 2026-02-16

Authored and stored a comprehensive HC-032 + HC-033 consolidated technical postmortem (10+ page textbook-style continuation guide), then uploaded it to reMarkable as `HC-032-HC-033 Consolidated Technical Postmortem` under `/ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION`.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/03-hc032-hc033-consolidated-technical-postmortem-and-continuation-guide.md — New consolidated postmortem and continuation document
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/index.md — Added postmortem link in ticket index
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md — Added execution diary step for postmortem authoring and upload
