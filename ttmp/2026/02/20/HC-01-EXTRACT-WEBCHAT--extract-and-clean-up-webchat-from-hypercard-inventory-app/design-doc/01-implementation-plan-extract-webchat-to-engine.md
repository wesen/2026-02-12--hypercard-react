---
Title: 'Implementation Plan: Extract Webchat to Engine'
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/timelineProjection.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactsSlice.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/eventBus.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/semHelpers.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/index.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/registry.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts
    - /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts
ExternalSources:
    - local:chatgpt-pro-webchat-cleanup.md
Summary: "Detailed implementation plan for extracting webchat from inventory app into engine, aligned with pinocchio architecture"
LastUpdated: 2026-02-20
WhatFor: "Guide implementation of the webchat extraction refactor"
WhenToUse: "Reference during each implementation phase"
---

# Implementation Plan: Extract Webchat to Engine

## Executive Summary

Extract the webchat subsystem from `apps/inventory/src/features/chat/` (22 source files, ~3800 LOC) into `packages/engine/src/chat/` and `packages/engine/src/hypercard/`, aligning with the pinocchio web-chat architecture. The result: inventory app becomes a thin shell that wires engine components into window routing; the engine owns the SEM pipeline, timeline state, WebSocket management, and entity rendering.

This plan is organized into 8 phases that can be landed incrementally. Each phase produces a working system, so there is no "big bang" cutover.

## Problem Statement

The inventory app's `features/chat/` directory contains a parallel, bespoke implementation of chat infrastructure that duplicates what pinocchio's web-chat already provides more robustly:

1. **Bespoke SEM dispatch** -- `InventoryChatWindow.tsx:289-485` is a 200-line `if/else` chain dispatching SEM events to Redux actions. Pinocchio uses a clean `registerSem(type, handler)` registry (`sem/registry.ts`)
2. **No hydration gating** -- `webchatClient.ts` has no buffering; messages arriving during snapshot hydration can be lost or reordered. Pinocchio's `wsManager.ts` buffers until hydration completes, then replays in seq order
3. **Message-centric instead of entity-centric** -- `chatSlice.ts` stores `messages: ChatWindowMessage[]` with inline widget arrays, mixing presentation with domain state. Pinocchio uses `TimelineEntity { id, kind, props, version }` with version-gated upserts
4. **No renderer registry** -- Widget rendering is hardcoded in `InventoryChatWindow.tsx:654-696`. Pinocchio uses `rendererRegistry.ts` with `registerTimelineRenderer(kind, component)`
5. **Not reusable** -- All chat code is in `apps/inventory/`, so no other app can use it

## Proposed Solution

### Target Directory Layout

```
packages/engine/src/
  chat/
    sem/
      semRegistry.ts              # Handler registry (from pinocchio sem/registry.ts)
      semHelpers.ts               # Field extraction (from inventory semHelpers.ts)
      timelineMapper.ts           # Proto entity -> TimelineEntity (from pinocchio)
      timelinePropsRegistry.ts    # Props normalizer registry (from pinocchio)
    ws/
      wsManager.ts                # WebSocket + hydration + buffering (from pinocchio)
    state/
      timelineSlice.ts            # Conversation-scoped timeline entities (adapted from pinocchio)
      chatSessionSlice.ts         # Non-entity chat state (connection, suggestions, stats)
      selectors.ts                # Conversation-scoped selectors
    renderers/
      rendererRegistry.ts         # Entity kind -> React component (from pinocchio)
      builtin/
        MessageRenderer.tsx       # message entity renderer
        ToolCallRenderer.tsx      # tool_call entity renderer
        ToolResultRenderer.tsx    # tool_result entity renderer
        StatusRenderer.tsx        # status entity renderer
        LogRenderer.tsx           # log entity renderer
        GenericRenderer.tsx       # fallback renderer
    runtime/
      conversationManager.ts      # WS lifecycle + HTTP orchestration
      useConversation.ts          # React hook for conversation state
      http.ts                     # submitPrompt, fetchTimelineSnapshot
    components/
      ChatConversationWindow.tsx  # Connected component (replaces InventoryChatWindow)
      StatsFooter.tsx             # Token stats display
    debug/
      eventBus.ts                 # Per-conversation event log (from inventory)
      EventViewerWindow.tsx       # Event debug UI (from inventory)
      SyntaxHighlight.tsx         # Code highlighting (from inventory)
      yamlFormat.ts               # YAML display formatter (from inventory)
    utils/
      number.ts                   # Numeric helpers (from pinocchio)
      guards.ts                   # Type guards (from pinocchio)
    index.ts                      # Barrel exports for chat module
  hypercard/
    artifacts/
      artifactsSlice.ts           # Artifact storage (from inventory)
      artifactsSelectors.ts       # Artifact selectors (from inventory)
      artifactRuntime.ts          # Artifact extraction + window payloads (from inventory)
    timeline/
      hypercardWidget.ts          # SEM handlers + renderer for hypercard_widget
      hypercardCard.ts            # SEM handlers + renderer for hypercard_card
      registerHypercardTimeline.ts # Bootstrap function for both
    editor/
      CodeEditorWindow.tsx        # CodeMirror editor (from inventory)
      editorLaunch.ts             # Code stash + window open (from inventory)
    debug/
      RuntimeCardDebugWindow.tsx  # Runtime card debug UI (from inventory)
    index.ts                      # Barrel exports for hypercard module
```

