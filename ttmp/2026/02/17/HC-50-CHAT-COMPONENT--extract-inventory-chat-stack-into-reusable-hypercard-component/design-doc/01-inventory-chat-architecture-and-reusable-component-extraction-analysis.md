---
Title: Inventory Chat Architecture and Reusable Component Extraction Analysis
Ticket: HC-50-CHAT-COMPONENT
Status: active
Topics:
    - frontend
    - architecture
    - chat
    - windowing
    - cleanup
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Primary runtime orchestration and envelope dispatch path
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Conversation-keyed chat state and timeline/widget projection model
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/eventBus.ts
      Note: Current raw event viewer side-channel design
    - Path: pinocchio/cmd/web-chat/web/src/debug-ui/ws/debugTimelineWsManager.ts
      Note: Reference debug follow path with cache patching
    - Path: pinocchio/cmd/web-chat/web/src/sem/registry.ts
      Note: Reference SEM event handler registry pattern
    - Path: pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx
      Note: Reference modular chat component architecture
    - Path: pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
      Note: Reference websocket bootstrap and hydration buffering flow
ExternalSources: []
Summary: Detailed architecture analysis of the Inventory chat stack, comparison with Pinocchio web-chat, and reusable extraction designs for HyperCard/macOS-style apps.
LastUpdated: 2026-02-17T23:35:00Z
WhatFor: Provide implementation-ready direction to extract chat/event-viewer functionality from Inventory into reusable components/packages.
WhenToUse: Use when planning or implementing reusable chat/timeline/event-debug features across HyperCard applications.
---


# Inventory Chat Architecture and Reusable Component Extraction Analysis

## 1. Scope, Goals, and Method

This document analyzes the current Inventory chat implementation in `2026-02-12--hypercard-react/apps/inventory/src/features/chat`, compares it against Pinocchio’s web chat implementation in `pinocchio/cmd/web-chat/web/src/webchat` and debug implementation in `pinocchio/cmd/web-chat/web/src/debug-ui`, and proposes concrete extraction designs.

Primary goal: make chat, timeline widgeting, and event inspection reusable across HyperCard/macOS-style apps instead of being a hardcoded part of Inventory.

Secondary goals:
- Preserve current behavior (streaming, timeline/card/widget projection, artifact opening, event viewer).
- Reduce app-specific coupling (Inventory names, window keys, reducer layout assumptions).
- Define clear extension seams (transport, projection, renderers, debug, window launch behavior).

Method:
- Static architecture walkthrough and dispatch-path tracing.
- Coupling inventory (imports, window keys, widget types, action shape).
- Compare runtime flow and state boundaries with Pinocchio webchat and debug-ui.
- Produce extraction options with tradeoffs and migration sequence.


## 2. Current Inventory Chat Architecture (Deep Dive)

### 2.1 Bootstrapping and window entrypoints

Inventory app-level wiring lives in `2026-02-12--hypercard-react/apps/inventory/src/App.tsx`.

Key behaviors:
- Chat window creation is command-driven via `buildChatWindowPayload` (`App.tsx:21`).
- App-window routing is string-key based:
  - `inventory-chat:<convId>` -> `InventoryChatWindow` (`App.tsx:46`)
  - `event-viewer:<convId>` -> `EventViewerWindow` (`App.tsx:50`)
  - `runtime-card-debug` -> `RuntimeCardDebugWindow` (`App.tsx:54`)
  - `code-editor:<cardId>` -> `CodeEditorWindow` (`App.tsx:57`)

This is a lightweight but implicit protocol. It is not currently formalized as a reusable registry/contract.

Store wiring is in `2026-02-12--hypercard-react/apps/inventory/src/app/store.ts`.
- Domain reducers: `inventory`, `sales`
- Chat reducers: `artifacts`, `chat`
- Engine core reducers come from `createAppStore` (`packages/engine/src/app/createAppStore.ts:46`)


### 2.2 Runtime transport path

Inventory chat transport lives in `2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts`:
- HTTP prompt submit: `/chat` (`webchatClient.ts:156`)
- Timeline snapshot hydration: `/api/timeline` (`webchatClient.ts:174`)
- Live websocket: `/ws?conv_id=...` (`webchatClient.ts:81`)

