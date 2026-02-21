---
Title: Diary
Ticket: HC-45-DESKTOP-FRAMEWORK
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/app/createDSLApp.tsx
      Note: Deleted scaffold API file in prep step
    - Path: packages/engine/src/app/index.ts
      Note: |-
        Removal of createDSLApp export as requested in the prompt
        Recorded removal of createDSLApp export
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Primary investigation anchor for framework extraction analysis
    - Path: packages/engine/src/components/shell/windowing/dragOverlayStore.ts
      Note: Fast-lane interaction architecture investigated and documented
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Diary references interaction lifecycle investigation
    - Path: packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Durable state moved to desktop core during hard-cutover implementation
    - Path: packages/engine/src/components/shell/windowing/desktopCommandRouter.ts
      Note: Dedicated built-in command routing extracted from DesktopShell
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Controller hook extracted from monolithic DesktopShell implementation
    - Path: packages/engine/src/components/shell/windowing/DesktopShellView.tsx
      Note: Presentational shell view extracted for controller/view split
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.ts
      Note: Workstream C contribution contracts and merge/routing logic
    - Path: packages/engine/src/components/shell/windowing/windowContentAdapter.ts
      Note: Workstream D adapter-chain contract and renderer
    - Path: packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx
      Note: Default app/card/fallback adapter implementations
    - Path: apps/inventory/src/App.tsx
      Note: Inventory desktop migration to contribution-based config
    - Path: packages/engine/src/theme/index.ts
      Note: Modular theme entrypoint after Workstream E hard cutover
    - Path: packages/engine/src/theme/desktop/tokens.css
      Note: Split token pack extracted from legacy base stylesheet
    - Path: packages/engine/src/theme/desktop/shell.css
      Note: Split desktop windowing shell pack extracted from legacy base stylesheet
    - Path: ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/design-doc/01-desktop-shell-and-windowing-reusability-analysis-for-in-browser-os-framework.md
      Note: Diary linkage to authored analysis output
ExternalSources: []
Summary: Step-by-step record of HC-45 preparation and hard-cutover implementation slices for desktop framework extraction.
LastUpdated: 2026-02-17T16:48:00-05:00
WhatFor: Preserve implementation history, decisions, and validation commands for handoff and review.
WhenToUse: Use when reviewing how HC-45 analysis/planning artifacts were produced and validated.
---


# Diary

## Goal

Record the implementation path for the HC-45 ticket: finishing the DSL scaffold removal request, analyzing desktop/windowing architecture for reusable-framework extraction, authoring long-form design docs, and preparing upload artifacts.

## Step 1: Remove DSL App Scaffold API

I finished the requested cleanup that removed the unused DSL app scaffolding path from the engine app utilities surface. This was a focused code-only step intended to simplify exported APIs before new framework-oriented planning work.

The change removed both the source module and its export reference, then validated type integrity before committing.

### Prompt Context

**User prompt (verbatim):** "then, -remove DSL app and commit.

Then create a new docmgr ticket for the desktop shell / windowing cleanup, we want to turn this into a reusable package for people who want to build on top of a macos1 looking hypercard setup. Create a detailed analysis of the situation and how to make this a reusable framework for a \"in browser OS\" kind of thing, then a detailed implementation plan. Both 5+ pages. Store in ticket and then upload to remarkable. Use the textbook style we used above."

**Assistant interpretation:** Remove the DSL scaffold API with a commit first, then create and populate a new docmgr ticket with deep analysis and implementation planning docs.

**Inferred user intent:** Clean out obsolete scaffolding and immediately pivot to a serious architecture/planning pass for turning shell/windowing into a reusable framework.

**Commit (code):** `3f027bc` — "refactor(engine): remove unused createDSLApp scaffold API"

### What I did

- Deleted `packages/engine/src/app/createDSLApp.tsx`.
- Removed export from `packages/engine/src/app/index.ts`.
- Ran `npm run typecheck`.
- Committed targeted changes.

### Why

- The DSL scaffold API was unused and not aligned with the desired framework extraction direction.
- Reducing dead public surface lowers future migration noise.