### Key Architectural Decisions

#### Decision 1: SEM Handler Signature -- Use SemContext (Option A from analysis)

**Current (pinocchio):** `(ev: SemEvent, dispatch: AppDispatch) => void`

**Target:** `(ev: SemEvent, ctx: SemContext) => void` where `SemContext = { dispatch, convId }`

**Rationale:** Adding `convId` to every handler's dispatch calls is error-prone. Threading it through a context object keeps the handler signature clean and makes conversation-scoping automatic.

**Files affected:**
- New: `packages/engine/src/chat/sem/semRegistry.ts` (adapt `Handler` type)
- All handlers registered in `registerDefaultSemHandlers()` (adapt dispatch calls)

#### Decision 2: Timeline State -- Conversation-scoped with per-conversation sub-state

**Current (pinocchio):** `{ byId: Record<string, TimelineEntity>, order: string[] }`

**Target:**
```
{
  byConvId: Record<string, {
    byId: Record<string, TimelineEntity>,
    order: string[]
  }>
}
```

**Rationale:** Hypercard desktop can have multiple chat windows open. Entity CRUD must be scoped to a conversation to prevent cross-contamination.

**Action payloads change from:**
- `upsertEntity(entity)` -> `upsertEntity({ convId, entity })`
- `addEntity(entity)` -> `addEntity({ convId, entity })`
- `clear()` -> `clearConversation({ convId })`

**Source files:**
- Pinocchio original: `pinocchio/.../store/timelineSlice.ts` (107 lines)
- Inventory chatSlice for reference on per-conv pattern: `apps/inventory/.../chatSlice.ts:1-50` (the `conversations` Record pattern)

#### Decision 3: ChatWindow -- Remove message-centric rendering, make renderer-driven timeline shell

**Rationale:** Keeping both message-mode and entity-mode in `ChatWindow` creates duplicate rendering paths and slows the extraction. The target architecture is entity-first; message behavior should live in `MessageRenderer` (and other kind renderers), not in `ChatWindow`.

**Approach:**
- Remove `messages`-specific rendering from `ChatWindow` (`ChatWindowMessage`, block parsing, role labels, inline widget loops, streaming/thinking message logic)
- Keep `ChatWindow` focused on shell concerns only: header, timeline container, suggestions, composer, footer
- Add required `timelineContent: ReactNode` prop and render it directly in the timeline area
- Move all existing message presentation behavior into `MessageRenderer` and other timeline renderers
- `ChatConversationWindow` becomes the single owner of mapping entities -> renderers and passes the rendered list into `ChatWindow`

**Files affected:**
- Modify: `packages/engine/src/components/widgets/ChatWindow.tsx` (remove message mode, require timeline content input)
- Modify: `packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx` (preserve existing message UX from ChatWindow)
- New: `packages/engine/src/chat/components/ChatConversationWindow.tsx`

#### Decision 4: Protobuf vs JSON for SEM Decode

**Decision:** Use protobuf decode with `@bufbuild/protobuf` in engine, matching pinocchio.

**Rationale:**
- Type-safe decode catches schema drift at dev time
- Engine is the long-term home; investing in proper types pays off
- Pinocchio's handlers already use it; copying them requires the same dependency
- The `sem/pb/` proto schemas are already generated and available in pinocchio

