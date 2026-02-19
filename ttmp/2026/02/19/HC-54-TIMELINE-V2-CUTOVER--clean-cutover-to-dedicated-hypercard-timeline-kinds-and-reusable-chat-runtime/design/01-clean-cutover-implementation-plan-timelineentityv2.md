---
Title: HC-54 Clean Cutover Implementation Plan (TimelineEntityV2, Dedicated Hypercard Kinds)
Ticket: HC-54-TIMELINE-V2-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
    - protobuf
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md
      Note: Prior authoritative playbook; HC-54 executes this as production hard-cut sequence
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md
      Note: Module registration and event/projection/renderer reference model
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md
      Note: Websocket + hydration + timeline rendering runtime model
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Backend Hypercard event bridge currently using legacy tool_result/customKind route
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_extractors.go
      Note: Existing structured extractors to augment with protobuf payload extraction
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Frontend projection map currently containing hypercard customKind paths
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts
      Note: Timeline display mapping currently branching on tool_result customKind
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts
      Note: Artifact extraction currently tied to legacy hypercard customKind values
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: App-owned orchestration to slim down to host callbacks only
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts
      Note: Inventory-local projection/render glue to remove after reusable runtime extraction
ExternalSources: []
Summary: Detailed production implementation plan for a strict no-compatibility cutover to dedicated Hypercard TimelineEntityV2 kinds, protobuf extraction, reusable runtime dispatch, and legacy path deletion, with per-step reference guidance.
LastUpdated: 2026-02-19T18:45:00-05:00
WhatFor: Provide the exact execution blueprint, file end-state, and acceptance gates for HC-54 implementation.
WhenToUse: Use while implementing HC-54 step-by-step; treat this as the source of truth for sequencing and legacy removal requirements.
---

# HC-54 Clean Cutover Implementation Plan (TimelineEntityV2, Dedicated Hypercard Kinds)

## 1) Scope and Intent

HC-54 is a production hard cutover ticket. This is not a compatibility migration. The end state must contain only the new architecture:

1. Dedicated Hypercard timeline kinds (`hypercard_widget`, `hypercard_card`) on `TimelineEntityV2`.
2. Protobuf extraction for Hypercard event payloads in backend translator/projector flow.
3. Registry-driven frontend kind normalization and renderer dispatch.
4. Reusable chat/runtime extraction out of Inventory app glue.
5. Full removal of legacy widget/card routing via `tool_result.customKind`.

If any legacy route remains in active code at the end, HC-54 is not complete.

## 2) Non-Negotiable Constraints

### 2.1 No backward compatibility path

The following are explicitly disallowed in final code:

1. Widget/card final state persisted through `tool_result` + `customKind`.
2. Frontend mapping that branches widget/card rendering through `tool_result.customKind`.
3. Dual old/new code paths with feature flags or aliases.

### 2.2 Timeline durability contract

Durable widget/card state must be represented by timeline entities and delivered via canonical `timeline.upsert` ingestion path.

### 2.3 Registration model

Backend and frontend extension behavior must be wired through explicit registration/bootstrap calls, not hidden side effects.

## 3) Canonical Data Contract

### 3.1 Timeline kinds

1. `hypercard_widget`
2. `hypercard_card`

### 3.2 Entity IDs

1. Widget: `<itemId>:widget`
2. Card: `<itemId>:card`

### 3.3 Required props

1. `schemaVersion`
2. `itemId`
3. `title`
4. `phase` (`start|update|ready|error`)
5. `error` (optional)
6. `data` (structured payload)

### 3.4 Transport stance

Pinocchio transport remains `TimelineEntityV2` open model. No per-kind transport proto oneof edits are required.

## 4) End-to-End Target Flow

```text
Hypercard middleware/extractor output
  -> typed protobuf extraction helpers (backend)
  -> SEM translator registration handlers
  -> timeline projection registration handlers
  -> TimelineEntityV2 upsert (kind=hypercard_widget|hypercard_card)
  -> timeline store + timeline.upsert websocket
  -> frontend timeline.upsert mapping
  -> kind props normalizer registry
  -> kind renderer registry
  -> reusable ChatWindow runtime + Hypercard renderer pack
  -> Inventory host actions only
```

