Below is a concrete “hard refactor” plan that makes **hypercard-react** reuse the **pinocchio/cmd/web-chat** architecture end‑to‑end:

* **SEM → timeline entities** is the only projection mechanism (frontend + backend converge via `timeline.upsert`)
* **renderers** are registered by entity kind (and/or custom kind) and are the only UI mapping layer
* **inventory app becomes a thin shell** that wires engine components into window routing; everything under `apps/inventory/src/features/chat` goes away

I’m going to be very explicit about **which files map to where**, what needs to change, and what the final layout looks like.

---

## 1) What to copy from pinocchio into `packages/engine/src/chat`

### Core runtime to transplant (minimal set that gives you “pinocchio webchat” behavior)

Copy (then adapt imports/types):

1. **WebSocket + hydration + buffering**

* **FROM:** `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts`
* **TO:** `packages/engine/src/chat/ws/wsManager.ts`

Why: This is the piece inventory is currently missing (ordering, buffering, hydrate gating, lastSeq/queueDepth, etc.). It’s the “clean” streaming + snapshot model you want everywhere.

2. **SEM handler registry**

* **FROM:** `pinocchio/cmd/web-chat/web/src/sem/registry.ts`
* **TO:** `packages/engine/src/chat/sem/semRegistry.ts`

Why: This is the authoritative “SEM → timeline entity projection” mechanism. Inventory’s `chatSlice.ts` and `timelineProjection.ts` are doing a parallel, bespoke projection—remove it.

3. **Timeline entity mapper (proto → render entity)**

* **FROM:** `pinocchio/cmd/web-chat/web/src/sem/timelineMapper.ts`
* **TO:** `packages/engine/src/chat/sem/timelineMapper.ts`

Why: This is the clean V2 timeline entity mapping (createdAt/updatedAt/props normalization + versioning).

4. **Timeline props normalization registry**

* **FROM:** `pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts`
* **TO:** `packages/engine/src/chat/sem/timelinePropsRegistry.ts`

Why: This is how you keep `timelineMapper` clean and let modules add normalizers (hypercard, thinking mode, etc.).

5. **Protobuf TS schemas for decoding SEM + timeline snapshots**

* **FROM:** `pinocchio/cmd/web-chat/web/src/sem/pb/**`
* **TO:** `packages/engine/src/chat/sem/pb/**`

Why: If you truly want “the same semRegistry.ts”, you want the same decode surface: `@bufbuild/protobuf` + schema files.

6. **Timeline store slice**

* **FROM:** `pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts`
* **TO:** `packages/engine/src/chat/state/timelineSlice.ts`

…but **you must adapt it** to support **multiple conversations** (see section 2). Pinocchio assumes a single active conversation; Hypercard desktop can have multiple chat windows open.

7. Small utilities required by the above

* **FROM:** `pinocchio/cmd/web-chat/web/src/utils/number.ts`
* **TO:** `packages/engine/src/chat/utils/number.ts`
* **FROM:** `pinocchio/cmd/web-chat/web/src/utils/guards.ts`
* **TO:** `packages/engine/src/chat/utils/guards.ts`
* (Optional) logging helpers:

  * **FROM:** `pinocchio/cmd/web-chat/web/src/utils/logger.ts`
  * **TO:** `packages/engine/src/chat/utils/logger.ts`

### Conversation manager (pinocchio doesn’t have a clean “manager” object; it’s split across `ChatWidget.tsx` + `wsManager`)

You want a reusable Engine-side abstraction. Create (new files in engine):

* `packages/engine/src/chat/runtime/conversationManager.ts`
* `packages/engine/src/chat/runtime/useConversation.ts` (hook)
* `packages/engine/src/chat/runtime/http.ts` (submit prompt, fetch snapshot if you want it outside wsManager)

**Seed code** comes from:

* Pinocchio send logic in `pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx` (`POST /chat` payload shape, errors)
* Inventory’s `apps/inventory/src/features/chat/webchatClient.ts` (your local endpoint paths if they differ)

**Net:** you copy the robust pieces from pinocchio, and you *extract* a proper manager/hook for Engine consumption.

---

## 2) Reorganize SEM → timeline projection to match pinocchio cleanly

### Target architecture (same conceptual pipeline as pinocchio)

**Single pipeline** for all apps:

```
WS frames (SEM envelopes) ─┐
                           ├─> semRegistry.handleSem(envelope) ─> timelineSlice.upsert(...)
HTTP timeline snapshot  ───┘
```

