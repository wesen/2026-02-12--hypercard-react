---
Title: Diary
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/registry.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
    - Path: apps/inventory/src/features/chat/chatSlice.ts
    - Path: apps/inventory/src/features/chat/timelineProjection.ts
    - Path: apps/inventory/src/features/chat/webchatClient.ts
    - Path: packages/engine/src/chat/chatApi.ts
      Note: Resolved pre-existing typecheck gap for StreamHandlers
    - Path: packages/engine/src/chat/renderers/builtin/GenericRenderer.tsx
      Note: Phase 3 fallback renderer
    - Path: packages/engine/src/chat/renderers/builtin/LogRenderer.tsx
      Note: Phase 3 builtin log renderer
    - Path: packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx
      Note: Phase 3 message renderer preserving legacy UX
    - Path: packages/engine/src/chat/renderers/builtin/StatusRenderer.tsx
      Note: Phase 3 builtin status renderer
    - Path: packages/engine/src/chat/renderers/builtin/ToolCallRenderer.tsx
      Note: Phase 3 builtin tool-call renderer
    - Path: packages/engine/src/chat/renderers/builtin/ToolResultRenderer.tsx
      Note: Phase 3 builtin tool-result renderer
    - Path: packages/engine/src/chat/renderers/rendererRegistry.ts
      Note: Phase 3 registry and default renderer registration
    - Path: packages/engine/src/chat/renderers/types.ts
      Note: Phase 3 renderer contracts
    - Path: packages/engine/src/chat/runtime/conversationManager.ts
      Note: Phase 2 per-conversation runtime lifecycle manager
    - Path: packages/engine/src/chat/runtime/http.ts
      Note: Phase 2 HTTP helpers for prompt submit and timeline snapshot
    - Path: packages/engine/src/chat/runtime/useConversation.ts
      Note: Phase 2 React hook for lifecycle + send API
    - Path: packages/engine/src/chat/sem/semRegistry.test.ts
      Note: SemContext threading and handler registration tests
    - Path: packages/engine/src/chat/sem/semRegistry.ts
      Note: Phase 1 SemContext adaptation and default handlers
    - Path: packages/engine/src/chat/state/chatSessionSlice.ts
      Note: Per-conversation non-entity chat session state
    - Path: packages/engine/src/chat/state/timelineSlice.test.ts
      Note: Reducer tests for Phase 1 acceptance criteria
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Conversation-scoped timeline reducer with version gating
    - Path: packages/engine/src/chat/ws/wsManager.test.ts
      Note: Phase 2 integration coverage for WS replay behavior
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Phase 2 WS runtime with hydration buffering and SemContext dispatch
    - Path: packages/engine/src/components/widgets/ChatTimelineRenderers.stories.tsx
      Note: Phase 3 Storybook stories for builtin renderers
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
    - Path: packages/engine/src/index.ts
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/changelog.md
      Note: Recorded plan direction change
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/01-implementation-plan-extract-webchat-to-engine.md
      Note: Updated Phase 4 direction to renderer-only ChatWindow
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md
      Note: Aligned task 4.1 with renderer-only conversion
ExternalSources: []
Summary: Implementation diary for HC-01 webchat extraction from inventory app into engine package
LastUpdated: 2026-02-20T00:00:00Z
WhatFor: Track exploration, decisions, and implementation progress
WhenToUse: Reference during implementation and code review
---





# Diary

## Goal

Track the exploration, planning, and implementation of extracting the webchat subsystem from `apps/inventory/src/features/chat/` into `packages/engine/src/chat/` and `packages/engine/src/hypercard/`, aligning with the pinocchio web-chat architecture (SEM registry, timeline entities, renderer registry).

---

## Step 1: Codebase Exploration and Architecture Mapping

Explored all three codebases in parallel to understand the current state and map the refactoring surface. The goal was to verify the ChatGPT Pro analysis against actual code, identify precise file/symbol references, and discover any discrepancies or additional considerations the analysis missed.

The exploration confirmed the analysis is accurate in its high-level assessment. The inventory chat code is a self-contained 22-file subsystem under `apps/inventory/src/features/chat/` that implements its own bespoke SEM handling, timeline projection, and message rendering -- all of which duplicate (less cleanly) what pinocchio already implements via `semRegistry`, `timelineSlice`, `wsManager`, and `rendererRegistry`.

