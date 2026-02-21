---
Title: 'Postmortem: Webchat extraction hard cutover'
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/chat/runtime/moduleBootstrap.ts
      Note: Representative architecture artifact for bootstrap contract covered in postmortem
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Shell/container separation and legacy adapter retirement described in postmortem
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/changelog.md
      Note: Phase-by-phase milestone and validation evidence used in postmortem
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md
      Note: Fleshed technical source timeline for the postmortem
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:13:48.656312983-05:00
WhatFor: Detailed technical postmortem of the HC-01 webchat extraction hard cutover, including architecture changes, execution timeline, breakpoints, mitigations, and remaining risks.
WhenToUse: Read when maintaining engine chat/hypercard modules, onboarding to the extraction work, or planning follow-up cleanup and runtime verification.
---


# Postmortem: Webchat extraction hard cutover

## Executive Summary

HC-01 extracted the chat subsystem from `apps/inventory/src/features/chat` into reusable engine modules (`packages/engine/src/chat` and `packages/engine/src/hypercard`) and performed a hard cutover in inventory. The migration replaced message-centric rendering and app-local runtime wiring with entity-centric SEM projection, renderer registry composition, conversation-scoped reducers, and explicit module bootstrap.

The implementation completed 59 of 60 tasks, with one task still open (`7.5`: manual end-to-end runtime verification in a running app session). Structural validation gates are green (`npm run typecheck`, `npm test`, and `npm run build-storybook` all pass after CRM compatibility alignment).

Major outcomes:

1. Inventory-local legacy chat subsystem was deleted.
2. Engine now owns chat runtime, reducers, renderers, debug tooling, and hypercard timeline integration.
3. Chat shell (`ChatWindow`) is renderer-agnostic; entity rendering behavior lives in dedicated renderers and container.
4. One-time global registration for SEM/timeline modules is in place.
5. Structured runtime error state replaced string-only error channeling.

## Problem Statement

Before HC-01, chat behavior was fragmented and tightly coupled to inventory app internals:

1. SEM dispatch path was implemented as large ad-hoc conditional chains in inventory-specific components.
2. WebSocket + hydration lifecycle logic was not reusable across apps.
3. Rendering path was message-centric and coupled to `ChatWindow`, mixing shell and domain concerns.
4. Hypercard artifact and timeline behavior depended on inventory-local slices and runtime glue.
5. Debug/editor windows and utilities existed outside engine ownership, preventing clean reuse.
6. Story/test surfaces retained legacy adapters and mixed architecture modes.

This created duplicate architecture, high coupling, and difficult evolution across inventory, CRM, and pinocchio-aligned runtime paths.

## Proposed Solution

Delivered architecture after cutover:

1. `packages/engine/src/chat` owns:
   - SEM registry and protobuf mapping
   - conversation-scoped timeline/session reducers
   - wsManager + conversation runtime orchestration
   - renderer registry + builtin renderers
   - `ChatConversationWindow` (container) + `ChatWindow` (shell)
   - debug event bus and migrated debug UI helpers
2. `packages/engine/src/hypercard` owns:
   - artifacts slice/selectors/runtime
   - hypercard timeline handlers + renderers
   - code editor/runtime debug windows
3. Inventory app is a thin integration shell:
   - imports engine reducers/components
   - no longer maintains standalone `features/chat` code.

Key behavioral contract:

1. Timeline entities are conversation-scoped and version-gated.
2. Rendering is entity-native via registry (`kind -> renderer`).
3. Runtime module registration is one-time and additive.
4. Errors are tracked in typed, conversation-scoped records.

## Design Decisions

1. **Conversation-scoped state as first principle**
   - Timeline/session reducers moved from global patterns to per-conversation substates to support multiple active chat windows.

2. **Renderer-first architecture with shell/container split**
   - `ChatWindow` became pure shell (`timelineContent` slot).
   - `ChatConversationWindow` owns entity selection, rendering, runtime lifecycle.
   - Message semantics (role, streaming cursor, thinking cues) were moved into `MessageRenderer`.

3. **Hard cutover over compatibility shim**
   - Legacy inventory chat directory was removed instead of preserved behind adapters.
   - Legacy story adapters were explicitly retired in favor of entity-native stories.

