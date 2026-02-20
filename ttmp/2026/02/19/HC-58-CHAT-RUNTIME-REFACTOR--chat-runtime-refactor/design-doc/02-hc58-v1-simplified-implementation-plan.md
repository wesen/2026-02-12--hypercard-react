---
Title: HC-58 V1 Simplified Implementation Plan
Ticket: HC-58-CHAT-RUNTIME-REFACTOR
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
    - developer-experience
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts
      Note: Current hook-owned connection lifecycle to be replaced by runtime-owned connection claims
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx
      Note: Primary timeline-native view after hard cutover
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts
      Note: Existing one-path projection seam to preserve and re-home under runtime core
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Core deterministic SEM handler registry
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.ts
      Note: Stable-id and version-aware merge rules to preserve
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts
      Note: Current global widget registry design to replace with per-window registry
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx
      Note: Current ref-counted global namespace registration
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Current host composition and integration target for migration
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/registerInventoryConversationExtensions.ts
      Note: Inventory runtime extension bootstrap module
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Adapter narrowing boundary (domain side-effects only)
    - Path: pinocchio/cmd/web-chat/web/src/ws/wsManager.ts
      Note: Frontend lifecycle alignment target
    - Path: pinocchio/cmd/web-chat/web/src/sem/registry.ts
      Note: SEM registry behavior alignment target
    - Path: pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts
      Note: Timeline merge semantics alignment target
    - Path: pinocchio/pkg/webchat/conversation.go
      Note: ConvManager ownership model alignment target
Summary: Detailed, ambiguity-free HC-58 V1 implementation plan that keeps one deterministic projection path, introduces conversation runtime ownership, aligns with pinocchio web-chat, and defines explicit out-of-scope boundaries.
LastUpdated: 2026-02-20T20:45:00-05:00
WhatFor: Provide a definitive implementation blueprint developers can execute without interpretation gaps.
WhenToUse: Use as the primary execution reference for HC-58 implementation, review, and handoff.
---

# HC-58 V1 Simplified Implementation Plan

## Purpose
This document replaces ambiguous planning with a strict V1 implementation contract.

Required properties of this plan:
1. Each previously stated point is preserved verbatim.
2. Each point is mapped to a concrete final API and runtime behavior.
3. Each point includes explicit build steps, file targets, tests, and done criteria.
4. The final section defines what is intentionally out of scope for V1.

## Scope of This Plan
This plan covers frontend runtime architecture inside `hypercard-react` engine/inventory code and explicitly aligns with existing `pinocchio/cmd/web-chat` patterns.

This is an implementation plan, not a speculative architecture proposal.

## Global V1 Architecture Contract
These constraints apply to every point below:
1. One runtime instance per `conversationId`.
2. One projection behavior for all windows.
3. Stable entity IDs and version precedence are the timeline correctness contract.
4. Adapters never carry core projection correctness.
5. UI differences are rendering/selector-level only.

## Canonical V1 API Surface
These APIs are the target minimal surface for V1.

### Runtime Core Types
```ts
// packages/engine/src/hypercard-chat/conversation/types.ts
export type ConversationConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export interface ConversationRuntimeMeta {
  modelName?: string;
  streamStartTime?: number;
  streamOutputTokens?: number;
  turnStats?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    cacheCreationInputTokens?: number;
    cacheReadInputTokens?: number;
    durationMs?: number;
    tps?: number;
  };
  lastError?: string;
}

export interface ConversationRuntimeState {
  conversationId: string;
  connection: {
    status: ConversationConnectionStatus;
    error?: string;
    lastSeq?: string;
    lastStreamId?: string;
    hydratedVersion?: string;
  };
  timeline: {
    ids: string[];
    byId: Record<string, TimelineEntity>;
  };
  meta: ConversationRuntimeMeta;
}
```

