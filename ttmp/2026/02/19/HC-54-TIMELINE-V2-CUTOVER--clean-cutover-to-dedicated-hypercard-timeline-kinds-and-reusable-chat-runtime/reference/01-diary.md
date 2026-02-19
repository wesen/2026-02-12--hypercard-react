---
Title: Diary
Ticket: HC-54-TIMELINE-V2-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
    - protobuf
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md
      Note: Step-by-step execution checklist for the hard cutover
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md
      Note: Authoritative implementation plan used during execution
ExternalSources: []
Summary: Execution diary for HC-54 task-by-task implementation and commit trail.
LastUpdated: 2026-02-19T19:32:00-05:00
WhatFor: Capture exact implementation steps, decisions, failures, and validations as HC-54 progresses.
WhenToUse: Use when reviewing ongoing progress or resuming work from the last completed step.
---

# Diary

## Goal

Execute HC-54 as a strict hard cutover with no legacy compatibility path, committing each completed task step and recording validation evidence.

## Step 1: Freeze contract and ban legacy references in active HC-54 docs

This step formalized the cutover contract in HC-54 ticket artifacts and established the no-compatibility baseline before code changes. The objective was to ensure implementation could proceed without ambiguity about kind naming, IDs, sequencing, or whether legacy tool-result routing should be retained.

### Prompt Context

**User prompt (verbatim):** `Go ahead and work on it, task by task, commit at appropriate intervals, update your diary as you go.`

**Assistant interpretation:** Begin implementing HC-54 in strict step order, committing as steps complete, while maintaining ticket diary updates throughout.

**Inferred user intent:** Drive the cutover to completion with auditable incremental progress and no hidden compatibility behavior.

### What I did

1. Verified repository was clean and worktree stable before starting implementation.
2. Confirmed HC-54 ticket artifacts were present and aligned to TimelineEntityV2 cutover language.
3. Added this dedicated diary document under HC-54 reference docs.
4. Prepared step-by-step logging format for subsequent implementation tasks.

### Why

1. A clean contract-first start reduces risk of accidental dual-path migration.
2. Dedicated diary continuity is required for task-by-task execution and reviewability.

### What worked

1. Ticket scaffolding was already in place and aligned with current architectural direction.
2. No baseline git conflicts or local drift blocked step execution.

### What didn't work

- N/A.

### What I learned

1. Keeping contract and execution references in the same ticket allows rapid verification while coding.

### What was tricky to build

1. Ensuring documentation stays explicit about prohibited legacy paths while remaining implementation-ready.

### What warrants a second pair of eyes

1. Verify final contract wording for required props and lifecycle phases before backend code refactor starts.

### What should be done in the future

1. Keep each subsequent step commit tied to explicit removal of superseded legacy branches.

### Code review instructions

1. Review HC-54 plan and task documents:
   - `ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/tasks.md`
   - `ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/design/01-clean-cutover-implementation-plan-timelineentityv2.md`
2. Review this diary entry for kickoff and step-tracking format:
   - `ttmp/2026/02/19/HC-54-TIMELINE-V2-CUTOVER--clean-cutover-to-dedicated-hypercard-timeline-kinds-and-reusable-chat-runtime/reference/01-diary.md`

### Technical details

1. Execution uses the ordered HC-54 1-9 task list with per-step references.
2. Hard-cut rule remains active: no retained `tool_result/customKind` widget/card route in final state.

## Step 2: Backend protobuf extraction + dedicated Hypercard TimelineEntityV2 projection

This step implemented app-owned protobuf payload extraction for Hypercard widget/card lifecycle events and rewired backend timeline projection to emit dedicated timeline kinds (`hypercard_widget`, `hypercard_card`) with deterministic IDs. Legacy map-decoding helpers were removed from active code paths.

### Prompt Context

**User prompt (verbatim):** `Go ahead and work on it, task by task, commit at appropriate intervals, update your diary as you go.`

**Assistant interpretation:** Continue HC-54 in execution order, ship a concrete backend/proto checkpoint with test validation, and record implementation details in the diary before committing.

**Inferred user intent:** Deliver auditable incremental progress toward the no-legacy hard cutover.

### What I did

1. Added app-local protobuf schema module under `go-inventory-chat/internal/pinoweb/proto`:
   - `buf.yaml`
   - `buf.gen.yaml`
   - `sem/hypercard/widget.proto`
   - `sem/hypercard/card.proto`
