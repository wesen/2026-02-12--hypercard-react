---
Title: Chat Runtime Refactor Analysis and Concrete Blueprint
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
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Real host integration constraints and runtime usage
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Current inventory-owned runtime metadata and suggestions state targeted for extraction/removal
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Current adapter-level metadata and suggestions handling targeted for runtime-core ownership
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts
      Note: Current selector API that will be replaced by runtime selectors for connection and turn stats
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts
      Note: Current project/apply/adapter pipeline shape
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx
      Note: Current runtime wrapper and projectionMode gate behavior
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts
      Note: Current connection lifecycle ownership and adapter skip-path logic
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Current event->timeline op mapping including structured tool/widget events
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.ts
      Note: Current version-aware upsert and rekey behavior
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md
      Note: Imported proposal analyzed and corrected
ExternalSources:
    - local:chat-runtime-chatgpt-pro.md
Summary: In-depth technical analysis of imported chat runtime refactor proposal, including corrections for structured streaming data, concrete API contracts, migration mapping, and implementation risks.
LastUpdated: 2026-02-19T17:22:58.109823143-05:00
WhatFor: Align HC-58 on a concrete and correct runtime architecture before implementation.
WhenToUse: Use when designing or implementing reusable multi-window chat runtime behavior.
---


# Chat Runtime Refactor Analysis and Concrete Blueprint

## Executive Summary
The imported proposal is directionally strong and compatible with the goals behind HC-56 and HC-57: split headless conversation runtime from UI, remove projection-mode correctness toggles, and make extension points developer-first.

The most important correction is the streaming contract. `streaming/append` and `streaming/finalize` as plain string operations are too narrow for our actual traffic. In our system, streaming and partial updates are not only text. We already handle tool deltas, tool result payloads, widget/card lifecycle updates, and metadata-rich SEM envelopes. The runtime must support typed structured stream fragments and patch semantics, not just cumulative text.

This document proposes a concrete runtime contract that preserves the good parts of the imported design and corrects the weak parts, with one explicit policy decision: hard cutover with no compatibility or fallback UI layers.
- headless per-conversation runtime managed by a `ConversationManager`
- idempotent reducer-level merge with version precedence and alias/canonical ID mapping
- streaming channels that support structured payloads (text, JSON patch, object patch, status transitions, widget/card fragments)
- per-window selector subscriptions for distinct rerender profiles
- kit-based extension API for runtime behaviors and widget rendering
- timeline-native UI (`TimelineConversationView`) as the only first-class chat surface
- suggestions removed for now across runtime/UI/app state to simplify cutover and avoid preserving soon-to-be-replaced behavior

## Problem Statement
`TimelineChatRuntimeWindow` currently combines transport wiring, projection policy, registry wiring, adapter side-effects, and UI composition in one surface. This has three practical consequences:

1. API crowding and ownership confusion.
- Runtime and UI concerns are configured together in `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`.

2. Lifecycle coupling to component mount.
- `useProjectedChatConnection` creates a client per mount and owns connect/close directly (`packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`).
- Multiple windows on the same conversation can double-connect unless each host implements coordination.

3. Projection correctness depends on caller policy.
- `projectionMode` can drop non-`timeline.upsert` envelopes (`timeline-upsert-only` default in `timelineChatRuntime.tsx`).
- This can be useful as a temporary guard, but correctness should not depend on UI-level filtering.

We need a runtime architecture that supports:
- many simultaneous windows over one conversation runtime,
- deterministic dedup and merge correctness without “drop mode” switches,
- extension by app developers without deep transport/projection knowledge,
- structured streaming payloads (not only text).

## Current-System Grounding
This proposal is grounded in current implementation behavior.

### Runtime seam today
- `TimelineChatRuntimeWindow` wraps `TimelineChatWindow`, registers a widget pack, and opens a projected chat connection.
- Path: `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`

### Connection lifecycle today
- `useProjectedChatConnection` instantiates `createClient(...)` in an effect and calls `connect()`/`close()`.
- Path: `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`

### Projection pipeline today
- Envelope -> `semRegistry.handle(...)` -> `applySemTimelineOps(...)` -> adapters.
- Path: `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`

