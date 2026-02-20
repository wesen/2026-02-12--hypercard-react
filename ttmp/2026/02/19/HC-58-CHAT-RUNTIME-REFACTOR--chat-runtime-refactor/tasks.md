# Tasks

This task list is the execution companion for:
`design-doc/02-hc58-v1-simplified-implementation-plan.md`

## Task Format Contract
Every task below is implementation-ready and must be executed exactly as written.

Required per task:
1. File targets are explicit.
2. Symbol targets are explicit.
3. Dependency ordering is explicit.
4. Acceptance criteria are explicit.
5. Verification commands are explicit.

## Global Execution Rules
1. Do not skip section ordering.
2. Do not collapse tasks into large unreviewable PRs.
3. Do not introduce out-of-scope items from the HC-58 V1 plan.
4. If a task changes API shape, update docs in the same PR.
5. If a task changes behavior, add/adjust tests in the same PR.

## Completed Baseline Context
- [x] Validate proposal against current engine/inventory runtime implementation.
- [x] Remove projection gating behavior and align active path to always-project semantics.
- [x] Produce simplified V1 implementation plan document.

---

## Section 1: Runtime Ownership and Core Module Scaffolding
Covers plan points: 1, 6, 16.

### HC58-S1-T01 Create `conversation/` module skeleton
- [x] Create the conversation runtime module files.

Files to create:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/types.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts`
3. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/manager.ts`
4. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/selectors.ts`
5. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/context.tsx`
6. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/index.ts`

Symbols to add:
1. `ConversationRuntimeMeta`
2. `ConversationRuntimeState`
3. `ConversationRuntime`
4. `ConversationManager`
5. `useConversationConnection`
6. `useTimelineIds`
7. `useTimelineEntity`
8. `useConversationMeta`

Steps:
1. Define types in `types.ts` matching V1 plan contract.
2. Implement runtime interface in `runtime.ts` with no UI imports.
3. Implement manager cache in `manager.ts` keyed by conversation ID.
4. Add React provider/context and selector hooks.
5. Export all public symbols in `conversation/index.ts`.

Acceptance criteria:
1. `conversation/` compiles with no circular dependencies.
2. Runtime core has no React component rendering logic.
3. Manager can return same runtime instance for same conversation ID.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S1-T02 Wire new conversation exports into engine public API
- [x] Export the new conversation runtime API from engine entrypoints.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/index.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/index.ts` (if required by package surface)

Symbols to expose:
1. `createConversationManager` (or equivalent manager constructor)
2. Runtime hooks/selectors from `conversation/selectors.ts`
3. Runtime/provider types from `conversation/types.ts`

Steps:
1. Add explicit `export * from './conversation'` pathing.
2. Confirm no accidental export duplication/conflicts.

Acceptance criteria:
1. Inventory app can import conversation runtime APIs from `@hypercard/engine`.
2. Existing imports remain valid.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S1-T03 Add manager identity tests
- [x] Add tests for one-runtime-per-conversation behavior.

Files to create:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/manager.test.ts`

Test cases:
1. Same `conversationId` returns same runtime instance.
2. Different `conversationId` returns different runtime instances.
3. `releaseRuntime` disposes when no references remain.

Acceptance criteria:
1. All manager tests pass.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine -- manager.test.ts`

---

## Section 2: Connection Lifecycle Ownership and Multi-Window Semantics
Covers plan points: 2, 12.

