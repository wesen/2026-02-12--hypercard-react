# Tasks

## TODO

- [x] Add tasks here
  Task explanation and bigger refactor purpose: establish explicit execution tracking so refactor work is auditable and can resume without ambiguity.

- [x] Validate proposal against current engine/inventory runtime implementation
  Task explanation and bigger refactor purpose: remove design assumptions that do not match real code paths before starting invasive changes.
- [x] Close HC-57 and create HC-58 ticket workspace
  Task explanation and bigger refactor purpose: consolidate work under one runtime-refactor ticket and remove split tracking.
- [x] Import and review /tmp/chat-runtime-chatgpt-pro.md source
  Task explanation and bigger refactor purpose: tie decisions to a concrete external proposal and record where we intentionally diverge.
- [x] Write corrected detailed analysis and maintain diary in HC-58
  Task explanation and bigger refactor purpose: convert broad direction into implementable contracts and keep decision history explicit.
- [x] Add concrete inventory chatSlice extraction details and remove-suggestions policy
  Task explanation and bigger refactor purpose: clarify app-vs-runtime ownership and eliminate suggestion-related scope noise during refactor.
- [x] Remove projectionMode/timeline-upsert-only gating from runtime and callers
  Task explanation and bigger refactor purpose: delete correctness-by-filter toggles so projection semantics are deterministic.
- [x] Create detailed HC-58 implementation task breakdown for code phase
  Task explanation and bigger refactor purpose: turn architectural intent into executable work slices with clear sequencing.
- [x] Simplify projected connection hook path after projectionMode removal
  Task explanation and bigger refactor purpose: remove the residual envelope-skip branch and reduce runtime branching complexity.
- [x] Run typecheck/tests for HC-58 touched surfaces
  Task explanation and bigger refactor purpose: validate that runtime API simplification did not introduce immediate regressions.
- [x] Update runtime stories and inventory integration for no-gating path
  Task explanation and bigger refactor purpose: align examples and app integration with the new runtime contract.
- [x] Update HC-58 diary/changelog and commit each phase
  Task explanation and bigger refactor purpose: preserve commit-level traceability and maintain restart-safe context.

## Implementation Backlog (Up Front)

- [ ] HC58-IMPL-01 Runtime core scaffold:
  `packages/engine/src/hypercard-chat/conversation/runtimeCore.ts` (new), symbols to add:
  `ConversationRuntimeState`, `ConversationProjectionOp`, `createConversationRuntime`, `applyProjectionOps`
  Task explanation and bigger refactor purpose: centralize runtime projection-op/state logic so it is no longer split across wrappers, hooks, and app slices.

- [ ] HC58-IMPL-02 One projection path for all windows:
  `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts` + `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`, symbols:
  one shared `projectSemEnvelope(...)` path for all windows, remove any per-window projection branching
  Task explanation and bigger refactor purpose: enforce that every window ingests the same SEM envelopes and runs the same projection logic.

- [ ] HC58-IMPL-03 Stable entity ID invariants:
  `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`, symbols:
  remove `timeline.alias` / `timeline.rekey` handling, enforce direct `entity.id` merge semantics
  Task explanation and bigger refactor purpose: simplify timeline identity handling by treating entity IDs as stable and removing aliasing complexity.

- [ ] HC58-IMPL-04 Deterministic envelope apply ordering:
  `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`, symbols:
  deterministic envelope apply ordering (`event.seq`/arrival order) with one reducer pass per envelope
  Task explanation and bigger refactor purpose: keep projection behavior predictable without introducing extra abstraction layers.

- [ ] HC58-IMPL-05 Manager-owned lifecycle:
  `packages/engine/src/hypercard-chat/conversation/manager.ts` (new), symbols:
  `ConversationManager`, `getRuntime(conversationId)`, `claimConnection()`, `release()`
  Task explanation and bigger refactor purpose: move lifecycle ownership from component mounts to per-conversation runtime instances.

- [ ] HC58-IMPL-06 Move socket ownership off hooks:
  `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`,
  replace hook-owned `createClient/connect/close` flow with manager subscription symbols
  Task explanation and bigger refactor purpose: stop per-window transport churn and make connection behavior consistent across multiple views.