### Runtime + Manager Interfaces
```ts
// packages/engine/src/hypercard-chat/conversation/runtime.ts
export interface ConversationRuntime {
  getState(): ConversationRuntimeState;
  subscribe(listener: () => void): () => void;
  claimConnection(): () => void;
  ingestEnvelope(envelope: SemEnvelope): void;
  hydrateSnapshot(snapshot: TimelineSnapshotPayload): void;
  setConnectionStatus(status: ConversationConnectionStatus, error?: string): void;
  dispose(): void;
}

// packages/engine/src/hypercard-chat/conversation/manager.ts
export interface ConversationManager {
  getRuntime(conversationId: string): ConversationRuntime;
  releaseRuntime(conversationId: string): void;
}
```

### React Selectors/Hooks
```ts
// packages/engine/src/hypercard-chat/conversation/selectors.ts
export function useConversationConnection(conversationId: string): {
  status: ConversationConnectionStatus;
  error?: string;
};

export function useTimelineIds(conversationId: string): string[];
export function useTimelineEntity(conversationId: string, entityId: string): TimelineEntity | undefined;
export function useConversationMeta<T>(conversationId: string, select: (meta: ConversationRuntimeMeta) => T): T;
```

### Hard Cutover Layer
```ts
// Compatibility wrappers are removed in hard cutover.
// Primary path is TimelineConversationView + useProjectedChatConnection.
```

## Implementation Ordering (Non-negotiable)
1. Runtime core + manager creation.
2. Connection ownership migration.
3. Metadata ownership migration.
4. Timeline-native view cutover.
5. Wrapper deletion and stale API cleanup.

No team should start UI cleanup before runtime ownership exists.

---

## Point 1
### Point (Exact)
"Runtime concerns are still app-wired instead of core-wired: `InventoryChatWindow` passes `createClient`, `semRegistry`, adapters, and host actions directly into the runtime window (`2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx:127`, `2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx:252`)."

### Final Design API and How It Works
In V1, app windows do not pass runtime infrastructure objects (`createClient`, `semRegistry`, adapters) directly.

Final integration shape:
```tsx
// inventory app
<InventoryTimelineConversationView conversationId={conversationId} />
```

`InventoryTimelineConversationView` is allowed to pass:
1. UI config (title/subtitle/footer/actions).
2. Domain-only adapter bundle registration at bootstrap time.
3. App-specific widget renderers.

It is not allowed to pass:
1. Projection pipeline function references.
2. Core connection lifecycle callbacks.
3. Core registry objects per-render.

Runtime infrastructure is created once in engine core and resolved by `conversationId` through `ConversationManager`.

### How to Build It
1. Create `packages/engine/src/hypercard-chat/conversation/bootstrap.ts` that initializes manager, runtime factories, and registry composition once.
2. Move `createSemRegistry()` usage out of `InventoryChatWindow` and into runtime creation.
3. Move adapter list ownership from `InventoryChatWindow` to runtime bootstrap input:
   - `registerConversationAdapters('inventory', [createInventoryArtifactProjectionAdapter()])`.
4. Replace direct `TimelineChatRuntimeWindow` usage with a new engine-provided conversation view that only needs `conversationId` + UI props.
5. Update `apps/inventory/src/features/chat/InventoryChatWindow.tsx` to remove `semRegistryRef`, `projectionAdaptersRef`, and `createClient` creation from render path.

Validation:
1. Typecheck passes with no remaining runtime infra props in inventory call sites.
2. Search check passes:
   - `rg -n "createSemRegistry\(|ProjectionPipelineAdapter\[|createClient\(" apps/inventory/src/features/chat`
3. Inventory chat behavior remains unchanged in smoke test.

Done criteria:
1. No app component owns SEM registry instantiation.
2. No app component owns projection pipeline wiring.

---

## Point 2
### Point (Exact)
"Connection lifecycle is mount-owned, so two windows for one conversation will open two clients (`2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts:68`)."

### Final Design API and How It Works
Connection lifecycle becomes runtime-owned with ref-counted claims.

