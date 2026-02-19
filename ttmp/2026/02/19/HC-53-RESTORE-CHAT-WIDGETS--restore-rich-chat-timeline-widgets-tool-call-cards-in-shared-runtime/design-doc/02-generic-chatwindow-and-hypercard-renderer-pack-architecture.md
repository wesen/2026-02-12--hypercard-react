---
Title: 'Design exploration: reusable ChatWindow runtime and self-contained Hypercard widget pack'
Ticket: HC-53-RESTORE-CHAT-WIDGETS
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/sem/registry.ts
      Note: |-
        Frontend SEM registry and protobuf decode patterns for generic projection
        Typed frontend SEM handler registration model
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx
      Note: Generic renderer/component override design for reusable webchat UIs
    - Path: ../../../../../../../pinocchio/pkg/webchat/timeline_projector.go
      Note: Canonical SEM-to-timeline projector with custom-handler-first execution
    - Path: ../../../../../../../pinocchio/pkg/webchat/timeline_registry.go
      Note: |-
        Backend timeline extension registry used for custom event projection hooks
        Custom timeline handler registry reused by Hypercard
    - Path: ../../../../../../../pinocchio/proto/sem/timeline/transport.proto
      Note: |-
        Shared protobuf timeline entity/upsert contract used by Go and TypeScript
        Canonical protobuf timeline entity/upsert contract
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Current app-owned orchestration that mixes transport, projection, rendering, and side-effect actions
    - Path: apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: App-owned adapter wiring for artifact/runtime-card metadata side effects
    - Path: apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts
      Note: Inventory-specific display synthesis that should move to reusable package-level projection
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: |-
        Existing Hypercard custom event bridge already built on pinocchio webchat hooks
        Current Hypercard custom event bridge on pinocchio webchat
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Presentational chat shell that is already mostly reusable but still host-callback-based for widgets
    - Path: packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts
      Note: Hypercard-specific TimelineEntity-to-TimelineWidgetItem formatter suitable for pack extraction
    - Path: packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts
      Note: Core projection pipeline with adapter extension seam to generalize further
    - Path: packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Shared SEM handlers currently mixing generic and hypercard-specific mapping concerns
    - Path: packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx
      Note: Card/widget panel renderers candidate for pluggable renderer-pack export
    - Path: packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx
      Note: Rich timeline widget renderer candidate for pluggable renderer-pack export
ExternalSources: []
Summary: Detailed architecture plan for extracting inventory-specific chat/hypercard rendering into a reusable, pluggable engine runtime, including pinocchio pkg/webchat reuse and protobuf custom-event contracts.
LastUpdated: 2026-02-19T13:25:00-05:00
WhatFor: Define how to make chat + hypercard widgets reusable across apps without app-specific core modifications
WhenToUse: Use when implementing reusable chat runtime layers, pluginized SEM handlers, and cross-app hypercard renderer integration
---


# Design exploration: reusable ChatWindow runtime and self-contained Hypercard widget pack

## Executive summary

The current system already has the right primitives for reuse, but they are assembled in an app-specific way. `ChatWindow` is mostly a pure presentational component (`packages/engine/src/components/widgets/ChatWindow.tsx`) and the SEM projection primitives are already in engine (`packages/engine/src/hypercard-chat/sem/registry.ts`, `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`). The main reuse barrier is orchestration ownership: `apps/inventory/src/features/chat/InventoryChatWindow.tsx` currently hardwires transport wiring, projection invocation, round-scoped widget synthesis, and widget action behavior in one component.

The recommended direction is a two-layer extraction:

1. A reusable **chat runtime shell** that owns ingress -> projection -> display message shaping and exposes host callbacks.
2. A self-contained **Hypercard renderer pack** that registers SEM handlers, projection adapters, display message synthesis, and widget renderers as a pluggable module.

This model keeps the timeline-first projection architecture intact, removes inventory coupling (`inventory.timeline`, `inventory.widgets`, `inventory.cards`), and gives app teams one registration API instead of copy/pasted integration code.

## Scope and goals

This document focuses on frontend/runtime architecture in `2026-02-12--hypercard-react`, specifically:

- Making chat rendering and orchestration reusable across multiple apps.
- Extracting hypercard card/widget behavior into a self-contained reusable pack.
- Designing SEM registration and widget switching as data-driven extension points.

Out of scope:

- Immediate backend runtime behavior changes.
- Runtime card language changes.
- Full visual redesign of timeline widgets.

## Current implementation: concrete flow and ownership

### End-to-end data flow today

Current flow in inventory app can be represented as:

```text
WebSocket (/ws) frame
  -> InventoryWebChatClient normalizes envelope
     (apps/inventory/src/features/chat/webchatClient.ts)
  -> InventoryChatWindow.onEnvelope
     ignores timeline.upsert, projects all others
     (apps/inventory/src/features/chat/InventoryChatWindow.tsx)
  -> projectSemEnvelope(...)
     (packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts)
  -> SemRegistry handler -> timeline ops
     (packages/engine/src/hypercard-chat/sem/registry.ts)
  -> timeline reducer updates by conversation
     (packages/engine/src/hypercard-chat/timeline/timelineSlice.ts)
  -> adapters run (artifacts + chat meta)
     (apps/inventory/src/features/chat/runtime/projectionAdapters.ts)
  -> buildTimelineDisplayMessages(...) synthesizes widget messages
     (apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts)
  -> ChatWindow renders content blocks
     (packages/engine/src/components/widgets/ChatWindow.tsx)
  -> Inventory renderWidget switch maps widget type to component
     (apps/inventory/src/features/chat/InventoryChatWindow.tsx)
```

### What is already reusable

The following are strong reusable primitives today:

1. `ChatWindow` structured content model (`ChatWindowMessage`, `ChatContentBlock`, `InlineWidget`) in `packages/engine/src/components/widgets/ChatWindow.tsx:30`.
2. Timeline-first reducer/state (`timelineSlice`) in `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts:27`.
3. Projection entrypoint with adapter seam (`projectSemEnvelope`) in `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts:44`.
4. Hypercard artifact extraction and runtime-card payload tools in `packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts:55`.

### Where coupling still exists

The reusability issue is concentrated in orchestration and naming conventions.

#### 1) App-specific widget types and render switch

`InventoryChatWindow` routes widget types with inventory names:

- `inventory.cards`
- `inventory.widgets`
- `inventory.timeline`

Reference: `apps/inventory/src/features/chat/InventoryChatWindow.tsx:238`.

These names are not portable and force each app to duplicate mapping logic.

#### 2) Display synthesis lives in app

Round grouping and widget message synthesis (`buildTimelineDisplayMessages`) lives in inventory app (`apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts:222`) even though it primarily depends on engine types (`TimelineEntity`, `formatTimelineEntity`).

This means every app would need to copy or re-implement grouping behavior.

#### 3) Side effects wired manually in app

Artifact upserts and runtime-card registration are injected via inventory adapters (`apps/inventory/src/features/chat/runtime/projectionAdapters.ts:43`) rather than being packaged as reusable behavior.

#### 4) SemRegistry only supports single handler per event type

`SemRegistry` is `Map<string, SemHandler>` (`packages/engine/src/hypercard-chat/sem/registry.ts:59`), so last registration wins.

This makes plugin-style composition harder. For reusable packs, we want multiple handlers per event type (for example, one generic tool handler + one pack-specific lifecycle handler).

#### 5) Connection logic and projection policy are embedded in component