**Impact:**
- Add `@bufbuild/protobuf` to `packages/engine/package.json`
- Copy `pinocchio/.../sem/pb/` generated types to `packages/engine/src/chat/sem/pb/`

#### Decision 5: Entity Identity Convention

**Core entities:** Use pinocchio's scheme (event ID / entity.id from SEM envelope)
- `message` entities: `id = ev.id`
- `tool_call` entities: `id = ev.id`
- `tool_result` entities: `id = ${ev.id}:result` or `${ev.id}:custom`

**Hypercard entities:** Use the stable itemId prefix scheme from inventory
- `hypercard_widget` entities: `id = widget:${itemId}`
- `hypercard_card` entities: `id = card:${itemId}`

**Reconciliation:** When `timeline.upsert` arrives with `customKind = hypercard.widget.v1`, the timelineMapper remaps:
- `{ kind: 'tool_result', id: originalId }` -> `{ kind: 'hypercard_widget', id: 'widget:' + toolCallId }`

This ensures SEM lifecycle events and backend timeline.upsert converge on the same entity.

**Files affected:**
- New: `packages/engine/src/chat/sem/timelineMapper.ts` (add customKind remap hook)
- New: `packages/engine/src/hypercard/timeline/hypercardWidget.ts` (lifecycle handlers)
- New: `packages/engine/src/hypercard/timeline/hypercardCard.ts` (lifecycle handlers)

#### Decision 6: Non-entity Chat State (chatSessionSlice)

**What stays outside timeline entities:**
- `connectionStatus`: 'idle' | 'connecting' | 'connected' | 'closed' | 'error'
- `isStreaming`: boolean (convenience flag, derivable from entities but useful)
- `suggestions`: string[] (from `hypercard.suggestions.*` events)
- `modelName`: string | null
- `currentTurnStats`: TurnStats | null
- `streamStartTime`: number | null
- `streamOutputTokens`: number
- `lastError`: string | null

**Source of these fields:** `apps/inventory/.../chatSlice.ts` `ConversationState` type (lines ~30-50)

**New file:** `packages/engine/src/chat/state/chatSessionSlice.ts`

State shape is conversation-scoped just like the timeline slice:
```
{ byConvId: Record<string, ChatSessionState> }
```

---

## Implementation Phases

### Phase 1: Engine Chat Skeleton + SEM Registry + Timeline Slice

**Goal:** Create the foundational chat module in engine with SEM handler registry and conversation-scoped timeline state. No UI changes yet.

**What to do:**

1. Create directory structure: `packages/engine/src/chat/{sem,ws,state,utils,renderers,runtime,components,debug}`

2. Copy + adapt SEM registry:
   - **Source:** `pinocchio/.../sem/registry.ts` (201 lines)
   - **Target:** `packages/engine/src/chat/sem/semRegistry.ts`
   - **Changes:** Change `Handler` signature from `(ev, dispatch)` to `(ev, ctx: SemContext)` where `SemContext = { dispatch, convId }`. Update all handler bodies in `registerDefaultSemHandlers()` to use `ctx.dispatch` and pass `ctx.convId` in action payloads
   - **Symbols to copy:** `SemEnvelope`, `SemEvent`, `registerSem`, `handleSem`, `registerDefaultSemHandlers`, `decodeProto`

3. Copy protobuf types:
   - **Source:** `pinocchio/.../sem/pb/proto/sem/` (generated .ts files)
   - **Target:** `packages/engine/src/chat/sem/pb/`
   - **Schemas needed:** `LlmStartSchema`, `LlmDeltaSchema`, `LlmFinalSchema`, `LlmDoneSchema`, `ToolStartSchema`, `ToolDeltaSchema`, `ToolResultSchema`, `ToolDoneSchema`, `LogV1Schema`, `AgentModeV1Schema`, `DebuggerPauseV1Schema`, `TimelineUpsertV2Schema`, `TimelineSnapshotV2Schema`, `TimelineEntityV2`

4. Copy + adapt timeline mapper:
   - **Source:** `pinocchio/.../sem/timelineMapper.ts` (28 lines)
   - **Target:** `packages/engine/src/chat/sem/timelineMapper.ts`
   - **Changes:** Import from local pb paths. Later (Phase 5) add customKind remap hook