`InventoryChatWindow` startup sequence (`InventoryChatWindow.tsx:572`):
1. Build websocket handlers.
2. Fetch timeline snapshot.
3. Hydrate state from snapshot.
4. Connect websocket.

This ordering prevents websocket events from arriving before snapshot hydration completes, but it also couples transport lifecycle tightly to UI component mount logic.


### 2.3 Event ingestion and dispatching behavior

Most runtime complexity is in `onSemEnvelope` in `InventoryChatWindow.tsx:289`.

Event families handled:
- `llm.start`, `llm.delta`, `llm.final`
- `tool.start`, `tool.delta`, `tool.result`, `tool.done`
- `hypercard.suggestions.*`
- `hypercard.widget.*`, `hypercard.card.*`
- `timeline.upsert`
- `ws.error`

Representative dispatch pattern:
```ts
if (type === 'llm.delta') {
  dispatch(updateStreamTokens({ conversationId, outputTokens }));
  dispatch(applyLLMDelta({ conversationId, messageId, cumulative, delta }));
  return;
}
```

Important detail: this function may dispatch multiple Redux actions per incoming envelope, and for some event types it fans out to multiple reducers:
- `upsertArtifact`
- `upsertTimelineItem`
- `upsertCardPanelItem`
- `upsertWidgetPanelItem`

That fan-out happens through `fanOutArtifactPanelUpdate` (`InventoryChatWindow.tsx:114`) and is called from both live events and snapshot hydration.

Implication:
- A single high-frequency stream (especially `llm.delta`) can create substantial dispatch pressure.
- Projection concerns (timeline/card/widget materialization) are mixed with live message update concerns in the same function.


### 2.4 Chat slice data model and message projection

`2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts` contains a conversation-keyed state shape:
```ts
conversations: Record<string, ConversationState>
```

Conversation state includes:
- message transcript (`messages`)
- stream state (`isStreaming`, `streamStartTime`, `streamOutputTokens`)
- model/turn stats
- suggestions
- `currentRoundId`

A major design choice: timeline, card panel, and widget panel are not stored in separate normalized collections. They are embedded as inline widgets inside synthetic `ChatWindowMessage` rows via helper functions:
- `ensureTimelineWidgetMessage` (`chatSlice.ts:260`)
- `ensureCardPanelMessage` (`chatSlice.ts:271`)
- `ensureWidgetPanelMessage` (`chatSlice.ts:282`)

Timeline/panel data ends up in `message.content[].widget.props.items` and is mutated/upserted by `applyTimelineItemUpsert` (`chatSlice.ts:293`).

Pros:
- Single data source for `ChatWindow` rendering.
- No extra join logic in UI.

Cons:
- Projection state and chat transcript state are entangled.
- High-frequency event updates mutate chat-message arrays, which are also driving visual transcript updates.
- Harder to extract as reusable module because this representation is Inventory-specific (`inventory.timeline`, `inventory.cards`, `inventory.widgets`).


### 2.5 Timeline projection logic

Projection function lives in `2026-02-12--hypercard-react/apps/inventory/src/features/chat/timelineProjection.ts`.

This converts `timeline.upsert` payloads into UI timeline item updates with rules for:
- `tool_call`
- `status`
- `tool_result`
- special handling for `hypercard.widget.v1` and `hypercard.card.v2`

It already behaves like a reusable domain mapper, but today it is embedded in Inventory-specific pipeline and identifiers.

Example behavior:
- status text `"Updating card proposal: ..."` maps to card-running timeline item.
- tool result with `customKind=hypercard.card.v2` maps to card success item with `artifactId`.

This mapper is a strong candidate for extraction into a generic “timeline projection adapter layer” with app-provided rules.


### 2.6 Artifact and runtime card path

Artifact parsing/opening is split across:
- `artifactRuntime.ts`
- `artifactsSlice.ts`
- portions of `InventoryChatWindow.tsx`