### Prompt Context

**User prompt (verbatim):** "Work on docmgr ticket HC-01-EXTRACT-WEBCHAT which we are going to use to cleanup up the hypercard / inventory app. We have an analysis and refactoring plan provided by our esteemed colleague in Read the chatgpt pro analysis document in the ticket. Then inspect the codebase and create an implementation plan document that contains more detail, references to files and symbols. Store the implementation plan (which should not contain actual code) into the ticket, and create tasks in the ticket to implement it. Keep a diary as you explore the codebase and write the doc."

**Assistant interpretation:** Read the ChatGPT Pro refactoring plan, explore all three codebases (inventory chat, engine package, pinocchio web-chat), then produce a detailed implementation plan with file/symbol references and create docmgr tasks.

**Inferred user intent:** Get a concrete, actionable implementation plan that bridges the gap between the high-level ChatGPT Pro analysis and actual code changes, with trackable tasks.

### What I did

1. Read all ticket documents: `index.md`, `README.md`, `tasks.md`, `changelog.md`, and `sources/local/chatgpt-pro-webchat-cleanup.md`
2. Explored `apps/inventory/src/features/chat/` (22 files) -- mapped every export, import, Redux slice, component, and SEM handler
3. Explored `packages/engine/src/` -- mapped store factory, ChatWindow component, windowing adapter pattern, barrel exports
4. Located pinocchio source at `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/` (accessible via go.work)
5. Read pinocchio key files: `sem/registry.ts`, `ws/wsManager.ts`, `webchat/rendererRegistry.ts`, `sem/timelineMapper.ts`, `sem/timelinePropsRegistry.ts`, `store/timelineSlice.ts`, `webchat/types.ts`
6. Read inventory store setup (`apps/inventory/src/app/store.ts`) and App.tsx window routing

### Why

Need precise file paths, symbol names, state shapes, and architectural patterns to produce an implementation plan that can be followed without ambiguity.

### What worked

- Parallel exploration of all three codebases gave a complete picture quickly
- The ChatGPT Pro analysis maps accurately to actual code -- file names and module boundaries are correct
- Pinocchio source is directly accessible in the workspace via go.work, making copy/adapt feasible

### What didn't work

- N/A (exploration phase only)

### What I learned

**Inventory chat architecture (current):**
- `chatSlice.ts` (627 lines) is the central state manager with `ConversationState` keyed by `conversationId`. It stores: `messages: ChatWindowMessage[]`, `connectionStatus`, `isStreaming`, `suggestions`, `modelName`, `currentTurnStats`, and three inline widget arrays per round (timeline, cards, widgets)
- `InventoryChatWindow.tsx` (778 lines) is the monolithic orchestrator: owns WS lifecycle, SEM dispatch (big `if/else` chain in `onSemEnvelope`), artifact extraction, runtime card registration, timeline snapshot hydration, and inline widget rendering
- `webchatClient.ts` is a simple WS + fetch client with no buffering, no seq tracking, no hydration gating
- `timelineProjection.ts` handles `timeline.upsert` by parsing entity kinds (tool_call, status, tool_result) into `TimelineWidgetItem` updates
- `artifactRuntime.ts` extracts artifact records from SEM events and builds window open payloads

**Pinocchio web-chat architecture (target):**
- `sem/registry.ts` -- clean handler map with `registerSem(type, handler)` + `handleSem(envelope, dispatch)`. All handlers use protobuf decode (`@bufbuild/protobuf`) and dispatch `timelineSlice.actions.upsertEntity/addEntity`
- `ws/wsManager.ts` -- robust WS with nonce-based connection identity, hydration gating (buffers WS frames until HTTP snapshot applied), seq-based dedup, and protobuf snapshot decode
- `store/timelineSlice.ts` -- entities stored as `{ byId, order }` with version-gated upserts (incoming version < existing version = skip). Single-conversation scoped (needs adaptation)
- `webchat/rendererRegistry.ts` -- simple `builtinRenderers` map + `extensionRenderers` Map, resolved via `resolveTimelineRenderers()`. Renderers are `React.ComponentType<{ e: RenderEntity }>`
- `sem/timelinePropsRegistry.ts` -- extensible props normalizer per entity kind
- `webchat/types.ts` -- `RenderEntity = { id, kind, props, createdAt, updatedAt? }` is the universal render contract