## 5) Implementation Sequence (1-9)

## Step 1: Freeze contract first

Deliverables:

1. Document canonical kind/ID/props contract in HC-54 docs and code comments at integration points.
2. Add explicit “legacy forbidden” notes where prior customKind conventions were referenced.

Legacy deletion in this step:

1. Remove or annotate stale HC docs that still instruct `tool_result/customKind` for widget/card end state.

Gate:

1. No ambiguity remains in active docs about final kinds and IDs.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md` (contract and invariants baseline)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md` (module ownership + contract-first setup)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md` (historical context + alignment note)

## Step 2: Protobuf extraction layer in backend

Deliverables:

1. Add app-owned Hypercard protobuf payload schemas.
2. Generate Go bindings under app-owned package path.
3. Add helper functions to decode SEM payloads via `protojson.UnmarshalOptions{DiscardUnknown:true}`.
4. Convert decoded payloads to timeline props in centralized helper functions.

Legacy deletion in this step:

1. Remove ad-hoc map decode helpers used for widget/card lifecycle extraction once protobuf decode path is active.

Gate:

1. Unit tests confirm valid payload decode and deterministic errors for invalid payloads.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md` (Step 2 protobuf extraction pattern)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md` (typed event contracts and explicit bootstrap flow)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_extractors.go` (current extraction surface to migrate)

## Step 3: Add generic frontend registry seams

Deliverables:

1. Add shared runtime registry for kind props normalizers.
2. Add shared runtime registry for kind renderers.
3. Add explicit bootstrap API for app/module registration.

Legacy deletion in this step:

1. Remove manual dispatch helpers that are redundant once registry seam exists.

Gate:

1. Registry can register/unregister kinds and fallback behavior remains stable.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/sem/timelinePropsRegistry.ts` (kind normalizer registry model)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/webchat/rendererRegistry.ts` (kind renderer registry model)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/cmd/web-chat/web/src/features/thinkingMode/registerThinkingMode.tsx` (explicit module registration pattern)

## Step 4: Backend projection cutover to dedicated kinds

Deliverables:

1. Update `go-inventory-chat/internal/pinoweb/hypercard_events.go` projector handlers to emit dedicated kinds.
2. Keep sequence/version and stable IDs.
3. Optional status rows may remain for UX progress text, but final durable payload is dedicated kinds.

Legacy deletion in this step:

1. Delete widget/card final projection through `tool_result + customKind`.
2. Delete backend constants/tests specific to legacy customKind projection output.

Gate:

1. Timeline snapshots show `hypercard_widget` / `hypercard_card` entities with required props.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go` (current legacy projection path to replace)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/webchat/timeline_registry.go` (backend timeline handler registration seam)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/webchat/timeline_projector.go` (canonical upsert flow and custom handler execution model)

## Step 5: Frontend projection cutover to dedicated kinds

Deliverables:

1. Update `packages/engine/src/hypercard-chat/sem/registry.ts` and mapping helpers to consume dedicated kinds from `timeline.upsert`.
2. Update artifact/timeline formatting helpers to use dedicated kinds.

Legacy deletion in this step:

1. Remove `tool_result.customKind` widget/card mapping branches.
2. Remove tests asserting legacy customKind widget/card rendering behavior.

Gate:

1. Hydrated and live streams both produce widget/card entities through dedicated kind paths only.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts` (current mapping path with legacy branches)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts` (timeline display mapper with customKind logic to remove)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md` (canonical timeline.upsert + hydration/replay flow)

## Step 6: Extract Hypercard renderer pack (git mv-first)

Deliverables:

1. `git mv` renderer files to new pack-oriented names:
   - `TimelineWidget.tsx` -> `HypercardTimelinePanel.tsx`
   - `ArtifactPanelWidgets.tsx` -> `HypercardArtifactPanels.tsx`
2. Add registration entrypoint for Hypercard renderer pack.

Legacy deletion in this step:

1. Remove duplicated inventory-local renderer implementations replaced by the pack.

Gate:

1. Renderer history preserved and styles/functionality retained post-move.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx` (source file for git mv)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx` (source file for git mv)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md` (Step 6 extraction guidance)

