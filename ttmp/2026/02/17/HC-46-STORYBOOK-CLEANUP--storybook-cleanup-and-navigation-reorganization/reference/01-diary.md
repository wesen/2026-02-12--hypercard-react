---
Title: Diary
Ticket: HC-46-STORYBOOK-CLEANUP
Status: active
Topics:
    - frontend
    - storybook
    - cleanup
    - ux
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: "Implementation diary for HC-46 Storybook cleanup execution."
LastUpdated: 2026-02-17T16:18:00-05:00
WhatFor: "Capture step-by-step implementation details, validation, and commit trace for Storybook cleanup and reorganization."
WhenToUse: "Use when reviewing HC-46 implementation progress or continuing execution work."
---

# Diary

## Goal

Capture the implementation path for HC-46 Storybook cleanup, including concrete code moves, title taxonomy cutover, validation commands, and commit anchors.

## Step 1: Storybook Ownership Cutover + IA Normalization Baseline

I executed the first implementation slice for HC-46: move Storybook configuration ownership to repo root, reorganize app story files into feature/app directories, and hard-cut over story titles to package-aligned hierarchy (`Apps/*`, `Packages/*`).

This step intentionally does not include monolithic story splitting yet; it establishes the structural baseline so follow-on refactors can happen against stable ownership and naming policy.

### Prompt Context

**User prompt (verbatim):** "alright, implement the ticket, commit as you go and keep a diary."

**Assistant interpretation:** Execute HC-46 implementation tasks directly, make incremental commits, and maintain a detailed ongoing diary in-ticket.

**Inferred user intent:** Turn the HC-46 plan into real code cleanup with auditable progress, not just planning docs.

### What I did

- Moved Storybook config from inventory-local path to root-owned path:
  - `apps/inventory/.storybook/main.ts` -> `.storybook/main.ts`
  - `apps/inventory/.storybook/preview.ts` -> `.storybook/preview.ts`
- Reworked Storybook source registration to package/app prefixes in `.storybook/main.ts`:
  - `Apps/Inventory`, `Apps/Todo`, `Apps/Crm`, `Apps/BookTrackerDebug`, `Packages/Engine`
- Added Storybook tree ordering in `.storybook/preview.ts` using `parameters.options.storySort`.
- Reorganized app stories out of flat `src/stories` buckets:
  - `apps/inventory/src/app/stories/*`
  - `apps/inventory/src/features/chat/stories/*`
  - `apps/todo/src/app/stories/*`
  - `apps/crm/src/app/stories/*`
  - `apps/book-tracker-debug/src/app/stories/*`
- Updated moved story import paths to match new locations.
- Updated Storybook scripts:
  - root `package.json`
  - `apps/inventory/package.json` with `--config-dir ../../.storybook`
- Updated app story smoke test paths:
  - `packages/engine/src/__tests__/storybook-app-smoke.test.ts`
- Hard-cutover normalized all story titles to package-aligned hierarchy.

### Why

- Tasks 5/6/7/9/10 require an explicit package-first Storybook IA, hard-cut title normalization, app story file reorganization, and ownership clarity.

### What worked

- `git mv` preserved clean rename history for story file reorganizations.
- Canonical title normalization landed across all 42 story files.
- Validation passed:
  - `npm run typecheck`
  - `npm run -w packages/engine test`

### What didn't work

- N/A in this step.

### What I learned

- The fastest stable cutover path is to move ownership and file layout first, then tackle monolith splitting and CI checks in subsequent slices.

### What was tricky to build

- Updating moved story imports required careful per-file path adjustments because app stories moved to two distinct depths (`src/app/stories` and `src/features/chat/stories`).

### What warrants a second pair of eyes

- Confirm final Storybook navigation shape in UI after title + `titlePrefix` cutover (tree should start with `Apps` and `Packages`).

### What should be done in the future

- Split oversized story monoliths (`ChatWindow`, desktop/windowing stories).
- Add taxonomy and placement drift checks and CI integration.
- Add Storybook maintainer guide.

### Code review instructions

- Start with ownership and config:
  - `.storybook/main.ts`
  - `.storybook/preview.ts`
  - `package.json`
  - `apps/inventory/package.json`
- Review reorg examples:
  - `apps/inventory/src/app/stories/FullApp.stories.tsx`
  - `apps/inventory/src/features/chat/stories/EventViewer.stories.tsx`
  - `apps/todo/src/app/stories/TodoApp.stories.tsx`
- Verify smoke coverage path updates:
  - `packages/engine/src/__tests__/storybook-app-smoke.test.ts`

### Technical details

- Canonical title convention now follows owner-first taxonomy:
  - `Apps/<AppName>/...`
  - `Packages/Engine/...`

---

## Step 2: Split Oversized Story Monoliths (ChatWindow + Desktop Primitives)

I executed the monolith split pass for HC-46 by decomposing the largest widget story file and a large windowing story file into focused scenario modules. The intent was to reduce review overhead while keeping the same Storybook IA/title and runtime behavior.