Contract:
1. `runtime.claimConnection()` increments claim count.
2. First claim opens WS client and hydration path.
3. Additional claims only subscribe.
4. Release function decrements claim count.
5. When claim count reaches zero, runtime follows policy:
   - V1 default: close immediately.

This guarantees one active connection per `conversationId` per manager instance.

### How to Build It
1. Implement claim refcount inside `ConversationRuntime`.
2. Move websocket client initialization from `useProjectedChatConnection` to `ConversationRuntime.ensureConnected()`.
3. Replace hook effect behavior:
   - Old: create/close client in component effect.
   - New: call `claimConnection()` on mount and release on unmount.
4. Add manager-level runtime cache `Map<string, ConversationRuntime>`.
5. Ensure `InventoryWebChatClient` lifecycle callbacks update runtime state, not app slice directly.

Tests:
1. Unit: two claims => one connect call.
2. Unit: release first claim keeps connection alive.
3. Unit: release last claim closes connection.
4. Integration: two windows same conversation share one socket lifecycle.

Done criteria:
1. `useProjectedChatConnection` no longer creates transport client directly.
2. Connection count for same conversation is 1 under two-window test.

---

## Point 3
### Point (Exact)
"Core chat metadata is app-owned in `chatSlice` + adapter logic (`2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts:20`, `2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts:57`)."

### Final Design API and How It Works
Runtime owns generic chat metadata:
1. connection status/error,
2. model name,
3. stream token counters,
4. turn usage stats.

Apps consume via runtime selectors:
1. `useConversationConnection(conversationId)`
2. `useConversationMeta(conversationId, selector)`

Inventory keeps only domain metadata not reusable across apps.

### How to Build It
1. Add runtime meta reducer/update helpers in `conversation/runtime.ts`.
2. Move metadata extraction logic for `llm.start`, `llm.delta`, `llm.final`, `ws.error` from inventory adapter into engine runtime metadata handler module.
3. Remove metadata reducers/actions from `apps/inventory/src/features/chat/chatSlice.ts`.
4. Keep inventory artifact adapter; remove metadata adapter.
5. Update `InventoryChatWindow` footer reads to runtime selectors.

Hard-cut migration steps:
1. Remove inventory compatibility selectors immediately.
2. Migrate all call sites directly to runtime selectors in the same change.
3. Add grep/typecheck guard in verification to ensure removed selectors are not imported.

Tests:
1. Runtime unit tests for metadata updates by event type.
2. Inventory component tests verifying footer still shows same model/stats values.

Done criteria:
1. Inventory no longer dispatches model/stats runtime actions.
2. Runtime state contains full generic metadata contract.

---

## Point 4
### Point (Exact)
"There is a second projection layer from timeline entities to `ChatWindowMessage` (`2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts:230`), which makes behavior harder to reason about."

### Final Design API and How It Works
Primary runtime path becomes timeline-native rendering.

Rule:
1. Projection from SEM to timeline happens once.
2. Rendering reads timeline entities directly.
3. Any mapping to display model is local UI formatting only, not state transformation.

`TimelineConversationView` renders entity-by-entity:
1. fetch ordered entity IDs,
2. fetch each entity by ID,
3. dispatch to renderer by `entity.kind`.

No batch message synthesis step in core runtime path.

### How to Build It
1. Create `packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx`.
2. Implement direct entity list rendering using runtime selectors.
3. Extract only minimal shared formatting helpers from `timelineDisplayMessages.ts` where needed.
4. Delete `timelineDisplayMessages.ts` and all references in runtime/stories.
5. Keep only direct entity rendering in `TimelineConversationView`.

Tests:
1. UI test verifying entity order and content parity against current behavior.
2. Snapshot tests for message/tool/log entity rendering.

Done criteria:
1. Primary inventory chat route uses timeline-native view.
2. `timelineDisplayMessages.ts` is no longer in primary render path.

---

## Point 5
### Point (Exact)
"Widget registration is global mutable state (`2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts:12`, `2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx:40`)."