`InventoryChatWindow` constructs client, routes envelopes, toggles debug UI, opens windows, and manages action wiring inside one component (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:111`).

This is serviceable for one app, but creates friction for reuse and testing.

## Comparative architecture: pinocchio pkg/webchat and web frontend

This section answers two specific questions:

1. How much of `pinocchio/pkg/webchat` is already reusable in Hypercard.
2. How the protobuf-backed custom-event approach should be adopted for Hypercard widget/card families.

### Backend extension model in `pkg/webchat`

Pinocchio backend is built as layered extension points, not one giant app-specific switch.

The key seams are:

1. Event translation seam by Go event type via `semregistry.RegisterByType[T]` (`pinocchio/pkg/sem/registry/registry.go:22`).
2. Timeline projection seam by SEM event type via `webchat.RegisterTimelineHandler(eventType, handler)` (`pinocchio/pkg/webchat/timeline_registry.go:29`).
3. Canonical projector path where custom handlers run before built-ins (`pinocchio/pkg/webchat/timeline_projector.go:117`).
4. Timeline upsert emission seam via `Router.TimelineUpsertHook` (`pinocchio/pkg/webchat/timeline_upsert.go:6`).

This means new middleware/event families can be integrated without editing core projector code as long as they are mapped through these registries.

### Frontend extension model in `cmd/web-chat/web`

Pinocchio web frontend separates projection from rendering:

1. Projection registry:
   - `registerSem(type, handler)` (`pinocchio/cmd/web-chat/web/src/sem/registry.ts:36`).
   - Default handlers decoded with protobuf schemas and upsert timeline entities (`pinocchio/cmd/web-chat/web/src/sem/registry.ts:69`).
2. Rendering registry:
   - `renderers` prop merged with default renderers (`pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx:218`).
   - Entity kind dispatch in timeline component (`pinocchio/cmd/web-chat/web/src/webchat/components/Timeline.tsx:102`).

This is more generic than the current Hypercard inventory integration, where inline widget switching is still done imperatively in app code (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:238`).

### Typed payload decoding pattern

Pinocchio frontend decodes payloads with generated schemas through a shared helper (`decodeProto`) and `fromJson(..., { ignoreUnknownFields: true })` (`pinocchio/cmd/web-chat/web/src/sem/registry.ts:60`). This gives schema discipline while preserving JSON transport compatibility.

Hydration uses the same typed contract:

1. `TimelineSnapshotV1Schema` decode.
2. `timelineEntityFromProto(...)` mapping.
3. State upsert with version semantics.

Reference: `pinocchio/cmd/web-chat/web/src/ws/wsManager.ts:183`.

### Hypercard already reuses pinocchio backend package

In Hypercard inventory backend, `webchat.NewServer(...)` is already the runtime base (`go-inventory-chat/cmd/hypercard-inventory-server/main.go:115`).

Custom Hypercard integration is already attached through pinocchio extension seams:

1. SEM translator hooks through `semregistry.RegisterByType` for `hypercard.widget.*` and `hypercard.card.*` (`go-inventory-chat/internal/pinoweb/hypercard_events.go:166`).
2. Timeline projector hooks through `webchat.RegisterTimelineHandler` to emit `status` and `tool_result(customKind=...)` entities (`go-inventory-chat/internal/pinoweb/hypercard_events.go:300`).

So backend reuse is not theoretical; it is already in production path. The main remaining architectural debt is frontend orchestration extraction and payload typing discipline.

### Flow comparison

```text
Pinocchio canonical model
-------------------------
Geppetto event
  -> RegisterByType translator (typed payload)
  -> SEM frame envelope
  -> TimelineProjector.ApplySemFrame
     -> custom RegisterTimelineHandler hooks
     -> built-in switch fallback
  -> timeline store upsert (TimelineEntityV1)
  -> timeline.upsert websocket frame
  -> frontend registerSem handler
  -> timeline slice upsert
  -> renderer map dispatch by entity.kind

Hypercard inventory model today
-------------------------------
WebSocket SEM frame
  -> InventoryChatWindow.onEnvelope
  -> engine SemRegistry projection
  -> timeline slice upsert
  -> app-local buildTimelineDisplayMessages
  -> ChatWindow renderWidget callback
  -> app-local widget type switch
```

## Reuse matrix: what to adopt from pinocchio in Hypercard

### Directly reusable patterns

1. Custom-handler registries with additive registration.
2. Custom-handler-first projector flow.
3. Typed `decodeProto` frontend handler pattern.
4. Renderer-map dispatch by semantic kind.
5. Hydration + live replay reconciliation through canonical `timeline.upsert`.

### Reuse with adaptation