Runtime card flow:
1. Event carries artifact/card payload.
2. `extractArtifactUpsertFromSem` maps it.
3. `upsertArtifact` stores runtime card metadata.
4. `registerRuntimeCard` injects card code into runtime registry (`InventoryChatWindow.tsx:298` and `CodeEditorWindow.tsx:93`).
5. “Open artifact” resolves runtime card id + opens desktop window.

This is useful functionality, but tightly coupled with Inventory template assumptions (`templateToCardId` in `artifactRuntime.ts:105`).


### 2.7 Event viewer path

Event viewer architecture:
- Producer: chat window emits raw envelopes into in-memory per-conversation bus (`eventBus.ts:73`).
- Consumer: `EventViewerWindow` subscribes and keeps local state (`EventViewerWindow.tsx:52`).

Notably, event viewer does **not** store raw events in Redux, which is good for high-frequency traffic. It bounds memory with `MAX_ENTRIES = 500` (`EventViewerWindow.tsx:7`).

Current constraints:
- Event bus is process-local and ephemeral.
- No replay/history once viewer opens unless events are still arriving.
- Viewer is tightly themed/styled inline rather than package-level style contract.


### 2.8 Tests and confidence profile

Inventory chat has meaningful coverage in:
- `chatSlice.test.ts` (streaming behavior, hydration dedupe, round widget behavior)
- `InventoryChatWindow.timeline.test.ts` (projection mapping)
- `eventBus.test.ts`

Gaps relevant to extraction:
- No integration tests for `InventoryChatWindow` transport lifecycle and envelope routing end-to-end.
- No contract tests for app-window key protocol (`event-viewer:<id>`, `code-editor:<id>`).
- No package-level API tests because API surface is currently app-local.


### 2.9 Coupling summary (why it is not reusable yet)

Major coupling points:
1. Inventory naming and semantics are hardcoded:
- widget types: `inventory.timeline`, `inventory.cards`, `inventory.widgets`
- window keys: `inventory-chat:*`, `event-viewer:*`, `code-editor:*`

2. Chat runtime orchestration is in UI component body:
- bootstrap, websocket lifecycle, event mapping, and view rendering are all in `InventoryChatWindow.tsx`.

3. Projection and persistence concerns are mixed:
- same path updates transcript, timeline panels, artifacts, and debug bus.

4. No explicit plugin contracts:
- transport, event mapper, widget renderer, and window launcher are all implicit imports.


## 3. Pinocchio Comparison (What It Does Differently)

Pinocchio’s web-chat side splits concerns differently.

### 3.1 Web chat core (`webchat`)

Entry component: `pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx`.

Architecture traits:
- Chat widget is styled/component-slot driven (`types.ts`, `parts.ts`), explicitly designed for overrides.
- Message rendering is kind-based and renderer-injectable (`ChatWidget.tsx:218`).
- State is mostly timeline-entity centric (`store/timelineSlice.ts`).

SEM event handling is centralized in a registry (`sem/registry.ts`):
- Event type -> handler map.
- Handlers convert raw SEM to timeline entities.

Websocket manager (`ws/wsManager.ts`) does lifecycle + hydration buffering, then delegates event handling via `handleSem`.

This separation is cleaner for reuse than Inventory’s single large `onSemEnvelope` in UI.


### 3.2 Debug UI as separate application

Pinocchio debug experience is not embedded in chat window. It is a separate app (`debug-ui/DebugUIApp.tsx`) with its own store.

State strategy:
- UI interaction state in `uiSlice.ts`.
- Timeline/events data mostly in RTK Query caches (`debugApi.ts`).
- Live follow websocket path patches query caches (`debugTimelineWsManager.ts`).

This gives a notable design contrast:
- Inventory: inline local event viewer and app-specific bus.
- Pinocchio: dedicated debug app with richer querying, timeline lanes, and event inspection.


### 3.3 Reuse affordances in Pinocchio

Pinocchio has clearer reusable seams:
- Slot/component extension points in `webchat/types.ts`.
- Renderer map by entity kind (`ChatWidgetRenderers`).
- Event registry abstraction for SEM handling.
- Debug tooling decoupled from the end-user chat component.

