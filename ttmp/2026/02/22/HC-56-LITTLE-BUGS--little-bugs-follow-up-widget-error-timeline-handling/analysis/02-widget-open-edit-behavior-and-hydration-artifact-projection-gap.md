---
Title: widget open/edit behavior and hydration artifact projection gap
Ticket: HC-56-LITTLE-BUGS
Status: complete
Topics:
    - chat
    - frontend
    - debugging
    - ux
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardWidget.tsx
      Note: Widget renderer had Open and Edit wired to same action.
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.ts
      Note: Artifact projection listened to applySnapshot but not mergeSnapshot.
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js
      Note: Report/item viewer cards show "Artifact not found" when artifacts slice lacks the id.
ExternalSources: []
Summary: Analyze and fix widget open/edit UX bug and hydration-time artifact projection gap causing "Artifact not found" windows.
LastUpdated: 2026-02-22T17:08:00-05:00
WhatFor: Capture root causes and acceptance criteria for this follow-up little bug.
WhenToUse: Use when reviewing widget action behavior or diagnosing artifact window failures after hydration.
---

# Analysis: Widget Open/Edit + Hydration Artifact Projection

## User-Reported Symptoms

1. For a `hypercard_widget`, `Open` and `Edit` lead to the same artifact window.
2. Clicking `Open` can show report/item viewer with "Artifact not found: <id>".

## Root Causes

### 1) Widget Edit Action Wiring

In `HypercardWidgetRenderer`, both buttons invoked the same handler (`openArtifact`), so `Edit` never opened code editor UX.

### 2) Artifact Projection Gap on Hydration Merge

Artifact projection middleware projected artifacts on:
- `timeline.addEntity`
- `timeline.upsertEntity`
- `timeline.applySnapshot`

But hydration path uses `timeline.mergeSnapshot`, and middleware did not process that action. Result: timeline entities existed, but artifacts slice could be missing corresponding artifact records, leading report/item viewer to render "Artifact not found".

## Fix Implemented

1. `HypercardWidgetRenderer`:
- `Open` keeps artifact window path.
- `Edit` now opens code editor window (`buildCodeEditorWindowPayload`) using template-based card id.
- Buttons no longer forced to identical behavior.

2. Artifact projection middleware:
- Added `timeline.mergeSnapshot` to snapshot projection listener.
- Artifacts are now projected consistently for hydration merge entities.

## Acceptance Criteria

- `Edit` on widget opens code editor app window instead of artifact viewer window.
- Hydrated timeline entities containing `artifactId` result in artifacts slice projection.
- Opening widget artifacts after hydration no longer fails solely due to missing projection on `mergeSnapshot`.

## Validation Coverage

- `packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.test.ts`
  - Added mergeSnapshot projection test.
- `packages/engine/src/hypercard/timeline/hypercardWidget.test.ts`
  - Existing timeline remap behavior remains green after renderer action change.