## Step 7: Generalize ChatWindow runtime and orchestration

Deliverables:

1. Move reusable chat orchestration out of Inventory-specific component structure.
2. Keep generic runtime dispatch and host callback seams.

Legacy deletion in this step:

1. Remove inventory-specific orchestration glue that becomes shared-runtime responsibility.

Gate:

1. At least one non-inventory integration path can consume the generalized runtime APIs.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx` (presentational shell to keep generic)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md` (runtime extraction architecture)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md` (chat shell + ws/timeline orchestration boundaries)

## Step 8: Rewire Inventory to reusable runtime + Hypercard pack only

Deliverables:

1. Inventory chat integration calls runtime/module bootstrap and passes host actions.
2. Inventory keeps business-specific behavior (open/edit/side effects), not projection/render plumbing.

Legacy deletion in this step:

1. Remove remaining inventory-local projection/renderer glue duplicates.

Gate:

1. Inventory behavior parity achieved while significantly reducing app-local orchestration code.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx` (current heavy integration surface)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts` (app-specific side-effect boundary)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md` (Step 8 rewire guidance)

## Step 9: Final hard-cut cleanup and validation gate

Deliverables:

1. Full test + typecheck + e2e validation run.
2. Hydration/replay parity verification for widget/card entities.
3. Dead code elimination sweep.

Legacy deletion in this step:

1. Remove any residual compatibility aliases, flags, dead constants, or helper paths tied to old routing.

Hard fail criteria:

1. Any active code path still rendering widget/card through `tool_result/customKind`.

References for this step:

1. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md` (step completion and hard-cut acceptance requirements)
2. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md` (testing checklist pattern for hydration/replay correctness)
3. `/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md` (validation matrix and hard-cut expectations)

## 6) End-State File Plan

### 6.1 Backend (go-inventory-chat)

New/updated:

1. `go-inventory-chat/internal/pinoweb/hypercard_events.go` (updated)
2. `go-inventory-chat/internal/pinoweb/hypercard_extractors.go` (updated)
3. `go-inventory-chat/internal/pinoweb/hypercard_extractors_test.go` (updated)
4. `go-inventory-chat/internal/pinoweb/hypercard_events_test.go` (new)
5. `go-inventory-chat/internal/pinoweb/proto/buf.yaml` (new)
6. `go-inventory-chat/internal/pinoweb/proto/buf.gen.yaml` (new)
7. `go-inventory-chat/internal/pinoweb/proto/sem/hypercard/widget.proto` (new)
8. `go-inventory-chat/internal/pinoweb/proto/sem/hypercard/card.proto` (new)
9. `go-inventory-chat/internal/pinoweb/pb/sem/hypercard/widget.pb.go` (new/generated)
10. `go-inventory-chat/internal/pinoweb/pb/sem/hypercard/card.pb.go` (new/generated)

### 6.2 Shared engine runtime

New/updated:

1. `packages/engine/src/hypercard-chat/sem/registry.ts` (updated)
2. `packages/engine/src/hypercard-chat/sem/timelineMapper.ts` (updated)
3. `packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts` (updated)
4. `packages/engine/src/hypercard-chat/artifacts/artifactRuntime.ts` (updated)
5. `packages/engine/src/hypercard-chat/runtime/timelinePropsRegistry.ts` (new)
6. `packages/engine/src/hypercard-chat/runtime/timelineRendererRegistry.ts` (new)
7. `packages/engine/src/hypercard-chat/runtime/registerHypercardChatModule.ts` (new)
8. `packages/engine/src/hypercard-chat/widgets/HypercardTimelinePanel.tsx` (moved/updated)
9. `packages/engine/src/hypercard-chat/widgets/HypercardArtifactPanels.tsx` (moved/updated)
10. `packages/engine/src/hypercard-chat/widgets/registerHypercardWidgets.ts` (new)
11. `packages/engine/src/hypercard-chat/index.ts` (updated exports)
12. relevant tests under `packages/engine/src/hypercard-chat/...` (updated/new)