### SEM mapping and timeline reducer
- `SemRegistry` maps event types to timeline ops.
- Paths:
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
  - `packages/engine/src/hypercard-chat/sem/timelineMapper.ts`
- Timeline reducer already has version-aware merge behavior and `rekeyEntity`.
- Path: `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`

### Widget registration model
- Widget renderers are globally registered into a module-level map with refcount by namespace.
- Path: `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`

### Inventory integration (real host)
- Inventory uses `TimelineChatRuntimeWindow` with `projectionMode="timeline-upsert-only"`, custom adapters, and host callbacks.
- Path: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

## Analysis of Imported Proposal

## What is correct and should be retained
1. Headless runtime and UI split.
2. Shared runtime instance per conversation ID.
3. Manager-based lifecycle and multi-window support.
4. No projection correctness toggles as core strategy.
5. Reducer-level idempotency with version precedence.
6. Kit-oriented extension surface.
7. Selector-level subscription model for rerender control.

## What needs correction or hardening

### 1) Streaming model is too text-centric
Imported mutation examples center on:
- `streaming/append(entityId, delta: string)`
- `streaming/finalize(entityId)`

This is insufficient for our event space:
- tool updates may stream structured patches (`tool.delta` patch object)
- tool results can be structured objects, not plain strings
- hypercard lifecycle events update structured `data` payloads
- future multimodal payloads can include typed parts (text, JSON, media refs)

Correction:
Use typed streaming channels with typed fragments/patches.

### 2) Reducer merge needs explicit cross-entity transaction semantics
Some events naturally produce multiple correlated mutations (example: tool result + done transitions, alias mapping + upsert). We need a transaction wrapper or batched commit semantics to avoid intermediate inconsistent UI states.

### 3) Ordering and replay semantics need a strict cursor contract
The imported design calls out ordering conceptually, but the runtime must standardize order keys (`seq`/`stream_id`) and replay policy for buffered events and hydration reconciliation.

### 4) Global widget registry side effects need confinement
Current inline widget registry is module-global. Multi-window differing render policies should avoid global mutable renderer collisions.

### 5) Adapter phase model should be explicit
Current adapters run via `onEnvelope` with projected payload. We need explicit phases to avoid ambiguous assumptions:
- before projection,
- after projection pre-commit,
- after commit with state diff summary.

### 6) Alias/canonical IDs need first-class state and API
We already have `rekeyEntity`, but alias mapping should be native in runtime state and not only ad hoc op emission.

## Corrected Runtime Contract (Concrete)

### Runtime state
```ts
type ConversationState = {
  connection: {
    status: 'idle' | 'connecting' | 'connected' | 'closed' | 'error';
    error?: string;
    connectedAtMs?: number;
    lastFrameAtMs?: number;
  };

  cursor: {
    lastSeq?: string;
    lastStreamId?: string;
    hydratedVersion?: string;
  };

  raw: {
    ring: Envelope[]; // bounded
    max: number;
  };

  timeline: {
    ids: string[];
    byId: Record<string, TimelineEntity>;
    aliasToCanonical: Record<string, string>;
  };

  streams: {
    // per-entity channel state for high-frequency/structured updates
    byEntity: Record<string, Record<string, StreamChannelState>>;
  };

  meta: Record<string, unknown>;
};
```

### Structured streaming channel model
```ts
type StreamChannelKind =
  | 'message.text'
  | 'message.parts'
  | 'tool.progress'
  | 'tool.patch'
  | 'widget.patch'
  | 'custom';

type StreamFragment =
  | { kind: 'text.delta'; text: string }
  | { kind: 'text.cumulative'; text: string }
  | { kind: 'json.patch'; ops: JsonPatchOp[] }
  | { kind: 'object.patch'; patch: Record<string, unknown> }
  | { kind: 'status'; value: string }
  | { kind: 'parts.append'; parts: Array<{ type: string; data: unknown }> }
  | { kind: 'replace'; value: unknown };

type StreamChannelState = {
  channel: StreamChannelKind | string;
  status: 'open' | 'finalized' | 'errored';
  value: unknown;
  startedAtMs?: number;
  updatedAtMs?: number;
  finalizedAtMs?: number;
  error?: string;
};
```

