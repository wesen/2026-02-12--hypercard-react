---
Title: Diary
Ticket: HC-030-DESKTOP-CUTOVER
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/design-doc/01-desktop-migration-implementation-plan.md
      Note: Primary migration implementation document
    - Path: ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/tasks.md
      Note: Execution checklist for hard cutover
ExternalSources: []
Summary: Step-by-step implementation diary for hard migration from legacy HyperCard shell/navigation to DesktopShell-only architecture.
LastUpdated: 2026-02-15T12:36:00-05:00
WhatFor: Capture implementation sequence, commits, failures, and verification evidence for HC-030.
WhenToUse: Use during migration implementation and review.
---

# Diary

## Goal

Execute a hard cutover to DesktopShell as the only shell architecture, remove legacy shell/navigation code, and keep the repository buildable at each migration step.

## Step 1: Create migration ticket and implementation plan

I created a separate migration ticket (HC-030) and wrote a detailed implementation plan before touching additional code. This establishes sequence, scope boundaries, deletion impact, and risk controls for a no-backwards-compatibility cutover.

The ticket now contains both planning artifacts and an actionable task list, so implementation can proceed in small audited commits.

### Prompt Context

**User prompt (verbatim):** "Ok, make a detailed implementation doument for the migration, in a separate ticket, and add tasks to that ticket. Then work on the tasks one by one, committing and adding to your diary as you progress."

**Assistant interpretation:** Create a new ticket dedicated to the migration, write a detailed implementation doc and tasks there, then execute tasks sequentially with commits and diary updates.

**Inferred user intent:** Drive migration with disciplined execution and traceability, not ad-hoc edits.

**Commit (code):** N/A

### What I did

- Created ticket workspace:
  - `docmgr ticket create-ticket --ticket HC-030-DESKTOP-CUTOVER --title "Desktop Shell Hard Cutover and Legacy Removal" --topics architecture,code-quality,review`
- Added ticket docs:
  - `docmgr doc add --ticket HC-030-DESKTOP-CUTOVER --doc-type design-doc --title "Desktop Migration Implementation Plan"`
  - `docmgr doc add --ticket HC-030-DESKTOP-CUTOVER --doc-type reference --title "Diary"`
- Wrote full implementation plan in:
  - `design-doc/01-desktop-migration-implementation-plan.md`
- Replaced placeholder tasks with phased, granular checklist in:
  - `tasks.md`

### Why

- Hard cutovers need strict sequencing to avoid breaking the repo mid-flight.
- Explicit impact mapping prevents accidental partial deletions.

### What worked

- Ticket and docs were created successfully.
- Plan and tasks now cover helper migration, app migration, deletion scope, and validation gates.

### What didn't work

- `docmgr doc list --ticket HC-030-DESKTOP-CUTOVER` returned no entries immediately despite files existing; this appears to be a listing/index quirk rather than missing files.

### What I learned

- The helper layer (`createStoryHelpers`) is the largest coupling point and must be migrated before legacy shell deletion.

### What was tricky to build

- The key challenge was ordering: deleting legacy shell code early would break app/story helpers that still encode navigation-slice assumptions.

### What warrants a second pair of eyes

- Confirm migration plan sequencing around helper cutover vs navigation slice deletion.

### What should be done in the future

- Keep each migration phase in separate commits so regressions can be bisected quickly.

### Code review instructions

- Read the plan:
  - `ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/design-doc/01-desktop-migration-implementation-plan.md`
- Read task checklist:
  - `ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/tasks.md`

### Technical details

- Ticket ID: `HC-030-DESKTOP-CUTOVER`
- New docs: design-doc + diary + task expansion

## Step 2: Complete C1-C3 — shared runtime-host extraction and validation

I completed the first code migration slice by extracting duplicated runtime orchestration out of `HyperCardShell` and `CardSessionHost` into one shared hook. This is the biggest duplication reduction in the shell layer and lowers risk for later hard deletion of legacy shell files.

