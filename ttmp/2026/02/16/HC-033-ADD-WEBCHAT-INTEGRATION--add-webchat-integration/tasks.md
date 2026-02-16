# Tasks

## TODO

### 0. Decision freeze

- [x] D0.1 Confirm runtime override policy for MVP (`disabled` vs `debug-flag-only`).
- [x] D0.2 Confirm assistant surface strategy at cutover (`remove plugin assistant` vs `temporary feature flag`).
- [x] D0.3 Confirm default card open behavior (`dedupe per artifact` vs `always new window`).
- [x] D0.4 Freeze `hypercard.widget.v1` schema.
- [x] D0.5 Freeze `hypercard.card_proposal.v1` schema.
- [x] D0.6 Lock no-fallback policy for widget/card generation (model-authored only).
- [x] D0.7 Lock title-gated `*.start` lifecycle event rule.
- [x] D0.8 Remove mandatory structured-block enforcement for every assistant turn (no missing-block errors by default).

### 1. Glazed command and backend scaffolding (`go-inventory-chat`)

- [x] B1.1 Create Go module under `2026-02-12--hypercard-react/go-inventory-chat`.
- [x] B1.2 Create `cmd/hypercard-inventory-server/main.go` using Glazed command pattern.
- [x] B1.3 Wire `clay.InitGlazed`, help system, and logger bootstrap.
- [x] B1.4 Add command flags for addr/root and persistence (`timeline-*`, `turns-*`).
- [x] B1.5 Add Geppetto section wiring for provider/model settings.
- [x] B1.6 Add backend README with run examples and env requirements.

### 2. Pinocchio webchat composition (reuse-first)

- [x] B2.1 Implement runtime composer in Pinocchio style (`ComposeEngineFromSettings`).
- [x] B2.2 Implement strict request resolver (`conv_id` policy and runtime locking).
- [x] B2.3 Build server with `webchat.NewServer` and `WithRuntimeComposer`.
- [x] B2.4 Mount app-owned routes (`/chat`, `/ws`, `/api/timeline`, `/api/*`).
- [x] B2.5 Keep timeline/turn persistence via router settings only (no custom store layer).
- [x] B2.6 Add integration tests for `/chat`, `/ws`, and `/api/timeline` baseline behavior.

### 2.5 Early frontend cutover (minimal streaming round-trip)

- [x] F2.5.1 Add inventory Vite proxy for `/chat`, `/ws`, `/api`.
- [x] F2.5.2 Add minimal transport module (`conv_id` persistence, ws attach, prompt submit).
- [x] F2.5.3 Replace inventory fake-stream path for primary chat surface at this checkpoint.
- [x] F2.5.4 Implement minimal reducer path for `llm.start/delta/final` (+ optional `tool.*` display).
- [x] F2.5.5 Render minimal streaming chat in app-window and verify send/receive loop.
- [x] F2.5.6 Add end-to-end smoke test for round-trip (`UI -> /chat -> /ws -> streamed text`).
- [x] F2.5.7 Keep artifact/card lifecycle rendering disabled until later phases.

### 3. SQLite inventory domain

- [x] B3.1 Implement SQLite open/migrate helpers.
- [x] B3.2 Create `items` schema.
- [x] B3.3 Create `sales` schema.
- [x] B3.4 Add deterministic seed data files.
- [x] B3.5 Add reset/seed command in ticket scripts or backend cmd.
- [x] B3.6 Add repository/query methods used by tools.
- [x] B3.7 Add tests for migration and seed idempotency.

### 4. Inventory tools

- [x] B4.1 Implement `inventory_search_items`.
- [x] B4.2 Implement `inventory_get_item`.
- [x] B4.3 Implement `inventory_low_stock`.
- [x] B4.4 Implement `inventory_report`.
- [x] B4.5 Implement `inventory_update_qty`.
- [x] B4.6 Implement `inventory_record_sale`.
- [x] B4.7 Register tool factories in server bootstrap.
- [x] B4.8 Restrict runtime allowed-tools list.
- [x] B4.9 Add tool contract tests (validation + output shape).

### 5. Geppetto middleware-driven artifact/card generation

- [x] B5.1 Add `inventory_artifact_policy` middleware package.
- [x] B5.2 Ensure policy middleware injects stable structured output instructions.
- [x] B5.3 Add `inventory_artifact_generator` middleware package.
- [x] B5.4 Ensure middleware does not synthesize fallback success payloads (strict no-fallback behavior).
- [x] B5.5 Ensure malformed structured outputs are surfaced as explicit error lifecycle events.
- [x] B5.6 Add middleware factories and runtime middleware config wiring.
- [x] B5.7 Add middleware unit tests for deterministic generation and idempotence.
- [x] B5.8 Add optional `inventory_suggestions_policy` middleware for model-authored follow-up chips.

