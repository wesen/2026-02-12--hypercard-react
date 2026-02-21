---
Title: F8 Artifact Runtime Cleanup Analysis and Wiring Plan
Ticket: HC-02-CLEANUP-WEBCHAT-REFACTOR
Status: active
Topics:
    - cleanup
    - architecture
    - frontend
    - chat
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/domain/pluginBundle.vm.js
      Note: Artifact lookup and not-found behavior at viewer boundary analyzed
    - Path: packages/engine/src/chat/sem/timelineMapper.ts
      Note: Remap and artifact-id normalization interaction considered in F8
    - Path: packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx
      Note: Runtime-card injection lifecycle wiring gaps identified
    - Path: packages/engine/src/hypercard/artifacts/artifactRuntime.ts
      Note: Core artifact extraction/open utility surface analyzed for F8
    - Path: packages/engine/src/hypercard/timeline/hypercardCard.tsx
      Note: Card SEM ingestion
    - Path: packages/engine/src/hypercard/timeline/hypercardWidget.tsx
      Note: Widget SEM ingestion and renderer open flow coupling analyzed
    - Path: packages/engine/src/plugin-runtime/runtimeCardRegistry.ts
      Note: Runtime-card registry signals and injection outcomes analyzed
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T19:07:42.939173996-05:00
WhatFor: ""
WhenToUse: ""
---


# F8 Artifact Runtime Cleanup Analysis and Wiring Plan

## Executive Summary