However, Pinocchio’s chat is not currently a standalone package in this monorepo, and it still assumes a specific backend shape (`/chat`, `/ws`, `/api/timeline`) with its own store setup.


### 3.4 Comparative takeaways

Inventory strengths:
- Strong HyperCard desktop/window integration.
- Artifact-to-runtime-card workflow aligned with HyperCard app model.
- Practical local event viewer already avoids Redux pressure.

Pinocchio strengths:
- Better separation of ingestion/dispatch concerns.
- Better explicit extension surface for rendering and composition.
- More mature debug surface and follow model.

Opportunity:
- Keep Inventory’s HyperCard integration primitives.
- Adopt Pinocchio-style separation and extension contracts.


## 4. Reusable Extraction Designs

This section proposes three viable designs and one recommended direction.

### 4.1 Design A: Reusable Chat Runtime Package + HyperCard Adapter (Recommended)

Create a new package under HyperCard workspace, e.g.:

```text
packages/chat-runtime/
  src/
    runtime/
      createChatRuntime.ts
      eventRegistry.ts
      projectionPipeline.ts
      eventStore.ts
    ui/
      ChatRuntimeWindow.tsx
      EventInspectorWindow.tsx
    adapters/
      hypercardDesktopAdapter.ts
      semTransportAdapter.ts
    types.ts
    index.ts
```

Core idea:
- Move orchestration out of Inventory UI.
- Introduce explicit contracts for transport, event mapping, and widget renderers.
- Keep high-frequency raw events in external store/event buffer (non-Redux), while pushing durable view state into Redux or derived model snapshots.

Minimal interfaces:
```ts
interface ChatTransport {
  connect(convId: string, handlers: TransportHandlers): () => void;
  fetchSnapshot(convId: string): Promise<TimelineSnapshotLike>;
  submitPrompt(convId: string, text: string): Promise<void>;
}

interface ChatProjectionAdapter {
  onEnvelope(env: SemEnvelope, ctx: ProjectionContext): void;
  hydrate(entity: TimelineEntityLike, ctx: ProjectionContext): void;
}

interface DebugEventStore {
  push(convId: string, env: SemEnvelope): void;
  subscribe(convId: string, cb: (e: EventLogEntry) => void): () => void;
  getRecent(convId: string, limit: number): EventLogEntry[];
}
```

Then Inventory becomes configuration, not implementation.


### 4.2 Design B: Keep current app structure, extract only render components

Move `InventoryTimelineWidget`, `InventoryArtifactPanelWidgets`, and `EventViewerWindow` to package and keep `InventoryChatWindow` orchestration local.

Pros:
- Fastest migration.

Cons:
- Keeps main coupling and complexity in app.
- Reuse value is limited to visuals, not runtime behavior.

Recommendation: only do this if schedule is very constrained.


### 4.3 Design C: Pinocchio-first reuse by importing ChatWidget into HyperCard

Adopt Pinocchio `webchat` component as base chat experience in HyperCard app, then bridge artifact/windowing capabilities via renderers.

Pros:
- Inherits modular renderer model and event registry patterns.

Cons:
- Requires cross-repo packaging and contract alignment.
- Pinocchio chat currently not designed around HyperCard runtime-card artifact lifecycle.

Recommendation: useful reference architecture, but higher integration cost than Design A.


### 4.4 Why Design A is best for this codebase

Design A minimizes disruption while extracting the right layers:
- preserves HyperCard desktop integration and runtime card semantics.
- codifies transport/projection/debug seams.
- enables per-app customization without forking logic.
- allows phased migration from Inventory implementation with low regression risk.


## 5. Proposed Reusable API and Execution Model

### 5.1 Runtime model

A “chat runtime” instance owns:
- conversation lifecycle (bootstrap + ws)
- projection pipeline (envelope -> reducers + side stores)
- debug event buffering

Pseudo-constructor:
```ts
const runtime = createChatRuntime({
  transport,
  projection,
  debugEventStore,
  windowAdapter,
  selectors,
  actions,
});
```

### 5.2 Sequence diagram (target)

