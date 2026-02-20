# Changelog

## 2026-02-20

Added a new HC-58 V1 implementation plan document that rewrites the refactor into an explicit, ambiguity-free execution blueprint with point-by-point API design, build instructions, verification matrix, PR slicing, and a strict out-of-scope contract.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/02-hc58-v1-simplified-implementation-plan.md — New primary implementation plan for HC-58 V1

Implemented HC-58 Section 1 code tasks (`HC58-S1-T01..T03`): introduced the new conversation runtime module scaffold, manager reference lifecycle, React provider/selectors, public engine export wiring, and passing manager identity/disposal tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts — New runtime core scaffold for conversation-owned state and lifecycle
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/manager.ts — New one-runtime-per-conversation manager with release/dispose behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/manager.test.ts — New tests validating manager identity and disposal invariants
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/index.ts — Export wiring for the new conversation module
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Section 1 tasks checked off after implementation and validation
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Detailed Step 16 execution diary with command/test trace

Implemented HC-58 Section 2 code tasks (`HC58-S2-T01..T04`): moved projected connection lifecycle ownership into `ConversationRuntime`, added claim/refcount connect-disconnect semantics, runtime-owned hydrate-buffer-replay sequencing, and explicit single-connection multi-window tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts — Added runtime-owned connection lifecycle helpers, hydration buffering/replay, and callback wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts — Replaced direct client connect/close ownership with `ConversationRuntime` claim/release flow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.test.ts — Added claim lifecycle and hydrate-replay behavior tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.integration.test.ts — Added explicit one-runtime two-claims single-connect regression test
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Section 2 tasks checked off after passing verification
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Added Step 17 command/test/commit trace for Section 2

Implemented HC-58 Section 3 code tasks (`HC58-S3-T01..T03`): validated single projection-path enforcement, made `SemRegistry` fallback IDs deterministic via `ctx.now`, and added replay/version determinism tests covering unknown-event no-op, duplicate replay idempotency, and versionless merge behavior.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts — Deterministic fallback ID generation now sourced from `SemContext.now`
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.test.ts — Added unknown-event no-op and deterministic fallback-ID tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.test.ts — Added duplicate buffered replay idempotency test
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts — Added versionless patch-on-versioned-entity contract test
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Section 3 tasks checked off after verification
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Added Step 18 command/test/commit trace for Section 3

Implemented HC-58 Section 4 code tasks (`HC58-S4-T01..T03`): moved generic chat metadata extraction into `ConversationRuntime`, migrated inventory status/footer consumers to runtime selectors, removed inventory chat metadata adapter logic, and hardened adapter contract to side-effects-only with mutation guard assertions.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.ts — Runtime now owns model/stream/turn/error metadata extraction and state updates
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/conversation/runtime.test.ts — Added metadata extraction tests for llm/ws envelopes
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts — Documented and enforced side-effects-only adapter contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts — Supports injected manager-owned runtime instances
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts — Removed inventory chat metadata adapter; kept artifact side-effects adapter
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Uses conversation runtime hooks for connection/meta status and provider-managed runtime ownership
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts — Updated to reflect adapter boundary and runtime-owned metadata model
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts — Removed deprecated inventory metadata selectors
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Section 4 tasks checked off after verification
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Added Step 19 command/test/commit trace for Section 4

Implemented HC-58 hard cutover for Sections 5-8: removed compatibility wrapper chain, moved inventory to `TimelineConversationView`, de-globalized widget registries, deleted obsolete inventory chat slice state, and aligned docs/tasks/diary to the no-backwards-compatibility architecture.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx — New primary timeline-native chat rendering surface
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx — Deleted legacy bridge layer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts — Deleted second projection path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx — Deleted wrapper runtime surface
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts — Replaced global registry API with per-instance registry factory
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx — Widget pack registration now requires injected registry instance
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/registerInventoryConversationExtensions.ts — Centralized inventory runtime extension bootstrap
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Migrated to runtime hooks plus `TimelineConversationView`
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Deleted obsolete inventory chat runtime slice
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/02-hc58-v1-simplified-implementation-plan.md — Updated to remove compatibility language and codify hard-cut build contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Checked Sections 5-8 tasks and tightened no-wrapper acceptance criteria
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Added Step 20 with full hard-cutover execution and validation trace

## 2026-02-19

- Initial workspace created


## 2026-02-19

Closed HC-57, created HC-58, imported /tmp/chat-runtime-chatgpt-pro.md, and completed a concrete corrected runtime refactor analysis with structured stream-channel mutations, phased adapters, canonical-id merge strategy, migration plan, and detailed implementation diary.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Primary detailed analysis output
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Detailed frequent diary of actions and findings
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md — Imported source that was reviewed and critiqued