### Mutation model (replaces string-only append/finalize)
```ts
type Mutation =
  | { type: 'timeline.upsert'; entity: TimelineEntity }
  | { type: 'timeline.remove'; id: string }
  | { type: 'timeline.alias'; alias: string; canonicalId: string }
  | { type: 'timeline.rekey'; fromId: string; toId: string }
  | { type: 'stream.open'; entityId: string; channel: string; initial?: unknown }
  | { type: 'stream.apply'; entityId: string; channel: string; fragment: StreamFragment }
  | { type: 'stream.finalize'; entityId: string; channel: string; final?: unknown }
  | { type: 'stream.error'; entityId: string; channel: string; error: string }
  | { type: 'meta.patch'; patch: Record<string, unknown> }
  | { type: 'raw.append'; envelope: Envelope }
  | { type: 'cursor.update'; seq?: string; streamId?: string; version?: string };
```

This addresses the exact gap you identified: finalization is not a text-only event and may include structured payload completion.

## Projection and adapter phases

### Projection phases
1. Ingest raw envelope (`raw.append`, `cursor.update`).
2. Build mutation transaction via SEM handlers.
3. Apply transaction in one reducer commit (or one batched block).
4. Run post-commit adapters.

### Adapter contract
```ts
type AdapterPhase = 'beforeProject' | 'afterProject' | 'afterCommit';

type AdapterContext = {
  phase: AdapterPhase;
  envelope: Envelope;
  mutations?: Mutation[];
  prevState?: ConversationState;
  nextState?: ConversationState;
};
```

This prevents adapters from depending on implicit ordering.

## Canonical ID and dedup strategy

### Canonical resolution
For incoming entity updates, runtime resolves canonical ID by:
1. explicit `canonicalId` in payload (if present),
2. existing alias map lookup,
3. defaulting to `entity.id`.

### Alias recording
Whenever an update includes known alternates (`aliases`, `sourceEventId`, old ID), runtime writes alias entries.

### Merge precedence
- if both sides have comparable versions: higher version wins field precedence,
- if only one side is versioned: versioned fields are authoritative,
- if neither versioned: use semantic merger by kind (message/tool/widget), not only shallow merge.

## ConversationManager and connection claims
```ts
type ConversationManager = {
  getRuntime(conversationId: string): ConversationRuntime;
  installKits(conversationId: string, kits: ConversationKit[]): void;
  claimConnection(conversationId: string, opts?: { keepAliveMs?: number }): () => void;
};
```

Behavior:
- one runtime instance per conversation ID,
- N window claims -> one shared transport connection,
- disconnect after last release (immediate or keepAlive grace).

## React selector surface for rerender profiles
```ts
useConversationConnection(conversationId)
useTimelineIds(conversationId)
useTimelineEntity(conversationId, entityId)
useStreamChannel(conversationId, entityId, channel)
useMeta(conversationId, selector)
```

Example:
- live window subscribes to `message.text` stream channels,
- final transcript window subscribes only to timeline entities.

No projection-mode switches are needed for this distinction.

## Kit API (developer-facing)

### Runtime kits
```ts
type ConversationKit = {
  id: string;
  runtime?: {
    registerSem?: (reg: SemHandlerRegistry) => void;
    registerAdapters?: (reg: AdapterRegistry) => void;
    mergeByKind?: Partial<Record<string, EntityMergeFn>>;
  };
  widgets?: WidgetPack;
};
```

### SEM handler context
```ts
type SemHandlerContext = {
  emit: (m: Mutation) => void;
  timeline: {
    upsert: (e: TimelineEntity) => void;
    alias: (alias: string, canonicalId: string) => void;
  };
  stream: {
    open: (entityId: string, channel: string, initial?: unknown) => void;
    apply: (entityId: string, channel: string, fragment: StreamFragment) => void;
    finalize: (entityId: string, channel: string, final?: unknown) => void;
    error: (entityId: string, channel: string, error: string) => void;
  };
  meta: {
    patch: (patch: Record<string, unknown>) => void;
  };
};
```