```text
User -> ChatRuntimeWindow: send(prompt)
ChatRuntimeWindow -> Runtime: submitPrompt
Runtime -> Transport: POST /chat
Transport -> Runtime: accepted

Transport(ws) -> Runtime: envelope(llm.delta)
Runtime -> DebugEventStore: push(rawEnvelope)
Runtime -> ProjectionAdapter: projectDelta
ProjectionAdapter -> Redux: dispatch(applyLLMDelta)
ProjectionAdapter -> OptionalFastStore: updateHighFreqCounters
Runtime -> UI: selector update/re-render

User -> HeaderAction: open events
HeaderAction -> WindowAdapter: open(event inspector window)
EventInspector -> DebugEventStore: subscribe(convId)
DebugEventStore -> EventInspector: streamed entries
```

### 5.3 Projection decomposition

Current `onSemEnvelope` should split into handlers table:
```ts
const handlers: Record<string, EnvelopeHandler> = {
  'llm.start': handleLlmStart,
  'llm.delta': handleLlmDelta,
  'llm.final': handleLlmFinal,
  'tool.start': handleToolStart,
  'timeline.upsert': handleTimelineUpsert,
  // ...
};

function onEnvelope(env: SemEnvelope, ctx: Ctx) {
  const type = env.event?.type ?? 'unknown';
  ctx.debugStore.push(ctx.convId, env);
  handlers[type]?.(env, ctx);
}
```

Benefits:
- testability per event type.
- pluggable extensions for app-specific kinds.
- smaller blast radius for behavior changes.


### 5.4 Debug event store contract

Inventory event bus is a good baseline but should become a reusable bounded store with replay API.

```ts
interface EventLogStore {
  push(convId: string, env: SemEnvelope): void;
  subscribe(convId: string, listener: (entry: EventLogEntry) => void): () => void;
  getRecent(convId: string, opts?: { limit?: number; family?: string[] }): EventLogEntry[];
  clear(convId: string): void;
}
```

Keep this outside Redux to avoid high-frequency pressure.


### 5.5 Window adapter contract

Current chat code dispatches `openWindow` directly and builds Inventory-specific app keys. Replace with adapter:

```ts
interface ChatWindowAdapter {
  openEventViewer(convId: string): void;
  openArtifact(input: OpenArtifactInput): void;
  openCodeEditor(input: OpenCodeEditorInput): void;
}
```

Inventory can provide one adapter; other apps can provide different launch behavior.


## 6. Migration Plan (Hard-cutover at feature boundary, reusable end state)

### Phase 1: Extract contracts and wrappers (no behavior change)

1. Introduce package `packages/chat-runtime` with types/interfaces only.
2. Move Inventory eventBus logic into package as generic `EventLogStore` (keep old API shim temporarily only inside Inventory).
3. Move projection helpers (`timelineProjection`) into package `projection` module with app extension hooks.

### Phase 2: Extract orchestration from `InventoryChatWindow`

1. Move bootstrap/ws lifecycle + envelope dispatch into runtime service.
2. Keep `InventoryChatWindow` as thin view component with props from runtime hook.
3. Replace direct `openWindow` calls with adapter methods.

### Phase 3: Extract reusable UI pieces

1. Move event viewer to package as `EventInspectorWindow` with theme slots/parts.
2. Move panel widgets into generic timeline panel components.
3. Keep Inventory-specific widget flavors as optional renderer plugins.

### Phase 4: App adoption

1. Inventory app switches to package runtime.
2. Add second app (e.g., Todo or CRM) minimal chat integration using same runtime to validate reuse.
3. Remove deprecated app-local chat orchestration code after parity tests.


## 7. Risks, Tradeoffs, and Mitigations

### Risk 1: Breaking subtle event semantics during refactor

Mitigation:
- Snapshot and replay tests around `onSemEnvelope` behavior.
- Golden tests for `timeline.upsert` projection and artifact extraction.
- Keep one-to-one handler parity before introducing behavioral improvements.

### Risk 2: Reuse API too HyperCard-specific

Mitigation:
- Keep adapter interfaces narrow.
- Put windowing/artifact launch behavior behind optional capabilities.
- Core runtime should not import Inventory domain modules.