5. Copy timeline props registry:
   - **Source:** `pinocchio/.../sem/timelinePropsRegistry.ts` (43 lines)
   - **Target:** `packages/engine/src/chat/sem/timelinePropsRegistry.ts`
   - **Changes:** None initially; copy verbatim

6. Create conversation-scoped timeline slice:
   - **Source:** `pinocchio/.../store/timelineSlice.ts` (107 lines)
   - **Target:** `packages/engine/src/chat/state/timelineSlice.ts`
   - **Changes:**
     - State shape: `{ byConvId: Record<string, { byId, order }> }`
     - Actions: `upsertEntity({ convId, entity })`, `addEntity({ convId, entity })`, `clearConversation({ convId })`, `applySnapshot({ convId, entities })`, `rekeyEntity({ convId, fromId, toId })`
     - Preserve version-gating logic from pinocchio's `upsertEntity`
   - **Types to export:** `TimelineEntity`, `ConversationTimelineState`

7. Copy utility files:
   - **Source:** `pinocchio/.../utils/number.ts`, `pinocchio/.../utils/guards.ts`
   - **Target:** `packages/engine/src/chat/utils/`
   - Move `apps/inventory/.../semHelpers.ts` to `packages/engine/src/chat/sem/semHelpers.ts`

8. Create `chatSessionSlice`:
   - **Target:** `packages/engine/src/chat/state/chatSessionSlice.ts`
   - **Fields:** connectionStatus, isStreaming, suggestions, modelName, currentTurnStats, streamStartTime, streamOutputTokens, lastError (all per-conversation)
   - **Source for field definitions:** `apps/inventory/.../chatSlice.ts` (ConversationState type, lines ~30-50)
   - **Actions:** `setConnectionStatus`, `setSuggestions`, `mergeSuggestions`, `setModelName`, `setTurnStats`, `markStreamStart`, `updateStreamTokens`, `setStreamError`, `setIsStreaming`, `resetSession`

9. Create selectors:
   - **Target:** `packages/engine/src/chat/state/selectors.ts`
   - Conversation-scoped selectors for both timeline and session state
   - **Source for selector patterns:** `apps/inventory/.../selectors.ts` (46 lines)

10. Add `@bufbuild/protobuf` dependency to `packages/engine/package.json`

11. Create barrel export: `packages/engine/src/chat/index.ts`

12. Add `export * from './chat'` to `packages/engine/src/index.ts`

**Verification:** Unit tests for timelineSlice (upsert, version gating, conversation scoping) and semRegistry (handler registration, dispatch routing).

---

### Phase 2: WebSocket Manager + HTTP Client

**Goal:** Bring pinocchio's robust WS management into engine, adapted for conversation-scoping.

**What to do:**

1. Copy + adapt wsManager:
   - **Source:** `pinocchio/.../ws/wsManager.ts` (223 lines)
   - **Target:** `packages/engine/src/chat/ws/wsManager.ts`
   - **Key features to preserve:**
     - Nonce-based connection identity (`connectNonce`, checked in every callback)
     - Hydration gating (`hydrated` flag, `buffered` queue)
     - Seq-based dedup during replay (`seqFromEnvelope`, sort, filter)
     - Timeline snapshot decode via protobuf (`TimelineSnapshotV2Schema`)
   - **Changes:**
     - `connect(args)` takes `convId` which threads into SemContext
     - `handleSem(payload, dispatch)` becomes `handleSem(payload, { dispatch, convId })`
     - Timeline clear uses `clearConversation({ convId })` instead of `clear()`
     - Remove pinocchio-specific `appSlice` references (wsStatus, lastSeq); use `chatSessionSlice` actions instead
     - Remove `registerThinkingModeModule()` call; that becomes part of module registration (Phase 6)

2. Create HTTP helpers:
   - **Target:** `packages/engine/src/chat/runtime/http.ts`
   - **Functions:** `submitPrompt(prompt, convId, basePrefix?)`, `fetchTimelineSnapshot(convId, basePrefix?)`
   - **Source:** `apps/inventory/.../webchatClient.ts` (`submitPrompt` at line ~150, `fetchTimelineSnapshot` at line ~170) for endpoint shapes
   - Make `basePrefix` configurable (defaults to `''`); pinocchio uses `args.basePrefix`, inventory hardcodes paths

