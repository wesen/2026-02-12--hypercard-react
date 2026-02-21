---
Title: CustomKind Decommission Plan and Kind Cutover Analysis
Ticket: HC-52-CUSTOMKIND-KIND-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - cleanup
    - frontend
    - backend
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: |-
        Backend timeline projector currently injecting customKind
        Cut over timeline upsert kinds to first-class hypercard kind names
    - Path: packages/engine/src/chat/sem/semRegistry.ts
      Note: Current timeline and tool_result projection routing behavior
    - Path: packages/engine/src/chat/sem/timelineMapper.test.ts
      Note: First-class kind cutover and legacy-remap removal coverage
    - Path: packages/engine/src/chat/sem/timelineMapper.ts
      Note: |-
        Current customKind-to-hypercard remap logic targeted for removal
        Removed legacy customKind remap dependency and added first-class kind mapping
    - Path: packages/engine/src/hypercard/artifacts/artifactRuntime.test.ts
      Note: First-class timeline extraction tests and legacy-path behavior checks
    - Path: packages/engine/src/hypercard/artifacts/artifactRuntime.ts
      Note: |-
        Artifact extraction/open path that must move away from customKind dependency
        First-class timeline kind artifact extraction and hard-cutover removal of legacy tool_result path
    - Path: packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts
      Note: Register renderers for first-class kind names
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T18:58:31.372682105-05:00
WhatFor: ""
WhenToUse: ""
---



# CustomKind Decommission Plan and Kind Cutover Analysis

## Executive Summary

This ticket plans a structural cleanup: stop encoding hypercard artifact type in `tool_result.props.customKind`, and move to first-class timeline entity kinds (`hypercard.widget.v1`, `hypercard.card.v2`) emitted by the backend projector.

The current approach works but introduces an extra translation hop (`tool_result` -> frontend `timelineMapper` remap -> renderer kind), creates coupling between generic tool semantics and hypercard artifact semantics, and has already contributed to artifact-open regressions on replay paths. The target state removes that remap dependency and makes timeline kinds authoritative.

### Implementation Status (2026-02-21)

The cutover has now been implemented as a hard cutover:

- backend timeline projector emits `kind=hypercard.widget.v1` / `kind=hypercard.card.v2` (no `tool_result` remap for hypercard),
- frontend timeline mapper remaps first-class kinds to hypercard render entities,
- legacy `tool_result + customKind` remap dependency was removed from timeline mapper,
- artifact extraction now supports first-class hypercard timeline kinds directly.

## Problem Statement

Current flow for timeline projection is split into two semantic layers:

1. Backend emits `timeline.upsert` with `kind=tool_result`.
2. Backend sets `props.customKind` (`hypercard.widget.v1` / `hypercard.card.v2`).
3. Frontend remaps tool-result entities into renderer entities (`hypercard_widget` / `hypercard_card`) via `timelineMapper`.

This has three concrete issues:

1. Semantic indirection: the actual entity type is hidden in `props.customKind`, not in `kind`.
2. Fragile ingestion side effects: artifact-store upsert logic may run on direct hypercard events but be skipped on remapped replay/timeline paths.
3. Harder compatibility surface: any change to `customKind`, `tool_result` normalization, or remap IDs can silently break renderer routing and artifact actions.

The cleanup objective is to make timeline projection self-describing: `kind` should already say what the entity is, without frontend remap heuristics.

## Proposed Solution

Adopt first-class timeline kinds for hypercard artifacts end-to-end.

### Target contract

- Backend timeline projector emits:
  - `kind: "hypercard.widget.v1"` for widget-ready/updating/error timeline entities.
  - `kind: "hypercard.card.v2"` for card timeline entities.
- `props` continue to carry the same operational fields (`itemId`, `artifactId`, status/title/detail/template/raw payload where needed).
- Frontend renderer registry resolves these kinds directly.
- Artifact runtime extracts/upserts artifacts from these first-class kinds directly.

### Why this does not require protobuf schema additions