### What worked

- Typecheck passed after deletion/export cleanup.
- Commit landed cleanly on branch head.

### What didn't work

- N/A in this step.

### What I learned

- The app utility surface is compact; removal of `createDSLApp` had minimal blast radius.

### What was tricky to build

- The challenge was not technical complexity but ensuring deletion did not affect story helper/app-store path exports. A quick typecheck covered this safely.

### What warrants a second pair of eyes

- Confirm no external downstream consumer imports `createDSLApp` via non-repo usage.

### What should be done in the future

- Keep app utility exports intentionally minimal and task-oriented.

### Code review instructions

- Start at `packages/engine/src/app/index.ts`.
- Confirm `createDSLApp` is no longer exported.
- Validate deletion of `packages/engine/src/app/createDSLApp.tsx`.
- Re-run `npm run typecheck`.

### Technical details

- Commit hash: `3f027bc`.

## Step 2: Investigate Desktop/Windowing Framework Extraction and Author HC-45 Design Docs

I created and then filled the HC-45 docs with textbook-style, code-anchored analysis and planning. The content was based on direct inspection of shell/windowing/runtime/theme/app integration paths and was framed as a reusable “in-browser OS” platform design.

This step included updating ticket metadata (index/tasks/changelog) to reflect the completed documentation phase and explicit pending upload work.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Produce two long documents in the new ticket: one deep architecture assessment and one implementation plan, both detailed enough for onboarding-level handoff.

**Inferred user intent:** Establish a high-signal, developer-education-grade foundation for the next wave of desktop shell framework refactoring.

### What I did

- Located the active repo/ticket paths under `2026-02-12--hypercard-react`.
- Investigated core files:
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
- `packages/engine/src/components/shell/windowing/dragOverlayStore.ts`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/features/windowing/selectors.ts`
- `packages/engine/src/theme/base.css`
- `apps/inventory/src/App.tsx`
- `packages/engine/src/index.ts`
- Authored:
- `design-doc/01-desktop-shell-and-windowing-reusability-analysis-for-in-browser-os-framework.md`
- `design-doc/02-desktop-shell-and-windowing-reusable-framework-implementation-plan.md`
- Updated:
- `index.md`
- `tasks.md`
- `changelog.md`

### Why

- The user asked for thorough analysis and a detailed implementation roadmap suitable for new developers.
- Code-level anchors were needed for credibility and direct execution.

### What worked

- Existing subsystem layout was clear enough to build concrete extraction workstreams.
- The current fast-lane drag architecture (`dragOverlayStore`) provided a strong reusable foundation to preserve in the plan.

### What didn't work

- Initial path assumptions failed because the workspace root contained nested projects.
- Observed command errors:
- `rg: packages/engine/src/components/shell/windowing: No such file or directory`
- `ls: cannot access 'ttmp/...HC-45...': No such file or directory`
- Resolution: switched into `2026-02-12--hypercard-react` and continued from correct paths.

### What I learned

- The windowing domain model is already framework-grade, while shell composition and package/style boundaries are the main extraction bottlenecks.
- The current DesktopShell is efficient but policy-dense; splitting controller/view/contracts is high leverage.

### What was tricky to build

- The primary difficulty was balancing exact current behavior preservation with forward-looking framework decomposition. The solution was to design phased extraction with compatibility re-exports and a delegating legacy shell wrapper.

### What warrants a second pair of eyes

- Proposed package boundaries and export subpaths (`desktop-core`, `desktop-react`, theme/adapter splits).
- Contribution merge/conflict policies for commands/menus/icons.
- CSS split plan to avoid accidental visual regressions.

### What should be done in the future

- Execute Phase 0 baseline tests before any structural moves.
- Start with core extraction and shell split, then contracts/adapters, then CSS/export cleanup.

### Code review instructions

- Read analysis doc first:
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/design-doc/01-desktop-shell-and-windowing-reusability-analysis-for-in-browser-os-framework.md`
- Then implementation plan:
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/design-doc/02-desktop-shell-and-windowing-reusable-framework-implementation-plan.md`
- Confirm ticket metadata updates:
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/index.md`
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/tasks.md`
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/changelog.md`