## 2026-02-19

Recorded commit dda91ff for HC-58 analysis and diary deliverables.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Design analysis delivered in commit dda91ff
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Diary now references commit hash for traceability


## 2026-02-19

Docmgr hygiene pass: added vocabulary topic 'developer-experience' and frontmatter to imported source file; doctor now reports only a non-blocking missing numeric-prefix warning for source filename.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md — Prepended frontmatter so docmgr parsing succeeds
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/vocabulary.yaml — Added developer-experience topic to satisfy ticket/document vocabulary checks


## 2026-02-19

Updated HC-58 analysis to enforce hard cutover policy: no fallbacks/backwards compatibility, timeline-native view as the only UI target, and explicit removal of TimelineChatRuntimeWindow -> TimelineChatWindow -> ChatWindow chain from timeline chat path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Hard-cut architecture policy and implementation plan updates
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded hard-cutover decision in work diary


## 2026-02-19

Expanded HC-58 with concrete inventory chatSlice extraction ownership mapping, runtime/meta selector targets, and explicit remove-suggestions-now policy for implementation sequencing.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Added Inventory Runtime Ownership Cutover section and implementation-phase updates
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded new step with user prompt and migration rationale


## 2026-02-19

Started HC-58 code phase: added detailed implementation tasks, inspected current runtime chain, and prepared phased execution for projection-mode cutover.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded kickoff and runtime target files
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Added code-phase tasks and removed duplicate entry


## 2026-02-19

Removed projectionMode/timeline-upsert-only gating from TimelineChatRuntimeWindow and updated runtime story + inventory caller to the always-project path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Removed projectionMode prop from runtime window usage
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx — Removed projectionMode story arg
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx — Removed projectionMode API and filtering branch
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded HC-58 task-7 implementation details


## 2026-02-19

Simplified projected connection flow by removing shouldProjectEnvelope API/branch; all envelopes now follow a single projectSemEnvelope path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx — Removed shouldProjectEnvelope surface
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts — Removed skip branch and callback state for shouldProjectEnvelope
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded HC-58 task-9 simplification step


## 2026-02-19

Validated HC-58 runtime gating-removal slice with full typecheck and focused inventory chat runtime tests (projection pipeline, event bus, webchat client).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx — Part of validated runtime path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts — Part of validated runtime path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded command-level validation results


## 2026-02-19

Updated HC-58 diary with concrete commit hashes for kickoff + runtime gating-removal phases and marked implementation-phase bookkeeping task complete.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Replaced pending commit placeholders and added validation step
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Checked all current HC-58 code-phase tasks


## 2026-02-19

Updated diary Step 10 commit reference from pending placeholder to concrete commit hash 500c73b.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Finalized Step-10 commit metadata


## 2026-02-19

Added full up-front HC-58 implementation backlog to tasks.md so future work is tracked from the start instead of incrementally adding tasks.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Added comprehensive implementation checklist section


## 2026-02-19

Expanded HC-58 planning with symbol-level implementation references: added task IDs with file/symbol targets in tasks.md and a mirrored execution map in design doc.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Added Execution Map (Task -> Symbols) section
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded prompt context and rationale for backlog refinement
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Replaced generic backlog with task IDs and concrete symbol/file references


## 2026-02-19

Finalized Step 11 diary commit reference with concrete hash 8080c4e.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Replaced pending commit placeholder



## 2026-02-19

Refined HC-58 task wording so each checkbox note explicitly states both task explanation and bigger refactor purpose.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Updated per-task explanatory phrasing
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded this documentation-refinement step


## 2026-02-19

Removed alias/canonical/rekey identity mechanics from HC-58 design/tasks and standardized on stable `entityId` semantics for timeline runtime planning.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Removed alias/rekey/canonical state/mutations/strategy references and aligned execution map
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Replaced HC58-IMPL-03 with stable entity ID invariants and updated test wording
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded this simplification step and rationale


## 2026-02-19

Rewrote HC-58 design/tasks to a simpler one-projection-path model: all windows process the same SEM stream with identical projection logic; adapters are side-effects only.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Simplified architecture blueprint and execution map
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Simplified implementation backlog wording and priorities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded simplification rationale and review guidance


## 2026-02-19

Clarified HC-58 terminology by replacing "conversation mutations" with "projection ops" to match the simplified one-path SEM projection model.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md — Renamed symbols and handler wording for clarity
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md — Updated execution-map symbols and added projection-op clarification sentence
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md — Recorded terminology-alignment step