**Engine package (destination):**
- `ChatWindow.tsx` renders `ChatWindowMessage[]` with `renderWidget` callback for inline widgets. This needs to evolve to render `RenderEntity[]` via a renderer registry
- `createAppStore()` accepts domain reducers, already supports chat and artifacts as app-level slices
- Windowing uses an adapter chain pattern (`WindowContentAdapter`) that is conceptually similar to the renderer registry
- Barrel exports are comprehensive; new chat modules just need to be added to `index.ts`

**Key discrepancies / additions to the ChatGPT Pro analysis:**
1. The analysis mentions `pinocchio/.../sem/semRegistry.ts` but the actual file is `sem/registry.ts` (no "sem" prefix)
2. The analysis doesn't mention that pinocchio's `wsManager` has a sophisticated nonce-based connection identity system and seq-based buffered replay -- this is a significant piece of robustness the inventory client lacks entirely
3. The `chatSlice` stores inline widgets in three separate arrays per round (`timelineWidgetItems`, `cardPanelItems`, `widgetPanelItems`) within each message. This "widget-per-round" pattern needs careful rethinking when moving to entity-based timeline
4. The analysis correctly identifies that pinocchio's timeline is single-conversation. The conversation-scoping adaptation is the single biggest structural change needed
5. Pinocchio uses `@bufbuild/protobuf` for SEM decode; inventory uses raw JSON field extraction (`semHelpers.ts`). The plan needs to decide: adopt protobuf decode in engine or keep JSON extraction? Both work since the backend emits JSON over WS

### What was tricky to build

N/A (exploration only)

### What warrants a second pair of eyes

1. **Conversation-scoped timeline state**: The adaptation from pinocchio's global `{ byId, order }` to `{ byConvId: { [id]: { byId, order } } }` affects every selector and every SEM handler's dispatch call. This is the riskiest structural change.
2. **Entity identity convergence**: Inventory uses `tool:${toolId}`, `widget:${itemId}`, `card:${itemId}` while pinocchio uses `ev.id` or `${ev.id}:result`. The timeline.upsert reconciliation depends on these converging.
3. **ChatWindow API change**: Moving from `messages: ChatWindowMessage[]` to `entities: RenderEntity[]` is a breaking change to the widget. Need to decide: new component, or backwards-compatible dual mode?

### What should be done in the future

- Write detailed implementation plan with file-level change specifications
- Create docmgr tasks for each implementation step
- Decide on protobuf vs JSON extraction strategy

### Code review instructions

No code changes in this step. Review the exploration findings above against the codebase to verify accuracy.

### Technical details

**Inventory chat file inventory (22 files):**
```
apps/inventory/src/features/chat/
  chatSlice.ts              (627 loc, Redux slice, 20+ actions)
  InventoryChatWindow.tsx   (778 loc, monolithic orchestrator)
  timelineProjection.ts     (213 loc, SEM -> timeline item mapping)
  InventoryTimelineWidget.tsx (270 loc, timeline display component)
  InventoryArtifactPanelWidgets.tsx (235 loc, card/widget panels)
  EventViewerWindow.tsx     (223 loc, debug event viewer)
  RuntimeCardDebugWindow.tsx (206 loc, runtime card debugger)
  webchatClient.ts          (199 loc, WS + HTTP client)
  CodeEditorWindow.tsx      (185 loc, CodeMirror editor)
  artifactRuntime.ts        (150 loc, artifact extraction)
  eventBus.ts               (107 loc, per-conv event pub/sub)
  artifactsSlice.ts         (94 loc, Redux slice)
  utils/SyntaxHighlight.tsx (86 loc, code highlighting)
  utils/yamlFormat.ts       (87 loc, JSON->YAML display)
  semHelpers.ts             (69 loc, field extraction utils)
  selectors.ts              (46 loc, Redux selectors)
  editorLaunch.ts           (41 loc, editor window launcher)
  artifactsSelectors.ts     (15 loc, Redux selectors)
  + 4 test files, 7 story files
```

**Pinocchio key type: TimelineEntity**
```typescript
// pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts
type TimelineEntity = {
  id: string; kind: string; createdAt: number;
  updatedAt?: number; version?: number; props: any;
};
```