### Final Design API and How It Works
Widget registry becomes per-window instance, not global singleton.

API:
```ts
export interface ConversationWidgetRegistry {
  register(type: string, render: InlineWidgetRenderer): void;
  resolve(type: string): InlineWidgetRenderer | undefined;
}

export function createConversationWidgetRegistry(): ConversationWidgetRegistry;
```

`TimelineConversationView` receives registry instance via props/context.

Result:
1. Different windows can render same entity kinds differently.
2. No global register/unregister race conditions.

### How to Build It
1. Introduce local registry object and context provider for runtime chat view.
2. Port `registerHypercardWidgetPack` to a pure function that registers into provided registry instance.
3. Remove direct use of global `extensionRenderers` for primary runtime path.
4. Delete legacy global registry functions and migrate all registrations to injected registry instances.

Tests:
1. Unit: two registries resolve different renderers for same type.
2. Integration: opening two windows with different widget packs produces different rendering without cross-talk.

Done criteria:
1. Primary runtime path does not read or write global widget registry maps.

---

## Point 6
### Point (Exact)
"Add a headless `ConversationManager` + `ConversationRuntime` in engine core, one runtime per `conversationId`, with ref-counted `claimConnection()/release()`."

### Final Design API and How It Works
This is the core V1 architecture anchor.

Manager responsibilities:
1. cache `ConversationRuntime` by conversation ID,
2. provide runtime creation policy,
3. release/dispose runtime when no references remain.

Runtime responsibilities:
1. own connection lifecycle,
2. own hydration + replay ordering,
3. own envelope ingestion + projection,
4. own connection/meta state,
5. expose subscription for selectors/hooks.

### How to Build It
1. Add new folder: `packages/engine/src/hypercard-chat/conversation/`.
2. Add files:
   - `types.ts`
   - `runtime.ts`
   - `manager.ts`
   - `selectors.ts`
   - `context.tsx` (provider)
3. Build runtime with injected dependencies:
   - transport client factory,
   - sem registry,
   - adapters,
   - now/time provider.
4. Add deterministic runtime dispose behavior.
5. Wire provider at app shell level or local chat root.

Tests:
1. runtime creation/caching behavior,
2. lifecycle claim refcount,
3. dispose path correctness.

Done criteria:
1. New conversation runtime package exists and is used by inventory integration.

---

## Point 7
### Point (Exact)
"Keep one projection path exactly as today (`projectSemEnvelope -> semRegistry.handle -> applySemTimelineOps -> adapters`) and move ownership from hook/window to runtime (`2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts:71`)."

### Final Design API and How It Works
Projection pipeline internals do not fork by UI mode.

Envelope ingestion algorithm:
1. envelope arrives,
2. runtime calls `projectSemEnvelope(...)`,
3. projected ops applied to timeline,
4. adapters run post-apply.

Hydration algorithm:
1. fetch timeline snapshot,
2. call `hydrateTimelineSnapshot(...)`,
3. replay buffered live envelopes in sequence order.

### How to Build It
1. Keep `projectionPipeline.ts` unchanged in behavior.
2. Move call sites from `useProjectedChatConnection` into runtime ingest/hydrate methods.
3. Ensure runtime updates cursor fields (`lastSeq`, `lastStreamId`, `hydratedVersion`) during ingest.
4. Remove any residual envelope filtering from UI layer.

Tests:
1. regression tests for existing SEM event types.
2. replay idempotency test with mixed hydration/live frames.

Done criteria:
1. There is exactly one projection call path in code search for runtime chat.

---

## Point 8
### Point (Exact)
"Move connection status + model/stats into runtime meta and remove them from inventory `chatSlice`."

### Final Design API and How It Works
`chatSlice` is removed or reduced to inventory-only concerns.

Runtime selectors become source-of-truth for chat footer/header metadata.

Inventory UI contracts:
1. `status` from `useConversationConnection`,
2. `modelName/turnStats/stream*` from `useConversationMeta`.