### 6.3 Inventory app

New/updated:

1. `apps/inventory/src/features/chat/InventoryChatWindow.tsx` (updated)
2. `apps/inventory/src/features/chat/runtime/registerInventoryChatRuntime.ts` (new)
3. `apps/inventory/src/features/chat/runtime/projectionAdapters.ts` (updated)
4. `apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts` (updated)

Removed:

1. `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts` (remove)
2. `apps/inventory/src/features/chat/runtime/timelineEntityRenderer.test.ts` (remove)

### 6.4 Legacy removals

1. `packages/engine/src/hypercard-chat/widgets/TimelineWidget.tsx` (removed after move)
2. `packages/engine/src/hypercard-chat/widgets/ArtifactPanelWidgets.tsx` (removed after move)
3. all widget/card `tool_result.customKind` branches across backend and frontend

## 7) PR / Commit Slicing Plan

Recommended merge sequence (one step per PR/commit cluster):

1. PR-A: Step 1 + step 2 foundations (contract + protobuf extraction)
2. PR-B: Step 3 registry seams
3. PR-C: Step 4 backend projection cutover (+ legacy backend removal)
4. PR-D: Step 5 frontend projection cutover (+ legacy frontend mapping removal)
5. PR-E: Step 6 renderer pack extraction (`git mv` first)
6. PR-F: Step 7 ChatWindow runtime generalization
7. PR-G: Step 8 Inventory rewire
8. PR-H: Step 9 final cleanup + validation + dead code purge

Each PR must include deletion of superseded legacy paths in that same PR.

## 8) Test and Validation Gates

### 8.1 Backend

1. unit tests for protobuf extraction helpers (valid, invalid, missing fields)
2. timeline projection tests assert dedicated kinds + deterministic IDs
3. regression test confirms no widget/card final payload through `tool_result`

### 8.2 Frontend

1. mapping tests for `timeline.upsert` dedicated kinds
2. renderer registry tests (registration, override, fallback)
3. regression tests proving no customKind-based rendering route remains

### 8.3 End-to-end

1. Inventory widget lifecycle scenario renders rich widget panels
2. Inventory card lifecycle scenario renders rich card panels
3. page refresh hydration parity (same widget/card render state after reload)
4. two-tab stream/hydrate race check

### 8.4 Hard-stop grep checks

Before closing HC-54, these must return no active-path hits for widget/card routing logic:

1. `tool_result.customKind` in widget/card render mapping
2. `hypercard.widget.v1` / `hypercard.card.v2` as final durable projection kinds

## 9) Risks and Mitigations

### Risk 1: Breaking runtime-card artifact actions during move

Mitigation:

1. keep action interfaces stable while moving renderer files
2. maintain story/test coverage around open/edit actions

### Risk 2: Hydration/live divergence after projection change

Mitigation:

1. assert hydration and live replay through same mapping utilities
2. add explicit parity tests and version-aware ordering checks

### Risk 3: Hidden legacy path survives in niche code

Mitigation:

1. per-step deletion requirements
2. final grep gate in Step 9
3. mandatory reviewer checklist item: “show removed legacy path diff”

## 10) Reviewer Checklist

For every HC-54 step PR, reviewer must verify:

1. new path works,
2. old path is removed,
3. tests prove replacement behavior,
4. no undocumented compatibility behavior introduced.

For final signoff:

1. dedicated kinds only,
2. registry/bootstraps explicit,
3. Inventory is thin integration,
4. no active customKind widget/card routing remains.

## 11) Execution Order Decision (Final)

Decision from planning discussion:

1. Do not generalize ChatWindow first.
2. First complete kind/protobuf/registry/backend/frontend cutover and remove legacy routes.
3. Then perform ChatWindow/general runtime extraction and Inventory rewire.

Reason:

1. behavior correctness and contract convergence must happen before broad structural extraction,
2. avoids spreading legacy compatibility behavior into generalized runtime code.

## 12) References

1. `ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md`
2. `ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md`
3. `pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
4. `pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`