**Pinocchio key type: RenderEntity**
```typescript
// pinocchio/cmd/web-chat/web/src/webchat/types.ts
type RenderEntity = {
  id: string; kind: string; props: any;
  createdAt: number; updatedAt?: number;
};
```

**Inventory store wiring (apps/inventory/src/app/store.ts):**
```typescript
createAppStore({
  inventory: inventoryReducer,
  sales: salesReducer,
  artifacts: artifactsReducer,  // from features/chat/artifactsSlice
  chat: chatReducer,            // from features/chat/chatSlice
});
```

**Inventory window routing (apps/inventory/src/App.tsx):**
```
inventory-chat:{convId}  -> InventoryChatWindow
event-viewer:{convId}    -> EventViewerWindow
runtime-card-debug       -> RuntimeCardDebugWindow
code-editor:{cardId}     -> CodeEditorWindow
redux-perf-debug         -> ReduxPerfWindow
```

---

## Step 2: Implementation Plan and Task Creation

Wrote a comprehensive implementation plan document (`design-doc/01-implementation-plan-extract-webchat-to-engine.md`) with 8 phases, 6 architectural decisions, and precise file/symbol references mapping every inventory file to its engine destination. Also created 45 granular tasks in `tasks.md` organized by phase.

The plan captures decisions the ChatGPT Pro analysis left as options: SemContext approach (Option A), conversation-scoped state, new ChatConversationWindow (rather than breaking ChatWindow API), protobuf decode in engine, and the entity identity convergence strategy. Each phase is designed to land independently with a working system.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Produce the implementation plan and task list as docmgr artifacts.

**Inferred user intent:** Have a reviewable, actionable plan with trackable tasks before any code is written.

### What I did

1. Created design-doc via `docmgr doc add --doc-type design-doc --title "Implementation Plan: Extract Webchat to Engine"`
2. Wrote 8-phase implementation plan with:
   - 6 key architectural decisions with rationale
   - Precise source -> target file mappings for every module
   - Symbol-level references (function names, type names, line numbers)
   - Verification criteria for each phase
3. Created 45 granular tasks in `tasks.md` organized by phase
4. Updated diary with this step

### Why

The ChatGPT Pro analysis provides a good high-level roadmap but lacks the precision needed to start coding: no exact file paths to pinocchio source, no line numbers, no symbol names, and several decisions left as open options. This plan resolves all of those.

### What worked

- The three-codebase exploration in Step 1 provided all the context needed to write the plan without going back to read more files
- docmgr's document structure (design-doc, reference, tasks) maps well to the artifacts needed

### What didn't work

N/A

### What I learned

- The plan has 45 tasks across 8 phases. Phases 1-2 (foundation) are the highest risk since they establish the conversation-scoped timeline pattern that everything else builds on.
- Phase 7 (delete inventory chat) is the most satisfying but depends on all prior phases.
- The open questions (proto ownership, module registration timing, CodeMirror bundle weight) should be resolved before starting Phase 3.

### What was tricky to build

The implementation plan needed to balance two tensions: (1) following pinocchio's architecture closely enough to converge, and (2) adapting it for hypercard's multi-conversation requirement. The conversation-scoping adaptation touches nearly every copied file and cannot be deferred.

### What warrants a second pair of eyes

The 6 architectural decisions should be reviewed before implementation begins, especially Decision 3 (ChatWindow slot extension vs new component) since it affects the engine's public API.

### What should be done in the future

Begin Phase 1 implementation.

### Code review instructions

No code in this step. Review the implementation plan at `design-doc/01-implementation-plan-extract-webchat-to-engine.md` and the task list at `tasks.md`.

---

## Step 3: Phase 4 Plan Direction Change (Renderer-Only ChatWindow)

Updated the implementation plan direction for Phase 4 so `ChatWindow` no longer keeps any legacy message rendering path. This turns `ChatWindow` into a pure shell component while message behavior is preserved in timeline renderers, especially `MessageRenderer`.

The change was applied directly to both the design doc and task list to keep execution unambiguous before coding continues. This avoids a dual-mode migration and enforces the entity-first architecture from this point onward.

### Prompt Context

**User prompt (verbatim):** "Update the plan for phase 4 to remove all the existings messages functionality from ChatWindow, and instead to preserve the functionality in the MessageRenderer and other renderers."

**Assistant interpretation:** Revise the implementation plan and tasks so Phase 4 removes message-mode `ChatWindow` behavior and relies entirely on renderer modules.