1. Pinocchio `ChatWidget` component architecture is reusable conceptually, but Hypercard should keep existing `ChatWindow` shell and desktop integration.
2. Pinocchio `wsManager` hydration gating pattern should be ported into a reusable Hypercard runtime controller, not copied 1:1 into app components.
3. Pinocchio default cards should inform fallback renderer behavior, but Hypercard needs richer artifact actions and runtime-card editor hooks.

### Not reusable as-is

1. Pinocchio default `ToolResultCard` is generic textual rendering (`pinocchio/cmd/web-chat/web/src/webchat/cards.tsx:65`); it does not model Hypercard card/widget panel actions.
2. Hypercard frontend currently relies on inline widget message synthesis, which pinocchio default chat does not provide out of the box.

## Protobuf approach for Hypercard custom events

### Current state

Hypercard custom event payloads are emitted as ad-hoc JSON maps in translator hooks (`go-inventory-chat/internal/pinoweb/hypercard_events.go:398`). They are projected into typed timeline entities, but the custom event payload contract itself is not schema-checked.

This creates drift risk:

1. Field name changes are untyped and can silently break frontend parsing.
2. There is no generated TS decoder for Hypercard-specific payloads.
3. Event-shape compatibility must be validated manually in tests.

### Target state

Keep websocket envelopes JSON, but make `event.data` protobuf-backed for Hypercard custom families, exactly like pinocchio base events.

Proposed approach:

1. Add `proto/sem/base/hypercard/*.proto` for custom payloads.
2. Generate Go + TS artifacts via Buf (same workflow as `pinocchio/buf.gen.yaml`).
3. In Go translator hooks, emit `protoToRaw(protoMessage)` instead of raw `map[string]any`.
4. In TS SEM handlers, decode with generated schema and `fromJson`.
5. Keep timeline projection output compatible (`status` + `tool_result(customKind=...)`) to avoid immediate frontend behavior changes.

### Suggested proto messages

```proto
syntax = "proto3";
package sem.base.hypercard;

import "google/protobuf/struct.proto";

message WidgetLifecycleV1 {
  string item_id = 1;
  string title = 2;
  string widget_type = 3;
  string phase = 4; // start|update|ready|error
  string error = 5;
  google.protobuf.Struct data = 6;
}

message CardLifecycleV2 {
  string item_id = 1;
  string title = 2;
  string template = 3;
  string phase = 4; // start|update|ready|error
  string error = 5;
  google.protobuf.Struct data = 6;
}
```

### Why this is pragmatic

1. No transport rewrite required.
2. No immediate timeline schema rewrite required.
3. Stronger compile-time contracts for both Go and TS.
4. Aligns Hypercard with the same toolchain already used in pinocchio.

### Compatibility and migration model

Recommended rollout:

1. Dual decode stage in frontend for one release:
   - prefer protobuf schema decode,
   - fallback to existing plain object parsing.
2. Keep event type names stable (`hypercard.widget.v1`, `hypercard.card.v2`).
3. Keep `customKind` stable in timeline tool results to avoid renderer breakage.
4. Remove fallback after backend rollout is stable.

## Hybrid target architecture: reusable runtime + Hypercard pack

The right architecture is a hybrid:

1. Preserve Hypercard `ChatWindow` as presentational shell.
2. Port pinocchio-style registry composition into engine runtime.
3. Move Hypercard behavior into installable pack modules.
4. Introduce protobuf contracts for Hypercard custom payload families.

### Hybrid flow

```text
[Go backend]
  custom events
    -> RegisterByType translators (protobuf-backed data)
    -> SEM frames
    -> RegisterTimelineHandler projector hooks
    -> timeline.upsert canonical entities

[TS engine runtime]
  transport + hydration gate
    -> composable sem registry
    -> timeline reducer
    -> display projector registry
    -> inline widget renderer registry
    -> ChatWindow

[Hypercard pack]
  installs sem handlers, adapters, display projector, and renderers
  through registration APIs (no core patches)
```

## Developer ergonomics: register custom widgets without core edits

The end state should let developers add new domain packs without touching engine core files.

### Bootstrap sketch

```ts
const runtime = createSemChatRuntime({
  transport,
  store,
  hostActions,
});

runtime.install(createCoreTimelinePack());
runtime.install(createHypercardPack());
runtime.install(createMyDomainPack());
```

### Pack contract