### 6. Structured extraction and SEM mapping

- [x] B6.1 Define custom event types for widget/card extractor outputs.
- [x] B6.2 Register Geppetto event factories/codecs for custom events.
- [x] B6.3 Implement `hypercard/widget/v1` extractor.
- [x] B6.4 Implement `hypercard/cardproposal/v1` extractor.
- [x] B6.5 Wire `WithEventSinkWrapper` + `structuredsink.NewFilteringSink`.
- [x] B6.6 Emit widget lifecycle events (`start`, `update`, `v1`, `error`) from extractor session.
- [x] B6.7 Emit card lifecycle events (`start`, `update`, `card_proposal.v1`, `error`) from extractor session.
- [x] B6.8 Enforce title-gated `start` emission in extractor logic.
- [x] B6.9 Register SEM mappings for all widget/card lifecycle events.
- [x] B6.10 Register timeline handlers for lifecycle projection (`status` + `tool_result` upserts).
- [x] B6.11 Add extractor tests for fragmented tags, malformed blocks, title-gated start, and success paths.
- [x] B6.12 Add websocket integration tests for progressive lifecycle events.
- [x] B6.13 Implement `hypercard:suggestions:v1` extractor with progressive `start/update/v1/error` events.
- [x] B6.14 Register SEM mappings for `hypercard.suggestions.*` events.

### 7. Frontend artifact-aware expansion (post-round-trip cutover)

- [x] F7.1 Add SEM envelope parser/type guards for widget/card lifecycle events.
- [x] F7.2 Extend reducer model to handle widget/card lifecycle events.
- [x] F7.3 Add reducer/UI state for spinner rows driven by `*.start` and `*.update`.
- [ ] F7.4 Add reducer tests for streaming order, title-gated starts, and event attachment.
- [x] F7.5 Validate regression-free behavior for minimal round-trip flow introduced in Phase 2.5.
- [x] F7.6 Add Storybook stories for the timeline widget renderer.
- [x] F7.7 Add separate in-chat widget panels for generated cards and generated widgets.
- [x] F7.8 Map `hypercard.suggestions.*` events into existing chat suggestions widget with incremental fill.
- [x] F7.9 Add reducer tests for suggestion merge/replace normalization.

### 8. Chat window integration

- [ ] F8.1 Implement inventory chat app-window component based on engine `ChatWindow`.
- [ ] F8.2 Wire custom widget renderer for `hypercard.widget.v1` content blocks.
- [ ] F8.3 Auto-open chat window on app start with stable dedupe key.
- [ ] F8.4 Wire send/actions to transport and reducer actions.
- [ ] F8.5 Add smoke test for app-window chat mount and send flow.

### 9. Artifact/card runtime integration

- [x] F9.1 Add artifacts state keyed by artifact id.
- [x] F9.2 Upsert artifact state on `hypercard.widget.v1` and `hypercard.card_proposal.v1`.
- [x] F9.3 Add template cards for report/item viewers.
- [x] F9.4 Wire card open action dispatch with `artifactId` parameter.
- [x] F9.5 Add tests for action payload and window/card opening behavior.

### 10. Timeline hydration and persistence validation

- [x] F10.1 Add timeline bootstrap call (`/api/timeline`).
- [x] F10.2 Map timeline entities back into chat/artifact state.
- [x] F10.3 Define and implement merge policy for hydrate + live frames.
- [x] F10.4 Add refresh/reload persistence tests.
- [x] F10.5 Validate turn persistence by checking turn store snapshots.
- [x] F10.6 Validate lifecycle projection behavior for status/tool_result entities (`start/update/ready/error`).

### 11. Hard-cut cleanup and final verification

- [ ] C11.1 Remove inventory fake-stream dependencies from runtime path.
- [ ] C11.2 Remove duplicate assistant surfaces per final decision.
- [ ] C11.3 Run backend unit/integration tests.
- [ ] C11.4 Run frontend tests/smoke checks.
- [ ] C11.5 Document final runbook and known limitations.

### 12. Deferred (post-MVP)

- [ ] A12.1 Dynamic plugin code injection from card proposals.
- [ ] A12.2 Review/approve UX for generated plugin card definitions.
- [ ] A12.3 Extended runtime override policies for multi-runtime environments.