**Inferred user intent:** Eliminate mixed architecture complexity and ensure a single rendering path based on timeline entities and renderer registry.

### What I did

1. Updated Decision 3 in `design-doc/01-implementation-plan-extract-webchat-to-engine.md` to explicitly remove `messages` mode from `ChatWindow`
2. Rewrote the Phase 4 section title/goal to "Renderer-Only Conversion"
3. Updated the Phase 4 step breakdown to require `timelineContent` and remove backwards-compatibility shims
4. Updated task **4.1** in `tasks.md` to reflect the renderer-only conversion
5. Added changelog entry for this plan update

### Why

Keeping both legacy message rendering and entity rendering in `ChatWindow` would duplicate behavior and create two codepaths to test and maintain. The renderer-only direction keeps ownership clear: shell in `ChatWindow`, content behavior in renderers.

### What worked

- The plan/task changes were localized to Decision 3 and Phase 4, so the update was fast and unambiguous
- Existing Phase 3 renderer tasks already capture most needed behavior migration, so no extra phase was required

### What didn't work

- N/A

### What I learned

- The original plan still carried a backwards-compatibility assumption from the pre-change direction
- Converting this at the plan level now is lower risk than changing direction mid-implementation in Phase 4

### What was tricky to build

The tricky part was preserving the same UX behaviors (role labels, streaming cursor, thinking state) while removing the component that currently renders them. The mitigation is to make those behaviors explicit acceptance criteria for `MessageRenderer` and the renderer registry path.

### What warrants a second pair of eyes

- Review that all Phase 4 wording now consistently removes legacy `messages` mode
- Confirm Phase 3 renderer tasks are sufficient to preserve current ChatWindow behavior without hidden coupling

### What should be done in the future

- Keep implementing Phase 1 tasks in order, then carry this renderer-only constraint into Phase 3/4 code changes

### Code review instructions

- Review `design-doc/01-implementation-plan-extract-webchat-to-engine.md` (Decision 3 + Phase 4)
- Review `tasks.md` task **4.1** and Phase 4 heading
- Review `changelog.md` latest entry for decision traceability

### Technical details

- Decision rename: from "ChatWindow Slot Extension" to renderer-only conversion
- API direction: remove `messages` prop path, require `timelineContent: ReactNode`
- Behavior ownership: message rendering logic moves into `MessageRenderer` and companion renderers

---

## Step 4: Phase 1 Implementation (Chat Skeleton, SEM Registry, Timeline/Session State)

Implemented the full Phase 1 foundation in `packages/engine/src/chat/` and checked off tasks 1.1 through 1.11. This establishes the minimum engine-local chat architecture needed before WS/runtime/renderer migration in later phases.

The key outcome is a conversation-scoped state model plus SemContext-driven dispatch in the SEM registry, with protobuf decode and unit tests in place. This lands the architectural seam needed for multi-window conversation isolation.

### Prompt Context

**User prompt (verbatim):** "Work on docmgr ticket HC-01-EXTRACT-WEBCHAT and tackle task by task, keeping a detailed diary as you go. As you check off tasks by tasks, commit at opportune intervals."

**Assistant interpretation:** Execute the ticket implementation sequentially, keep detailed ticket diary entries, check tasks as completed, and commit in focused batches.

**Inferred user intent:** Drive implementation with disciplined execution tracking and auditability rather than ad-hoc coding.

**Commit (code):** a813f39 — "feat(engine): scaffold chat sem + conversation-scoped timeline state"

### What I did

1. Implemented directory skeleton for `chat/*` and `hypercard/*` Phase 1 targets
2. Copied/generated SEM protobuf TS files into `packages/engine/src/chat/sem/pb/`
3. Adapted `semRegistry` to use `SemContext = { dispatch, convId }` and conv-scoped timeline dispatch
4. Added conversation-scoped `timelineSlice` with version-gated upsert + rekey + snapshot + clear
5. Added `chatSessionSlice` for non-entity per-conversation state
6. Added conversation-scoped selectors for timeline/session state
7. Added `chat` barrel export and wired `export * from './chat'` in engine index
8. Added `@bufbuild/protobuf` dependency in engine package + lockfile update
9. Added tests:
   - `timelineSlice.test.ts` (upsert/scoping/version gating/rekey)
   - `semRegistry.test.ts` (handler registration + SemContext threading)