- [ ] HC58-IMPL-07 Runtime SEM handler migration:
  `packages/engine/src/hypercard-chat/sem/registry.ts`,
  move generic meta handling (`llm.start`, `llm.delta`, `llm.final`, `ws.error`) into runtime-owned projection handlers
  Task explanation and bigger refactor purpose: remove generic runtime metadata projection from app adapters and unify it in engine runtime.

- [ ] HC58-IMPL-08 Inventory adapter narrowing:
  `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`, keep only domain side effects:
  `createInventoryArtifactProjectionAdapter`, remove generic metadata responsibilities and projection correctness logic
  Task explanation and bigger refactor purpose: keep adapters strictly app-side-effect only and preserve one engine-owned projection truth.

- [ ] HC58-IMPL-09 Runtime selector/hooks API:
  `packages/engine/src/hypercard-chat/conversation/selectors.ts` (new), symbols:
  `useConversationConnection`, `useTimelineIds`, `useTimelineEntity`, `useMeta`
  Task explanation and bigger refactor purpose: provide stable read APIs so consumers do not re-derive runtime state ad hoc.

- [ ] HC58-IMPL-10 Inventory migration to runtime selectors:
  `apps/inventory/src/features/chat/InventoryChatWindow.tsx` + `apps/inventory/src/features/chat/chatSlice.ts`,
  remove app-owned runtime meta (`connectionStatus`, `lastError`, `modelName`, turn/stream stats)
  Task explanation and bigger refactor purpose: make runtime the single owner of chat lifecycle/meta state and simplify inventory state shape.

- [ ] HC58-IMPL-11 Timeline-native view cutover:
  add `packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx` (new),
  route timeline UI through runtime selectors instead of wrapper chain
  Task explanation and bigger refactor purpose: align UI composition directly with timeline/runtime model and reduce translation layers.

- [ ] HC58-IMPL-12 Remove wrapper chain:
  remove/retire `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`,
  `packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`,
  `packages/engine/src/components/widgets/ChatWindow.tsx` from timeline runtime path
  Task explanation and bigger refactor purpose: delete legacy bridge layers that obscure ownership and duplicate rendering semantics.

- [ ] HC58-IMPL-13 Exports/API cleanup:
  `packages/engine/src/hypercard-chat/index.ts`, `packages/engine/src/index.ts`,
  remove stale exports tied to deleted wrappers
  Task explanation and bigger refactor purpose: prevent accidental reuse of removed abstractions and keep public API truthful.

- [ ] HC58-IMPL-14 Unit test coverage:
  add tests around reducer/runtime symbols:
  stable entity ID merge invariants, version precedence, one-path projection invariants, deterministic apply ordering
  Task explanation and bigger refactor purpose: lock down core invariants so follow-on refactors cannot silently break correctness.

- [ ] HC58-IMPL-15 Integration test coverage:
  duplicate replay, out-of-order frame handling (`event.seq`, `event.stream_id`),
  reconnect hydration reconciliation in runtime connection path, and window parity on identical streams
  Task explanation and bigger refactor purpose: validate behavior under real stream conditions where ordering/replay bugs appear.

- [ ] HC58-IMPL-16 Multi-window shared-connection test:
  assert two windows on one conversation share a single manager-owned transport claim
  Task explanation and bigger refactor purpose: verify manager lifecycle design solves duplicate connection behavior in practice.

- [ ] HC58-IMPL-17 Story/docs alignment:
  update runtime stories/docs to new manager + timeline-native symbols and removed wrapper APIs
  Task explanation and bigger refactor purpose: keep contributor guidance aligned with the new architecture and avoid outdated examples.

- [ ] HC58-IMPL-18 Final validation gate:
  `npm run typecheck` + focused runtime/inventory tests + regression smoke for inventory chat window
  Task explanation and bigger refactor purpose: establish cutover confidence before declaring runtime refactor slice complete.

- [ ] HC58-IMPL-19 Diary/changelog discipline:
  append per-phase diary entries with commit hashes and update changelog each completed task
  Task explanation and bigger refactor purpose: maintain reliable implementation narrative and decision provenance across the full refactor.