And the backend also emits `timeline.upsert` SEM events, so the frontend projection converges on the backend’s projection via versioned upserts.

### The key refactor: make timeline state conversation-scoped

Pinocchio `timelineSlice` is global:

* `state.byId`
* `state.order`

Hypercard desktop needs:

* `state.byConvId[convId].byId`
* `state.byConvId[convId].order`

So adapt the timeline slice to:

```ts
type TimelineState = {
  byConvId: Record<string, {
    byId: Record<string, TimelineEntity>;
    order: string[];
  }>;
};
```

and actions become conversation-scoped:

* `upsertEntity({ convId, entity })`
* `clearConversation({ convId })`
* `applySnapshot({ convId, snapshotVersion, entities })`

### Adapt semRegistry handlers to be conversation-aware

You have two good options:

**Option A (recommended): add a SemContext)**
Change handler signature:

* from `(ev, dispatch) => void`
* to `(ev, ctx) => void`

Where `ctx = { dispatch, convId }`

This keeps the registry clean and avoids “wrapping dispatch”.

**Option B: keep signature, but semRegistry is created per conversation**
`createSemRegistry(convId)` returns `{ registerSem, handleSem }` scoped to that conv.

Option A is simpler and closer to pinocchio’s code (just threading a context).

### Replace inventory’s `chatSlice.ts` and `timelineProjection.ts`

**Delete the whole idea** of “chatSlice owns messages + embedded widgets”.

Instead:

* `timelineSlice` is the only “timeline”.
* The UI is derived from timeline entities (plus a small chat UI state slice for input/suggestions/connection status).

What remains as *non-timeline* chat state:

* ws connection status (`idle|connecting|connected|closed|error`)
* “is streaming” flag (you can derive it from entities, but it’s convenient)
* suggestions list (from `hypercard.suggestions.update`)
* last error (optional)
* per-turn stats (if you keep them)

This becomes an engine slice:

* `packages/engine/src/chat/state/chatSessionSlice.ts`

Key point: **no messages array** stored here. Messages are timeline entities.

### How to deal with `timeline.upsert` reconciliation cleanly

Pinocchio already does:

* decode `TimelineUpsertV2`
* map proto entity → TimelineEntity
* `upsertEntity` with version gating

You should preserve that **exact** behavior.

The only extra work is for hypercard widget/card (see next section): you may want to override kind/id mapping for certain `customKind`s so server projection and frontend projection converge on the *same* entity identity.

---

## 3) Extract timeline entity widgets as standalone React widgets registered to renderers

### Use the pinocchio pattern verbatim: a renderer registry keyed by entity kind

Copy the idea from:

* `pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts`

Into engine:

* `packages/engine/src/chat/renderers/rendererRegistry.ts`

You want:

* `registerTimelineRenderer(kind, component)`
* `resolveTimelineRenderers()` or `getRenderer(kind)`

### Make ChatWindow render timeline entities, not “ChatWindowMessage[]”

Right now engine’s ChatWindow renders:

* `ChatWindowMessage[]` (role/text/content blocks)
* and asks a caller to `renderWidget(widget: InlineWidget)`

Refactor it so it renders:

* `RenderEntity[]` (id/kind/props/createdAt)
* and uses rendererRegistry to pick a renderer for each entity

Concrete approach that preserves your current look:

1. Keep ChatWindow’s *outer frame* (header, suggestions, composer, footer) largely as-is.
2. Replace `renderMessage(m)` with `renderEntity(e)`:

   * ChatWindow computes:

     * `role = roleFromEntity(e)` (message.role → user/ai/system; others default system)
     * `RoleLabel` stays as the same UI (“You:”, “AI:”, “System:”)
   * Then call renderer:

     * `const Renderer = resolveRenderer(e.kind)`
     * Render within the current body slot.

This is literally “port the look into renderers”:

* The wrapper is “chat message layout”
* The renderer is “what the message looks like inside”

### Built-in renderers to implement in engine/chat

At minimum you need these (matching pinocchio’s default projections):

* `message` renderer

  * supports streaming cursor if `props.streaming === true`
  * supports empty streaming as ThinkingDots if you want (pinocchio uses thinking events too)
* `tool_call` renderer
* `tool_result` renderer
* `status` renderer
* `log` renderer
* (optional) `thinking_mode`, `debugger_pause`, etc if your backend emits them

Put them in:

* `packages/engine/src/chat/renderers/builtin/*`