`F8` is no longer about restoring basic functionality (that was handled by Task #19), but about removing architectural fragility in artifact ingestion/open flows.

Current behavior works through three overlapping paths:

1. direct SEM artifact upsert during hypercard handlers,
2. timeline-upsert parsing for projected `tool_result`,
3. renderer click-time fallback that backfills artifact store before opening.

This overlap is functional but not clean. The remaining cleanup should preserve the useful pieces while moving to a single ingestion contract so open/edit behavior does not depend on renderer side-effects.

## Problem Statement

Artifact runtime behavior is spread across multiple modules with partial duplication and inconsistent lifecycle timing:

- `packages/engine/src/hypercard/artifacts/artifactRuntime.ts` parses several payload shapes.
- `packages/engine/src/hypercard/timeline/hypercardWidget.tsx` and `packages/engine/src/hypercard/timeline/hypercardCard.tsx` both upsert artifacts directly and now also backfill on click.
- `packages/engine/src/chat/sem/timelineMapper.ts` remaps projected `tool_result` entities and performs its own artifact-id normalization.
- Artifact consumers in inventory lookup by exact key (`apps/inventory/src/domain/pluginBundle.vm.js`), so any key mismatch is user-visible (`Artifact not found`).

As a result:

- correctness depends on at least one path having run before user clicks open/edit,
- parser logic is duplicated across ingestion and fallback paths,
- runtime-card injection state fields in artifact records are not fully wired,
- coverage is mostly unit-level (parsers), not integration-level (click -> window -> artifact lookup).

## Current State Deep Dive

### 1. Behavior topology

`Path A: direct hypercard SEM events`
- Source: `hypercard.widget.v1`, `hypercard.card.v2`
- Ingestion: `extractArtifactUpsertFromSem(type, data)`
- Upsert location: widget/card SEM handlers
- Runtime card registration: only on direct `hypercard.card.v2` via `maybeRegisterRuntimeCard`

`Path B: projected timeline upsert`
- Source: `timeline.upsert` (`entity.kind=tool_result`, legacy `entity.toolResult` or v2 `entity.props`)
- Ingestion: `extractArtifactUpsertFromSem('timeline.upsert', data)`
- Upsert location: currently only when this event is fed through hypercard SEM path or recovered by renderer fallback

`Path C: renderer click-time fallback`
- Source: existing timeline entity (`hypercard_widget`/`hypercard_card`)
- Ingestion: `extractArtifactUpsertFromTimelineEntity(e.kind, e.props)`
- Upsert location: inside renderer `openArtifact()`
- Purpose: resilience when prior ingestion missed the artifact store

### 2. Duplication/convergence map

- Shared utility: `normalizeArtifactId` (good; now reused in extraction + open payload)
- Duplicate extraction concerns:
  - direct card extraction of runtime card fields in `extractArtifactUpsertFromSem('hypercard.card.v2', ...)`
  - similar extraction in timeline tool-result path (`artifactFromTimelineToolResult`)
- Two independent normalization sites:
  - `artifactRuntime.normalizeArtifactId`
  - `timelineMapper` local quote-stripping normalization

### 3. Gaps that still exist after Task #19

1. Artifact store population still depends on renderer interaction in some replay/remap cases.
2. Runtime card metadata lifecycle is incomplete:
   - `ArtifactRecord.injectionStatus` and `injectionError` exist, but no runtime path updates them to `injected/failed`.
3. No global artifact-open command route:
   - `buildArtifactOpenWindowPayload` is only used from widget/card renderers, not from a shared desktop command.
4. Limited integration testing:
   - parser tests are good,
   - missing contract tests for `click Open` -> `window nav.param` -> `artifact lookup succeeds`.

## Proposed Solution

Move from "multi-path side effects" to "single projector contract + simple consumers".

### Core idea

Introduce a single artifact projector that runs on ingestion, not on click:

- Input: SEM envelope and/or timeline entity.
- Output: optional `ArtifactUpsert`.
- Side effects:
  - `upsertArtifact(...)`
  - optional runtime-card registration when `runtimeCardId + runtimeCardCode` present.

Renderers become pure consumers:

- read already-projected artifact IDs,
- call `buildArtifactOpenWindowPayload(...)`,
- no store backfill logic in click handlers.

### Suggested wiring shape (pseudocode)

```ts
// new module (example): hypercard/artifacts/artifactProjector.ts
export function projectArtifactFromSemEvent(ev): ArtifactUpsert | undefined {
  return extractArtifactUpsertFromSem(ev.type, asRecord(ev.data));
}

export function projectArtifactFromTimelineEntity(entity): ArtifactUpsert | undefined {
  return extractArtifactUpsertFromTimelineEntity(entity.kind, entity.props);
}

export function applyArtifactProjection(dispatch, upsert?: ArtifactUpsert) {
  if (!upsert) return;
  dispatch(upsertArtifact({ ...upsert, updatedAt: Date.now() }));
  if (upsert.runtimeCardId && upsert.runtimeCardCode) {
    registerRuntimeCard(upsert.runtimeCardId, upsert.runtimeCardCode);
  }
}
```

Then wire once in ingestion paths (SEM/timeline reconciliation), not in UI click handlers.

## What Is Still Useful and Should Be Wired In

This is the specific keep/wire analysis requested for F8.

| Utility / Path | Current value | Status | Recommendation |
|---|---|---|---|
| `normalizeArtifactId` | Prevents key mismatch due quote wrappers | Useful + active | Keep; also reuse in selectors and any manual artifact lookup entrypoints |
| `buildArtifactOpenWindowPayload` | Canonical window shape (`dedupeKey`, `cardSessionId`, normalized `param`) | Useful + active | Keep; expose as shared "open artifact" command utility (not renderer-only) |
| `extractArtifactUpsertFromSem` | Handles direct SEM and projected timeline event payloads | Useful + active | Keep short-term; eventually trim legacy shapes when replay window allows |
| `extractArtifactUpsertFromTimelineEntity` | Strong fallback for reconstructed/remapped timeline entities | Useful but currently UI-coupled | Keep but wire at ingestion/middleware level; remove click-time backfill |
| `ArtifactRecord.injectionStatus/injectionError` | Useful observability for runtime-card injection | Present but underwired | Wire into runtime injection results in `PluginCardSessionHost` and/or registry APIs |
| `tool_result + customKind` parsing branch | Needed for current contract compatibility | Transitional | Keep until HC-52 cutover; then remove |
| Hard-coded template routing (`itemViewer` vs default `reportViewer`) | Works for current inventory templates | Useful but narrow | Keep now; consider template->card registry for extensibility |

## Design Decisions

1. Keep parser flexibility until contract cleanup ticket HC-52 lands.
Reason: avoids breaking historical timeline snapshots and mixed streams during transition.

2. Move side effects to ingestion layer, not renderer click handlers.
Reason: renderer purity improves determinism and testability; users should not "fix state" by clicking.

3. Preserve `buildArtifactOpenWindowPayload` as canonical open-window contract.
Reason: centralizes dedupe/session/window param behavior.

4. Treat injection status as first-class state or remove it.
Reason: current partial wiring creates misleading debug signals.

## Alternatives Considered

1. Keep current approach permanently (renderer click-time backfill as safety net).
Rejected for long-term cleanup: hides ingestion defects and keeps UI coupled to data repair.

2. Remove fallback extraction immediately.
Rejected now: too risky while `customKind` and mixed timeline payload shapes remain active.

3. Full first-class timeline-kind cutover inside F8.
Deferred to HC-52: valid direction, but separate scope with backend/frontend coordination.

## Implementation Plan

### Phase F8.1: Consolidate projection API

- Add artifact projector helper that wraps extraction + upsert + runtime-card registration.
- Replace duplicated inline extraction/upsert logic in widget/card SEM handlers with projector helper.

### Phase F8.2: Move fallback from UI to ingestion

- Wire `extractArtifactUpsertFromTimelineEntity` into timeline entity ingestion/reconciliation path.
- Remove renderer click-time `upsertArtifact` backfill after ingestion wiring is verified.

### Phase F8.3: Injection lifecycle wiring

- Extend runtime card injection flow to emit success/failure outcomes.
- Update artifact slice with explicit action(s):
  - `markArtifactInjectionSuccess(artifactId)`
  - `markArtifactInjectionFailure(artifactId, error)`
- Reflect real statuses in `RuntimeCardDebugWindow`.

### Phase F8.4: Integration tests for open/edit contracts

- Add tests covering:
  - remapped timeline entity -> open payload uses normalized artifact ID,
  - open window param resolves artifact in inventory plugin viewer,
  - runtime card edit path for card artifacts where runtime code exists.

### Phase F8.5: Post-HC-52 cleanup

- Remove `tool_result/customKind`-specific branches from artifact projector.
- Keep only first-class timeline-kind extraction contract.

## Open Questions

1. What replay horizon requires legacy `entity.toolResult` support in timeline-upsert parsing?
2. Should artifact ID normalization happen at slice boundary (`artifactsSlice`) as well, or remain ingress-only?
3. Is runtime injection status worth maintaining in state, or should debug window read directly from runtime registry events?
4. Should `templateToCardId` become a registry-based mapping before broader externalization of artifact viewers?

## References

- `packages/engine/src/hypercard/artifacts/artifactRuntime.ts`
- `packages/engine/src/hypercard/timeline/hypercardWidget.tsx`
- `packages/engine/src/hypercard/timeline/hypercardCard.tsx`
- `packages/engine/src/chat/sem/timelineMapper.ts`
- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- `packages/engine/src/plugin-runtime/runtimeCardRegistry.ts`
- `apps/inventory/src/domain/pluginBundle.vm.js`