```ts
interface ChatRuntimePack {
  id: string;
  registerSemHandlers(registry: SemRegistry): void;
  registerAdapters(registry: ProjectionAdapterRegistry): void;
  registerDisplayProjector(registry: DisplayProjectorRegistry): void;
  registerWidgetRenderers(registry: WidgetRendererRegistry): void;
}
```

This is the same developer experience pinocchio enables conceptually with `registerSem` and renderer maps, adapted to Hypercard’s inline-widget message model.

## Problem statement for extraction

To move chat + hypercard widgets out of inventory app and into reusable engine facilities, the architecture must satisfy all of the following at once:

1. Preserve timeline-first projection semantics.
2. Preserve rich per-round widget/card/timeline UX.
3. Allow app-specific behavior (window opening, runtime editor launch, debug actions) without forking core code.
4. Allow multiple packs to coexist without handler collisions.
5. Minimize migration risk for current inventory app.

## Design principles

### Principle 1: Keep `ChatWindow` presentational

`ChatWindow` should stay mostly as-is: it consumes display messages and delegates widget rendering by descriptor.

It is already a good primitive and should not take direct store, websocket, or SEM responsibilities.

### Principle 2: Move orchestration to a reusable runtime layer

A reusable layer should own:

- ingress routing,
- projection invocation,
- adapter execution,
- display message synthesis,
- widget renderer lookup.

Apps should configure this layer, not rewrite it.

### Principle 3: Package hypercard behavior as plugin pack

Hypercard-specific behavior should be shipped as a module with explicit registration hooks:

- SEM handlers,
- projection adapters,
- display synthesizer,
- widget renderers,
- optional action helpers.

### Principle 4: Prefer composition over inheritance or hardcoded switches

All extension points should be additive registries with deterministic precedence rules.

## Target architecture

### Layered structure

```text
Layer A: Generic chat shell
  - ChatWindow (presentational)
  - Generic runtime controller/hook
  - Registry primitives (SEM handlers, adapters, widget renderers)

Layer B: Pack modules
  - Hypercard pack (this extraction)
  - Potential future packs (agent-mode pack, planning pack, etc.)

Layer C: App host
  - Supplies transport client, store, and host actions
  - Chooses which packs to install
```

### Proposed new reusable building blocks

#### 1) `createComposableSemRegistry` (engine)

Replace or wrap current single-map registry with multi-handler support.

Proposed semantics:

- `register(type, handler, { id, priority })`
- handlers execute in priority order
- each handler returns ops/effects
- results are merged

Pseudo-code:

```ts
interface RegisteredSemHandler {
  id: string;
  priority: number;
  fn: SemHandler;
}

class ComposableSemRegistry {
  private handlers = new Map<string, RegisteredSemHandler[]>();

  register(type: string, fn: SemHandler, opts?: { id?: string; priority?: number }) {
    const item = { id: opts?.id ?? crypto.randomUUID(), priority: opts?.priority ?? 0, fn };
    const list = this.handlers.get(type) ?? [];
    list.push(item);
    list.sort((a, b) => b.priority - a.priority);
    this.handlers.set(type, list);
  }

  handle(envelope: SemEnvelope, ctx: SemContext): SemHandlerResult {
    const list = this.handlers.get(envelope.event?.type ?? "") ?? [];
    return list.reduce(mergeResults, emptyResult());
  }
}
```

Current compatibility path: keep `createSemRegistry()` as wrapper that registers existing defaults into the composable registry.

#### 2) `ChatDisplayProjector` abstraction (engine)

Externalize display shaping from inventory app.

```ts
interface ChatDisplayProjector {
  toMessages(input: {
    timelineEntities: TimelineEntity[];
    debugMode: boolean;
  }): ChatWindowMessage[];
}
```

Default projector can preserve today’s generic behavior (`mapTimelineEntityToMessage` fallback). Hypercard pack can register richer round-scoped synthesis.

#### 3) `InlineWidgetRendererRegistry` (engine)

Standardize widget renderer lookup.