4. **One-time global module registration**
   - Default SEM handlers and hypercard module registration moved away from per-connect calls into idempotent bootstrap, reducing handler-loss and ordering risk.

5. **Typed runtime error model**
   - Replaced string-only `setStreamError` pathways with structured `ChatErrorRecord` state and selectors.

6. **Keep `ChatWindow` and `ChatConversationWindow` split**
   - Post-cleanup reevaluation concluded separation improves reuse and testability versus collapsing both concerns into one component.

7. **Preserve pinocchio version-gating semantics**
   - Conversation-scoped timeline reducer retained monotonic version update behavior and unversioned merge compatibility.

8. **Suggestions architecture investigation captured, not forced mid-cutover**
   - Detailed analysis documented two paths (timeline entity projection vs formalized session meta action) without destabilizing the core extraction timeline.

## Alternatives Considered

1. **Keep message rendering logic in `ChatWindow` with dual mode**
   - Rejected: preserves architectural duplication and blurs shell/domain boundaries.

2. **Per-connect handler/module registration**
   - Rejected: risks extension handler clobbering and nondeterministic registration order.

3. **Unify `ChatWindow` and `ChatConversationWindow` immediately**
   - Rejected after reevaluation: would merge shell and runtime concerns and reduce composability.

4. **Keep suggestions as unstructured special-case only**
   - Deferred as design follow-up: analysis captured stronger timeline-entity option and formal fallback option with action meta semantics.

5. **Preserve inventory-local chat for compatibility window**
   - Rejected: hard-cutover goal favored deletion to prevent parallel drift.

## Executed Implementation Timeline

### Phase 0: Exploration and planning

1. Mapped inventory, engine, and pinocchio chat stacks.
2. Produced phased execution plan and task matrix.
3. Pivoted plan to renderer-only `ChatWindow` early to avoid dual architecture debt.

### Phase 1: Core chat skeleton + conversation-scoped state (`a813f39`)

1. Created engine chat directories and base exports.
2. Ported/adapted SEM registry to `SemContext` model (`dispatch + convId`).
3. Added protobuf SEM types and timeline mapper/props registry.
4. Implemented conversation-scoped timeline + session reducers and selectors.
5. Added foundational tests for version gating/scoping and registry behavior.

Primary technical risk handled:

- preserving pinocchio upsert/version semantics while adding per-conversation state partitioning.

### Phase 2: Runtime lifecycle + WS/hydration pipeline (`a788974`)

1. Added wsManager with hydration buffering/replay behavior.
2. Added HTTP runtime helpers and conversationManager lifecycle wrapper.
3. Added `useConversation` hook for connect/send state.
4. Added integration tests for SEM frame flow through runtime to reducers.

Primary technical risk handled:

- ordered replay after hydration with conversation-scoped dispatch.

### Phase 3: Renderer registry + builtin renderer set (`27758b7`)

1. Added renderer registry and default renderer registration.
2. Added builtin renderers: message/tool-call/tool-result/status/log/generic.
3. Added renderer-focused Storybook coverage.

Primary technical risk handled:

- preserving legacy message UX while moving behavior out of shell component.

### Phase 4: Renderer-only ChatWindow + containerization (`6e07ad1`)

1. Converted `ChatWindow` to timeline-content shell API.
2. Added `ChatConversationWindow` container for runtime/select/render orchestration.
3. Extracted `StatsFooter`.
4. Moved event bus into engine and wired runtime envelope emission.
5. Added conversation-window Storybook mock backend story.

Primary technical risk handled:

- hard API pivot without stalling validation for existing demos/stories.

### Phase 5: Hypercard module extraction + one-time bootstrap (`fd931ff`)

1. Moved artifacts slice/selectors/runtime into engine hypercard module.
2. Added hypercard widget/card SEM handlers and renderers.
3. Added `customKind` remap tests.
4. Implemented one-time global registration bootstrap and test reset pathway.

Primary technical risk handled:

- avoiding handler loss after moving from per-connect to global registration lifecycle.

### Phase 6: Debug/editor/runtime tooling migration (`e8fbc61`, `d0e758d`)

