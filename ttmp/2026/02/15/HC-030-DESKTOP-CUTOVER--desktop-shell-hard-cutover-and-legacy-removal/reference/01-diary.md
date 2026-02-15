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