### Risk 3: Debug viewer performance degradation if generalized poorly

Mitigation:
- Retain bounded buffer with hard cap.
- Add optional virtualized list for large logs.
- Avoid Redux for raw event stream.


## 8. Concrete Work Backlog Proposal

1. `chat-runtime:scaffold`
- Create package skeleton and exports.
- Add base types for envelopes, projection context, runtime adapter.

2. `chat-runtime:event-store`
- Implement bounded event store with replay and family filtering.
- Port Inventory `eventBus` tests.

3. `chat-runtime:projection-core`
- Extract `formatTimelineUpsert` and artifact extraction helpers.
- Add extension API for app-specific custom kinds.

4. `chat-runtime:runtime-orchestrator`
- Implement bootstrap + ws + envelope dispatch manager.
- Add integration tests with fake transport.

5. `inventory:adopt-runtime`
- Replace direct orchestration in `InventoryChatWindow` with runtime hook.
- Keep existing UI behavior.

6. `chat-runtime:event-inspector-ui`
- Extract `EventViewerWindow` into package-level component with part props.
- Add default style + Inventory theme wrapper.

7. `docs`
- Document contracts and app integration recipe.
- Add “new app integration checklist”.


## 9. Implementation Notes for New Developers

### 9.1 Files to study first

Inventory implementation:
- `2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts`
- `2026-02-12--hypercard-react/apps/inventory/src/features/chat/timelineProjection.ts`
- `2026-02-12--hypercard-react/apps/inventory/src/features/chat/eventBus.ts`
- `2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.ts`

Pinocchio reference:
- `pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx`
- `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts`
- `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
- `pinocchio/cmd/web-chat/web/src/debug-ui/ws/debugTimelineWsManager.ts`
- `pinocchio/cmd/web-chat/web/src/debug-ui/api/debugApi.ts`

### 9.2 Behavior invariants to preserve

1. No duplicate user/assistant rows when hydration echoes live messages.
2. Timeline/card/widget panel upserts remain idempotent per item id.
3. Suggestions merge/replace semantics stay unchanged.
4. Artifact open/edit workflows continue to resolve runtime card metadata.
5. Event viewer remains usable without writing raw stream events into Redux.


## 10. Final Recommendation

Proceed with Design A: create a reusable `chat-runtime` package with explicit contracts for transport, projection, event storage, and windowing adapters; migrate Inventory to it incrementally; preserve current behavior by porting existing reducer/projection tests as parity gates.

The key extraction line is architectural, not visual: move orchestration and event interpretation out of `InventoryChatWindow` and into a composable runtime layer. Once that is done, chat UI and event inspector become naturally reusable across HyperCard apps.

## 11. Implementation Plan Update (Artifact/Card/Editor Hard Cutover)

This update refines execution around the user-selected direction: treat HyperCard artifact/card/editor behavior as its own reusable subsystem in `@hypercard/engine`, with chat integrating it through explicit contracts instead of owning implementation details.

### 11.1 Target module split in engine

Create a new engine subsystem folder:

```text
packages/engine/src/hypercard-chat/
  artifacts/
    artifactsSlice.ts
    artifactsSelectors.ts
    artifactRuntime.ts
    timelineProjection.ts
  widgets/
    TimelineWidget.tsx
    ArtifactPanelWidgets.tsx
  event-viewer/
    eventBus.ts
    EventViewerWindow.tsx
  runtime-card-tools/
    CodeEditorWindow.tsx
    editorLaunch.ts
    RuntimeCardDebugWindow.tsx
  utils/
    syntaxHighlight.tsx
    yamlFormat.ts
  windowAdapters.ts
  index.ts
```

### 11.2 Window adapter contract update

Instead of a single chat-owned adapter with artifact/editor responsibilities, split capability contracts:

```ts
interface WindowHost {
  open(payload: OpenWindowPayload): void;
}

interface ChatWindowAdapter {
  openEventInspector(convId: string): void;
}

interface ArtifactWindowAdapter {
  openArtifact(input: OpenArtifactInput): void;
}