### Hypercard-specific renderers: move into `packages/engine/src/hypercard` (requested)

You want two *first-class* timeline entity kinds in engine:

* `hypercard_widget`
* `hypercard_card`

Each gets:

* a SEM projection module (registerSem handlers)
* an optional props normalizer (registerTimelinePropsNormalizer)
* a renderer (registerTimelineRenderer)

This is exactly how pinocchio’s `registerThinkingModeModule()` works.

---

## 4) Hypercard widget + hypercard card as timeline entities in `packages/engine/src/hypercard`

You currently have the semantics spread across:

* `apps/inventory/src/features/chat/InventoryChatWindow.tsx` (`formatHypercardLifecycle`)
* `apps/inventory/src/features/chat/timelineProjection.ts` (mapping `timeline.upsert` tool_result customKind)
* `apps/inventory/src/features/chat/artifactRuntime.ts` + `artifactsSlice.ts` (artifact extraction + runtime card registration triggers)
* `InventoryArtifactPanelWidgets.tsx` (UI)
* `InventoryTimelineWidget.tsx` (UI-ish)

### New engine layout for hypercard

Create:

```
packages/engine/src/hypercard/
  artifacts/
    artifactsSlice.ts
    artifactsSelectors.ts
    artifactRuntime.ts          (extractArtifactUpsertFromSem + buildArtifactOpenWindowPayload)
  timeline/
    hypercardWidget.tsx         (SEM handlers + renderer registration)
    hypercardCard.tsx           (SEM handlers + renderer registration)
    registerHypercardTimeline.ts (one function to register both)
  editor/
    CodeEditorWindow.tsx
    editorLaunch.ts
  debug/
    RuntimeCardDebugWindow.tsx
  index.ts
```

### How hypercard widget/card become timeline entities cleanly

#### A) SEM events (`hypercard.widget.*`, `hypercard.card.*`)

Today inventory does this via `formatHypercardLifecycle`.

Move that logic into:

* `hypercard/timeline/hypercardWidget.tsx`
* `hypercard/timeline/hypercardCard.tsx`

They should upsert a timeline entity each time:

Entity identity convention:

* `id = widget:${itemId}` for widget lifecycle
* `id = card:${itemId}` for card lifecycle

Entity kind:

* `kind = hypercard_widget` / `hypercard_card`

Props:

* `title`
* `status` (running/success/error)
* `detail` (started/updating/ready/failed)
* `template`, `artifactId`
* `rawData` (optional)

#### B) `timeline.upsert` tool_result with `customKind` `hypercard.widget.v1` / `hypercard.card.v2`

Inventory currently maps these in `timelineProjection.ts` into “widget:toolCallId” and “card:toolCallId”.

To make reconciliation converge, you have two choices:

**Choice 1 (recommended): map these upserts into the same hypercard_* entities**
In `timelineMapper` (engine copy), add a “custom kind remap hook”:

* If proto kind is `tool_result`
* and `props.customKind === 'hypercard.widget.v1'`

  * return `{ id: 'widget:' + props.toolCallId, kind: 'hypercard_widget', props: { ... } }`
* if `customKind === 'hypercard.card.v2'`

  * return `{ id: 'card:' + props.toolCallId, kind: 'hypercard_card', props: { ... } }`

This keeps the *visible timeline entities* clean: you don’t render raw tool_result rows for hypercard artifacts; you render “hypercard widget/card”.

**Choice 2: keep tool_result entities, but renderer checks customKind**
This is less “first-class” and doesn’t match your request (“introduce two timeline entities”), so I would not do it.

### Artifacts + runtime cards should be handled in hypercard module, not in the chat window

Inventory currently does in `InventoryChatWindow.onSemEnvelope`:

* `extractArtifactUpsertFromSem(...)`
* `upsertArtifact(...)`
* `registerRuntimeCard(...)`

Move that into **SEM handlers** for:

* `hypercard.widget.v1`
* `hypercard.card.v2`
* and also `timeline.upsert` (when it’s a tool_result with those customKinds)

So the rule becomes:

* **SEM in → artifacts slice updated + runtime card registry updated**
* Renderers read artifacts state and provide “Open” / “Edit” actions

---

## 5) Move everything out of `apps/inventory/src/features/chat` and where it goes

Here’s a direct mapping (with notes).

### A) Chat runtime + window orchestration

