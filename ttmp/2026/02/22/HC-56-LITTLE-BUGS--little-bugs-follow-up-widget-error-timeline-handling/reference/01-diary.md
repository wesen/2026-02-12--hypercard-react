---
Title: Diary
Ticket: HC-56-LITTLE-BUGS
Status: active
Topics:
    - chat
    - frontend
    - debugging
    - ux
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Backend SEM mapping and timeline projection path for widget errors.
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts
      Note: Frontend timeline entity remap logic for widget/card timeline kinds.
ExternalSources: []
Summary: Implementation diary for HC-56 little bugs follow-up.
LastUpdated: 2026-02-22T17:00:00-05:00
WhatFor: Preserve complete implementation context, including failures and validation evidence.
WhenToUse: Use while continuing HC-56 work or reviewing fix rationale.
---

# Diary

## Goal

Track closure of legacy tickets and the implementation of the `hypercard.widget.error` timeline handling fix end-to-end.

## Step 1: Ticket Setup and Root-Cause Analysis

This step created the dedicated little-bugs ticket and documented why the widget error event is effectively dropped from persisted widget rendering after the backend-authoritative timeline shift. The output is an implementation-ready analysis and task list.

The key conclusion is that the event is emitted, but only projected as status; widget materialization now depends on `timeline.upsert` entities, so no widget error entity is produced.

### Prompt Context

**User prompt (verbatim):** "We don't handle event:
  data:
    error: |
  yaml: unmarshal errors:
    line 7: mapping key \"artifact\" already defined at line 3
    itemId: \"c5250a0a-b817-429f-88b2-cd278a17c8c8:1\"
  id: \"c5250a0a-b817-429f-88b2-cd278a17c8c8:1\"
  seq: 1771797194807000000
  type: hypercard.widget.error
sem: true

---

close HC-01, HC-55. Then Make a new ticket for little bugs, and add an analysis of the above, and then add tasks and fix it ."

**Assistant interpretation:** Close the two prior tickets, create a new ticket for this bug class, analyze the `hypercard.widget.error` gap, add executable tasks, and implement the fix.

**Inferred user intent:** Maintain clean ticket boundaries while quickly resolving concrete runtime correctness gaps.

**Commit (code):** `753cb0c` — "docs: close hc-01/hc-55 and open hc-56 little-bugs ticket"

### What I did

- Updated ticket metadata status for:
  - `HC-01-QOL-IMPROVEMENTS` -> `complete`
  - `HC-55-CHAT-HYDRATION-ROOTCAUSE` -> `complete`
- Created ticket `HC-56-LITTLE-BUGS`.
- Added analysis doc identifying backend/frontend projection mismatch for `hypercard.widget.error`.
- Added task checklist and diary scaffold.

### Why

- The user requested closure of prior tickets and a dedicated ticket for this bug class.
- The event-handling bug crosses backend projection and frontend remap layers and needs a focused traceable workspace.

### What worked

- `docmgr` ticket/doc creation and metadata updates succeeded.
- Root-cause path was confirmed in code quickly with direct file inspection.

### What didn't work

- N/A

### What I learned

- The architecture shift to backend-authoritative timeline entities means event support must be validated at projector level, not only SEM event emission level.

### What was tricky to build

- The event looked "handled" at first glance because a status entry is projected, but the user-visible widget state depends on a different entity kind path.

### What warrants a second pair of eyes

- Whether we should also project `hypercard.card.error` via the same canonical timeline-kind approach for symmetry.

### What should be done in the future

- Add explicit regression checks whenever a raw SEM event is moved from direct frontend handling to backend projection.

### Code review instructions

- Start with:
  - `ttmp/2026/02/22/HC-56-LITTLE-BUGS--little-bugs-follow-up-widget-error-timeline-handling/analysis/01-hypercard-widget-error-timeline-handling-gap.md`
  - `ttmp/2026/02/22/HC-56-LITTLE-BUGS--little-bugs-follow-up-widget-error-timeline-handling/tasks.md`

### Technical details

- Current mismatch:
  - backend emits `hypercard.widget.error` SEM frame
  - backend timeline projection creates status entity only
  - frontend persisted widget render path expects `timeline.upsert` of widget kind (`hypercard.widget.v1` remapped).

## Step 2: Implement `hypercard.widget.error` Projection and Remap

This step implemented the bug fix end-to-end across backend projection and frontend timeline remapping. The goal was to preserve the backend-authoritative contract while still producing a renderable widget error entity for timeline UI.

The fix keeps existing status entries and adds canonical widget-entity materialization for error events, then maps that entity to `status=error` on the frontend.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Implement the specific widget-error handling gap after creating the little-bugs ticket.

**Inferred user intent:** Make this class of runtime failure visible in the timeline UI and fully traceable through tests.

**Commit (code):** `460db7b` — "hypercard: persist and render widget.error timeline state"

### What I did

- Backend (`go-inventory-chat/internal/pinoweb/hypercard_events.go`):
  - extended `registerResult` to propagate `error` into `ToolResultSnapshotV1.Error`
  - added projection mapping:
    - `hypercard.widget.error` -> timeline kind `hypercard.widget.v1`
- Backend test (`go-inventory-chat/internal/pinoweb/hypercard_timeline_handlers_test.go`):
  - added regression verifying one widget-error frame creates:
    - `widget-call-1:status` (error status)
    - `widget-call-1:result` (`hypercard.widget.v1` with error payload)
- Frontend mapper (`packages/engine/src/chat/sem/timelineMapper.ts`):
  - remap logic now detects error in props/result and maps to:
    - `status: error`
    - `detail: <error message>`
  - success path remains `status: success`, `detail: ready`
- Frontend test (`packages/engine/src/chat/sem/timelineMapper.test.ts`):
  - added regression for hypercard widget error remap behavior.
- Ran targeted validations:
  - `go test ./2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb -count=1`
  - `pnpm vitest packages/engine/src/chat/sem/timelineMapper.test.ts`
  - `pnpm vitest packages/engine/src/hypercard/timeline/hypercardWidget.test.ts`

### Why

- After backend-authoritative timeline migration, direct frontend SEM handlers no longer materialize persisted widget entities.
- Error events were visible as status text only, missing canonical widget entity updates.

### What worked

- Projection + remap now produce consistent timeline entities for widget error states.
- Targeted Go and TS tests pass.

### What didn't work

- N/A

### What I learned

- Error events must flow through the same canonical kind pipeline as success events when UI entity semantics depend on remappers.

### What was tricky to build

- Avoiding architecture regression: the fix needed to stay within backend-authoritative projection rules instead of reintroducing direct frontend SEM mutation handlers.

### What warrants a second pair of eyes

- Whether `hypercard.card.error` should receive the same canonical projection treatment in a follow-up for strict symmetry.

### What should be done in the future

- Add one integration-level assertion in inventory app tests that a real widget parse failure renders a visible error-state widget row.

### Code review instructions

- Review backend projection changes first:
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
  - `go-inventory-chat/internal/pinoweb/hypercard_timeline_handlers_test.go`
- Review frontend remap behavior second:
  - `packages/engine/src/chat/sem/timelineMapper.ts`
  - `packages/engine/src/chat/sem/timelineMapper.test.ts`

### Technical details

- New event mapping path:
  - incoming SEM `hypercard.widget.error`
  - backend timeline projector upserts:
    - status entity (`<id>:status`)
    - result entity (`<id>:result`, kind `hypercard.widget.v1`, with `error` field)
  - frontend remapper converts that result entity into `hypercard_widget` with error status/detail.