## UI Hard Cutover
The chain `TimelineChatRuntimeWindow -> TimelineChatWindow -> ChatWindow` will be removed.

Target:
- headless runtime layer (`ConversationRuntime` + `ConversationManager`)
- one timeline-native UI component (`TimelineConversationView`)
- no `ChatWindow` bridge, no message-model adapter layer in the primary path

### Why hard cutover
1. `ChatWindow` is message-first while runtime state is entity-first, forcing lossy translation.
2. The translation layer obscures structured timeline semantics and increases API confusion.
3. Maintaining dual abstractions slows iteration and increases regression surface.

## Inventory Runtime Ownership Cutover (`chatSlice` Extraction)
Inventory currently owns multiple runtime concerns in `apps/inventory/src/features/chat/chatSlice.ts` that should be runtime-core concerns in HC-58:
- connection lifecycle state (`connectionStatus`, `lastError`),
- model + usage/turn performance stats (`modelName`, `currentTurnStats`, `streamStartTime`, `streamOutputTokens`),
- suggestions list and normalization (`suggestions`, merge/replace reducers).

### Ownership target after HC-58
1. Runtime core owns transport/meta/stream lifecycle state.
2. Timeline UI consumes runtime selectors directly.
3. Inventory keeps only host-specific orchestration and domain-side effects (artifact windows, custom actions, app shell behavior).
4. Suggestions are removed entirely for now and not re-homed.

### State mapping
| Current Inventory State (`chatSlice`) | Target Owner | Target API Shape |
| --- | --- | --- |
| `connectionStatus` | runtime core | `useConversationConnection(conversationId)` |
| `lastError` | runtime core | `useConversationConnection(conversationId).error` |
| `modelName` | runtime core meta | `useMeta(conversationId, s => s.modelName)` |
| `currentTurnStats` | runtime core meta | `useMeta(conversationId, s => s.turnStats)` |
| `streamStartTime` | runtime core stream/meta | `useMeta(...)/useStreamChannel(...)` |
| `streamOutputTokens` | runtime core stream/meta | `useStreamChannel(conversationId, entityId, 'message.text')` derived metrics |
| `suggestions` | removed | no replacement in HC-58/HC-59 |

### Adapter and event handling mapping
Current inventory `createChatMetaProjectionAdapter()` should be split:
1. Runtime-default SEM handlers own `llm.start`, `llm.delta`, `llm.final`, `ws.error` metadata projection.
2. Inventory keeps only adapters for domain projections (artifact upserts/runtime cards) and host actions.
3. `hypercard.suggestions.*` handlers are deleted; runtime ignores these events or classifies them as unhandled debug-only envelopes.

### What remains in Inventory after extraction
- Host action wiring (`onOpenArtifact`, `onEditCard`, event viewer emission),
- transport factory specifics (`InventoryWebChatClient` construction),
- window chrome concerns (title/subtitle/header actions),
- optional app-specific derived presentation not required by runtime correctness.

### What is intentionally removed now
1. Suggestion reducers/actions/selectors in inventory state.
2. Suggestion props from runtime/UI components.
3. Suggestion event handling in inventory adapters.
4. Suggestion-focused styles/stories/docs for timeline chat path.

## Mapping from current files to target architecture

### Keep and evolve
- `sem/registry.ts`: keep handler registration idea, evolve handler outputs to structured mutations.
- `timeline/timelineSlice.ts`: keep version-aware merge base, extend with alias map and stream channels.
- `runtime/projectionPipeline.ts`: evolve into phase-aware runtime pipeline.

### Replace/split
- `runtime/useProjectedChatConnection.ts`:
  - extract transport/session lifecycle into runtime core;
  - hook should subscribe to runtime rather than own transport.
- `runtime/timelineChatRuntime.tsx`:
  - remove after replacing with provider/hooks + `TimelineConversationView`.
- `runtime/TimelineChatWindow.tsx`:
  - remove; responsibilities move into timeline-native view composition.
- `components/widgets/ChatWindow.tsx`:
  - remove from timeline chat stack; not used as intermediary UI abstraction.

### Constrain
- `widgets/hypercardWidgetPack.tsx` and inline registry:
  - remove global renderer side effects from runtime path;
  - move to per-window registry instance.

