---
Title: Diary
Ticket: HC-52-CUSTOMKIND-KIND-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - cleanup
    - frontend
    - backend
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: |-
        Observed customKind origin captured in investigation diary
        Documented first-class kind emitter cutover
    - Path: packages/engine/src/chat/sem/timelineMapper.ts
      Note: |-
        Observed remap behavior captured in investigation diary
        Documented hard-cutover removal of legacy customKind remap
    - Path: packages/engine/src/hypercard/artifacts/artifactRuntime.ts
      Note: Documented first-class kind artifact extraction
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T18:58:31.341515985-05:00
WhatFor: ""
WhenToUse: ""
---



# Diary

## Goal

Capture investigation and planning steps for decommissioning `tool_result.customKind` remap in favor of first-class hypercard timeline kinds.

## Step 1: Ticket Setup and Migration Analysis Draft

This step established a dedicated cleanup ticket so long-term kind-contract work is decoupled from the immediate artifact-open hotfix. The objective was to capture the migration as an explicit phased plan rather than ad-hoc follow-up notes.

The analysis focused on concrete producer/consumer paths currently responsible for routing hypercard artifacts: backend timeline projector emits `tool_result` with `customKind`, and frontend `timelineMapper` remaps that shape to hypercard renderers. This became the baseline for a future hard cutover.

### Prompt Context

**User prompt (verbatim):** "ok, make a ticket for this cleanup away from custom_kind and write a detailed implementation plan and analysis in that ticket, for later. 

Then, fix the short term bug for opening the artifacts."

**Assistant interpretation:** Create a separate ticket with a complete migration design for removing `customKind` indirection, then proceed with the immediate artifact-open fix under current cleanup work.

**Inferred user intent:** Separate strategic refactor planning from tactical production bugfixing so progress is unblocked now while preserving a rigorous long-term path.

### What I did
- Created ticket `HC-52-CUSTOMKIND-KIND-CUTOVER`.
- Added a design doc with:
  - current-state architecture analysis,
  - rationale for first-class `kind` contract,
  - phased migration plan including compatibility window and removal criteria.
- Added implementation tasks `C1`..`C8` in `tasks.md`.

### Why
- The `customKind` approach introduces semantic indirection and increases breakage risk in replay/upsert paths.
- A dedicated ticket prevents scope collision with immediate HC-02 bug fixes.

### What worked
- `docmgr` ticket creation and document scaffolding worked without vocabulary/frontmatter issues.
- Design scope could be expressed without changing protobuf schemas.

### What didn't work
- N/A

### What I learned
- Current `TimelineEntityV2` model already allows this migration because `kind` is an open string and `props` is flexible.

### What was tricky to build
- Separating long-term contract cleanup from active bug triage while keeping both traceable required creating a new ticket before changing runtime code.

### What warrants a second pair of eyes
- Proposed compatibility window length and replay guarantees for old sessions.
- Final canonical kind naming policy (`hypercard.widget.v1` in UI state vs alias mapping).

### What should be done in the future
- Execute tasks `C1`..`C8` in the new ticket and remove legacy remap after soak.

### Code review instructions
- Read `tasks.md` and design doc in the new ticket.
- Confirm migration phases are independently deployable and reversible.

### Technical details
- Current backend origin of `customKind`: `go-inventory-chat/internal/pinoweb/hypercard_events.go`.
- Current frontend remap point: `packages/engine/src/chat/sem/timelineMapper.ts`.

## Related

- `../design-doc/01-customkind-decommission-plan-and-kind-cutover-analysis.md`

## Step 2: Implement hard cutover to first-class hypercard timeline kinds

This step executed the HC-52 implementation after F8 stabilization. I performed a hard cutover away from `tool_result + customKind` remap semantics and switched backend projection to first-class timeline kinds.

The frontend was updated to consume these kinds directly in mapper/artifact extraction paths, while legacy `tool_result` entities now remain generic and no longer auto-promote into hypercard entities.

### Prompt Context

**User prompt (verbatim):** "Ok, do F8, then HC-52"

**Assistant interpretation:** Complete HC-02 F8 runtime cleanup first, then execute the HC-52 customKind decommission implementation.

**Inferred user intent:** Finish both immediate runtime cleanup and strategic timeline-kind contract migration in one execution pass.

**Commit (code):** `ed12be9` — "feat(hc-52): cut over timeline projection to first-class hypercard kinds"

### What I did
- Backend cutover:
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
  - switched timeline upsert kinds from `tool_result` to first-class:
    - `hypercard.widget.v1`
    - `hypercard.card.v2`
  - stopped writing `CustomKind` into timeline projection payload for hypercard upserts.
- Frontend mapper cutover:
  - `packages/engine/src/chat/sem/timelineMapper.ts`
  - added first-class kind remap handling.
  - removed legacy `tool_result + customKind` remap path.
- Artifact extraction cutover:
  - `packages/engine/src/hypercard/artifacts/artifactRuntime.ts`
  - added first-class timeline kind parsing in sem/timeline extraction paths.
  - removed legacy timeline extraction path for `tool_result + customKind`.
- Renderer registration hardening:
  - `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
  - register renderers for first-class kinds as well.
- Added/updated tests:
  - `packages/engine/src/chat/sem/timelineMapper.test.ts`
  - `packages/engine/src/hypercard/artifacts/artifactRuntime.test.ts`

### Why
- First-class kinds remove semantic indirection and make projection contracts explicit.
- Hard cutover aligns with objective to decommission `customKind` dependency instead of carrying long dual-path complexity.

### What worked
- Frontend tests for mapper/artifact projection passed.
- Backend compile checks passed for relevant packages.
- No TypeScript typecheck regressions in engine package.

### What didn't work
- N/A

### What I learned
- Existing reducer/renderer architecture can absorb first-class kind contract changes without protobuf schema changes.
- Artifact runtime needed explicit first-class kind parsing to fully decouple from `customKind`.

### What was tricky to build
- Coordinating backend and frontend changes while preserving deterministic entity IDs and open/edit behavior required synchronized mapper + extractor updates.

### What warrants a second pair of eyes
- Confirm hard-cutover behavior for historical replays with legacy `tool_result + customKind` payloads is acceptable for your retention window.

### What should be done in the future
- If required, add targeted migration tooling for old persisted sessions instead of reintroducing runtime compatibility branches.

### Code review instructions
- Backend:
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
- Frontend:
  - `packages/engine/src/chat/sem/timelineMapper.ts`
  - `packages/engine/src/hypercard/artifacts/artifactRuntime.ts`
  - `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
  - related tests in same directories.

### Technical details
- First-class kinds emitted by backend timeline upsert:
  - `hypercard.widget.v1`
  - `hypercard.card.v2`
- Legacy `tool_result + customKind` remap promotion removed from timeline mapper.
