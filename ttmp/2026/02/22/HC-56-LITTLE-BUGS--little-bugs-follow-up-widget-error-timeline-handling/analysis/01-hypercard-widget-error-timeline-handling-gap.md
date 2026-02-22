---
Title: hypercard.widget.error timeline handling gap
Ticket: HC-56-LITTLE-BUGS
Status: active
Topics:
    - chat
    - frontend
    - debugging
    - ux
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Emits and projects hypercard widget events into timeline entities.
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts
      Note: Remaps timeline entities into UI-facing hypercard_widget entries.
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardWidget.tsx
      Note: Legacy direct SEM handlers that no longer run for persisted entities after backend-authoritative shift.
ExternalSources: []
Summary: Analyze why `hypercard.widget.error` does not render as widget error state and define a backend-authoritative fix.
LastUpdated: 2026-02-22T17:00:00-05:00
WhatFor: Provide implementation-ready context and acceptance criteria for fixing widget error projection.
WhenToUse: Use when implementing or reviewing handling of `hypercard.widget.error` and related timeline consistency.
---

# Analysis: `hypercard.widget.error` Handling Gap

## Problem Statement

We receive SEM frames like:

```yaml
sem: true
event:
  type: hypercard.widget.error
  id: c5250a0a-b817-429f-88b2-cd278a17c8c8:1
  seq: 1771797194807000000
  data:
    itemId: c5250a0a-b817-429f-88b2-cd278a17c8c8:1
    error: |
      yaml: unmarshal errors:
        line 7: mapping key "artifact" already defined at line 3
```

Current UX does not surface this as a widget-level error entity in timeline state.

## Current Architecture (Relevant)

1. Frontend persisted timeline entities are backend-authoritative via `timeline.upsert`.
2. Direct frontend SEM handlers for `hypercard.widget.*` were intentionally removed from active bootstrap paths.
3. Backend timeline projector currently does:
   - `hypercard.widget.error` -> `status` entity (`<id>:status`)
   - `hypercard.widget.v1` -> `hypercard.widget.v1` result entity (`<id>:result`)
4. Timeline mapper remaps `hypercard.widget.v1` into `hypercard_widget`, but defaults status/detail to success/ready.

## Root Cause

`hypercard.widget.error` is only projected as a status message, not as a `hypercard.widget.v1` result-like entity. Because persisted widget rendering now depends on `timeline.upsert` entity materialization, the widget error state has no canonical entity to render.

## Fix Strategy

1. Backend projector: also project `hypercard.widget.error` as a result entity of kind `hypercard.widget.v1` (same canonical kind used for widget timeline materialization), carrying `itemId` and `error`.
2. Frontend mapper: when remapping `hypercard.widget.v1`, derive `status=error` and `detail=<error>` when an error field is present (in props or result payload), instead of always forcing success.
3. Tests:
   - Go projector test: `hypercard.widget.error` yields both a status entry and a widget-kind result entry.
   - TS mapper test: `hypercard.widget.v1` with error remaps to `hypercard_widget` with error state.

## Acceptance Criteria

- A `hypercard.widget.error` frame results in a persisted widget entity that renders error status in timeline UI.
- Existing success path behavior (`hypercard.widget.v1` -> success widget) remains unchanged.
- Existing status entries (`<id>:status`) continue to appear.
- Targeted Go and TS tests pass.

## Non-Goals

- Reintroducing legacy direct frontend SEM mutation handlers for hypercard widget events.
- Changing artifact extraction behavior for error-only payloads that have no artifact id.