### Technical details

- Core inspection commands used: `rg --files`, `nl -ba`, targeted `sed -n` slices.
- Validation approach: source-of-truth references with line-level anchors in docs.

## Step 3: Relate Docs, Validate Ticket Metadata, and Upload Bundle to reMarkable

After authoring the two long design docs, I completed ticket hygiene and distribution: related file metadata links, vocabulary cleanup, doctor validation, and final bundle upload to reMarkable.

This finalized the request outcome so another developer can discover both docs from ticket metadata and read the combined PDF on-device.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Ensure docs are fully stored in the ticket workflow and uploaded to reMarkable, not just written locally.

**Inferred user intent:** Make the research artifacts durable and shareable through both docmgr and reMarkable channels.

### What I did

- Ran `docmgr doc relate` for analysis, implementation plan, and diary docs.
- Ran `docmgr doctor --ticket HC-45-DESKTOP-FRAMEWORK --stale-after 30`.
- Addressed topic vocabulary warnings by adding:
- `windowing`
- `design-system`
- Re-ran doctor to confirm all checks passed.
- Ran reMarkable upload sequence:
- `remarquee status`
- `remarquee cloud account --non-interactive`
- `remarquee upload bundle --dry-run ...`
- `remarquee upload bundle ... --name "HC-45 Desktop Framework Analysis and Plan" --remote-dir "/ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK" --toc-depth 2`
- `remarquee cloud ls /ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK --long --non-interactive`
- Marked all ticket tasks complete and updated changelog.

### Why

- `docmgr` relationships and clean doctor results make ticket artifacts discoverable and auditable.
- Upload verification ensures the deliverable exists on reMarkable in the expected destination folder.

### What worked

- Dry-run and actual upload both succeeded.
- Remote verification showed uploaded artifact:
- `HC-45 Desktop Framework Analysis and Plan`

### What didn't work

- Initial doctor pass warned about unknown topics in ticket metadata.
- Fix: added vocabulary entries and re-ran doctor successfully.

### What I learned

- Explicit topic vocabulary maintenance is required to keep doctor output clean when introducing new topic labels in frontmatter.

### What was tricky to build

- The tricky part was not upload mechanics but keeping ticket metadata consistent after incremental edits and relation updates. Running doctor before upload avoided leaving hidden metadata debt.

### What warrants a second pair of eyes

- Remote folder naming conventions for reMarkable (if your team wants a different hierarchy).
- Whether to also upload the diary in the same bundle for future handoff packets.

### What should be done in the future

- Add a standard “ticket finalization” script that runs `doc relate`, `doctor`, and upload dry-run checks automatically.

### Code review instructions