I validated this extraction with the required test/typecheck commands before proceeding.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Execute migration tasks incrementally with commits and diary updates.

**Inferred user intent:** Improve clarity first by shrinking oversized/duplicated runtime code paths.

**Commit (code):** (recorded in this step's implementation commit)

### What I did

- Added new shared hook:
  - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
- Refactored:
  - `packages/engine/src/components/shell/HyperCardShell.tsx`
  - `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
- Behavior retained:
  - runtime initialization via `ensureCardRuntime`
  - DSL action execution via `executeCommand`
  - selector resolution via `createSelectorResolver`
  - runtime debug events
- Validation:
  - `npm run typecheck` (pass)
  - `npm test` (pass, 95 tests)

### Why

- Needed to remove the largest duplication before deleting legacy shell code.
- A shared runtime host reduces drift between legacy and windowing paths while both still exist.

### What worked

- Refactor removed hundreds of duplicated lines from two large files.
- Tests/typecheck stayed green after extraction.

### What didn't work

- Initial typecheck failed because shared hook typed `store.getState()` too narrowly (`Record<string, unknown>`). Fixed by widening to `unknown`.

### What I learned

- The shell/runtime duplication was structurally very close, making extraction low-risk once nav adapter boundaries were explicit.

### What was tricky to build

- The key edge was preserving action dispatch/debug semantics while making nav behavior pluggable (`navigate/goBack` in legacy vs session nav actions in windowing).

### What warrants a second pair of eyes

- Verify nav adapter behavior remains identical in both shell modes for DSL `nav.go` and `nav.back` commands.

### What should be done in the future

- Keep all future runtime wiring changes inside `useCardRuntimeHost` to prevent reintroducing duplication.

### Code review instructions

- Start here:
  - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
- Then review callsites:
  - `packages/engine/src/components/shell/HyperCardShell.tsx`
  - `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
- Re-run validation:
  - `npm run typecheck`
  - `npm test`

### Technical details

- Net duplication reduction (two callsites): ~423 deleted lines, 37 inserted lines
- New shared runtime-host module: 293 lines

## Step 3: Complete C4-C8 — helper migration to DesktopShell semantics

I completed the helper and story-layer migration slice needed before hard deletion of legacy shell code. This included adding a minimal DesktopShell bootstrapping affordance (`homeParam`) and rewriting helper APIs that were previously anchored to `HyperCardShell` and the navigation slice.

This step removes major architectural coupling to legacy navigation in app/story scaffolding.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Continue migration tasks sequentially, with commits and diary updates.

**Inferred user intent:** Make the new DesktopShell architecture the default flow even in scaffolding and Storybook tooling.

**Commit (code):** (recorded in this step's implementation commit)

### What I did

- Added DesktopShell story bootstrap support:
  - `homeParam` prop in `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- Migrated helper APIs away from legacy shell assumptions:
  - `packages/engine/src/app/createDSLApp.tsx`
  - `packages/engine/src/app/generateCardStories.tsx`
- Removed legacy `navShortcuts`, `snapshotSelector`, and debug-pane-only helper behavior.
- Migrated helper call sites (story configs):
  - `apps/inventory/src/stories/CardPages.stories.tsx`
  - `apps/crm/src/stories/CrmApp.stories.tsx`
  - `apps/todo/src/stories/TodoApp.stories.tsx`
  - `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx`
- Migrated remaining direct legacy-shell usage in a widget story:
  - `packages/engine/src/components/widgets/BookTracker.stories.tsx`
- Validation:
  - `npm run typecheck` (pass)
  - `npm test` (pass, 95 tests)

### Why

- Helper migration is a prerequisite to deleting legacy shell/navigation files.
- Story layers were the biggest remaining dependence on navigation-slice orchestration.

### What worked

- Helpers now instantiate DesktopShell directly.
- Per-card stories use stack home-card override + `homeParam` instead of dispatching legacy `navigate()`.
- Typecheck/tests stayed green after the shift.

### What didn't work

- Initial edit in `BookTracker.stories.tsx` mistakenly imported `DesktopShell` from `../../cards`; fixed by importing from `../shell/windowing/DesktopShell`.

### What I learned

- The migration path is cleaner if story bootstrapping manipulates DesktopShell inputs directly rather than mutating global navigation state in effects.

### What was tricky to build

- The trickiest part was preserving per-card Storybook scenarios without navigation slice APIs. The replacement strategy (`homeCard` override + `homeParam`) kept stories deterministic while removing the old navigation dependency.

### What warrants a second pair of eyes

- Verify Storybook UX for per-card stories still matches previous expectations (especially detail-card param scenarios).

### What should be done in the future

- Add explicit `initialWindows`/multi-window helper support if Storybook needs richer desktop setup scenarios.

### Code review instructions

- Review helper migrations:
  - `packages/engine/src/app/createDSLApp.tsx`
  - `packages/engine/src/app/generateCardStories.tsx`
- Review DesktopShell affordance:
  - `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- Re-run validation:
  - `npm run typecheck`
  - `npm test`

### Technical details

- Completed tasks: C4, C5, C6, C7, C8
- Validation status: green (`typecheck`, `test`)

## Step 4: Complete C9-C12 — app entrypoint cutover and navigation-snapshot cleanup

I completed the direct app entrypoint migration to DesktopShell and removed remaining themed-story usage of HyperCardShell. This finished the app-facing migration prerequisites for hard deleting legacy shell code.

These changes were delivered in commit `d9de1c2` together with helper/story migration from Step 3.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Continue task execution sequentially, including concrete app migration work.

**Inferred user intent:** Make legacy shell genuinely unused in apps before deleting it.

**Commit (code):** `d9de1c2` — "refactor(HC-030): migrate helpers and app stories to DesktopShell"

### What I did

- Migrated app entrypoints to DesktopShell:
  - `apps/todo/src/App.tsx`
  - `apps/crm/src/App.tsx`
  - `apps/book-tracker-debug/src/App.tsx`
- Migrated themed inventory story off HyperCardShell:
  - `apps/inventory/src/stories/Themed.stories.tsx`
- Removed snapshot-selector configuration blocks in app story helper callsites that depended on legacy navigation assumptions.

### Why

- Needed to ensure app layer no longer blocks legacy shell deletion.
- Removing app-level legacy references makes final cutover safer and auditable.

### What worked

- App entrypoint migration was straightforward once helpers were DesktopShell-ready.
- Typecheck/tests remained green after app migration.

### What didn't work

- CRM app previously used legacy debug-pane/chat split composition from HyperCardShell; DesktopShell currently has no equivalent pane mode, so that composition was removed in this migration slice.

### What I learned

- Most app cutover complexity came from legacy helper/config contracts rather than app runtime logic itself.

### What was tricky to build

- The biggest decision point was whether to preserve debug-pane UX parity immediately. I chose hard-cut simplification (as requested) and removed legacy pane composition instead of adding compatibility scaffolding.

### What warrants a second pair of eyes

- Confirm that removing legacy debug-pane composition in CRM and book-tracker-debug is acceptable for current workflow expectations.

### What should be done in the future

- If needed, reintroduce debug UX as explicit desktop windows under DesktopShell instead of resurrecting legacy split-pane shell APIs.

### Code review instructions

- Review migrated app entrypoints:
  - `apps/todo/src/App.tsx`
  - `apps/crm/src/App.tsx`
  - `apps/book-tracker-debug/src/App.tsx`
- Review themed story migration:
  - `apps/inventory/src/stories/Themed.stories.tsx`

### Technical details

- Completed tasks: C9, C10, C11, C12
- Commit carrying these changes: `d9de1c2`