## Implementation Plan

### Phase 0: Contract docs and invariants
1. Freeze runtime invariants in docs (ordering, idempotency, version precedence, alias behavior).
2. Define typed mutation and stream channel schemas.
3. Define adapter phases.

### Phase 1: Headless runtime core
1. Add `conversation/runtimeCore.ts` with:
- state container,
- mutation reducer,
- pipeline execution,
- transport lifecycle hooks.
2. Port existing `SemRegistry` handlers directly to new runtime mutation contract (no compatibility shim).

### Phase 2: Manager + connection claims
1. Add `conversation/manager.ts` runtime cache keyed by conversation ID.
2. Implement claim/release reference counting and optional keepAlive.

### Phase 3: Structured stream support
1. Add stream channel reducer and selectors.
2. Upgrade default SEM handlers:
- `llm.delta` -> `stream.apply(message.text, text.*)`
- `tool.delta` -> `stream.apply(tool.patch, object.patch)`
- hypercard lifecycle updates -> structured stream or timeline patches as appropriate.
3. Make stream channels + timeline entities the only data contract for chat UI consumers.

### Phase 4: UI cutover
1. Add hook-level APIs (`useConversationRuntime`, selectors).
2. Implement `TimelineConversationView` directly from timeline entities/stream channels.
3. Remove `TimelineChatRuntimeWindow`, `TimelineChatWindow`, and `ChatWindow` from the timeline chat path.
4. Add per-window widget registry provider.

### Phase 5: Host migration (Inventory first)
1. Move `InventoryWebChatClient` ownership behind manager-backed runtime connection.
2. Keep adapters, but move them to phased adapter API.
3. Validate with two simultaneous inventory windows on same conversation.
4. Remove inventory runtime state ownership in `chatSlice` for connection/meta/turn stats and consume runtime selectors instead.
5. Delete `createChatMetaProjectionAdapter` responsibilities that are generic runtime concerns.
6. Remove suggestions from inventory window props and send flow.

### Phase 6: Cleanup after cutover
1. Remove `projectionMode` API entirely.
2. Delete event-drop branch and any wrapper-only plumbing.
3. Remove dead exports and stories tied to removed layers.
4. Remove all suggestion APIs/events/styles from chat runtime path until runtime refactor stabilizes.

## Validation Plan
1. Unit tests for reducer semantics:
- alias canonicalization,
- version precedence,
- structured stream apply/finalize,
- transaction atomicity.
2. Runtime tests:
- duplicate envelope replay idempotency,
- out-of-order frame handling by seq/stream_id,
- reconnect hydration reconciliation.
3. UI tests:
- two windows same conversation with different selectors and rerender counts,
- per-window widget registry isolation.

## Risks and Mitigations

1. Risk: increased complexity in stream channel schema.
- Mitigation: ship with minimal core channels and typed extension point.

2. Risk: host adapters depending on implicit timing.
- Mitigation: explicit phased adapter API and strict migration checklist.

3. Risk: performance regressions from high-frequency stream mutations.
- Mitigation: per-channel selectors, batched commits, and optional throttled channel adapters.

## Open Questions
1. Should `stream.apply` support JSON Patch natively at core level, or should kits pre-normalize to object patches?
2. Do we require backend to always emit canonical IDs, or keep client alias heuristics long term?
3. Should runtime own a persisted ring buffer for debug windows, or should debug tooling subscribe externally?
4. Which stream channels should be standardized in v1 (`message.text`, `tool.patch`, `widget.patch`) versus kit-defined only?

## Recommendation
Proceed with the imported architecture direction, enforce a hard UI cutover to a timeline-native view, and do not implement the streaming API as text-only append/finalize. The runtime should adopt structured stream channels from the first implementation increment so tool/widget/card and future multimodal flows fit naturally without another redesign.

## References
- Imported proposal: `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`
- Current runtime wrapper: `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- Current connection hook: `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
- Current projection pipeline: `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
- Current SEM registry: `packages/engine/src/hypercard-chat/sem/registry.ts`
- Current timeline reducer: `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`
- Inventory integration: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