### HC58-S2-T01 Move client lifecycle out of `useProjectedChatConnection`
- [x] Refactor connection lifecycle ownership into `ConversationRuntime`.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts`

Symbols to change:
1. Deprecate direct client creation in `useProjectedChatConnection`.
2. Introduce `claimConnection()` usage from runtime.

Steps:
1. Remove direct `createClient(...)` lifecycle from hook.
2. Replace with runtime claim/release orchestration.
3. Ensure cleanup always calls release function exactly once.

Acceptance criteria:
1. Hook no longer opens/closes websocket client directly.
2. Runtime owns connect/disconnect state transitions.

Verification:
1. `rg -n "createClient\(|client.connect\(|client.close\(" 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
2. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S2-T02 Implement connection claim reference counting
- [x] Add claim counting behavior in runtime.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts`

Symbols to add:
1. `private connectionClaims: number`
2. `claimConnection(): () => void`
3. `ensureConnected()` internal method
4. `maybeDisconnect()` internal method

Steps:
1. Initialize claim counter to zero.
2. Connect only when transitioning 0 -> 1.
3. Disconnect only when transitioning 1 -> 0.
4. Guard against double-release with idempotent release closure.

Acceptance criteria:
1. Two claims produce exactly one transport connect.
2. Releasing one of two claims does not disconnect.
3. Releasing last claim disconnects.

Verification:
1. Unit tests added in `conversation/runtime.test.ts`.
2. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine -- runtime.test.ts`

### HC58-S2-T03 Port hydrate-buffer-replay sequence to runtime-owned lifecycle
- [x] Implement connect/hydrate/buffer/replay in runtime.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts`
2. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts` (if lifecycle helpers are reused/extracted)

Behavior contract:
1. Buffer envelopes while hydration is incomplete.
2. Apply hydration snapshot first.
3. Replay buffered envelopes sorted by `stream_id` then `seq`.
4. Switch to live ingestion mode.

Acceptance criteria:
1. No live envelope is lost across hydration.
2. Replay order is deterministic.

Verification:
1. Runtime integration tests for out-of-order and buffered replay.
2. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine`

### HC58-S2-T04 Add explicit multi-window single-connection test
- [x] Add test proving two windows sharing one conversation use one connection.

Files to create/edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.integration.test.ts`

Test scenario:
1. Create one runtime for `conv-1`.
2. Call `claimConnection()` twice.
3. Assert transport connect count equals 1.
4. Release both claims and assert single disconnect.

Acceptance criteria:
1. Test fails on double-connect regression.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine -- runtime.integration.test.ts`

---

## Section 3: One Projection Path and Deterministic Registry Semantics
Covers plan points: 7, 13, 14.

### HC58-S3-T01 Route all envelope ingestion through `projectSemEnvelope`
- [x] Enforce one projection call path under runtime core.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`

Steps:
1. Runtime `ingestEnvelope` must call `projectSemEnvelope`.
2. Runtime `hydrateSnapshot` must call `hydrateTimelineSnapshot`.
3. Remove any duplicate/manual reducer dispatch paths for SEM events.

Acceptance criteria:
1. One code path for SEM->ops->timeline apply in runtime chat path.

Verification:
1. `rg -n "applySemTimelineOps\(|projectSemEnvelope\(" 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat`
2. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S3-T02 Keep `SemRegistry` deterministic and central
- [x] Keep registry as the only projection behavior definition.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts`

Steps:
1. Ensure handlers remain pure mappings to ops/effects.
2. Ensure unknown event types are no-op (or debug log only).
3. Do not move projection behavior into adapters.

Acceptance criteria:
1. No app code is required for base llm/tool/status timeline correctness.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine -- registry.test.ts`

### HC58-S3-T03 Lock replay idempotency and version ordering via tests
- [x] Add/update reducer and runtime tests for deterministic replay.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.test.ts`

Required test cases:
1. Duplicate envelope replay is idempotent.
2. Lower version does not overwrite higher version.
3. Versionless patch behavior on versioned entity remains intact.

Acceptance criteria:
1. Tests codify reducer contract and fail on regression.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine -- timelineSlice.test.ts`

---

## Section 4: Runtime Metadata Ownership and Adapter Narrowing
Covers plan points: 3, 8, 9.

### HC58-S4-T01 Move generic chat metadata extraction into runtime core
- [ ] Extract model/usage/error metadata handling from inventory adapter into engine runtime.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts` (if helper hooks are added)
3. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts`

Events covered:
1. `llm.start`
2. `llm.delta`
3. `llm.final`
4. `ws.error`

