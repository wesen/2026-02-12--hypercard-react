---
Title: Diary
Ticket: HC-47-DESKTOP-EXPORTS
Status: active
Topics:
    - frontend
    - architecture
    - cleanup
    - windowing
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/editorLaunch.ts
      Note: Diary records desktop-core import cutover
    - Path: packages/engine/src/desktop-core.ts
      Note: Diary step documents migration target for openWindow/OpenWindowPayload
    - Path: packages/engine/src/desktop-react.ts
      Note: Diary step documents creation of desktop-react entrypoint
    - Path: packages/engine/src/index.ts
      Note: Diary records removal of root desktop exports
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-17T16:48:24.39017798-05:00
WhatFor: ""
WhenToUse: ""
---


# Diary

## Goal

Track the Workstream F implementation for desktop export-surface hard cutover and preserve exact context for follow-up developers.

## Step 1: Subpath Export Hard Cutover

I implemented Workstream F as a hard cutover, not a compatibility migration. The objective was to stop exposing desktop/windowing APIs from the `@hypercard/engine` root barrel and move consumers to dedicated desktop subpaths.

I first created new desktop entrypoint files and an explicit package export map, then updated all app-level desktop imports and theme imports, and finally removed root desktop exports. This sequence let typecheck/tests confirm no residual root import dependency on desktop APIs.

### Prompt Context

**User prompt (verbatim):** "Ok, now create tickets for workstream F and workstream G, then work on them in the same way. continue keeping a frequent diary."

**Assistant interpretation:** Create dedicated tickets for Workstreams F and G, execute both implementations, and keep diary records current while coding.

**Inferred user intent:** Complete HC-45 follow-through with concrete implementation and auditability, without partial/planning-only output.

**Commit (code):** dd87bee — "refactor(engine): add desktop subpath entrypoints and hard-cutover imports"

### What I did
- Added explicit desktop entrypoint files:
  - `packages/engine/src/desktop-core.ts`
  - `packages/engine/src/desktop-react.ts`
  - `packages/engine/src/desktop-hypercard-adapter.ts`
  - `packages/engine/src/desktop-theme-macos1.ts`
- Added module barrels:
  - `packages/engine/src/desktop/core/index.ts`
  - `packages/engine/src/desktop/react/index.ts`
  - `packages/engine/src/desktop/adapters/index.ts`
  - `packages/engine/src/desktop/adapters/hypercard.ts`
  - `packages/engine/src/desktop/index.ts`
- Added package export map entries in `packages/engine/package.json` for desktop and theme subpaths.
- Removed root desktop/windowing exports from `packages/engine/src/index.ts` and updated usage comments to the new import model.
- Hard-cutover app and story imports:
  - `DesktopShell` to `@hypercard/engine/desktop-react`
  - `openWindow` and `OpenWindowPayload` to `@hypercard/engine/desktop-core`
  - theme imports to `@hypercard/engine/theme` and `@hypercard/engine/theme/*.css`
- Ran validation:
  - `npm run typecheck`
  - `npm run test -w packages/engine`

### Why
- Reduce accidental coupling from root barrel imports.
- Make desktop framework APIs explicit and packageable.
- Align implementation with HC-45 hard-cutover constraints.

### What worked
- All desktop call sites in apps were migrated cleanly.
- Root barrel desktop exports were removed without breaking workspace typecheck.
- Taxonomy check and engine tests remained green.

### What didn't work
- Initial shell context used the wrong repository root; I corrected to `2026-02-12--hypercard-react` before editing.

### What I learned
- Existing alias/path setup already supports subpath imports, so migration friction was low.
- Theme imports were still direct filesystem paths in app entrypoints and Storybook preview; converting these improved package hygiene.

### What was tricky to build
- Ensuring root barrel cleanup did not remove non-desktop exports depended on auditing app imports first. The risk was hidden root desktop imports in app code; I mitigated this by migrating imports before deleting root desktop exports.

### What warrants a second pair of eyes
- Whether `desktop-react` should remain a curated explicit export list or be further split (for even tighter runtime adapter boundaries).
- Whether additional `package.json` exports should include more CSS subpaths for future themes.

### What should be done in the future
- Follow with Workstream G contract-story coverage to lock the new surface in Storybook.

### Code review instructions
- Start with new subpath entrypoints:
  - `packages/engine/src/desktop-core.ts`
  - `packages/engine/src/desktop-react.ts`
  - `packages/engine/src/desktop-hypercard-adapter.ts`
  - `packages/engine/src/desktop-theme-macos1.ts`
- Review root-barrel removal:
  - `packages/engine/src/index.ts`
- Review call-site migration:
  - `apps/inventory/src/App.tsx`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/editorLaunch.ts`
  - `apps/todo/src/App.tsx`
  - `apps/crm/src/App.tsx`
  - `apps/book-tracker-debug/src/App.tsx`
- Validate with:
  - `npm run typecheck`
  - `npm run test -w packages/engine`

### Technical details
- Subpaths added in `packages/engine/package.json`:
  - `"./desktop-core"`
  - `"./desktop-react"`
  - `"./desktop-hypercard-adapter"`
  - `"./desktop-theme-macos1"`
  - `"./theme"`
- Root barrel now intentionally excludes desktop/windowing exports.