interface RuntimeCardToolsAdapter {
  openCodeEditor(cardId: string, code?: string): void;
  openRuntimeCardDebug(): void;
}
```

Effect:
- Chat remains reusable without mandatory artifact/editor dependencies.
- Artifact and editor integrations become opt-in capabilities.
- Inventory supplies app-specific glue (for example stack binding) while core implementation lives in engine.

### 11.3 Inventory cutover strategy

Hard cutover for moved implementation ownership:
1. Move implementation logic to engine subsystem files.
2. Switch Inventory to import from engine for moved modules.
3. Keep only Inventory-specific wiring (stack config, menu/desktop commands).
4. Remove duplicated logic from Inventory feature folder (or reduce to thin glue where needed).

### 11.4 Validation gates

Before considering this phase complete:
- `timelineProjection` behavior parity tests pass.
- Artifact reducer tests pass in new module location.
- Event bus/viewer behavior still isolates per-conversation and remains bounded.
- Runtime card editor/debug windows open and operate from Inventory using engine-hosted components.
- Engine and Inventory typecheck/build pass for touched packages.

### 11.5 Execution status update (2026-02-17)

Implementation has been executed as a hard cutover (commit `a7ed70f`):

1. Added reusable engine subsystem at `packages/engine/src/hypercard-chat` with explicit module split:
   - `artifacts` (slice/selectors/runtime/projection + sem field helpers)
   - `widgets` (timeline + artifact panel widgets)
   - `event-viewer` (event bus + viewer window)
   - `runtime-card-tools` (editor launch + code editor + runtime card debug window)
   - `windowAdapters` contract and factory helpers
2. Exported subsystem from engine barrel:
   - `packages/engine/src/hypercard-chat/index.ts`
   - `packages/engine/src/index.ts`
3. Cut Inventory to engine-owned implementation:
   - `InventoryChatWindow` now imports moved logic/components from `@hypercard/engine`
   - `App.tsx` now renders `EventViewerWindow` and `CodeEditorWindow` from engine
   - `store.ts` now sources `artifactsReducer` from engine
4. Kept Inventory-only glue where appropriate:
   - `RuntimeCardDebugWindow` in Inventory reduced to a thin wrapper that passes stack metadata and editor-launch callback to engine `RuntimeCardDebugWindow`.
5. Removed Inventory-owned duplicate implementations for moved modules (artifact runtime/slice/selectors, timeline projection, event bus/viewer, code editor launch/window, syntax/yaml utils).
6. Updated Inventory tests/stories to import moved APIs from `@hypercard/engine`.

Validation run after cutover:
- `npm run typecheck` (pass)
- `npm run test -w packages/engine` (pass)
- `npm run build -w apps/inventory` (pass)

## References

- Inventory chat system:
  - `2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts`
  - `2026-02-12--hypercard-react/apps/inventory/src/features/chat/timelineProjection.ts`
  - `2026-02-12--hypercard-react/apps/inventory/src/features/chat/eventBus.ts`
  - `2026-02-12--hypercard-react/apps/inventory/src/features/chat/EventViewerWindow.tsx`
  - `2026-02-12--hypercard-react/apps/inventory/src/features/chat/artifactRuntime.ts`
- Inventory app integration:
  - `2026-02-12--hypercard-react/apps/inventory/src/App.tsx`
  - `2026-02-12--hypercard-react/apps/inventory/src/app/store.ts`
- HyperCard engine primitives:
  - `2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx`
  - `2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts`
  - `2026-02-12--hypercard-react/packages/engine/src/diagnostics/diagnosticsStore.ts`
- Pinocchio webchat and debug-ui:
  - `pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx`
  - `pinocchio/cmd/web-chat/web/src/webchat/types.ts`
  - `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts`
  - `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
  - `pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts`
  - `pinocchio/cmd/web-chat/web/src/debug-ui/api/debugApi.ts`
  - `pinocchio/cmd/web-chat/web/src/debug-ui/ws/debugTimelineWsManager.ts`
  - `pinocchio/cmd/web-chat/web/src/debug-ui/components/EventInspector.tsx`