10. Fixed pre-existing compile gap by adding `packages/engine/src/chat/chatApi.ts` for `StreamHandlers` used by `chat/mocks/fakeStreamService.ts`
11. Ran validation commands and then checked off tasks 1-11 with docmgr

### Why

Phase 1 is the architectural base for everything else. Without SemContext threading and conversation-scoped state, later work (wsManager, ChatConversationWindow, hypercard SEM modules) would accumulate incompatible assumptions.

### What worked

- Copy/adapt strategy from pinocchio made Phase 1 implementation direct and low-risk
- Unit tests covered the critical behaviors called out by the task list (scoping, version gating, context threading)
- Typecheck passed after adding missing `chatApi.ts`, confirming the new modules integrate with the package build

### What didn't work

- Initial `npm run -w packages/engine typecheck` failed with:
  - `src/chat/mocks/fakeStreamService.ts(1,37): error TS2307: Cannot find module '../chatApi' or its corresponding type declarations.`
- Resolution: added `packages/engine/src/chat/chatApi.ts` with `StreamHandlers` and related types, then reran typecheck successfully

### What I learned

- There was a latent typecheck issue in existing `chat/mocks` that had to be fixed to verify Phase 1 cleanly
- Keeping timeline and session slices separate early clarifies which data belongs in entities vs non-entity session state

### What was tricky to build

Conversation-scoping while preserving pinocchio's version-gating semantics was the main sharp edge. The reducer logic has to preserve idempotence for unversioned updates while refusing stale versioned updates, and do that independently per `convId`. The approach was to keep the original upsert algorithm intact and apply it inside a per-conversation substate accessor.

### What warrants a second pair of eyes

- `timelineSlice` merge behavior when `props` payloads are non-object values
- `semRegistry` event decode handling for malformed payloads (currently ignores decode failures silently)
- Whether `chatSessionSlice` should retain both `setSuggestions` and `replaceSuggestions` long-term

### What should be done in the future

- Proceed to Phase 2 tasks (2.1-2.5): wsManager + HTTP runtime + conversation hook + integration tests

### Code review instructions

- Start with `packages/engine/src/chat/sem/semRegistry.ts` and `packages/engine/src/chat/state/timelineSlice.ts`
- Then review `packages/engine/src/chat/state/chatSessionSlice.ts` and `packages/engine/src/chat/state/selectors.ts`
- Validate with:
  - `npm run -w packages/engine test -- src/chat/state/timelineSlice.test.ts src/chat/sem/semRegistry.test.ts`
  - `npm run -w packages/engine typecheck`
- Confirm task bookkeeping:
  - `docmgr task list --ticket HC-01-EXTRACT-WEBCHAT`

### Technical details

- Added copied protobuf artifacts under `packages/engine/src/chat/sem/pb/proto/sem/{base,domain,team,timeline}`
- Sem registry dispatch path now uses `timelineSlice.actions.{addEntity,upsertEntity}({ convId, entity })`
- Timeline reducer state shape:
  - `{ byConvId: Record<string, { byId: Record<string, TimelineEntity>, order: string[] }> }`
- Task updates executed:
  - `docmgr task check --ticket HC-01-EXTRACT-WEBCHAT --id 1,2,3,4,5,6,7,8,9,10,11`

---

## Step 5: Phase 2 Implementation (WS Manager, HTTP Runtime, Conversation Lifecycle)

Implemented Phase 2 runtime plumbing for chat connectivity and hydration. This adds the engine-local WS manager, HTTP helpers, and a per-conversation lifecycle manager used by the new `useConversation` hook.

The Phase 2 integration test verifies that SEM frames flow from a mocked WebSocket into Redux timeline entities and that hydration buffering/replay works when frames arrive before snapshot application completes.

### Prompt Context

**User prompt (verbatim):** (see Step 4)

**Assistant interpretation:** Continue sequential task execution and keep diary/task/commit bookkeeping in lockstep.

**Inferred user intent:** Progress through the implementation plan with verifiable, incremental milestones.

**Commit (code):** a788974 — "feat(engine): add websocket runtime and conversation manager"

### What I did