| Inventory file            | What it becomes                                                                                | New location                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `InventoryChatWindow.tsx` | generic engine chat window that connects WS + renders timeline entities                        | `packages/engine/src/chat/components/ChatConversationWindow.tsx` (or similar)                 |
| `webchatClient.ts`        | replaced by pinocchio wsManager + tiny http helpers                                            | `packages/engine/src/chat/runtime/http.ts` (and `ws/wsManager.ts`)                            |
| `chatSlice.ts`            | replaced by (1) timelineSlice (entities) + (2) chatSessionSlice (connection/suggestions/stats) | `packages/engine/src/chat/state/*`                                                            |
| `selectors.ts`            | engine selectors for conversation-scoped timeline + session state                              | `packages/engine/src/chat/state/selectors.ts`                                                 |
| `timelineProjection.ts`   | **deleted**; logic moved to (a) timelineMapper remap (b) hypercard module                      | `packages/engine/src/chat/sem/timelineMapper.ts` + `packages/engine/src/hypercard/timeline/*` |
| `semHelpers.ts`           | keep as parsing helpers, but move out of app                                                   | `packages/engine/src/chat/sem/semHelpers.ts`                                                  |

### B) Hypercard artifacts + UI bits

| Inventory file                      | New location                                                                                    |                                                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `artifactsSlice.ts`                 | `packages/engine/src/hypercard/artifacts/artifactsSlice.ts`                                     |                                                                                                         |
| `artifactsSelectors.ts`             | `packages/engine/src/hypercard/artifacts/artifactsSelectors.ts`                                 |                                                                                                         |
| `artifactRuntime.ts`                | `packages/engine/src/hypercard/artifacts/artifactRuntime.ts`                                    |                                                                                                         |
| `InventoryArtifactPanelWidgets.tsx` | either (1) becomes renderers or (2) becomes a reusable “ArtifactPanel” widget used by renderers | `packages/engine/src/hypercard/components/ArtifactPanel.tsx` (or `hypercard/renderers/*` if per-entity) |

### C) Generic debug/editor windows

| Inventory file               | New location                                                     | Notes                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `eventBus.ts`                | `packages/engine/src/chat/debug/eventBus.ts`                     | rename to `eventLogStore` if you want                                                                   |
| `EventViewerWindow.tsx`      | `packages/engine/src/chat/debug/EventViewerWindow.tsx`           | make it accept `conversationId`                                                                         |
| `CodeEditorWindow.tsx`       | `packages/engine/src/hypercard/editor/CodeEditorWindow.tsx`      | needs codemirror deps moved to engine                                                                   |
| `editorLaunch.ts`            | `packages/engine/src/hypercard/editor/editorLaunch.ts`           | keeps “stash code in module map” trick                                                                  |
| `RuntimeCardDebugWindow.tsx` | `packages/engine/src/hypercard/debug/RuntimeCardDebugWindow.tsx` | must remove inventory’s direct `STACK` import; accept optional stack(s) as prop or read from a registry |

### D) Utils

| Inventory file              | New location                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `utils/SyntaxHighlight.tsx` | `packages/engine/src/chat/debug/SyntaxHighlight.tsx` (or a general `components/SyntaxHighlight.tsx`) |
| `utils/yamlFormat.ts`       | `packages/engine/src/chat/debug/yamlFormat.ts` (or `utils/yamlFormat.ts`)                            |

### E) Tests & stories

* Move tests into engine alongside new modules:

  * `eventBus.test.ts` → `packages/engine/src/chat/debug/eventBus.test.ts`
  * `artifactsSlice.test.ts` → `packages/engine/src/hypercard/artifacts/*`
  * `artifactRuntime.test.ts` → `packages/engine/src/hypercard/artifacts/*`
* Inventory’s `chatSlice.test.ts` becomes obsolete (you’re deleting that whole model). Replace with:

  * sem projection tests: “given SEM event → correct timeline entity upsert”
  * timelineMapper remap tests for hypercard customKinds

Stories:

* Either move to `packages/engine/src/**/stories` or keep in root storybook but pointing at engine components.

### Inventory app after the refactor

After deleting `apps/inventory/src/features/chat/**`, inventory app will only do:

* window routing:

  * map `inventory-chat:${convId}` → `<ChatConversationWindow convId={convId} stackId="inventory" />`
  * map `event-viewer:${convId}` → `<EventViewerWindow convId={convId} />`
  * map `runtime-card-debug` → `<RuntimeCardDebugWindow stack={STACK} />` (or pass stacks list)
  * map `code-editor:${cardId}` → `<CodeEditorWindow ... />`