```ts
interface InlineWidgetRenderer {
  type: string;
  render: (widget: InlineWidget, ctx: WidgetRenderContext) => ReactNode;
}

interface WidgetRenderContext {
  host: ChatHostActions;
  store: StoreLike;
  debugMode: boolean;
}
```

This removes hardcoded `if (widget.type === ...)` chains from app components.

#### 4) `SemChatRuntimeController` hook/component (engine)

Reusable orchestration hook encapsulating:

- websocket client lifecycle,
- hydration/replay routing,
- projection pipeline,
- adapter execution,
- selector wiring,
- display projection.

Proposed surface:

```ts
interface UseSemChatRuntimeOptions {
  conversationId: string;
  clientFactory: (handlers: InventoryWebChatClientHandlers) => { connect(): void; close(): void };
  semRegistry: SemRegistry;
  adapters: ProjectionPipelineAdapter[];
  displayProjector: ChatDisplayProjector;
  selectTimelineEntities: (state: unknown, conversationId: string) => TimelineEntity[];
  selectChatMeta: (state: unknown, conversationId: string) => ChatMeta;
}
```

The returned view model feeds `ChatWindow`.

## Hypercard renderer pack design

### Pack objective

Deliver a one-call installable pack that restores current rich behavior without inventory-specific code.

### Proposed pack API

```ts
interface ChatRuntimePack {
  id: string;
  registerSemHandlers(registry: ComposableSemRegistry): void;
  registerProjectionAdapters(reg: ProjectionAdapterRegistry): void;
  registerDisplayProjectors(reg: DisplayProjectorRegistry): void;
  registerWidgetRenderers(reg: WidgetRendererRegistry): void;
}

export function createHypercardChatPack(options?: HypercardPackOptions): ChatRuntimePack;
```

### What belongs inside the Hypercard pack

1. Hypercard-specific SEM lifecycle handlers:
   - `hypercard.widget.*`
   - `hypercard.card.*`
   - custom tool_result projection conventions
   Current code basis: `packages/engine/src/hypercard-chat/sem/registry.ts:247` onward.

2. Artifact/runtime-card adapter:
   - `extractArtifactUpsertFromSem`
   - `registerRuntimeCard`
   Current code basis: `packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts:55` and `apps/inventory/src/features/chat/runtime/projectionAdapters.ts:43`.

3. Rich display projector:
   - current `buildTimelineDisplayMessages` logic moved out of inventory app.
   Current code basis: `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts:222`.

4. Widget renderers:
   - timeline widget panel
   - generated widgets panel
   - generated cards panel
   Current code basis: `packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx:153`, `packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx:192`.

5. Host action contract (not direct redux assumptions):
   - `openArtifact(item)`
   - `editRuntimeCard(item)`
   - `openEventInspector(conversationId)`

### Naming normalization

To decouple from inventory domain, rename widget type IDs to pack-level names:

- `inventory.timeline` -> `hypercard.timeline`
- `inventory.widgets` -> `hypercard.widgets`
- `inventory.cards` -> `hypercard.cards`

Compatibility shim can accept both for one migration release.

## Generic host contract and action boundaries

### Current action coupling

`InventoryChatWindow` reads `artifacts.byId` from store and calls `openWindow` / `openRuntimeCardCodeEditor` directly (`apps/inventory/src/features/chat/InventoryChatWindow.tsx:206`).

### Proposed host action interface

```ts
interface ChatHostActions {
  openArtifactWindow: (input: {
    artifactId: string;
    template?: string;
    title?: string;
    runtimeCardId?: string;
  }) => void;
  openRuntimeCardEditor: (input: {
    artifactId: string;
    runtimeCardId: string;
    runtimeCardCode: string;
  }) => void;
  openEventInspector?: (conversationId: string) => void;
}
```

The pack calls this interface, not `dispatch` directly. Apps provide implementation adapters (for example, redux windowing, route navigation, or modal systems).

This is what makes the pack portable across apps.

## Proposed module layout