2. Generated Go protobuf bindings under `go-inventory-chat/internal/pinoweb/pb/sem/hypercard`.
3. Added protobuf decode/props helpers in `go-inventory-chat/internal/pinoweb/hypercard_payload_proto.go`:
   - `decodeWidgetLifecyclePayload`
   - `decodeCardLifecyclePayload`
   - `propsFromWidgetLifecycle`
   - `propsFromCardLifecycle`
   - `mapFromStruct`
4. Added helper tests in `go-inventory-chat/internal/pinoweb/hypercard_payload_proto_test.go`.
5. Rewrote timeline handler projection in `go-inventory-chat/internal/pinoweb/hypercard_events.go` to:
   - decode SEM payload via protojson + protobuf contracts
   - upsert `TimelineEntityV2` directly with kinds:
     - `hypercard_widget` and id `<itemId>:widget`
     - `hypercard_card` and id `<itemId>:card`
6. Removed ad-hoc map-decoding helper path in the same file.
7. Added projection snapshot coverage in `go-inventory-chat/internal/pinoweb/hypercard_events_timeline_test.go`.

### Why

1. Protobuf extraction gives explicit payload shape control without requiring Pinocchio transport schema updates.
2. Dedicated timeline kinds avoid overloading `tool_result/customKind` and align with the cutover architecture.
3. Deterministic IDs preserve upsert semantics per artifact item lifecycle.

### Commands run

1. Focused package validation:
   - `cd go-inventory-chat && go test ./internal/pinoweb -count=1`
2. Broader module sweep:
   - `cd go-inventory-chat && go test ./... -count=1`
3. Legacy-path scan in backend scope:
   - `rg -n "customKind|tool_result|hypercard_widget|hypercard_card|hypercard\\.widget\\.|hypercard\\.card\\." go-inventory-chat/internal go-inventory-chat/cmd`

### What worked

1. New decode + projection tests passed and captured expected dedicated kinds.
2. Full `go-inventory-chat` test run passed after refactor.
3. Backend legacy `tool_result/customKind` route for Hypercard widget/card projection is no longer present in active pinoweb handlers.

### What didn't work

1. Initial compile state before completion still referenced older timeline-entity assumptions while code was mid-transition.
2. `protojson.UnmarshalOptions` usage required precise method invocation form to satisfy compiler expectations.

### What I learned

1. Keeping protobuf schema/app bindings scoped to `go-inventory-chat/internal/pinoweb` is a clean decoupling seam from Pinocchio transport core.
2. A direct `TimelineEntityV2` helper (`timelineEntityV2FromMap`) keeps handler code concise and consistent across widget/card lifecycle registrations.

### What was tricky to build

1. Ensuring lifecycle phase fallback and item-id fallback are deterministic for all start/update/ready/error events.
2. Maintaining strict hard-cut direction while still preserving existing event emission (`hypercard.widget.*`, `hypercard.card.*`) semantics.

### What warrants a second pair of eyes

1. Confirm expected behavior on decode failure paths (current behavior ignores malformed payload events rather than bubbling projector errors).
2. Confirm lifecycle prop field naming is final for frontend registry consumption (`title`, `widgetType`, `name`, `phase`, `error`, `data`).

### What should be done in the future

1. Continue Step 3 by introducing frontend kind normalizer/renderer registration seams.
2. Execute Step 5 frontend cutover to dedicated kinds and remove remaining tool-result-based widget/card mapping branches.

### Code review instructions

1. Review protobuf contracts and generated bindings:
   - `go-inventory-chat/internal/pinoweb/proto/sem/hypercard/widget.proto`
   - `go-inventory-chat/internal/pinoweb/proto/sem/hypercard/card.proto`
   - `go-inventory-chat/internal/pinoweb/pb/sem/hypercard/widget.pb.go`
   - `go-inventory-chat/internal/pinoweb/pb/sem/hypercard/card.pb.go`
2. Review decode/props helpers + tests:
   - `go-inventory-chat/internal/pinoweb/hypercard_payload_proto.go`
   - `go-inventory-chat/internal/pinoweb/hypercard_payload_proto_test.go`
3. Review backend timeline cutover + projection tests:
   - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
   - `go-inventory-chat/internal/pinoweb/hypercard_events_timeline_test.go`
4. Re-run validation:
   - `cd go-inventory-chat && go test ./... -count=1`

### Technical details

1. Widget lifecycle events now project through `decodeWidgetLifecyclePayload` and upsert one entity per item id: `<itemId>:widget`.
2. Card lifecycle events now project through `decodeCardLifecyclePayload` and upsert one entity per item id: `<itemId>:card`.
3. Props payload includes `schemaVersion: 1` and normalized lifecycle fields for frontend registration dispatch.
