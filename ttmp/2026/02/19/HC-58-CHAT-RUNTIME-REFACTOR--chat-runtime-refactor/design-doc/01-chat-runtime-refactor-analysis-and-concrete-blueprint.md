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
      Note: Current inventory-owned runtime metadata targeted for extraction into runtime
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts
      Note: Current adapter-level metadata and artifact side effects; target is side-effects only
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts
      Note: Current selector API that will be replaced by runtime selectors
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts
      Note: Current SEM projection pipeline and adapter hook point
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx
      Note: Current runtime wrapper and legacy projection-mode history
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts
      Note: Current hook-owned connection lifecycle
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Current event-to-timeline-op mapping
    - Path: 2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/timeline/timelineSlice.ts
      Note: Current version-aware upsert behavior with stable entity IDs
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md
      Note: Imported proposal analyzed and corrected
ExternalSources:
    - local:chat-runtime-chatgpt-pro.md
Summary: Simplified HC-58 runtime blueprint: one SEM projection path for all windows, no projection-mode behavior differences, stable entity IDs, and adapters restricted to host side effects.
LastUpdated: 2026-02-19T21:45:00-05:00
WhatFor: Align HC-58 implementation around a minimal and deterministic timeline runtime model.
WhenToUse: Use when implementing or reviewing chat runtime behavior and ownership boundaries.
---

# Chat Runtime Refactor Analysis and Concrete Blueprint

## Executive Summary
This refactor is now explicitly simplified.

Hard invariants:
1. Every window receives the same SEM envelopes.
2. Every window runs the same projection path.
3. No projection-mode toggles, no event filtering by window.
4. Timeline state is the single projected truth.
5. Adapters are side-effects only (never projection correctness logic).
6. Entity IDs are stable and used directly (no alias/rekey/canonical mapping).

This mirrors the practical shape in `pinocchio/cmd/web-chat`: SEM events (`llm.*`, `tool.*`, domain events) project into timeline entities; hydration replays timeline state; windows only differ in presentation.

## Problem Statement
`TimelineChatRuntimeWindow` currently mixes connection lifecycle, projection pipeline wiring, adapters, and UI composition.

Main issues:
1. Ownership confusion: runtime concerns and UI concerns are configured together.
2. Lifecycle coupling: connection is hook/mount-owned instead of conversation-runtime-owned.
3. Historical projection policy toggles: correctness should never depend on per-window flags.

Desired end state:
1. One deterministic projection pipeline for all windows.
2. One runtime instance per conversation.
3. UI surfaces read the same runtime state with different selectors/rendering.

## Current-System Grounding
Current runtime path in engine:
1. Envelope enters `projectSemEnvelope(...)`.
2. `semRegistry.handle(...)` returns timeline ops.
3. `applySemTimelineOps(...)` updates timeline reducer.
4. `adapters.onEnvelope(...)` runs app-specific follow-up logic.

References:
- `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
- `packages/engine/src/hypercard-chat/sem/registry.ts`
- `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`

Current inventory host usage:
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`

## Simplified Runtime Model (HC-58)

### Input contract
Runtime ingests SEM envelopes, primarily:
- `llm.start`
- `llm.delta`
- `llm.final`
- `llm.thinking.*`
- `tool.start|delta|result|done`
- `hypercard.widget.*` and `hypercard.card.*`
- `timeline.upsert` (hydration / projector upsert path)
- `ws.error`, `log`

### Projection contract
Projection remains SEM-first and timeline-upsert based.

Runtime projection operation:
1. Parse envelope.
2. Route by `event.type` in SEM registry.
3. Produce timeline ops (`addEntity`, `upsertEntity`, `clearConversation`).
4. Apply ops in reducer.
5. Run optional adapters for host side-effects.

No separate stream-channel abstraction is required in HC-58 v1.

Here, \"projection ops\" are intentionally simple reducer-facing operations, not a second event protocol.

### Runtime state contract
```ts
type ConversationRuntimeState = {
  connection: {
    status: 'idle' | 'connecting' | 'connected' | 'closed' | 'error';
    error?: string;
  };
  cursor: {
    lastSeq?: string;
    lastStreamId?: string;
    hydratedVersion?: string;
  };
  timeline: {
    ids: string[];
    byId: Record<string, TimelineEntity>;
  };
  meta: Record<string, unknown>;
};
```

## Projection and Adapter Rules