1. Added `packages/engine/src/chat/ws/wsManager.ts` adapted from pinocchio:
   - threaded `SemContext` (`dispatch`, `convId`) into `handleSem`
   - replaced appSlice/errorSlice dependencies with `chatSessionSlice` + `timelineSlice`
   - removed `registerThinkingModeModule()` call
   - kept hydration buffering + replay and timeline snapshot decode
2. Added HTTP helpers in `packages/engine/src/chat/runtime/http.ts`:
   - `submitPrompt(prompt, convId, basePrefix?)`
   - `fetchTimelineSnapshot(convId, basePrefix?)`
3. Added `packages/engine/src/chat/runtime/conversationManager.ts`:
   - wraps WS connect/disconnect and HTTP submit
   - tracks per-conversation lifecycle via internal session map
4. Added `packages/engine/src/chat/runtime/useConversation.ts`:
   - connects on mount, disconnects on cleanup
   - exposes `{ send, connectionStatus, isStreaming }`
5. Added integration tests in `packages/engine/src/chat/ws/wsManager.test.ts`:
   - frame-to-entity dispatch path
   - hydrate-buffer-then-replay path
6. Exported runtime/ws modules from `packages/engine/src/chat/index.ts`
7. Checked off tasks 2.1-2.5 in docmgr

### Why

Phase 2 is required to move chat orchestration out of inventory's monolithic `InventoryChatWindow` and into reusable engine runtime modules. Without this layer, renderer and component extraction in Phase 3/4 would still depend on app-local networking code.

### What worked

- The pinocchio WS flow ported cleanly once action targets were converted to conversation-scoped slices
- Injected `wsFactory`/`fetchImpl` hooks made WS integration tests deterministic in Node
- Typecheck and targeted tests passed after implementation

### What didn't work

- Initial typecheck surfaced strict typing issues in the new WS test and snapshot mapping:
  - nullable map result in `applyTimelineSnapshot`
  - `fromJson` input typing
  - deferred resolver typing in test
- Resolution:
  - added explicit type guard for mapped entities
  - cast JSON payload to `any` at the protobuf decode boundary
  - switched deferred resolver to definite assignment style

### What I learned

- Keeping WS manager API injection points (`wsFactory`, `fetchImpl`, `location`) is valuable for reliable integration tests without browser globals
- Hydration behavior needs explicit handling for `hydrate: false`; otherwise frames can remain buffered indefinitely

### What was tricky to build

The trickiest part was preserving hydration ordering guarantees while adapting from global app state to conversation-scoped slices. Buffered frames must replay only after snapshot apply and in seq order, while still supporting a no-hydrate mode used by tests and potential low-latency flows.

### What warrants a second pair of eyes

- Conversation ref-count behavior in `conversationManager.connect/disconnect` for edge cases with repeated mounts
- Whether `registerDefaultSemHandlers()` should be called per WS connect or once at module bootstrap when extension handlers are introduced in later phases
- Error channeling strategy (`setStreamError`) vs dedicated structured error state in future phases

### What should be done in the future

- Proceed to Phase 3 tasks (renderer registry + builtin renderers)

### Code review instructions

- Start with `packages/engine/src/chat/ws/wsManager.ts`
- Then review `packages/engine/src/chat/runtime/conversationManager.ts`, `packages/engine/src/chat/runtime/http.ts`, and `packages/engine/src/chat/runtime/useConversation.ts`
- Validate with:
  - `npm run -w packages/engine test -- src/chat/ws/wsManager.test.ts`
  - `npm run -w packages/engine typecheck`
- Confirm task bookkeeping:
  - `docmgr task list --ticket HC-01-EXTRACT-WEBCHAT`

### Technical details

- WS snapshot endpoint:
  - `${basePrefix}/api/timeline?conv_id=${encodeURIComponent(convId)}`
- WS live endpoint:
  - `${protocol}://${host}${basePrefix}/ws?conv_id=${encodeURIComponent(convId)}`
- Task updates executed:
  - `docmgr task check --ticket HC-01-EXTRACT-WEBCHAT --id 12,13,14,15,16`

---

## Step 6: Phase 3 Implementation (Renderer Registry + Builtin Renderers + Stories)

Implemented Phase 3 by introducing a renderer registry and a first batch of builtin renderers that cover the current core timeline kinds (`message`, `tool_call`, `tool_result`, `status`, `log`) plus a generic fallback.