3. Create conversation manager:
   - **Target:** `packages/engine/src/chat/runtime/conversationManager.ts`
   - Thin wrapper combining wsManager.connect/disconnect + HTTP submit
   - Manages lifecycle per conversation (connect on mount, disconnect on unmount)
   - Dispatches `chatSessionSlice.setConnectionStatus` on WS state changes

4. Create React hook:
   - **Target:** `packages/engine/src/chat/runtime/useConversation.ts`
   - `useConversation(convId)` -- calls conversationManager.connect on mount, disconnect on cleanup
   - Returns `{ send, connectionStatus, isStreaming }` from selectors

**Verification:** Integration test: create store, call wsManager.connect with mock WS, verify timeline entities appear after simulated SEM frames.

---

### Phase 3: Renderer Registry + Builtin Renderers

**Goal:** Port pinocchio's renderer registry and create builtin renderers for core entity kinds.

**What to do:**

1. Copy + adapt renderer registry:
   - **Source:** `pinocchio/.../webchat/rendererRegistry.ts` (49 lines)
   - **Target:** `packages/engine/src/chat/renderers/rendererRegistry.ts`
   - **Exports:** `registerTimelineRenderer`, `unregisterTimelineRenderer`, `clearRegisteredTimelineRenderers`, `resolveTimelineRenderers`
   - **Type:** `Renderer = React.ComponentType<{ e: RenderEntity }>`
   - **Changes:** Use engine's own `RenderEntity` type (same shape as pinocchio's)

2. Define RenderEntity type in engine:
   - **Target:** `packages/engine/src/chat/renderers/types.ts`
   - `RenderEntity = { id: string; kind: string; props: any; createdAt: number; updatedAt?: number }`
   - `ChatWidgetRenderers = Record<string, React.ComponentType<{ e: RenderEntity }>> & { default?: ... }`

3. Create builtin renderers:
   - **Target:** `packages/engine/src/chat/renderers/builtin/`
   - **MessageRenderer.tsx:** Renders `e.props.content` as text with streaming cursor when `e.props.streaming === true`. Shows role label (user/ai/system based on `e.props.role`). Shows "Thinking..." for empty streaming messages
   - **ToolCallRenderer.tsx:** Shows tool name (`e.props.name`), input args, done/running status
   - **ToolResultRenderer.tsx:** Shows result text, customKind badge
   - **StatusRenderer.tsx:** Shows status text and type (info/warning/error)
   - **LogRenderer.tsx:** Shows level, message, and optional fields
   - **GenericRenderer.tsx:** Fallback that shows entity kind and JSON props

   **Source for look & feel:** Current rendering in `packages/engine/src/components/widgets/ChatWindow.tsx:160-240` (message rendering) and pinocchio's card components in `pinocchio/.../webchat/cards.ts`

4. Register defaults:
   - `registerDefaultTimelineRenderers()` function that registers all builtin renderers
   - Called during conversation bootstrap (alongside `registerDefaultSemHandlers()`)

**Verification:** Storybook stories for each renderer showing representative entities.

---

### Phase 4: ChatConversationWindow + ChatWindow Renderer-Only Conversion

**Goal:** Create the connected conversation window component and convert ChatWindow into a renderer-driven shell with no legacy message mode.

**What to do:**

1. Convert ChatWindow to renderer-only timeline shell:
   - **File:** `packages/engine/src/components/widgets/ChatWindow.tsx`
   - Remove `messages` prop and all built-in message rendering logic
   - Add required `timelineContent: ReactNode` prop to `ChatWindowProps`
   - Render `timelineContent` directly in the `chat-timeline` div
   - Keep header/composer/suggestions/footer behavior intact
   - Do not retain backwards compatibility shims for `messages` mode

2. Create ChatConversationWindow:
   - **Target:** `packages/engine/src/chat/components/ChatConversationWindow.tsx`
   - **Props:** `{ convId: string; basePrefix?: string; title?: string; placeholder?: string; headerActions?: ReactNode }`
   - **Behavior:**
     - Uses `useConversation(convId)` hook for WS lifecycle
     - Selects timeline entities via `selectTimelineEntities(state, convId)`
     - Selects session state (suggestions, isStreaming, connectionStatus, modelName, turnStats) via chatSessionSlice selectors
     - Maps entities to rendered elements via `resolveTimelineRenderers()`
     - Renders `ChatWindow` with `timelineContent` slot
     - Handles `onSend` via `conversationManager.send()`
   - **Source for orchestration pattern:** `apps/inventory/.../InventoryChatWindow.tsx` (lines 557-777)