### How to Build It
1. Remove existing `chatSlice` runtime metadata fields/actions outright.
2. Implement runtime meta selectors and migrate UI call sites in the same slice.
3. Delete dead reducers/actions/types and update imports.
4. Remove metadata adapter `createChatMetaProjectionAdapter` from inventory.

Tests:
1. compile-time: no imports of removed chatSlice actions.
2. component tests for footer rendering with runtime selectors.

Done criteria:
1. inventory chat metadata derives entirely from runtime state.

---

## Point 9
### Point (Exact)
"Keep adapters, but enforce them as side-effects only; projection correctness stays in SEM handlers/reducer."

### Final Design API and How It Works
Adapter API contract:
1. receives envelope + projected ops + conversation state snapshot (optional),
2. may trigger domain side-effects (artifact upsert, runtime card registration, telemetry),
3. may not mutate core projection result.

Adapter anti-patterns forbidden:
1. creating timeline entities required for correctness,
2. compensating missing handler logic,
3. changing projection order.

### How to Build It
1. Document adapter contract in `projectionPipeline.ts` TSDoc.
2. Add runtime assertion helper in development mode:
   - compare projected ops pre/post adapter (must remain unchanged).
3. Move all generic metadata logic out of adapters into runtime metadata handlers.
4. Keep only inventory artifact adapter in app code.

Tests:
1. unit test ensuring adapter cannot influence projected ops.
2. integration test with inventory adapter verifying artifacts still update.

Done criteria:
1. adapters are side-effects-only by architecture and enforcement.

---

## Point 10
### Point (Exact)
"Introduce a timeline-native view component that reads runtime selectors directly; keep old wrapper only as temporary compatibility."

### Final Design API and How It Works
New primary component:
```tsx
<TimelineConversationView
  conversationId={conversationId}
  title="Inventory Chat"
  subtitle={subtitle}
  footer={...}
  headerActions={...}
  onSend={handleSend}
  widgetRegistry={registry}
/>
```

Hard cutover policy:
1. `TimelineChatRuntimeWindow` is removed.
2. `TimelineChatWindow` is removed.
3. `TimelineConversationView` is the only supported runtime chat surface.

### How to Build It
1. Implement `TimelineConversationView.tsx` in engine runtime.
2. Migrate inventory to new component.
3. Delete wrapper stories/exports and migrate callers immediately.
4. Update docs to present only timeline-native runtime usage.

Tests:
1. story updates for new component.
2. e2e/smoke of inventory window.

Done criteria:
1. inventory does not import any removed wrapper chain symbol.

---

## Point 11
### Point (Exact)
"Keep stable-ID + version precedence as the merge rule (already implemented in reducer) (`2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.ts:46`)."

### Final Design API and How It Works
Timeline merge invariants:
1. entity identity key is stable `entity.id`.
2. if incoming version < existing version => ignore.
3. if existing has version and incoming lacks version => patch props/updatedAt only.
4. otherwise standard upsert merge.

No alias/rekey/canonical remapping added in V1.

### How to Build It
1. Preserve existing `timelineSlice.upsertEntity` behavior.
2. Remove `rekeyEntity` from active projection op set in runtime path.
3. Keep `rekeyEntity` only if needed by legacy tests; otherwise delete in cleanup phase.
4. Add test matrix for version precedence edge cases.

Tests:
1. low-version rejection,
2. versionless patch over versioned entity,
3. idempotent same-version merge,
4. initial insert ordering.

Done criteria:
1. stable ID/version merge semantics are unchanged and fully covered by tests.

---

## Point 12
### Point (Exact)
"Frontend lifecycle shape matches Pinocchio `wsManager`: connect once, hydrate, buffer, replay (`pinocchio/cmd/web-chat/web/src/ws/wsManager.ts:57`)."