* store wiring:

  * remove `chatReducer` and `artifactsReducer` imports from inventory
  * include reducers from engine instead, e.g.:

    * `chat: chatReducer`
    * `timeline: chatTimelineReducer` (or one combined reducer)
    * `hypercardArtifacts: artifactsReducer`
  * OR, if you decide chat/hypercard slices are “engine core”, add them into `createAppStore` defaults (optional design choice).

---

## 6) The renderer + module registration story (this is what makes the refactor stay clean)

You want a “module registration” mechanism exactly like pinocchio’s thinking mode example:

* Default (engine chat) registers:

  * timeline props normalizers (tool_result)
  * timeline renderers (message/tool_call/tool_result/status/log/default)
  * SEM projection handlers for llm/tool/log/timeline.upsert/etc

* Hypercard module registers:

  * renderers: `hypercard_widget`, `hypercard_card`
  * SEM projection handlers: `hypercard.widget.*`, `hypercard.card.*`, `hypercard.suggestions.update`
  * artifacts upsert + runtime card registry integration

So your engine chat “bootstrap” becomes:

* `registerDefaultSemHandlers()`
* `registerDefaultTimelineRenderers()`
* `registerHypercardTimelineModule()`  ✅ (in `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`)

Then wsManager connect calls that bootstrap once (or idempotently).

This prevents the “inventory window owns everything” anti-pattern from returning.

---

## 7) Practical refactor order (so you can land this without weeks of churn)

1. **Bring pinocchio core into engine**

   * Add `engine/src/chat/{sem,ws,state,utils}` skeleton
   * Copy wsManager + sem registry + timeline mapper + props registry + pb types + small utils
   * Add `@bufbuild/protobuf` to `packages/engine/package.json`

2. **Add conversation-scoped timeline slice**

   * Make `upsertEntity({convId, entity})` and friends
   * Update copied wsManager + sem registry handlers to pass convId through

3. **Replace InventoryChatWindow behavior with engine conversation window**

   * Create `ChatConversationWindow` in engine that:

     * owns ws connect/disconnect
     * submits prompt via HTTP
     * selects timeline entities + session state
     * renders updated `ChatWindow`

4. **Refactor engine ChatWindow to render timeline entities via renderers**

   * Convert `messages: ChatWindowMessage[]` → `entities: RenderEntity[]`
   * Add renderer resolution + roleFromEntity wrapper
   * Keep the header/composer/suggestions UI intact

5. **Extract hypercard module**

   * Move artifacts slice/runtime extraction into `engine/src/hypercard/artifacts`
   * Implement `hypercard_widget` + `hypercard_card` timeline modules
   * Implement the timelineMapper “customKind remap” for `timeline.upsert` tool_result → hypercard_* entity

6. **Move debug/editor windows**

   * EventViewer + eventBus into engine/chat/debug
   * CodeEditor + editorLaunch into engine/hypercard/editor
   * RuntimeCardDebugWindow into engine/hypercard/debug (remove inventory stack dependency)

7. **Delete inventory/features/chat**

   * Update imports in inventory App.tsx and store.ts to use engine exports
   * Remove inventory chat reducers
   * Confirm no remaining references

8. **Rebuild tests**

   * Delete chatSlice tests
   * Add sem projection tests + mapper remap tests + artifact tests in engine

---

## 8) One “gotcha” you should decide up front: entity identity for reconciliation

Pinocchio’s local projection tends to use `ev.id` as the timeline entity id.

Inventory previously built ids like:

* `tool:${toolCallId}`
* `widget:${itemId}`
* `card:${itemId}`

If you want `timeline.upsert` to reconcile “the same entity”, the IDs must converge.

**Recommendation:**

* For core kinds (message/tool_call/status/log): keep pinocchio’s scheme (use event id / entity.id).
* For hypercard widget/card: use the stable `itemId/toolCallId` prefix scheme you already have, and explicitly remap `timeline.upsert` tool_result customKinds into those IDs in the mapper.

That gives you:

* stable, update-in-place hypercard entities
* no duplicates
* still “pinocchio clean” everywhere else

---

If you want, I can also draft the **final directory tree** for `packages/engine/src/chat` and `packages/engine/src/hypercard` exactly as it should look after the refactor, including the key exports you’ll need to add to `packages/engine/package.json` and `packages/engine/src/index.ts` so inventory can import everything cleanly.