3. Create StatsFooter component:
   - **Target:** `packages/engine/src/chat/components/StatsFooter.tsx`
   - **Source:** `apps/inventory/.../InventoryChatWindow.tsx:494-551` (`StatsFooter` function)
   - Extract verbatim, parameterize with props

4. Move event bus to engine:
   - **Source:** `apps/inventory/.../eventBus.ts` (107 lines)
   - **Target:** `packages/engine/src/chat/debug/eventBus.ts`
   - **Changes:** Import `SemEnvelope` from engine's semRegistry types instead of webchatClient

5. Wire event emission into conversation manager:
   - `conversationManager` calls `emitConversationEvent(convId, envelope)` for each SEM frame before dispatching to semRegistry
   - This replaces the explicit `emitConversationEvent` call in `InventoryChatWindow.tsx:575`

**Verification:** Mount `ChatConversationWindow` in Storybook with a mock WebSocket backend. Verify entities render through the renderer registry, suggestions work, and streaming/thinking UX is preserved by `MessageRenderer`.

---

### Phase 5: Hypercard Module -- Artifacts, Timeline Entities, Renderers

**Goal:** Extract hypercard-specific logic into `packages/engine/src/hypercard/`.

**What to do:**

1. Move artifact state:
   - **Source:** `apps/inventory/.../artifactsSlice.ts` (94 lines)
   - **Target:** `packages/engine/src/hypercard/artifacts/artifactsSlice.ts`
   - **Changes:** None; copy verbatim
   - **Types:** `ArtifactSource`, `ArtifactRecord`, actions `upsertArtifact`, `clearArtifacts`

2. Move artifact selectors:
   - **Source:** `apps/inventory/.../artifactsSelectors.ts` (15 lines)
   - **Target:** `packages/engine/src/hypercard/artifacts/artifactsSelectors.ts`

3. Move artifact runtime:
   - **Source:** `apps/inventory/.../artifactRuntime.ts` (150 lines)
   - **Target:** `packages/engine/src/hypercard/artifacts/artifactRuntime.ts`
   - **Changes:** Import `openWindow` from `@hypercard/engine/desktop-core` (already does), import semHelpers from `../chat/sem/semHelpers`
   - **Functions:** `extractArtifactUpsertFromSem()`, `buildArtifactOpenWindowPayload()`, `templateToCardId()`

4. Create hypercard widget SEM handlers + renderer:
   - **Target:** `packages/engine/src/hypercard/timeline/hypercardWidget.ts`
   - **SEM events handled:** `hypercard.widget.start`, `hypercard.widget.update`, `hypercard.widget.v1`, `hypercard.widget.error`
   - **Handler logic:** Adapted from `InventoryChatWindow.tsx:123-224` (`formatHypercardLifecycle` for widget events)
   - **Entity kind:** `hypercard_widget`
   - **Entity ID:** `widget:${itemId}`
   - **Props:** `{ title, status, detail, template, artifactId, rawData }`
   - Each handler calls `ctx.dispatch(timelineSlice.actions.upsertEntity({ convId: ctx.convId, entity }))` and `ctx.dispatch(upsertArtifact(...))` when applicable
   - **Renderer:** Shows widget lifecycle status with open button for completed artifacts

5. Create hypercard card SEM handlers + renderer:
   - **Target:** `packages/engine/src/hypercard/timeline/hypercardCard.ts`
   - **SEM events handled:** `hypercard.card.start`, `hypercard.card.update`, `hypercard.card.v2`, `hypercard.card.error`
   - **Handler logic:** Adapted from `InventoryChatWindow.tsx:184-224` (`formatHypercardLifecycle` for card events)
   - **Entity kind:** `hypercard_card`
   - **Entity ID:** `card:${itemId}`
   - **Renderer:** Shows card lifecycle status with open + edit buttons

6. Add hypercard suggestion handlers:
   - Register handlers for `hypercard.suggestions.start`, `hypercard.suggestions.update`, `hypercard.suggestions.v1`
   - These dispatch to `chatSessionSlice.mergeSuggestions` / `chatSessionSlice.replaceSuggestions`
   - **Source:** `InventoryChatWindow.tsx:450-464`