### Final Design API and How It Works
V1 runtime lifecycle sequence:
1. `claimConnection` triggers connect.
2. while hydrating, buffer incoming envelopes.
3. apply snapshot.
4. sort/replay buffer by stream/seq.
5. switch to live mode.

Status transitions are runtime-owned and observable via selector.

### How to Build It
1. Port hydration gate logic from `InventoryWebChatClient` and Pinocchio ws manager behavior into runtime-owned lifecycle module.
2. Keep ordering comparator using `stream_id` then `seq` fallback.
3. Record cursor after each applied envelope.
4. Expose errors through runtime connection state.

Tests:
1. hydration replay ordering test,
2. malformed frame handling test,
3. reconnect/hydrate reconciliation test.

Done criteria:
1. runtime lifecycle behavior mirrors established pinocchio operational sequence.

---

## Point 13
### Point (Exact)
"SEM registry remains central and deterministic (`pinocchio/cmd/web-chat/web/src/sem/registry.ts:61`)."

### Final Design API and How It Works
Single central registry for event handlers remains mandatory.

Handler rules:
1. pure function style from envelope/context to ops/effects,
2. deterministic output for same input,
3. no UI-layer dependencies.

Unknown event handling:
1. ignore by default,
2. optional debug log hook in runtime.

### How to Build It
1. Keep `createSemRegistry` and `registerDefaultSemHandlers` as central entrypoint.
2. Move any app-reusable handlers into engine registry.
3. Keep app-owned domain events registered through explicit extension hooks.

Tests:
1. deterministic handler snapshot tests.
2. unknown event no-op test.

Done criteria:
1. projection behavior is fully registry-driven.

---

## Point 14
### Point (Exact)
"Timeline reducer remains idempotent/version-aware (`pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts:59`)."

### Final Design API and How It Works
Reducer contract must remain safe for:
1. duplicate replays,
2. out-of-order deliveries,
3. snapshot + live stream convergence.

Idempotency guarantees:
1. `upsertEntity` can be replayed repeatedly with no corruption,
2. ordering list is append-once per ID.

### How to Build It
1. Keep `timelineSlice` reducer authoritative.
2. Add runtime integration tests that replay same envelope set multiple times.
3. Add out-of-order tests using mixed `version` values.

Done criteria:
1. replay and out-of-order tests are green.

---

## Point 15
### Point (Exact)
"App-owned feature extensions stay modular (thinking-mode style: register SEM + renderer from app module) (`pinocchio/cmd/web-chat/web/src/features/thinkingMode/registerThinkingMode.tsx:101`)."

### Final Design API and How It Works
Extension model in V1:
1. engine ships core SEM handlers,
2. app registers app-owned handlers/renderers in one explicit bootstrap function,
3. app logic remains outside engine core.

Example V1 extension seam:
```ts
registerConversationExtension({
  id: 'inventory',
  registerSem(registry) { ... },
  registerWidgets(registry) { ... },
  adapters: [createInventoryArtifactProjectionAdapter()],
});
```

### How to Build It
1. Add `extensions.ts` in conversation module.
2. Provide explicit registration API for app modules.
3. Migrate inventory feature wiring into one `registerInventoryConversationExtensions()` function.
4. Call once from inventory app bootstrap.

Tests:
1. extension registration idempotency test.
2. app extension not loaded => core chat still works.

Done criteria:
1. inventory-specific logic is modular and explicitly wired.

---

## Point 16
### Point (Exact)
"Conceptually mirrors backend ConvManager one-conversation-one-runtime ownership (`pinocchio/pkg/webchat/conversation.go:62`, `pinocchio/pkg/webchat/conversation.go:247`)."

### Final Design API and How It Works
Frontend manager mirrors backend ownership semantics:
1. runtime keyed by conversation,
2. reused for all windows on same conversation,
3. lifecycle explicitly managed.

This creates symmetric reasoning model across backend and frontend:
1. backend ConvManager owns stream/session lifecycle,
2. frontend ConversationManager owns ws/projection lifecycle.