1. Migrated debug viewer, syntax highlight, and yaml formatter into engine chat module.
2. Migrated code editor, editor launch, and runtime card debug window into engine hypercard module.
3. Removed direct STACK coupling in runtime card debug API via `stacks?: CardStackDefinition[]`.

Primary technical risk handled:

- preserving strict TypeScript function compatibility and decoupling legacy imports.

### Phase 7: Inventory hard cutover + legacy deletion (`df8ef49`)

1. Switched inventory store wiring to engine reducers.
2. Switched app routing/window usage to engine components.
3. Deleted `apps/inventory/src/features/chat/` entirely.
4. Removed obsolete tests/stories shipped with legacy directory.

Primary technical risk handled:

- ensuring cutover completeness without residual imports from deleted paths.

### Phase 8: Tests/stories migration + adapter cleanup (multiple commits)

1. Migrated artifact/event/yaml tests into engine ownership.
2. Added missing chat session and SEM/timeline coverage.
3. Added stories for migrated debug/editor windows.
4. Removed legacy adapter-based ChatWindow stories.
5. Initially blocked by CRM compatibility mismatch; later unblocked.

Primary technical risk handled:

- global story/type checks across apps when engine exports changed.

### Phase 9: Structured runtime errors + bootstrap contract + split decision (`e9d8031`)

1. Added typed conversation-scoped error model (`ChatErrorRecord`, history/current selectors).
2. Migrated runtime callsites (ws/http/useConversation) to structured error dispatch.
3. Added formal module bootstrap contract/orchestrator.
4. Removed legacy ChatWindow adapter exports.
5. Re-evaluated shell/container unification and explicitly kept split.

Primary technical risk handled:

- maintaining compatibility selectors while introducing typed errors.

### Final verification unblock (`bdb614d`, docs in `5037e9e`)

1. Fixed stale CRM imports expecting removed engine exports.
2. Achieved passing global validation gates:
   - `npm run typecheck`
   - `npm test`
   - `npm run build-storybook`

## Incident Log and Breakpoints During Execution

1. Engine typecheck break: missing `chatApi` contract file during early runtime extraction.
   - Mitigation: added `packages/engine/src/chat/chatApi.ts`.

2. Storybook path policy mismatch for renderer stories.
   - Mitigation: relocated stories under allowed `components/widgets` hierarchy.

3. Type variance issues in editor launch dispatch typing.
   - Mitigation: normalized dispatch action type to `UnknownAction`.

4. Temporary global validation blocker from unrelated CRM stale exports.
   - Mitigation: compatibility updates in CRM store/response typing.

5. Test isolation risk after one-time bootstrap change.
   - Mitigation: added explicit reset path for test runtime registration state.

## Validation Summary

Final state validation:

1. Engine package typecheck passed.
2. Engine and workspace test suites passed.
3. Storybook checks and full build-storybook passed.
4. Inventory build passed after hard cutover.

Residual gate:

1. Task `7.5` remains open for explicit manual runtime behavior verification:
   - chat connects
   - streaming messages display correctly
   - artifact open/edit behavior works
   - event viewer behavior in live app session is validated.

## Implementation Plan

Postmortem action plan (follow-ups):

1. Close `7.5` with a written runtime verification checklist and captured evidence.
2. Decide and implement final suggestion architecture (timeline entity projection vs formalized session projection action).
3. Continue tightening public API boundaries for debug/editor exports.
4. Add focused regression tests around bootstrap ordering and external consumer safety.
5. Keep docs synchronized with shell/container split contract to avoid reintroducing message-mode assumptions.

## Open Questions

1. Should suggestions be promoted to timeline entities in the near-term follow-up?
2. Should bootstrap registration be exposed as a formal app initialization entrypoint for all consumers (not just current internal runtime)?
3. Do we want a stricter policy to prevent cross-app global gate failures (like CRM stale imports) from blocking unrelated ticket closure?
4. Is additional runtime telemetry needed for structured error state to improve production diagnostics?

## References

- `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md`
- `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/changelog.md`
- `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/01-implementation-plan-extract-webchat-to-engine.md`
- `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/02-analysis-project-suggestions-as-timeline-entities.md`
- `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/03-structured-runtime-error-state-for-chat.md`