7. Add customKind remap to timelineMapper:
   - **File:** `packages/engine/src/chat/sem/timelineMapper.ts`
   - When a `timeline.upsert` entity has `kind === 'tool_result'` and `props.customKind === 'hypercard.widget.v1'`:
     - Remap to `{ id: 'widget:' + props.toolCallId, kind: 'hypercard_widget', props: { ... } }`
   - When `props.customKind === 'hypercard.card.v2'`:
     - Remap to `{ id: 'card:' + props.toolCallId, kind: 'hypercard_card', props: { ... } }`
   - **Source for remap logic:** `apps/inventory/.../timelineProjection.ts:1-213` (`formatTimelineUpsert` function)

8. Create registration bootstrap:
   - **Target:** `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
   - **Function:** `registerHypercardTimelineModule()` that calls:
     - `registerSem('hypercard.widget.start', ...)` (and all other hypercard SEM types)
     - `registerTimelineRenderer('hypercard_widget', HypercardWidgetRenderer)`
     - `registerTimelineRenderer('hypercard_card', HypercardCardRenderer)`
   - Registered from a one-time global bootstrap (idempotent), not per-conversation connect

9. Register hypercard artifacts reducer in `createAppStore`:
   - **File:** `packages/engine/src/app/createAppStore.ts`
   - Add `hypercardArtifacts: artifactsReducer` to the built-in reducers
   - Remove `artifacts: artifactsReducer` from inventory's `store.ts`

10. Create barrel export: `packages/engine/src/hypercard/index.ts`
11. Add `export * from './hypercard'` to `packages/engine/src/index.ts`

**Verification:** Tests for hypercard SEM handlers (given SEM event -> correct timeline entity upsert + artifact upsert). Tests for customKind remap in timelineMapper.

---

### Phase 6: Debug + Editor Windows

**Goal:** Move remaining UI components from inventory to engine.

**What to do:**

1. Move EventViewerWindow:
   - **Source:** `apps/inventory/.../EventViewerWindow.tsx` (223 lines)
   - **Target:** `packages/engine/src/chat/debug/EventViewerWindow.tsx`
   - **Changes:** Import eventBus from `./eventBus`, import SyntaxHighlight from `./SyntaxHighlight`, import yamlFormat from `./yamlFormat`

2. Move SyntaxHighlight:
   - **Source:** `apps/inventory/.../utils/SyntaxHighlight.tsx` (86 lines)
   - **Target:** `packages/engine/src/chat/debug/SyntaxHighlight.tsx`
   - **Changes:** None; copy verbatim. Ensure `@codemirror/lang-javascript`, `@codemirror/lang-yaml`, `@lezer/highlight` are in engine's `package.json`

3. Move yamlFormat:
   - **Source:** `apps/inventory/.../utils/yamlFormat.ts` (87 lines)
   - **Target:** `packages/engine/src/chat/debug/yamlFormat.ts`
   - **Changes:** None

4. Move CodeEditorWindow:
   - **Source:** `apps/inventory/.../CodeEditorWindow.tsx` (185 lines)
   - **Target:** `packages/engine/src/hypercard/editor/CodeEditorWindow.tsx`
   - **Changes:** Import `registerRuntimeCard` from engine's plugin-runtime. Ensure CodeMirror deps are in engine's `package.json`

5. Move editorLaunch:
   - **Source:** `apps/inventory/.../editorLaunch.ts` (41 lines)
   - **Target:** `packages/engine/src/hypercard/editor/editorLaunch.ts`
   - **Changes:** Import `openWindow` from `@hypercard/engine/desktop-core`

6. Move RuntimeCardDebugWindow:
   - **Source:** `apps/inventory/.../RuntimeCardDebugWindow.tsx` (206 lines)
   - **Target:** `packages/engine/src/hypercard/debug/RuntimeCardDebugWindow.tsx`
   - **Changes:** Remove direct import of inventory's `STACK` constant. Accept `stacks?: CardStackDefinition[]` as a prop instead. The inventory app passes its stacks when mounting this window

**Verification:** Storybook stories for EventViewerWindow, CodeEditorWindow. Manual test in inventory app.

---

### Phase 7: Inventory App Thin Shell

**Goal:** Delete `apps/inventory/src/features/chat/` and rewire inventory to use engine exports.

**What to do:**

1. Update `apps/inventory/src/app/store.ts`:
   - Remove `import { chatReducer } from '../features/chat/chatSlice'`
   - Remove `import { artifactsReducer } from '../features/chat/artifactsSlice'`
   - Import from engine instead: `import { chatTimelineReducer, chatSessionReducer } from '@hypercard/engine'`
   - Or, if Phase 5 added these to `createAppStore` defaults, just remove the app-level reducer entries

2. Update `apps/inventory/src/App.tsx` window routing:
   - Replace `<InventoryChatWindow conversationId={convId} />` with `<ChatConversationWindow convId={convId} title="Inventory Chat" placeholder="Ask about inventory..." />`
   - Replace `<EventViewerWindow conversationId={convId} />` with engine's `<EventViewerWindow conversationId={convId} />`
   - Replace `<RuntimeCardDebugWindow />` with engine's `<RuntimeCardDebugWindow stacks={[STACK]} />`
   - Replace `<CodeEditorWindow ... />` with engine's `<CodeEditorWindow ... />`
   - Update imports to point to `@hypercard/engine` or `@hypercard/engine/hypercard`

3. Delete `apps/inventory/src/features/chat/` directory entirely:
   - All 22 source files
   - All test files
   - All story files (or move stories to engine)

4. Verify no remaining references:
   - Search for imports from `../features/chat/` or `./features/chat/`
   - Search for symbols that were defined in the deleted files

**Verification:** `tsc --noEmit` passes. App boots. Chat window connects, messages stream, artifacts open, event viewer works.

---

### Phase 8: Tests + Stories Migration

**Goal:** Rebuild test coverage in engine and clean up stories.

**What to do:**

1. Delete obsolete tests:
   - `chatSlice.test.ts` -- the entire chatSlice is replaced
   - `InventoryChatWindow.timeline.test.ts` -- timeline projection is replaced

2. Migrate passing tests:
   - `eventBus.test.ts` -> `packages/engine/src/chat/debug/eventBus.test.ts`
   - `artifactsSlice.test.ts` -> `packages/engine/src/hypercard/artifacts/artifactsSlice.test.ts`
   - `artifactRuntime.test.ts` -> `packages/engine/src/hypercard/artifacts/artifactRuntime.test.ts`
   - `yamlFormat.test.ts` -> `packages/engine/src/chat/debug/yamlFormat.test.ts`

3. New tests to write:
   - `timelineSlice.test.ts` -- conversation-scoped upsert, version gating, addEntity idempotency, clearConversation, rekeyEntity
   - `semRegistry.test.ts` -- handler registration, SemContext threading, handleSem routing
   - `timelineMapper.test.ts` -- proto entity mapping, customKind remap for hypercard
   - `chatSessionSlice.test.ts` -- connection status, suggestions, stats
   - `hypercardWidget.test.ts` -- SEM event -> entity + artifact upsert
   - `hypercardCard.test.ts` -- SEM event -> entity + artifact + runtime card registration

4. Move/recreate stories:
   - Move story files from `apps/inventory/.../stories/` to `packages/engine/src/chat/` and `packages/engine/src/hypercard/` alongside their components
   - Update imports

**Verification:** Full test suite passes. Stories render correctly in Storybook.

---

## Open Questions

1. **Protobuf schema maintenance:** Should engine own its own proto generation, or continue to copy from pinocchio? Long-term, a shared proto package would be ideal.

2. **Module registration timing:** Resolved: use one-time global idempotent bootstrap for `registerDefaultSemHandlers()` + `registerHypercardTimelineModule()`; do not re-register on each `connect()`.

3. **StatsFooter scope:** The live streaming TPS counter in `StatsFooter` uses `Date.now() - streamStartTime` which requires re-rendering on a timer. Should this be a concern of the engine or left to the app?

4. **CodeMirror dependency weight:** Moving CodeMirror deps to engine increases its bundle size. Consider lazy loading or making the editor an optional sub-package.

## References

- **ChatGPT Pro analysis:** `sources/local/chatgpt-pro-webchat-cleanup.md` (in this ticket)
- **Pinocchio web-chat source:** `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/`
- **Inventory chat source:** `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/`
- **Engine package:** `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/`