### How to Build It
1. Implement manager cache key strictly as normalized conversation ID.
2. Expose debug instrumentation:
   - active runtimes,
   - active connection claims,
   - connection status by conversation.
3. Add test asserting same ID returns same runtime instance.
4. Add test asserting different IDs return distinct runtime instances.

Done criteria:
1. ownership model is one-runtime-per-conversation and test-enforced.

---

## Detailed Build Plan (Execution Backlog)
This section is the strict execution order with concrete code moves.

### Phase A: Runtime Core Scaffolding
1. Add `conversation/` module with runtime/manager/types/selectors.
2. Add runtime unit test scaffold.
3. Export new module from `packages/engine/src/hypercard-chat/index.ts`.

### Phase B: Connection Ownership Migration
1. Refactor `useProjectedChatConnection` to be a thin runtime-claim hook or remove it.
2. Move websocket lifecycle into runtime.
3. Add claim-count tests.

### Phase C: Metadata Ownership Migration
1. Move metadata extraction from inventory adapters into runtime core.
2. Migrate inventory selectors and components to runtime meta selectors.
3. Remove obsolete `chatSlice` metadata state.

### Phase D: Timeline-Native UI Cutover
1. Create `TimelineConversationView`.
2. Migrate inventory chat to it.
3. Delete wrapper chain and related exports/stories.

### Phase E: Registry and Widget Isolation
1. Add per-window widget registry implementation.
2. Migrate hypercard widget pack registration to local registry injection.
3. Remove global registry usage from runtime path.

### Phase F: Cleanup and Hardening
1. Remove dead exports and obsolete wrappers from docs/stories and code.
2. Complete runtime and integration test suite.
3. Update HC-58 docs/tasks/changelog.

---

## Verification Matrix (Must Pass)
1. `npm run typecheck` in `2026-02-12--hypercard-react`.
2. Runtime unit tests:
   - claim lifecycle,
   - projection application,
   - metadata updates,
   - replay idempotency.
3. Inventory integration tests:
   - chat footer metadata,
   - artifact side-effects,
   - multi-window same-conversation behavior.
4. Manual smoke:
   - open two chat windows on same conversation,
   - send prompt,
   - confirm one connection lifecycle and equal timeline output.

---

## Pull Request Strategy
Use small, reviewable PR slices.

1. PR-1 Runtime scaffolding + manager + types + tests.
2. PR-2 Connection ownership migration.
3. PR-3 Metadata migration out of inventory chatSlice.
4. PR-4 Timeline-native view + inventory cutover.
5. PR-5 Widget registry de-globalization (primary path).
6. PR-6 Cleanup/deprecations/docs/tests hardening.

Each PR must include:
1. migration notes,
2. before/after architecture note,
3. explicit risk and rollback statement.

---

## Risks and Mitigations
1. Risk: hidden dependencies on `chatSlice` metadata.
   Mitigation: temporary forwarding selectors + search-based migration checks.
2. Risk: accidental behavior drift in projection.
   Mitigation: freeze projection pipeline behavior and add parity tests.
3. Risk: widget rendering regressions due to registry changes.
   Mitigation: run side-by-side storybook snapshots during transition.
4. Risk: hidden callers of removed wrapper symbols.
   Mitigation: run code search + typecheck in same PR; migrate or delete each call site before merge.

---

## Out of Scope (V1)
The following are explicitly not part of HC-58 V1.

1. Alias/canonical entity identity systems unless real production payloads prove stable-ID mismatch.
2. A large generalized “kit framework” with lifecycle/plugin dependency graphs.
3. Full split streaming substore architecture for differential rerender profiles.
4. Re-architecting backend APIs or changing `/chat`, `/ws`, `/api/timeline` contracts.
5. New UI themes, design overhauls, or non-runtime UX redesigns.
6. Advanced offline caching/persistence on frontend runtime state.

Out-of-scope enforcement rule:
1. If a change does not directly improve runtime ownership clarity, projection determinism, or pinocchio alignment, defer it.