```text
packages/engine/src/chat-runtime/
  registries/
    semRegistry.ts
    projectionAdapterRegistry.ts
    widgetRendererRegistry.ts
    displayProjectorRegistry.ts
  runtime/
    useSemChatRuntime.ts
    SemChatWindow.tsx
  types.ts

packages/engine/src/hypercard-chat-pack/
  sem/registerHypercardSemHandlers.ts
  adapters/createHypercardArtifactAdapter.ts
  display/hypercardDisplayProjector.ts
  renderers/
    HypercardTimelineWidgetRenderer.tsx
    HypercardGeneratedWidgetRenderer.tsx
    HypercardCardPanelWidgetRenderer.tsx
  createHypercardChatPack.ts
```

Notes:

- This separates generic orchestration from domain pack behavior.
- Existing `packages/engine/src/hypercard-chat` can be gradually reorganized into this model without breaking exports immediately.

## Migration plan (phased)

### Phase 1: Introduce composable registries and runtime controller

Deliverables:

1. Add composable SEM registry while keeping `createSemRegistry` compatibility.
2. Add widget renderer registry and display projector interfaces.
3. Introduce `useSemChatRuntime` hook.

Risk mitigation:

- Keep current inventory flow working through adapter wrappers.
- Add unit tests for handler merge order and conflict behavior.

### Phase 2: Extract Hypercard pack from inventory code

Deliverables:

1. Move `buildTimelineDisplayMessages` into pack projector.
2. Move widget renderer switch and components into pack renderer registration.
3. Move inventory artifact adapter logic into pack adapter (reusing engine artifact runtime helpers).

Risk mitigation:

- Keep temporary aliases for old widget type names.
- Snapshot test message shapes before/after extraction.

### Phase 3: Replace `InventoryChatWindow` with generic runtime usage

Deliverables:

1. `InventoryChatWindow` becomes thin host integration.
2. Remove app-local timeline renderer and projection adapter files.
3. Keep inventory-specific cosmetics (title, placeholder, footer stats) as props only.

Risk mitigation:

- Golden path storybook scenario with old and new output diff.
- Run existing timeline tests migrated to pack tests.

### Phase 4: Cross-app adoption

Deliverables:

1. Add second app pilot with same runtime + hypercard pack.
2. Validate no inventory-only assumptions remain.

Risk mitigation:

- Build app-agnostic integration tests with fake host actions.

## Testing strategy

### Unit tests

1. SEM registry composition:
   - multiple handlers per event,
   - priority ordering,
   - deterministic merged ops.

2. Display projector:
   - round grouping,
   - widget/card/timeline panel synthesis,
   - debug mode badge behavior parity.

3. Widget renderer registry:
   - renderer selection,
   - unknown widget fallback behavior.

### Integration tests

1. Envelope stream -> projected timeline -> display messages -> rendered widget tree.
2. `hypercard.card.v2` path verifies artifact indexing and runtime card editor actions.
3. Hydration replay path verifies `timeline.upsert` events do not duplicate items.

### Regression tests to preserve

Existing tests that should be migrated, not deleted:

- `apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`
- `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.test.ts`
- `apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`

## Risks and tradeoffs

### Risk 1: Over-generalization

If abstractions are too broad too early, implementation cost rises and behavior parity drops.

Mitigation:

- Extract only what inventory currently uses.
- Add extension points incrementally.

### Risk 2: Handler precedence conflicts

Multiple packs may emit conflicting updates for same entity IDs.

Mitigation:

- enforce handler IDs,
- explicit priority,
- conflict diagnostics in dev mode.

### Risk 3: Global runtime card registry side effects

`runtimeCardRegistry` is global (`packages/engine/src/plugin-runtime/runtimeCardRegistry.ts:17`), so cards can leak across sessions/apps if not scoped.

Mitigation:

- add optional scope keys (`appId`, `conversationId`) in registry entries,
- clean up registration on conversation teardown.

### Tradeoff: pack-local convenience vs host-neutrality

A pack that dispatches redux actions directly is convenient but not portable. A host action interface is slightly more verbose but enables real reuse.

## Detailed design sketches

### Sketch A: Generic runtime component