- Inspect ticket metadata and task completion:
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/index.md`
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/tasks.md`
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/changelog.md`
- Confirm diary update and command records:
- `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/reference/01-diary.md`
- Confirm remote artifact existence at:
- `/ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK/HC-45 Desktop Framework Analysis and Plan`

### Technical details

- Upload command produced:
- `OK: uploaded HC-45 Desktop Framework Analysis and Plan.pdf -> /ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK`
- Verification command output included:
- `[f] HC-45 Desktop Framework Analysis and Plan`

## Step 4: Implement Hard-Cutover Tasks T1-T3 (Desktop Core State Move + Command Router + Shell Split)

I moved HC-45 from planning to implementation and executed the first three hard-cutover tasks in sequence. The implementation intentionally removed legacy state module paths and replaced the monolithic shell orchestration path with explicit controller/view and command router modules.

### Prompt Context

**User prompt (verbatim):** "Create tasks for the implementation, then implement them one by one, checking them off. Commit at appropriate intervals, and keep a detailed diary as you go."

**Assistant interpretation:** Add concrete implementation tasks into HC-45 and execute them in order with validation and documented handoff details.

**Inferred user intent:** Start actual HC-45 refactor work immediately, not just planning, and leave a traceable implementation record.

### Task setup

I added a dedicated implementation section in `tasks.md` with four hard-cutover tasks:

1. `T1` state move to `desktop/core/state` with legacy path deletion.
2. `T2` command routing extraction into dedicated module.
3. `T3` `DesktopShell` controller/view split.
4. `T4` validation/docs/changelog wrap-up.

### T1: Move windowing state to desktop core and remove legacy sources

#### What I changed

- Moved files:
  - `packages/engine/src/features/windowing/index.ts` -> `packages/engine/src/desktop/core/state/index.ts`
  - `packages/engine/src/features/windowing/selectors.ts` -> `packages/engine/src/desktop/core/state/selectors.ts`
  - `packages/engine/src/features/windowing/types.ts` -> `packages/engine/src/desktop/core/state/types.ts`
  - `packages/engine/src/features/windowing/windowingSlice.ts` -> `packages/engine/src/desktop/core/state/windowingSlice.ts`
- Removed legacy directory: `packages/engine/src/features/windowing/`
- Rewrote imports across engine internals, stories, tests, and store wiring to use `desktop/core/state` paths.
- Updated barrel export in `packages/engine/src/index.ts` from `./features/windowing` to `./desktop/core/state`.

#### Why

- Hard cutover required removing compatibility layer and old module paths.
- This establishes the new framework-first state boundary.

#### Validation

- `npm run -w packages/engine test` passed after path rewrites.

### T2: Extract desktop command routing to dedicated router module

#### What I changed

- Added `packages/engine/src/components/shell/windowing/desktopCommandRouter.ts`:
  - `routeDesktopCommand(commandId, ctx)` handles built-ins:
    - `window.open.home`
    - `window.close-focused`
    - `window.open.card.*`
    - `window.tile`
    - `window.cascade`
  - Returns boolean handled/pass-through contract.
- Added `packages/engine/src/components/shell/windowing/desktopCommandRouter.test.ts` with focused command routing tests.
- Wired `DesktopShell` to call `routeDesktopCommand(...)` and only delegate to host `onCommand` when not handled.
- Exported router API from `packages/engine/src/components/shell/windowing/index.ts`.

#### Why

- Reduces policy density in `DesktopShell` and creates explicit extension seam for future contribution pipeline work.

#### Validation

- New router test file passed in package test run.

### T3: Split DesktopShell into controller + view

#### What I changed

- Added `packages/engine/src/components/shell/windowing/desktopShellTypes.ts` for `DesktopShellProps` contract.
- Added `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`:
  - moved state selection, interaction wiring, command handling, menu/icon derivation, window-body caching, and drag overlay orchestration here.
- Added `packages/engine/src/components/shell/windowing/DesktopShellView.tsx`:
  - presentational rendering for menubar, icons, window layer, and toast.
- Replaced `packages/engine/src/components/shell/windowing/DesktopShell.tsx` with thin composition wrapper:
  - `useDesktopShellController(props)` -> `<DesktopShellView {...controller} />`
- Exported controller + view from `packages/engine/src/components/shell/windowing/index.ts`.

#### Why

- Implements HC-45 workstream goal of controller/view separation while preserving behavior.
- Makes future framework packaging and testing significantly easier.

#### What failed and how I fixed it

- First test run failed with parser error:
  - `Expected ">" but found "windowId"` in `useDesktopShellController.ts`.
- Cause: file contained JSX but used `.ts` extension.
- Fix: renamed to `useDesktopShellController.tsx` and re-ran tests.

#### Validation

- Final validation command:
  - `npm run -w packages/engine test`
- Result:
  - Storybook taxonomy check passed.
  - Vitest suite passed (`13` files, `146` tests).

### Outcome status

- `T1`: complete
- `T2`: complete
- `T3`: complete
- `T4`: pending (documentation/index/changelog finalization + commit hygiene)

### Notes for reviewers

- Verify there are no remaining `features/windowing` imports.
- Review `DesktopShell` behavior parity via existing shell/windowing stories and tests.
- Confirm command pass-through behavior for non-built-in command IDs.

## Step 5: Implement Workstream C and D (Contribution Contracts + Adapter Chain Decoupling)

I continued implementation with the next requested scope: Workstream C (extension contract formalization) and Workstream D (runtime adapter decoupling). This was a code-first pass focused on concrete contracts, controller integration, app migration for the first consumer, and test coverage.

### Prompt Context

**User prompt (verbatim):** "Ok, add tasks for C and D, continue."

**Assistant interpretation:** Add explicit ticket tasks for C and D, then proceed directly with implementation and validation.

**Inferred user intent:** Move beyond structural shell split and implement real extension/runtime decoupling mechanics now.

### Task bookkeeping updates

I added dedicated checked tasks in `tasks.md`:

- Workstream C:
  - `C1` contribution contracts/composer
  - `C2` contribution command lane integration
  - `C3` inventory app migration to contributions
- Workstream D:
  - `D1` adapter contract + adapter-chain renderer
  - `D2` default app/card/fallback adapters and controller decoupling
  - `D3` contribution-provided adapter precedence support

### Workstream C implementation details

#### New contract/composer module

Created `packages/engine/src/components/shell/windowing/desktopContributions.ts` with:

- `DesktopContribution`
- `DesktopCommandHandler`
- `DesktopCommandContext`
- `StartupWindowFactory`
- `composeDesktopContributions(...)`
- `routeContributionCommand(...)`

Key behavior implemented:

1. Deterministic command ordering by priority (stable sort).
2. Menu merge by section id with deterministic concatenation.
3. Icon collision policy:
   - throw in non-production
   - warn/skip in production
4. Startup window factories collected from contributions.

#### Controller integration

Updated `useDesktopShellController.tsx` to:

1. compose contributions via `composeDesktopContributions`.
2. derive menus/icons from contributions when legacy explicit props are absent.
3. execute contribution command handlers **before** built-ins.
4. dispatch startup windows (once per composition key) through controller-managed effect.

### Workstream D implementation details

#### New adapter contracts

Created `packages/engine/src/components/shell/windowing/windowContentAdapter.ts`:

- `WindowContentAdapter`
- `WindowAdapterContext`
- `renderWindowContentWithAdapters(...)`

Routing behavior:

- first adapter with `canRender` is asked to `render`.
- if adapter returns `null`, routing continues to allow fallback layers.

#### Default adapters

Created `packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx`:

1. app window adapter (`renderAppWindow` bridge)
2. HyperCard card adapter (`PluginCardSessionHost` rendering)
3. fallback adapter (generic placeholder)

#### Controller decoupling

`useDesktopShellController.tsx` no longer directly instantiates `PluginCardSessionHost` in `buildWindowBody`. Instead it now builds an adapter list:

- contribution-provided adapters first
- default adapters afterward

and renders via `renderWindowContentWithAdapters(...)`.

This isolates runtime-specific rendering policy behind adapters and narrows controller responsibility to orchestration.

### Inventory app migration to contributions

Updated `apps/inventory/src/App.tsx` to move desktop customization into contribution objects:

1. menus/icons are now contribution data.
2. command handling migrated to contribution command handlers.
3. startup windows moved to contribution startup factories (chat + dev redux perf window).
4. removed local mount effect + `onCommand`/`menus`/`icons` prop wiring to shell.

The app still uses `renderAppWindow` for now, but runtime window rendering now flows through the adapter chain in the controller.

### Tests added/updated

Added:

- `desktopContributions.test.ts`
- `windowContentAdapter.test.ts`

Existing suite also validates:

- command router tests
- windowing tests
- plugin/runtime integration tests

### Validation

Executed:

- `npm run -w packages/engine test`

Result:

- taxonomy check passed
- vitest passed: `15` files, `153` tests

### Outcome

Workstream C and D implementation tasks are now complete in-ticket for this pass.

Remaining broader HC-45 roadmap work still includes CSS/theme modularization and any further package/API surface polishing beyond current code cutover.

## Step 6: Backfill and Correctness Pass After C/D Implementation

I backfilled missing implementation context after C/D and verified the final code health status across both engine tests and full workspace typecheck.

### What was missing

The earlier Workstream C/D diary captured the architectural and feature changes but did not fully include the follow-up correctness sweep that occurred after integrating contribution contracts into inventory.

### Backfilled details

1. During full `npm run typecheck`, additional issues appeared that were not surfaced by package-local tests:
   - `process` usage in contribution collision logic/tests caused typing errors in this workspace configuration.
   - `dispatch` type in contribution command context was too narrow.
   - `windowContentAdapter.test.ts` used an incomplete `CardStackDefinition` fixture.
2. I resolved these by:
   - removing `process` dependence from runtime logic and introducing an explicit `onIconCollision` option in composer.
   - making command context dispatch compatible with Redux dispatch shape used by shell controller.
   - completing adapter test fixtures to satisfy type contract.
3. Revalidated with:
   - `npm run typecheck` (workspace)
   - `npm run -w packages/engine test`

### Commits associated with C/D delivery

- `e1778aa` — `feat(engine): add desktop contributions and window content adapters`
- `40e8621` — `docs(hc-45): add and complete workstream c/d tasks`

### Current status before Workstream E

- A-D implementation slices are complete for the current pass.
- Next focus is Workstream E CSS modularization and hard cutover from legacy theme import path.

## Step 7: Implement Workstream E (CSS Modularization Hard Cutover)

I executed the CSS workstream as a hard cutover by splitting the legacy monolithic stylesheet and removing the old import path from runtime entrypoints.

### Prompt Context

**User prompts (verbatim):**
- "Ok, let's do the CSS one"
- "Add tasks to the ticket. then do them. Continue committing and keeping a diary"
- "backfill your diary btw, iut seems you've been neglecting it. then continue"

**Assistant interpretation:** Backfill diary, add explicit Workstream E tasks, implement them end-to-end, validate, and commit in clean slices.

### Task additions and completion

Added Workstream E tasks in `tasks.md` and completed all:

1. `E1` split `theme/base.css` into modular desktop packs.
2. `E2` migrate app + Storybook imports away from `base.css`.
3. `E3` remove `base.css` and update comments/docs.
4. `E4` run validation and update ticket diary/changelog.

### CSS split details

Legacy source:

- `packages/engine/src/theme/base.css` (removed)

New modular packs created:

- `packages/engine/src/theme/desktop/tokens.css`
- `packages/engine/src/theme/desktop/shell.css`
- `packages/engine/src/theme/desktop/primitives.css`
- `packages/engine/src/theme/desktop/chat.css`
- `packages/engine/src/theme/desktop/syntax.css`
- `packages/engine/src/theme/desktop/animations.css`
- `packages/engine/src/theme/desktop/theme/macos1.css`

### Import cutover

Updated to modular entrypoint import (`packages/engine/src/theme/index.ts`) in:

- `.storybook/preview.ts`
- `apps/inventory/src/main.tsx`
- `apps/todo/src/main.tsx`
- `apps/crm/src/main.tsx`
- `apps/book-tracker-debug/src/main.tsx`

Updated theme contract docs/comments:

- `packages/engine/src/index.ts` (usage comments)
- `packages/engine/src/theme/classic.css` (layering comment)
- `packages/engine/src/theme/modern.css` (layering comment)
- `docs/js-api-user-guide-reference.md` (theming import example)

### What failed and what I fixed

- Initial typecheck/test pass for C/D had already been green, but this CSS cutover required re-running full validation because theme imports changed across all apps and Storybook.
- No new errors were introduced by the CSS split itself.

### Validation

Executed:

- `npm run typecheck`
- `npm run -w packages/engine test`

Result:

- TypeScript build: pass
- Engine tests: pass (`15` files, `154` tests)

### Outcome

Workstream E is complete for HC-45 hard-cutover scope:

- legacy `base.css` removed,
- modular packs are in place,
- all app/storybook imports now use the modular theme entry,
- ticket metadata and diary/changelog are updated.

## Step 8: Postmortem Pass Across HC-45, HC-47, and HC-48 + reMarkable Upload

I produced a full retrospective document in HC-45 that maps the original implementation plan (Workstreams A-G) to what actually landed in code and in follow-up tickets. The postmortem also calls out deferred cleanup work, residual risks, and practical next-step options.

This step closes the loop requested after implementation: it explains where we are now relative to the original HC-45 analysis and implementation plan, instead of only listing completed commits.

### Prompt Context

**User prompt (verbatim):** "Ok, let's basically do a postmortem, starting with the analysis we did in HC-45, and now checking where we are at, what we all did, and how things line up. Also, anything that could further be done or was skipped in the cleanup. Store the detailed postmortem in HC-45 ticket, and then upload to remarkable."

**Assistant interpretation:** Write a detailed plan-vs-actual retrospective into HC-45 and upload that specific postmortem doc to reMarkable.

**Inferred user intent:** Get a precise execution audit and gap analysis, not another proposal.

### What I did

1. Added new HC-45 design doc:
   - `design-doc/03-postmortem-hc-45-desktop-framework-execution-and-current-state.md`
2. Wrote a detailed postmortem with:
   - timeline of execution commits,
   - plan-vs-actual matrix for Workstreams A-G,
   - current architecture snapshot,
   - deferred/skipped scope,
   - prioritized cleanup opportunities.
3. Updated HC-45 metadata docs:
   - `index.md` (added postmortem and F/G status lines)
   - `tasks.md` (added/completed postmortem tasks)
   - `changelog.md` (recorded postmortem addition)
4. Ran metadata quality check:
   - `docmgr doctor --ticket HC-45-DESKTOP-FRAMEWORK --stale-after 30`
5. Uploaded the postmortem to reMarkable:
   - `remarquee upload md --dry-run ... --remote-dir /ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK`
   - `remarquee upload md ... --remote-dir /ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK`
   - `remarquee cloud ls /ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK --long --non-interactive`

### Why

- HC-45 had strong analysis + implementation artifacts, but lacked one consolidated “what landed vs what remains” narrative.
- A retrospective clarifies ticket closure criteria and prevents re-litigating already-completed workstreams.

### What worked

- The codebase had enough commit and ticket traceability to map all A-G outcomes concretely.
- reMarkable upload succeeded and remote listing confirmed the new postmortem artifact.

### What didn't work

- First upload attempt used an unsupported flag (`--name`) for this remarquee `upload md` command variant.
- Fix: reran with supported flags (`--remote-dir`, no `--name`).

### What I learned

- In this CLI version, `upload md` differs from `upload bundle` flag surface and derives filename from source path.
- The original HC-45 plan's documentation deliverables are mostly represented but not yet consolidated into standalone references.

### What was tricky to build

- The tricky part was reconciling execution spread across three tickets (HC-45, HC-47, HC-48) back into one coherent HC-45 postmortem narrative without losing chronology.

### What warrants a second pair of eyes

- Decision on whether to formally close HC-45 now (A-G delivered) or keep it open for documentation consolidation work.
- Decision on whether to keep subpath exports as the long-term packaging strategy or split into independent publishable packages.

### What should be done in the future

1. Decide HC-45 closure posture (close vs retain for follow-up docs).
2. If retained, add dedicated docs for Quickstart/Contribution API/Adapter Guide/Theming Contract/Perf model.
3. Add repeatable performance baseline playbook with explicit thresholds.

### Code review instructions

- Read postmortem first:
  - `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/design-doc/03-postmortem-hc-45-desktop-framework-execution-and-current-state.md`
- Verify HC-45 metadata updates:
  - `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/index.md`
  - `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/tasks.md`
  - `ttmp/2026/02/17/HC-45-DESKTOP-FRAMEWORK--desktop-shell-and-windowing-reusable-framework-cleanup/changelog.md`
- Verify remote artifact exists:
  - `/ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK/03-postmortem-hc-45-desktop-framework-execution-and-current-state`

### Technical details

- Upload result: `OK: uploaded 03-postmortem-hc-45-desktop-framework-execution-and-current-state.pdf -> /ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK`
- Remote verification includes:
  - `03-postmortem-hc-45-desktop-framework-execution-and-current-state`