`TimelineEntityV2` already models `kind` as a string and `props` as a generic struct/map. Moving classification from `customKind` into `kind` is a producer/consumer contract change, not a wire-schema expansion.

### Compatibility strategy

Decision applied: hard cutover (no compatibility window remap for legacy `tool_result + customKind`).

- Old timeline rows remain as generic `tool_result` entries.
- Hypercard-specific rendering/artifact projection now requires first-class timeline kinds.
- This was chosen to avoid prolonged dual-path complexity and complete customKind decommissioning in one tranche.

## Design Decisions

1. Keep stable entity ID semantics (`widget:${itemId}`, `card:${itemId}` or equivalent canonical ID) independent of kind naming.
Rationale: preserves upsert reconciliation and avoids duplicate timeline rows during transition.

2. Keep payload fields stable while changing dispatch key.
Rationale: isolates migration to routing/registration; avoids simultaneous data-shape churn.

3. Prefer dotted semantic kinds (`hypercard.widget.v1`) as canonical transport values.
Rationale: aligns with event taxonomy already used by SEM and avoids adapter naming drift (`hypercard_widget` vs `hypercard.widget.v1`).

4. Explicitly version the kind namespace by suffix (`v1`, `v2`).
Rationale: allows future upgrades without hidden per-field compatibility conditionals.

## Alternatives Considered

1. Keep current architecture (`tool_result` + `customKind` remap forever).
Rejected: keeps semantic indirection and recurrent edge cases around artifact ingestion/replay.

2. Keep `tool_result` kind but enforce stricter typed `props`.
Rejected: still leaves primary routing key generic; renderer dispatch and debugging remain indirect.

3. Introduce `Any`-typed protobuf payload for each hypercard entity now.
Deferred: stronger typing is useful but not required for this cleanup and increases migration scope/risk.

## Implementation Plan

### Phase 0: Baseline + contract freeze

- Capture current event/timeline snapshots for:
  - direct streaming widget/card generation,
  - timeline replay/hydration,
  - artifact open/edit.
- Freeze expected ID and props contract.

### Phase 1: Frontend readiness (no backend change yet)

- Add renderer registration for first-class kinds.
- Extend artifact extraction to parse first-class hypercard timeline upserts.
- Keep existing legacy `tool_result + customKind` support.

### Phase 2: Backend producer cutover

- In timeline projector, emit first-class hypercard kinds directly in `TimelineEntityV2.kind`.
- Preserve entity IDs and payload field names.
- Keep compatibility hooks only if historical replay requires legacy transforms.

### Phase 3: Verification

- Automated:
  - unit tests for mapper/remap compatibility and first-class path,
  - integration tests for artifact open/edit from both live stream and replay.
- Manual:
  - new chat widget -> open/edit works,
  - reload/hydrate -> open/edit still works,
  - no duplicate widget/card rows.

### Phase 4: Legacy path removal

- Remove remap logic in `timelineMapper` that translates `tool_result.customKind`.
- Delete deprecated tests and docs.
- Update playbooks to only describe first-class kind routing.

### Phase 5: Post-cutover hardening

- Add assertions/telemetry for unknown hypercard kinds.
- Add lint/test guard that blocks new code from relying on `customKind` dispatch for hypercard artifacts.

## Open Questions

1. Should timeline kind naming be fully dotted (`hypercard.widget.v1`) in UI state too, or mapped once to UI aliases?
2. What replay retention window requires legacy `tool_result + customKind` support?
3. Should we scope this cleanup to widgets/cards only, or generalize for suggestions/entities in same ticket?

## References

- `packages/engine/src/chat/sem/timelineMapper.ts` (current customKind remap point)
- `packages/engine/src/chat/sem/semRegistry.ts` (timeline upsert and tool.result projection handlers)
- `packages/engine/src/hypercard/artifacts/artifactRuntime.ts` (artifact extraction/open payload logic)
- `go-inventory-chat/internal/pinoweb/hypercard_events.go` (backend timeline projector emission path)