### Projection rules
1. Projection logic is engine-owned and deterministic.
2. All windows use the same `projectSemEnvelope(...)` behavior.
3. Ordering/replay behavior is based on `event.seq` and stable entity IDs.
4. No projection-mode flags and no per-window filtering.

### Adapter rules
1. Adapters run after core projection.
2. Adapters are allowed for host side-effects only.
3. Adapters must not define timeline correctness behavior.
4. Inventory metadata ownership currently in adapters moves into runtime meta over HC-58.

## Multi-Window Behavior
If two windows are open on the same conversation:
1. They share the same conversation runtime and connection.
2. They receive the same projected timeline state.
3. They can render differently, but not project differently.

Allowed differences between windows:
- selector granularity,
- visible panels/widgets,
- formatting and layout.

Not allowed:
- different event filtering,
- different projection semantics,
- mode-based projection behavior.

## UI Hard Cutover
The chain `TimelineChatRuntimeWindow -> TimelineChatWindow -> ChatWindow` is removed from the primary timeline path.

Target:
1. Headless conversation runtime + manager.
2. Timeline-native view (`TimelineConversationView`).
3. No message-model bridge as primary runtime abstraction.

## Inventory Ownership Cutover (`chatSlice`)
Inventory currently holds runtime-ish state that should move to runtime core:
- `connectionStatus`
- `lastError`
- `modelName`
- turn/usage stats

After HC-58:
1. Runtime owns connection and meta lifecycle.
2. Inventory keeps domain-side effects and shell wiring.
3. Inventory adapters keep artifact upserts/runtime card registration only.
4. Suggestions remain removed.

### State mapping
| Current Inventory State (`chatSlice`) | Target Owner | Target API Shape |
| --- | --- | --- |
| `connectionStatus` | runtime core | `useConversationConnection(conversationId)` |
| `lastError` | runtime core | `useConversationConnection(conversationId).error` |
| `modelName` | runtime core meta | `useMeta(conversationId, s => s.modelName)` |
| `currentTurnStats` | runtime core meta | `useMeta(conversationId, s => s.turnStats)` |
| `streamStartTime` | runtime core meta | `useMeta(conversationId, s => s.streamStartTime)` |
| `streamOutputTokens` | runtime core meta | `useMeta(conversationId, s => s.streamOutputTokens)` |
| `suggestions` | removed | no replacement |

## Mapping from Current Files to Target Architecture

### Keep and evolve
- `sem/registry.ts`: keep event-handler registration model.
- `timeline/timelineSlice.ts`: keep version-aware merge with stable entity IDs.
- `runtime/projectionPipeline.ts`: keep as one projection entrypoint.

### Replace/split
- `runtime/useProjectedChatConnection.ts`: remove hook-owned socket lifecycle; subscribe to manager-owned runtime.
- `runtime/timelineChatRuntime.tsx`: remove from primary path.
- `runtime/TimelineChatWindow.tsx`: remove from primary path.
- `components/widgets/ChatWindow.tsx`: remove from primary timeline runtime path.

### Constrain
- `projectionAdapters.ts` in host apps: side-effects only, no projection correctness.

## Implementation Plan

### Phase 0: Freeze invariants
1. Document one-projection-path rule.
2. Document stable-entity-id rule.
3. Document adapter side-effect-only rule.

### Phase 1: Runtime core + manager
1. Add conversation runtime core module.
2. Add manager cache by conversation ID.
3. Move connection ownership to manager claims.

### Phase 2: One projection path enforcement
1. Route all envelopes through shared `projectSemEnvelope(...)`.
2. Remove remaining per-window projection branching.
3. Align SEM registry behavior for deterministic ops.

### Phase 3: Inventory migration
1. Move generic runtime metadata handling to runtime.
2. Narrow inventory adapters to artifact/domain side-effects.
3. Remove runtime-ish state from inventory `chatSlice`.

### Phase 4: UI cutover
1. Add `TimelineConversationView` runtime consumer.
2. Remove wrapper chain from timeline runtime path.
3. Keep window differences to rendering/selectors only.

### Phase 5: cleanup and validation
1. Remove dead exports/docs/stories from removed wrappers.
2. Validate multi-window parity and replay/hydration behavior.

