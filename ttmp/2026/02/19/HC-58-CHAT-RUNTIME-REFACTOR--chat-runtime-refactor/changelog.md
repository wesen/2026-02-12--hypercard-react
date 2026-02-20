# Changelog

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