This step also introduces Storybook coverage for each builtin renderer and keeps message presentation behavior (role labels, thinking indicator, streaming cursor) inside `MessageRenderer`, aligned with the renderer-only Phase 4 direction.

### Prompt Context

**User prompt (verbatim):** (see Step 4)

**Assistant interpretation:** Continue sequentially through the task list and keep implementation/docs/commits synchronized.

**Inferred user intent:** Deliver incremental, reviewable architecture migration progress with concrete UX-preserving outcomes.

**Commit (code):** 27758b7 — "feat(engine): add timeline renderer registry and builtin renderers"

### What I did

1. Added renderer contracts in `packages/engine/src/chat/renderers/types.ts`
2. Added `rendererRegistry.ts` with:
   - `registerTimelineRenderer`
   - `unregisterTimelineRenderer`
   - `clearRegisteredTimelineRenderers`
   - `resolveTimelineRenderers`
   - `registerDefaultTimelineRenderers`
3. Added builtin renderer components:
   - `MessageRenderer.tsx`
   - `ToolCallRenderer.tsx`
   - `ToolResultRenderer.tsx`
   - `StatusRenderer.tsx`
   - `LogRenderer.tsx`
   - `GenericRenderer.tsx`
4. Added builtin barrel export `renderers/builtin/index.ts`
5. Added Storybook stories at `packages/engine/src/components/widgets/ChatTimelineRenderers.stories.tsx`
6. Exported renderers from `packages/engine/src/chat/index.ts`
7. Ran typecheck + tests (including Storybook taxonomy check) and fixed story placement to satisfy taxonomy constraints
8. Checked off tasks 3.1-3.6 in docmgr

### Why

Phase 3 is the bridge between entity state and UI rendering. Establishing renderer contracts now enables Phase 4 to simplify `ChatWindow` into a shell without losing existing message UX.

### What worked

- Registry API copied cleanly from pinocchio with engine-local renderer types
- Message behavior port from legacy `ChatWindow` to `MessageRenderer` retained expected role/cursor/thinking presentation
- Storybook taxonomy and tests passed after relocating stories under `components/widgets`

### What didn't work

- Initial Storybook story location under `packages/engine/src/chat/renderers/...` failed repo taxonomy check:
  - `engine story path must be under packages/engine/src/components or packages/engine/src/plugin-runtime`
- Resolution:
  - moved stories to `packages/engine/src/components/widgets/ChatTimelineRenderers.stories.tsx`

### What I learned

- This repo enforces strict story placement; renderer stories can still target chat modules if stored under `components/`
- The renderer contract is already sufficient for Phase 4 `timelineContent` rendering, so no additional renderer abstraction is needed right now

### What was tricky to build

Preserving message behavior while decoupling from `ChatWindow` required choosing what belongs to the renderer vs shell. The solution was to keep semantic message rendering details in `MessageRenderer` and avoid coupling to shell state beyond entity props.

### What warrants a second pair of eyes

- Visual consistency of new renderer output compared to existing `ChatWindow` message rendering
- Whether `registerDefaultTimelineRenderers()` should mutate extension registry or stay purely declarative
- Future `status`/`log` payload shape assumptions in renderers before hypercard-specific kinds are added

### What should be done in the future

- Proceed to Phase 4 tasks with renderer-only `ChatWindow` conversion and `ChatConversationWindow`

### Code review instructions

- Start with `packages/engine/src/chat/renderers/rendererRegistry.ts` and `packages/engine/src/chat/renderers/types.ts`
- Review builtin renderer files under `packages/engine/src/chat/renderers/builtin/`
- Review stories at `packages/engine/src/components/widgets/ChatTimelineRenderers.stories.tsx`
- Validate with:
  - `npm run -w packages/engine typecheck`
  - `npm run -w packages/engine test -- src/chat/state/timelineSlice.test.ts src/chat/sem/semRegistry.test.ts src/chat/ws/wsManager.test.ts`
- Confirm task bookkeeping:
  - `docmgr task list --ticket HC-01-EXTRACT-WEBCHAT`

### Technical details

- Builtin renderer kind mapping:
  - `message`, `tool_call`, `tool_result`, `status`, `log`
- Fallback renderer:
  - `default: GenericRenderer`
- Task updates executed:
  - `docmgr task check --ticket HC-01-EXTRACT-WEBCHAT --id 17,18,19,20,21,22`