This step targets task 8 directly and keeps all stories under the same canonical package-aligned title tree.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Continue implementing HC-46 task list and commit progress incrementally, including monolith decomposition.

**Inferred user intent:** Improve maintainability and navigation quality without regressing story coverage.

### What I did

- Split `ChatWindow` story monolith into focused files:
  - `packages/engine/src/components/widgets/ChatWindow.stories.tsx` (core + shared helpers/data exports)
  - `packages/engine/src/components/widgets/ChatWindow.widgets.stories.tsx` (inline widget/data scenarios)
  - `packages/engine/src/components/widgets/ChatWindow.interaction.stories.tsx` (actions/system/mobile/timestamps scenarios)
- Split `DesktopPrimitives` large scenario surface:
  - kept core desktop primitive stories in `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
  - moved large workspace scenarios into `packages/engine/src/components/shell/windowing/DesktopPrimitives.workspace.stories.tsx`

### Why

- Large single-story files are difficult to review and evolve safely.
- Splitting by scenario class makes ownership and edits more localized.

### What worked

- Typecheck passed after split.
- Engine vitest suite passed after split.
- Story title hierarchy remained canonical (`Packages/Engine/...`).

### What didn't work

- N/A in this step.

### What I learned

- Exporting shared fixtures/helpers from a core story file allows clean decomposition without duplicating large data fixtures.

### What was tricky to build

- Keeping story IDs and behavior intact while moving story definitions required careful separation of shared data/render helpers from scenario-specific story exports.

### What warrants a second pair of eyes

- Verify Storybook UI grouping for split files still appears cohesive and not confusingly fragmented.

### What should be done in the future

- Add explicit policy checks for file placement/title drift and finish maintainer docs.

### Code review instructions

- Review split outputs:
  - `packages/engine/src/components/widgets/ChatWindow.stories.tsx`
  - `packages/engine/src/components/widgets/ChatWindow.widgets.stories.tsx`
  - `packages/engine/src/components/widgets/ChatWindow.interaction.stories.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.stories.tsx`
  - `packages/engine/src/components/shell/windowing/DesktopPrimitives.workspace.stories.tsx`
- Validate with:
  - `npm run typecheck`
  - `npm run -w packages/engine test`

### Technical details

- Split strategy keeps identical title namespace, avoiding navigation regressions while reducing per-file complexity.

---

## Step 3: Add Taxonomy/Placement Guardrails and Maintainer Documentation

I implemented the enforcement layer for HC-46 by adding an explicit Storybook taxonomy checker script and wiring it into test execution, then documented contribution/maintenance rules in frontend docs.

This step closes the drift-prevention part of the ticket: once merged, invalid story titles or app story placement regressions should fail quickly.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Continue task-by-task implementation with commits, including governance/validation and maintainer docs.

**Inferred user intent:** Ensure cleanup is durable and enforceable, not just a one-off refactor.

### What I did

- Added Storybook taxonomy + placement check script:
  - `scripts/storybook/check-taxonomy.mjs`
- Wired checks into scripts:
  - root `package.json`: added `storybook:check`, prefixed `test`
  - `packages/engine/package.json`: prefixed `test` and `test:watch` with taxonomy check
- Added maintainer guide:
  - `docs/frontend/storybook.md`
- Updated ownership/boundary doc after root config cutover:
  - `docs/frontend/storybook-and-app-boot-model.md`
- Fixed theme import paths after inventory story moves:
  - `apps/inventory/src/app/stories/Themed.stories.tsx`

### Why

- Task 11 requires validation scripts/CI-style checks for taxonomy and placement drift.
- Task 12 requires maintainer documentation for adding and organizing stories.

### What worked

- `npm run storybook:check` passes (`45 story files`).
- `npm run -w packages/engine test` passes with taxonomy check integrated.

### What didn't work

- A moved story import (`Themed.stories.tsx`) initially used one fewer `../` segment for theme CSS paths and had to be corrected.

### What I learned

- Title checks should parse canonical title candidates rather than first `title:` occurrences, because fixture payloads often include unrelated `title` fields.

### What was tricky to build

- Placement checks must balance strictness (blocking flat `src/stories`) with flexibility (allowing nested `src/features/**/stories`).

### What warrants a second pair of eyes

- Confirm policy scope is strict enough for future additions but not so strict it blocks legitimate story module structures.

### What should be done in the future

- Optionally add a dedicated CI workflow invocation for `npm run storybook:check` if this repo introduces centralized CI workflows later.

### Code review instructions

- Review policy script:
  - `scripts/storybook/check-taxonomy.mjs`
- Review script wiring:
  - `package.json`
  - `packages/engine/package.json`
- Review docs:
  - `docs/frontend/storybook.md`
  - `docs/frontend/storybook-and-app-boot-model.md`

### Technical details

- Validation commands:
  - `npm run storybook:check`
  - `npm run -w packages/engine test`