Acceptance criteria:
1. Runtime state exposes `modelName`, stream counters, turn stats, last error.
2. Inventory metadata adapter logic is removed.

Verification:
1. `rg -n "setModelName|markStreamStart|updateStreamTokens|setTurnStats" 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
2. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S4-T02 Migrate inventory footer and status consumers to runtime selectors
- [ ] Replace inventory selectors and state reads with conversation runtime selectors.

Files to edit:
1. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx`
2. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts`
3. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts`

Steps:
1. Replace `selectConnectionStatus` usage with `useConversationConnection`.
2. Replace model/stats selectors with `useConversationMeta`.
3. Keep inventory selectors as temporary pass-throughs only if needed for migration safety.

Acceptance criteria:
1. `InventoryChatWindow` no longer depends on runtime metadata in `chatSlice`.

Verification:
1. `rg -n "selectConnectionStatus|selectModelName|selectCurrentTurnStats|selectStream" 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx`
2. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S4-T03 Narrow adapters to side-effects-only contract
- [ ] Enforce adapter boundary: no core timeline correctness logic in adapters.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
2. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts`

Steps:
1. Update adapter TSDoc contract.
2. Ensure inventory adapter keeps only artifact/runtime-card side effects.
3. Add optional dev assertion: adapter cannot alter projected ops.

Acceptance criteria:
1. Removing inventory adapters does not break base llm/tool/log timeline correctness.

Verification:
1. Run engine tests without inventory adapter injections where applicable.
2. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine`

---

## Section 5: Timeline-Native View Cutover and Wrapper Decomposition
Covers plan points: 4, 10.

### HC58-S5-T01 Introduce `TimelineConversationView` as primary runtime UI
- [ ] Add new timeline-native conversation view.

Files to create:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx`

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/index.ts`

Behavior:
1. Render by timeline entity IDs/entities from runtime selectors.
2. Keep composer/header/footer composition in this view.
3. Avoid timeline-to-message projection as primary path.

Acceptance criteria:
1. Primary inventory route can render chat via `TimelineConversationView`.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S5-T02 Remove `timelineDisplayMessages` from primary runtime path
- [ ] Stop using `buildTimelineDisplayMessages(...)` in primary runtime integration.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts`

Steps:
1. Keep `timelineDisplayMessages.ts` only for legacy compatibility wrappers if required.
2. Mark file and legacy usage with deprecation comments.

Acceptance criteria:
1. Inventory primary chat no longer depends on `timelineDisplayMessages.ts`.

Verification:
1. `rg -n "buildTimelineDisplayMessages\(" 2026-02-12--hypercard-react/apps/inventory/src 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime`

### HC58-S5-T03 Convert `TimelineChatRuntimeWindow` into compatibility wrapper
- [ ] Keep wrapper temporarily, but implement on top of runtime manager + timeline-native view.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`

Steps:
1. Remove infrastructure ownership from wrapper.
2. Add `@deprecated` TSDoc with migration target.
3. Keep existing call sites functional during migration window.

Acceptance criteria:
1. Wrapper no longer owns transport/projection lifecycle.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run typecheck`

---

## Section 6: Widget Registry De-Globalization and Extension Boundaries
Covers plan points: 5, 15.

### HC58-S6-T01 Add per-window widget registry instance API
- [ ] Introduce local widget registry factory and remove global dependence from primary path.

Files to create/edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
2. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx`

Required API:
1. `createConversationWidgetRegistry()`
2. Instance `register/resolve` functions

Acceptance criteria:
1. Two independent registries can resolve different renderers for same widget type.

Verification:
1. Add unit tests in `inlineWidgetRegistry.test.ts`.
2. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine -- inlineWidgetRegistry.test.ts`

### HC58-S6-T02 Port `hypercardWidgetPack` to register against injected registry
- [ ] Remove global mutable dependence from primary usage.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`

Steps:
1. Change registration API to accept registry instance.
2. Keep legacy namespace/global adapter only for compatibility wrapper path.

Acceptance criteria:
1. Primary path uses injected registry only.

