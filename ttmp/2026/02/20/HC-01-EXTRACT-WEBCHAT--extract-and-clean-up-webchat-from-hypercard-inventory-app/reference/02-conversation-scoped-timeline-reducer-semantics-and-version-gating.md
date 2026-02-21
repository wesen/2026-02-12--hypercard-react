---
Title: Conversation-scoped timeline reducer semantics and version gating
Ticket: HC-01-EXTRACT-WEBCHAT
Status: active
Topics: []
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts
      Note: Pinocchio baseline semantics used for version-gating comparison
    - Path: packages/engine/src/chat/state/timelineSlice.ts
      Note: Conversation-scoped reducer implementation described by this reference
    - Path: ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md
      Note: Step 4 Phase 1 implementation context referenced in this doc
ExternalSources: []
Summary: Detailed explanation of timeline reducer logic introduced in Phase 1 Step 4, including conversation scoping and preservation of pinocchio version-gating behavior.
LastUpdated: 2026-02-20T11:05:28.766119117-05:00
WhatFor: Explain the exact reducer semantics implemented in Phase 1 so future changes preserve conversation isolation and version-gated idempotence.
WhenToUse: Use when modifying timeline reducers, SEM handlers, or hydration logic that dispatches timeline entities.
---


# Conversation-scoped timeline reducer semantics and version gating

## Goal

Provide a precise explanation of how `packages/engine/src/chat/state/timelineSlice.ts` works after Phase 1 (Step 4), especially:

1. How timeline state is scoped per conversation.
2. How pinocchio's version-gating semantics were preserved.
3. What invariants must remain true when we evolve chat runtime behavior.

## Context

In Step 4 of the diary ("Phase 1 Implementation"), we moved from a single global timeline to a conversation-scoped timeline while retaining pinocchio's merge/version behavior.

Source reducers:

1. Engine (conversation-scoped): `packages/engine/src/chat/state/timelineSlice.ts`
2. Pinocchio baseline (single-conversation): `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts`

High-level adaptation:

1. Pinocchio shape: `{ byId, order }`
2. Engine shape: `{ byConvId: Record<convId, { byId, order }> }`
3. Pinocchio `upsertEntity(entity)` became engine `upsertEntity({ convId, entity })` with the same internal decision logic.

## Quick Reference

### State Shape

```ts
type TimelineEntity = {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  version?: number;
  props: unknown;
};

type ConversationTimelineState = {
  byId: Record<string, TimelineEntity>;
  order: string[];
};

type TimelineState = {
  byConvId: Record<string, ConversationTimelineState>;
};
```

### Core Invariants

1. All entity mutation is conversation-local (`convId` keyspace isolation).
2. `order` contains each entity id at most once per conversation.
3. Stale versioned updates (`incomingVersion < existingVersion`) are ignored.
4. Once an entity has a positive version, unversioned updates cannot overwrite core versioned fields.
5. `props` merging is additive (`existing.props` merged with `incoming.props`), not replacement.

### Reducer Semantics Summary

| Reducer | Conversation-scoped behavior | Version semantics |
|---|---|---|
| `addEntity` | Adds only to `byConvId[convId]`; no-op if id exists | None |
| `upsertEntity` | Upserts only in `byConvId[convId]` | Preserves pinocchio version-gating matrix |
| `rekeyEntity` | Rekeys inside one conversation only | Preserves entity with merge preference for target id |
| `applySnapshot` | Replaces one conversation timeline from snapshot entities | Snapshot version remains on entities; no cross-conv effect |
| `clearConversation` | Deletes only one `convId` branch | None |

### Version-Gating Decision Matrix (`upsertEntity`)

`incomingVersion` is `entity.version` if finite positive number, otherwise `0`.
`existingVersion` is `existing.version` if finite positive number, otherwise `0`.

| Case | Condition | Outcome |
|---|---|---|
| Insert | No existing entity | Insert entity and append id to order |
| Drop stale | `incomingVersion > 0` and `incomingVersion < existingVersion` | Ignore incoming update |
| Accept versioned | `incomingVersion > 0` and `incomingVersion >= existingVersion` | Merge into existing, set `version = incomingVersion`, keep stable `createdAt`/`kind` fallback |
| Protect versioned entity | `incomingVersion == 0` and `existingVersion > 0` | Only merge `updatedAt` and `props`; do not overwrite stronger versioned fields |
| Unversioned merge | `incomingVersion == 0` and `existingVersion == 0` | General merge with stable `createdAt` and additive `props` |

### Conversation Scoping Mechanism

All reducers call `ensureConversationTimeline(state, convId)` which lazily initializes:

```ts
state.byConvId[convId] ??= { byId: {}, order: [] };
```

This is the only structural change vs pinocchio logic. After obtaining `conv`, operations are identical in spirit to the original single-conversation reducer.

### Why This Preserves Pinocchio Semantics

1. Same `incomingVersion` / `existingVersion` normalization.
2. Same stale-drop rule (`incoming < existing`).
3. Same "versioned entity is authoritative" behavior for unversioned deltas.
4. Same additive `props` merge behavior.
5. Same order/id idempotence guarantees.

The adaptation is horizontal (namespace by `convId`) rather than vertical (algorithm change).

## Usage Examples

### Example 1: Stale version is ignored

```ts
dispatch(upsertEntity({ convId: "c1", entity: { id: "m1", version: 5, ... } }));
dispatch(upsertEntity({ convId: "c1", entity: { id: "m1", version: 4, ... } }));
// result: version 4 update is dropped
```

### Example 2: Unversioned delta cannot clobber versioned state

```ts
dispatch(upsertEntity({ convId: "c1", entity: { id: "m1", version: 5, kind: "message", props: { text: "A" }, ... } }));
dispatch(upsertEntity({ convId: "c1", entity: { id: "m1", props: { streaming: true }, ... } }));
// result: version remains 5; core versioned fields remain authoritative; props merge adds streaming
```

### Example 3: Same entity id in different conversations stays isolated

```ts
dispatch(addEntity({ convId: "conv-a", entity: { id: "m1", ... } }));
dispatch(addEntity({ convId: "conv-b", entity: { id: "m1", ... } }));
// result: two independent entities under byConvId["conv-a"] and byConvId["conv-b"]
```

### Example 4: Rekey is conversation-local

```ts
dispatch(rekeyEntity({ convId: "conv-a", fromId: "tmp-1", toId: "msg-1" }));
// only conv-a mutated; conv-b untouched
```

### Validation commands

```bash
npm run -w packages/engine test -- src/chat/state/timelineSlice.test.ts
npm run -w packages/engine test -- src/chat/sem/semRegistry.test.ts
```

## Related

1. Diary Step 4 (Phase 1 implementation): `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/01-diary.md`
2. Phase plan: `ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/01-implementation-plan-extract-webchat-to-engine.md`
3. Engine reducer implementation: `packages/engine/src/chat/state/timelineSlice.ts`
4. Pinocchio baseline reducer: `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/store/timelineSlice.ts`