```tsx
function SemChatWindow(props: SemChatWindowProps) {
  const vm = useSemChatRuntime({
    conversationId: props.conversationId,
    clientFactory: props.clientFactory,
    runtime: props.runtime,
  });

  return (
    <ChatWindow
      messages={vm.messages}
      isStreaming={vm.isStreaming}
      onSend={vm.send}
      renderWidget={vm.renderWidget}
      title={props.title}
      subtitle={vm.subtitle}
      footer={props.footer?.(vm.meta)}
      headerActions={props.headerActions?.(vm.actions)}
    />
  );
}
```

### Sketch B: Hypercard pack installation

```ts
const runtime = createChatRuntime({
  semRegistry: createComposableSemRegistry(),
  adapterRegistry: createProjectionAdapterRegistry(),
  widgetRegistry: createWidgetRendererRegistry(),
  displayRegistry: createDisplayProjectorRegistry(),
});

runtime.install(
  createHypercardChatPack({
    widgetTypePrefix: "hypercard",
    includeRuntimeCardTools: true,
  })
);
```

### Sketch C: Inventory app thin integration after extraction

```ts
const hostActions = createInventoryHostActions({ dispatch, store });
const runtime = createInventoryChatRuntime(hostActions); // installs hypercard pack

<SemChatWindow
  conversationId={conversationId}
  runtime={runtime}
  clientFactory={(handlers) => new InventoryWebChatClient(conversationId, handlers, { hydrate: false })}
  title="Inventory Chat"
  placeholder="Ask about inventory..."
/>
```

## Implementation checklist

1. Introduce composable registries and keep compatibility wrapper exports.
2. Add generic runtime hook and container component in engine.
3. Move round/projector logic from inventory app to hypercard pack display module.
4. Move inventory render switch to pack widget registry renderers.
5. Move artifact projection adapter construction into pack.
6. Convert `InventoryChatWindow` to thin host wrapper.
7. Add compatibility widget type aliases for one cycle.
8. Migrate tests and stories to new locations.
9. Remove inventory-local duplicated runtime files.

## Open questions

1. Should pack installation be static at app bootstrap or per conversation instance?
2. Do we want one global runtime-card registry or scoped registries per app runtime?
3. Should `timeline.upsert` be handled by transport layer by default (as in pinocchio) or remain optional per registry config (`enableTimelineUpsert`)?
4. Do we standardize widget type names as `pack.widget` or `hypercard/*` path-style identifiers?
5. Is `debugMode` a runtime-level concern or should it remain app-owned presentation state?
6. For protobuf rollout, do we version with `WidgetLifecycleV1` and `CardLifecycleV2` immediately, or mirror existing event names and version later?
7. Should Hypercard custom payload protos live in pinocchio repo (single SEM schema source) or in Hypercard repo with generated artifacts vendored into both sides?

## Recommended immediate next step

Start with Phase 1 + Phase 2 in one controlled PR:

- implement composable registry and pack API,
- extract projector and widget renderers into hypercard pack,
- keep inventory UI unchanged except wiring through pack.

This yields the biggest reuse benefit while limiting visible behavior change.

## Appendix A: key evidence references

- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - orchestration, envelope routing, renderWidget switch, window actions.
- `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts`
  - round grouping and synthesized inline widget messages.
- `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
  - artifact + runtime-card side effects.
- `packages/engine/src/components/widgets/ChatWindow.tsx`
  - presentational shell with widget callback.
- `packages/engine/src/hypercard-chat/sem/registry.ts`
  - current handlers, single-handler registry shape.
- `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - projection + adapter orchestration.
- `packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts`
  - canonical mapping from timeline entities to widget timeline items.
- `packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx`
  - expandable timeline renderer.
- `packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx`
  - generated widgets/cards panel renderers.
- `packages/engine/src/plugin-runtime/runtimeCardRegistry.ts`
  - global runtime-card registration and injection behavior.
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/webchat/timeline_registry.go`
  - custom timeline handler registration API.
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/webchat/timeline_projector.go`
  - custom-handler-first projector execution and built-in fallback.
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/registry.ts`
  - typed frontend SEM registry and decode strategy.
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/webchat/ChatWidget.tsx`
  - renderer map override pattern for generic component reuse.
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/proto/sem/timeline/transport.proto`
  - canonical timeline entity/upsert protobuf contract.
- `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go`
  - Hypercard custom event bridge built on pinocchio extension points.