## Execution Map (Task -> Symbols)
| Task ID | Concrete Target | Symbols / Files |
| --- | --- | --- |
| `HC58-IMPL-01` | Runtime core scaffold | `packages/engine/src/hypercard-chat/conversation/runtimeCore.ts` (new): `ConversationRuntimeState`, `ConversationProjectionOp`, `createConversationRuntime`, `applyProjectionOps` |
| `HC58-IMPL-02` | One projection path | `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`, `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`: single shared `projectSemEnvelope(...)` entrypoint for all windows |
| `HC58-IMPL-03` | Stable entity ID invariants | `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`: remove alias/rekey paths and enforce direct stable `entity.id` merge |
| `HC58-IMPL-04` | Deterministic apply ordering | `runtimeCore.ts` (new) + `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`: one-pass deterministic envelope apply |
| `HC58-IMPL-05` | Conversation manager ownership | `packages/engine/src/hypercard-chat/conversation/manager.ts` (new): `ConversationManager`, `getRuntime`, `claimConnection`, `release` |
| `HC58-IMPL-06` | Hook lifecycle simplification | `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`: remove hook-owned socket lifecycle |
| `HC58-IMPL-07` | Runtime SEM metadata handling | `packages/engine/src/hypercard-chat/sem/registry.ts`: runtime-owned handling for `llm.start`, `llm.delta`, `llm.final`, `ws.error` metadata |
| `HC58-IMPL-08` | Inventory adapter narrowing | `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`: keep artifact/domain side-effects only |
| `HC58-IMPL-09` | Runtime selector API | `packages/engine/src/hypercard-chat/conversation/selectors.ts` (new): `useConversationConnection`, `useTimelineIds`, `useTimelineEntity`, `useMeta` |
| `HC58-IMPL-10` | Inventory runtime-state extraction | `apps/inventory/src/features/chat/InventoryChatWindow.tsx`, `apps/inventory/src/features/chat/chatSlice.ts`: remove app-owned connection/model/stats runtime state |
| `HC58-IMPL-11` | Timeline-native view | `packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx` (new): direct runtime-selector rendering |
| `HC58-IMPL-12` | Wrapper chain removal | remove timeline-path dependency on `runtime/timelineChatRuntime.tsx`, `runtime/TimelineChatWindow.tsx`, `components/widgets/ChatWindow.tsx` |
| `HC58-IMPL-13` | Public API cleanup | `packages/engine/src/hypercard-chat/index.ts`, `packages/engine/src/index.ts`: remove stale wrapper exports |
| `HC58-IMPL-14` | Unit tests | add/update tests for stable ID merges, version precedence, one-path projection invariants, deterministic ordering |
| `HC58-IMPL-15` | Integration tests | replay idempotency, out-of-order handling (`event.seq`, `event.stream_id`), hydration reconciliation, window parity |
| `HC58-IMPL-16` | Multi-window behavior | assert one shared connection claim across two windows with same `conversationId` |
| `HC58-IMPL-17` | Story/docs migration | update stories/docs to manager + timeline-native symbols; remove legacy wrapper guidance |
| `HC58-IMPL-18` | Final validation | `npm run typecheck` + focused runtime/inventory suite + inventory chat smoke checks |

## Validation Plan
1. Unit tests:
- stable entity ID invariants,
- version precedence,
- deterministic envelope apply behavior.

2. Runtime tests:
- duplicate replay idempotency,
- out-of-order frame handling via `event.seq`/`event.stream_id`,
- reconnect hydration reconciliation.

3. UI tests:
- two windows same conversation show equivalent projected timeline state,
- manager-owned single-connection behavior.

## Risks and Mitigations
1. Risk: hidden window-specific projection assumptions remain.
- Mitigation: remove all projection-mode and per-window filtering code; add parity tests.

2. Risk: adapter side-effects still carry correctness logic.
- Mitigation: move generic metadata projection to runtime and keep adapters domain-only.

3. Risk: migration churn across inventory state.
- Mitigation: phase migration and lock with selector-level tests.

## Open Questions
1. Should unsupported SEM event types be logged in runtime debug state or only ignored?
2. Should runtime expose raw-envelope ring buffer for debug views or keep that outside runtime core?
3. Do we keep `rekeyEntity` reducer support only for backward test fixtures, or remove it during HC-58 code phase?

## Recommendation
Proceed with the simplified model: one SEM projection path for all windows, timeline entity upsert as core mechanism, stable entity IDs, and adapters limited to host side-effects. Avoid introducing additional stream-channel abstractions in HC-58.

## References
- Imported proposal: `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`
- Current runtime wrapper: `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- Current connection hook: `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
- Current projection pipeline: `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
- Current SEM registry: `packages/engine/src/hypercard-chat/sem/registry.ts`
- Current timeline reducer: `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`
- Inventory integration: `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