Verification:
1. `rg -n "registerInlineWidgetRenderer\(" 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime`
2. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S6-T03 Define explicit app extension bootstrap for inventory
- [ ] Consolidate inventory-specific SEM/widget/adapter registration in one bootstrap module.

Files to create/edit:
1. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/registerInventoryConversationExtensions.ts` (new)
2. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx`

Steps:
1. Centralize app extension wiring in one function.
2. Ensure function is called once at app bootstrap entry point.

Acceptance criteria:
1. Inventory-specific runtime extension logic is not scattered across render components.

Verification:
1. `rg -n "createInventoryArtifactProjectionAdapter|registerHypercardWidgetPack|createSemRegistry" 2026-02-12--hypercard-react/apps/inventory/src/features/chat`

---

## Section 7: Inventory Integration Cutover
Cross-cuts Sections 1-6 into app usage.

### HC58-S7-T01 Replace inventory runtime usage with conversation runtime primitives
- [ ] Migrate inventory chat window to conversation runtime selectors + timeline-native view.

Files to edit:
1. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx`

Required removals from inventory component (primary path):
1. Direct `createSemRegistry` ref.
2. Direct projection adapter ownership for metadata.
3. Direct projected transport wiring props.

Acceptance criteria:
1. Inventory chat component usage is infrastructure-light and runtime-driven.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S7-T02 Remove obsolete inventory chat runtime slice fields/actions
- [ ] Delete or reduce `chatSlice.ts` to inventory-only domain concerns.

Files to edit:
1. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts`
2. `2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts`
3. Associated tests under `apps/inventory/src/features/chat/*.test.ts`

Acceptance criteria:
1. No dead chatSlice runtime metadata remains.
2. Tests updated to reflect runtime-owned metadata.

Verification:
1. `rg -n "setConnectionStatus|setModelName|markStreamStart|updateStreamTokens|setTurnStats" 2026-02-12--hypercard-react/apps/inventory/src/features/chat`

---

## Section 8: Validation, Documentation, and Cleanup

### HC58-S8-T01 Add/refresh runtime and integration tests for all new invariants
- [ ] Ensure all invariants in V1 plan are covered by tests.

Test groups required:
1. Runtime ownership tests.
2. Claim lifecycle tests.
3. Replay/hydration ordering tests.
4. Metadata ownership tests.
5. Adapter boundary tests.
6. Multi-window parity tests.

Acceptance criteria:
1. Each V1 invariant maps to at least one test.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine`

### HC58-S8-T02 Update docs and stories to new primary runtime model
- [ ] Align docs/stories with conversation runtime architecture.

Files to edit (minimum):
1. `2026-02-12--hypercard-react/packages/engine/docs/chat-window-timeline-first-guide.md`
2. Relevant stories under `2026-02-12--hypercard-react/packages/engine/src/components/widgets/`
3. `2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/changelog.md`

Acceptance criteria:
1. Docs describe runtime-owned lifecycle and selector-driven UI.
2. Stories do not present deprecated path as primary usage.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run storybook:check`
2. `cd 2026-02-12--hypercard-react && npm run typecheck`

### HC58-S8-T03 Remove stale exports and dead primary-path dependencies
- [ ] Final cleanup once migration is complete.

Files to edit:
1. `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/index.ts`
2. Any stale runtime wrapper exports in engine surface.

Acceptance criteria:
1. Public API reflects new primary path.
2. Deprecated wrappers clearly marked or removed per migration decision.

Verification:
1. `cd 2026-02-12--hypercard-react && npm run typecheck`
2. `cd 2026-02-12--hypercard-react && npm run test -w packages/engine`

---

## Final Gate (Must Be Green Before Declaring HC-58 V1 Complete)
- [ ] `cd 2026-02-12--hypercard-react && npm run typecheck`
- [ ] `cd 2026-02-12--hypercard-react && npm run test -w packages/engine`
- [ ] Multi-window manual smoke test documented in changelog.
- [ ] HC-58 design-doc, tasks, and changelog updated in same final PR.
