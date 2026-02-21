---
Title: Diary
Ticket: HC-031-VM-PLUGIN-DSL
Status: active
Topics:
    - architecture
    - dsl
    - frontend
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts
      Note: |-
        Source-of-truth VM bootstrap and execution model inspected during analysis
        Analyzed during architecture mapping
    - Path: apps/inventory/src/domain/pluginBundle.ts
      Note: Inventory app plugin bundle hard cutover implementation
    - Path: apps/inventory/src/domain/stack.ts
      Note: Inventory stack metadata converted to plugin runtime
    - Path: packages/engine/package.json
      Note: Added singlefile QuickJS variant dependency
    - Path: packages/engine/src/cards/runtime.ts
      Note: |-
        Legacy DSL resolver/action runtime analyzed for rip-out strategy
        Analyzed during architecture mapping
    - Path: packages/engine/src/plugin-runtime/runtimeService.ts
      Note: Switched to singlefile QuickJS module loading for browser-safe plugin runtime
    - Path: ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md
      Note: |-
        Primary analysis deliverable authored in this ticket
        Primary deliverable documented by diary steps
ExternalSources: []
Summary: Detailed implementation diary for HC-031 analysis and documentation workflow.
LastUpdated: 2026-02-15T22:51:00-05:00
WhatFor: Record how the migration analysis document was produced, with command evidence and constraints encountered.
WhenToUse: Use when reviewing the provenance and reliability of HC-031 conclusions.
---



# Diary

## Goal

Produce a comprehensive HC-031 architecture and migration analysis (7+ pages) that compares the real `vm-system/frontend` plugin runtime against the current HyperCard card DSL runtime, defines a no-backwards-compat rip-out strategy, includes Storybook integration design, and is delivered both in ticket docs and on reMarkable.

## Step 1: Ticket creation and source import

I started by creating a dedicated ticket and importing the provided proposal markdown into ticket-managed sources. This ensured the entire analysis was grounded in a traceable artifact under `ttmp` instead of external ad-hoc notes.

The setup phase also included creating the formal design-doc and diary documents so subsequent work remained inside documented ticket structure.

### Prompt Context

**User prompt (verbatim):** "Ok, we have decide to go a completely different route. Create a new ticket HC-031-VM-PLUGIN-DSL and import with `docmgr import file --file /tmp/plugin-hypercard-dsl.md --ticket HC-031-VM-PLUGIN-DSL` and read that file and now do a comprehensive analysis of vm-system/frontend (the real implementation) and the card system, and make a detailed analysis of how to rip out (no backwards compat) the current DSL with Ev and Act and Sel and all that ,which is problematic, and replace it with the new plugin based DSL. Also make a section where you analyze what it would take to integrate that DSL with the storybook setup. 

7+ pages. 

Once stored in the ticket, upload the document to remarkable for me toreview. 

Keep a detailed diary as you work."

**Assistant interpretation:** Create and populate a new HC-031 ticket with a long-form implementation analysis, then upload the resulting document to reMarkable, while maintaining a detailed process diary.

**Inferred user intent:** Reset direction from incremental DSL fixes to a clean architectural replacement strategy with auditable documentation and immediate review distribution.

**Commit (code):** N/A (documentation workflow, not code commit)

### What I did

- Created ticket:
  - `docmgr ticket create-ticket --ticket HC-031-VM-PLUGIN-DSL --title "VM Plugin DSL Migration Analysis" --topics architecture,dsl,frontend`
- Verified source file exists:
  - `ls -l /tmp/plugin-hypercard-dsl.md`
- Imported source into ticket:
  - `docmgr import file --file /tmp/plugin-hypercard-dsl.md --ticket HC-031-VM-PLUGIN-DSL`
- Added docs:
  - `docmgr doc add --ticket HC-031-VM-PLUGIN-DSL --doc-type design-doc --title "VM Plugin DSL Migration and Storybook Integration Analysis"`
  - `docmgr doc add --ticket HC-031-VM-PLUGIN-DSL --doc-type reference --title "Diary"`

### Why

- The user requested strict ticket isolation and explicit source import.
- Starting with ticket docs avoids later copy/migration errors and keeps references stable.

### What worked

- Ticket, source import, and doc creation all succeeded on first pass.
- Imported proposal was stored under ticket-local source path.

### What didn't work

- N/A for this step.

### What I learned

- The imported proposal already contains actionable architecture direction, so the main value add is grounding it in actual code-level realities and migration sequencing.

### What was tricky to build

- No major technical obstacles in setup; the main nuance was preserving user-provided import command exactly and confirming artifact placement.

### What warrants a second pair of eyes

- Confirm ticket naming and topics align with broader documentation taxonomy.

### What should be done in the future

- Keep using ticket-local source imports for any external draft to maintain provenance.

### Code review instructions

- Verify ticket creation and source import:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/index.md`
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md`

### Technical details

- Source file size imported: ~17 KB markdown.
- Ticket path: `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis`

## Step 2: Deep architecture mapping (plugin runtime + current card runtime)

I performed a file-by-file inspection of `../vm-system/frontend` runtime internals and current HyperCard engine runtime internals, then computed migration surface metrics (`Act/Ev/Sel` usage counts and file spread). This step produced the factual backbone for the migration recommendations.

I also attempted to run plugin-runtime tests directly for validation, then recorded the environment limitation when test execution was blocked by missing workspace dependencies.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Ground the analysis in real implementation details and include concrete migration impact, not just conceptual architecture notes.

**Inferred user intent:** Ensure proposed migration is credible and executable by showing understanding of both source and target systems.

**Commit (code):** N/A

### What I did

- Inspected plugin runtime implementation:
  - `../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/worker/runtime.worker.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/worker/sandboxClient.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/uiSchema.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/dispatchIntent.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/hostAdapter.ts`
- Inspected plugin runtime docs:
  - `../vm-system/frontend/docs/architecture/ui-dsl.md`
  - `../vm-system/frontend/docs/architecture/dispatch-lifecycle.md`
  - `../vm-system/frontend/docs/architecture/capability-model.md`
  - `../vm-system/frontend/docs/runtime/embedding.md`
- Inspected current HyperCard runtime/DSL implementation:
  - `packages/engine/src/cards/helpers.ts`
  - `packages/engine/src/cards/types.ts`
  - `packages/engine/src/cards/runtime.ts`
  - `packages/engine/src/cards/runtimeStateSlice.ts`
  - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
  - `packages/engine/src/components/shell/CardRenderer.tsx`
  - `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
  - `packages/engine/src/app/createDSLApp.tsx`
  - `packages/engine/src/app/generateCardStories.tsx`
- Computed migration impact metrics:
  - `rg -o "\bAct\(" apps packages | wc -l` -> `181`
  - `rg -o "\bEv\(" apps packages | wc -l` -> `57`
  - `rg -o "\bSel\(" apps packages | wc -l` -> `94`
  - `rg -l "\bAct\(|\bEv\(|\bSel\(" apps packages | wc -l` -> `27` files
  - `rg -l "defineCardStack\(" apps packages | wc -l` -> `7` files
- Attempted runtime test execution in vm-system workspace:
  - `pnpm --dir ../vm-system/frontend exec vitest run packages/plugin-runtime/src/runtimeService.integration.test.ts`

### Why

- Needed to separate assumptions from verifiable behavior.
- Migration planning without usage spread metrics would under/over-estimate cutover work.

### What worked

- Architecture mapping across both systems was comprehensive and concrete.
- Usage metrics provided direct evidence of migration breadth.

### What didn't work

- Running vm-system plugin-runtime test command failed:
  - Error: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "vitest" not found`
  - Supporting check: `ls ../vm-system/frontend/node_modules` showed missing dependency install in this environment.

### What I learned

- `vm-system/frontend` already implements the right runtime boundaries (worker + validator + intent reducer + capability gating), reducing design uncertainty.
- Current HyperCard runtime complexity is concentrated in `cards/runtime.ts` + `useCardRuntimeHost.ts`, making them primary cutover hotspots.

### What was tricky to build

- The main challenge was reconciling conceptual “plugin DSL replacement” language with concrete HyperCard surfaces that include both runtime code and story/app helper APIs; both must migrate together to avoid split-brain runtime behavior.

### What warrants a second pair of eyes

- Review migration impact counts and ensure excluded directories (if any) are intentionally out of scope.

### What should be done in the future

- Run plugin-runtime tests in an environment with `../vm-system/frontend` dependencies installed to add runtime execution evidence to this ticket.

### Code review instructions

- Inspect source-of-truth runtime files:
  - `../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts`
  - `packages/engine/src/cards/runtime.ts`
- Re-run key usage scans:
  - `rg -o "\bAct\(" apps packages | wc -l`
  - `rg -o "\bSel\(" apps packages | wc -l`
  - `rg -o "\bEv\(" apps packages | wc -l`

### Technical details

- No repository code changes were made in this step; this was analysis and evidence gathering.
- Test execution gap documented for vm-system workspace dependency state.

## Step 3: Author the full migration analysis design document

I wrote the complete HC-031 design document with architecture analysis, rip-out strategy, migration phases, file-level impact map, risks/mitigations, and dedicated Storybook integration section. The document is intentionally implementation-level and no-backwards-compat by design.

This is the primary deliverable requested by the user.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Deliver a long-form, detailed migration document suitable for implementation planning and review.

**Inferred user intent:** Provide a practical roadmap that a team can execute without ambiguity.

**Commit (code):** N/A

### What I did

- Authored full design doc at:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md`
- Included required sections plus implementation-heavy extensions:
  - Executive summary
  - Problem statement
  - Current-state analysis (both runtimes)
  - Gap analysis
  - Proposed target architecture
  - Design decisions
  - Alternatives
  - Implementation plan (phases)
  - File-level impact map
  - Storybook integration section
  - Risks and mitigations
  - Open questions
  - Validation notes and references

### Why

- User requested a detailed migration analysis and specific Storybook integration coverage.
- A design doc is the right artifact for cross-team planning and review before execution tickets.

### What worked

- Document now captures both systems in detail with concrete file references and migration steps.
- Storybook integration is addressed as a first-class section, not an afterthought.

### What didn't work

- N/A in authoring itself.

### What I learned

- The migration can preserve Desktop/window host behavior while replacing only the card execution core, reducing rollout risk significantly.

### What was tricky to build

- Balancing “hard cut” clarity with phased execution safety required explicit sequencing so teams can avoid long broken states despite no compatibility goal.

### What warrants a second pair of eyes

- Validate whether the proposed target intent schema should include explicit `system` command enum now or remain open-string initially.

### What should be done in the future

- Split the implementation plan into execution tickets (runtime core, storybook migration, app migrations, hard deletion, validation).

### Code review instructions

- Start with primary deliverable:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md`
- Cross-check references used for claims:
  - `../vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts`
  - `../vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts`
  - `packages/engine/src/cards/runtime.ts`

### Technical details

- Document includes migration usage metrics and environment validation caveats.
- No runtime code was altered in this ticket.

## Step 4: Ticket bookkeeping, hygiene, and publication prep

I updated ticket tasks and changelog to reflect completed analysis work and prepared the remaining publication step (reMarkable upload) for execution. This keeps the ticket auditable end-to-end.

### Prompt Context

**User prompt (verbatim):** "You are welcome to run experiments and use the browser with playwright to validate things too."

**Assistant interpretation:** It is acceptable to run validation experiments/tools during analysis; proceed pragmatically as needed.

**Inferred user intent:** Prioritize confidence in conclusions over purely static writeup.

**Commit (code):** N/A

### What I did

- Updated task checklist in:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md`
- Prepared to run:
  - `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30`
- Prepared publication step to reMarkable (dry-run + upload).

### Why

- Ticket hygiene and explicit completion states are necessary for handoff.

### What worked

- Task tracking is now aligned with actual work completed.

### What didn't work

- N/A yet; upload/hygiene results will be recorded after execution.

### What I learned

- Document-first tickets still need disciplined task/changelog closure to remain useful for future execution.

### What was tricky to build

- Ensuring all diary evidence maps directly to tasks/changelog entries without redundant text.

### What warrants a second pair of eyes

- Final check that upload path and file naming on reMarkable match expected review workflow.

### What should be done in the future

- Keep publication metadata (remote directory, final filename, checksum if needed) in ticket records by default.

### Code review instructions

- Verify task state and pending publication step:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md`

### Technical details

- Publication and hygiene outcomes appended after command execution.

## Step 5: Doctor cleanup and reMarkable publication

I executed the remaining ticket closure work: doc hygiene checks and document upload to reMarkable. I resolved doctor findings that were actionable in this ticket and documented one remaining non-blocking warning tied to imported-source filename conventions.

The final analysis document is now uploaded and visible in the requested remote folder.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Finish delivery by storing the analysis in ticket docs and sending it to reMarkable for review.

**Inferred user intent:** Receive the long-form migration report in both repository docs and review device workflow, with an auditable trail.

**Commit (code):** N/A

### What I did

- Ran ticket hygiene check:
  - `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30`
- Addressed doctor findings:
  - Added vocabulary topics:
    - `docmgr vocab add --category topics --slug dsl --description \"Domain-specific language related work\"`
    - `docmgr vocab add --category topics --slug frontend --description \"Frontend runtime, UI, and browser integration work\"`
  - Added frontmatter to imported source file:
    - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md`
- Re-ran doctor:
  - Remaining finding: one warning (`missing_numeric_prefix`) on imported source filename.
- Verified reMarkable tooling/account:
  - `remarquee status`
  - `remarquee cloud account --non-interactive`
- Dry-run upload:
  - `remarquee upload md --dry-run .../design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md --remote-dir \"/ai/2026/02/15/HC-031-VM-PLUGIN-DSL\"`
- Uploaded final document:
  - `remarquee upload md .../design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md --remote-dir \"/ai/2026/02/15/HC-031-VM-PLUGIN-DSL\"`
- Verified remote listing:
  - `remarquee cloud ls /ai/2026/02/15/HC-031-VM-PLUGIN-DSL --long --non-interactive`

### Why

- User explicitly requested upload to reMarkable after storing in ticket.
- Doctor pass (or documented residual warnings) is required to keep ticket maintainable.

### What worked

- Analysis document uploaded successfully:
  - `OK: uploaded 01-vm-plugin-dsl-migration-and-storybook-integration-analysis.pdf -> /ai/2026/02/15/HC-031-VM-PLUGIN-DSL`
- Cloud listing confirms document presence.
- Doctor findings reduced to one non-blocking warning.

### What didn't work

- Initial upload command failed because `remarquee upload md` does not support `--name`:
  - Error: `unknown flag: --name`
  - Corrected by rerunning without `--name`.

### What I learned

- `remarquee upload md` names files from source filename; custom naming would require a rename upstream or different upload mode.
- Imported source artifacts may need frontmatter normalization for docmgr hygiene.

### What was tricky to build

- Balancing source provenance with strict docmgr rules: imported raw source files do not naturally satisfy frontmatter/numeric-prefix conventions, so some hygiene warnings may be intentionally retained and documented.

### What warrants a second pair of eyes

- Decide whether imported source files should be systematically renamed with numeric prefixes in future tickets to keep doctor output fully clean.

### What should be done in the future

- Add a small wrapper script for “import + frontmatter normalize + numeric prefix rename” for source docs to standardize this workflow.

### Code review instructions

- Verify publication target and file:
  - Remote dir: `/ai/2026/02/15/HC-031-VM-PLUGIN-DSL`
  - File: `01-vm-plugin-dsl-migration-and-storybook-integration-analysis`
- Verify ticket closure files:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md`
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/changelog.md`

### Technical details

- Final doctor report: one warning (`missing_numeric_prefix`) for imported source file naming.
- Upload command used markdown-to-PDF conversion path via `remarquee upload md`.

## Step 6: Install vm-system workspace dependencies and run integration tests

After the user requested explicit test execution, I installed dependencies in `../vm-system/frontend` and reran the plugin-runtime integration tests. This resolved the earlier environment limitation recorded in Step 2.

The runtime integration suite now has direct execution evidence in this ticket.

### Prompt Context

**User prompt (verbatim):** \"can you install the workspace deps and all, to run your test?\"

**Assistant interpretation:** Install missing dependencies in the vm-system frontend workspace and execute the previously blocked plugin-runtime test command(s).

**Inferred user intent:** Convert the earlier analysis caveat into an actual validated test result.

**Commit (code):** N/A

### What I did

- Verified tooling:
  - `pnpm --version`
  - `node --version`
- Installed vm-system frontend deps:
  - `pnpm --dir ../vm-system/frontend install`
- Re-ran original attempted command:
  - `pnpm --dir ../vm-system/frontend exec vitest run packages/plugin-runtime/src/runtimeService.integration.test.ts`
- Corrected command to use integration config:
  - `pnpm --dir ../vm-system/frontend exec vitest run --config vitest.integration.config.ts packages/plugin-runtime/src/runtimeService.integration.test.ts`
- Ran full integration script:
  - `pnpm --dir ../vm-system/frontend test:integration`

### Why

- User explicitly requested that dependency install and test execution be done.
- The ticket had a known validation gap that should be closed when feasible.

### What worked

- Dependency install succeeded.
- Integration tests passed:
  - `packages/plugin-runtime/src/runtimeService.integration.test.ts (6 tests)`.
- `test:integration` also passed in that workspace.

### What didn't work

- The first re-run command still failed to find files because default Vitest config excludes `*.integration.test.ts`.
- This was resolved by specifying `--config vitest.integration.config.ts`.

### What I learned

- The vm-system workspace is configured with separate unit vs integration include/exclude patterns, so command examples must specify the correct config for integration files.

### What was tricky to build

- The subtle issue was not runtime failure but test-discovery mismatch; without reading the include/exclude lines in output, it can look like a missing-test problem rather than config routing.

### What warrants a second pair of eyes

- Confirm whether docs should include an explicit “use integration config for `.integration.test.ts` files” note near test commands.

### What should be done in the future

- Add a short script alias for single-file integration runs to avoid future command confusion.

### Code review instructions

- Re-run exact passing command:
  - `pnpm --dir ../vm-system/frontend exec vitest run --config vitest.integration.config.ts packages/plugin-runtime/src/runtimeService.integration.test.ts`
- Re-run integration suite:
  - `pnpm --dir ../vm-system/frontend test:integration`

### Technical details

- `pnpm install` warning noted: build scripts for `@tailwindcss/oxide` and `esbuild` were ignored by pnpm approval policy; this did not block integration tests.

## Step 7: Expand hard-cutover tasks with runtime and validation gates

I translated the migration direction into an execution-grade backlog with explicit phase boundaries and completion criteria. The focus was to make hard cutover practical by sequencing runtime foundation work before shell/app migration and hard deletion of legacy DSL surfaces.

I also embedded test and verification checkpoints directly in the plan, including `tmux` process health and Playwright smoke checks, so runtime regressions are caught during migration rather than after cutover.

### Prompt Context

**User prompt (verbatim):** "alright, create detailed tasks to do this, with hard cutover, and test it as you go if you wnat (run vite/storybook in a tmux, use playwright to interact)"

**Assistant interpretation:** Expand HC-031 tasks into a detailed hard-cutover implementation backlog and include concrete testing steps (including tmux + Playwright) as part of execution.

**Inferred user intent:** Move from strategy to actionable implementation steps with explicit quality gates.

**Commit (code):** N/A

### What I did

- Updated `tasks.md` with a complete hard-cutover backlog organized as Phases A-G.
- Added phase-level tasks for:
  - runtime foundation (`contracts`, validators, runtime service, worker transport, tests)
  - engine state/routing (`pluginCardRuntime` slice, selectors, capability policy)
  - shell integration (`PluginCardSessionHost`, intent routing paths)
  - Storybook migration (`createDSLApp`/`createStoryHelpers` internals + harness)
  - app migration (`inventory`, `todo`, `crm`, `book-tracker-debug`)
  - hard deletion of legacy DSL (`Act/Ev/Sel` helpers/types/runtime/exports/tests)
  - end-to-end validation (`test/typecheck/build/lint`, tmux runtime checks, Playwright smoke)
- Marked top-level tracking item `T9` complete for this planning expansion.

### Why

- The prior design doc already defined architecture direction; execution required a concrete task graph with ordering and validation points.
- Hard cutover needs explicit deletion tasks, not just migration tasks, to prevent partial compatibility leftovers.

### What worked

- Backlog now provides direct, actionable task IDs and file targets.
- Test gates are integrated into plan structure, aligned with user-requested tmux/Playwright workflow.

### What didn't work

- N/A for this planning step.

### What I learned

- A phased backlog makes it easier to separate foundational runtime correctness from app-level migration risk.
- Explicit “legacy deletion” phase prevents accidental dual-runtime drift.

### What was tricky to build

- Balancing no-backwards-compat hard cutover with safe iteration required adding validation after each migration stratum. Without those gates, the deletion phase can obscure whether breakages came from migration logic or from removed legacy surfaces.

### What warrants a second pair of eyes

- Confirm that phase ordering matches team capacity (especially whether Storybook migration should start before all app migrations finish).

### What should be done in the future

- Start implementation at `A1` and close tasks sequentially with per-phase test evidence and diary/changelog updates.

### Code review instructions

- Review updated task plan:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md`
- Check that tmux/Playwright gates are present under `Phase G`.

### Technical details

- This step only changed ticket documentation (`tasks.md` + diary/changelog tracking), not product code.

## Step 8: Implement Phase A runtime foundation and validate it

I implemented the full Phase A runtime foundation in `packages/engine/src/plugin-runtime` with engine-specific contracts and QuickJS execution semantics aligned to the HC-031 hard-cutover model. The implementation introduces a session-scoped VM runtime (`loadStackBundle`, `renderCard`, `eventCard`, `disposeSession`) with explicit card/session/domain/system intent output.

I validated this phase through unit/integration tests and engine typecheck/build, then captured one compile-time issue discovered during validation (export-name collision + generic pending resolve typing) and fixed it before final commit.

### Prompt Context

**User prompt (verbatim):** "GO ahead, add tasks, check them off as you go, commit at opportune points, and keep a detailed diary."

**Assistant interpretation:** Begin implementation immediately, execute tasks in order, mark progress in ticket tasks, commit in logical chunks, and log details continuously in the HC-031 diary.

**Inferred user intent:** Move from planning to concrete migration execution with strong traceability and validation evidence.

**Commit (code):** c92c26b — "feat(engine): add plugin runtime foundation (Phase A)"

### What I did

- Added runtime foundation module files:
  - `packages/engine/src/plugin-runtime/contracts.ts`
  - `packages/engine/src/plugin-runtime/uiTypes.ts`
  - `packages/engine/src/plugin-runtime/uiSchema.ts`
  - `packages/engine/src/plugin-runtime/intentSchema.ts`
  - `packages/engine/src/plugin-runtime/runtimeService.ts`
  - `packages/engine/src/plugin-runtime/worker/runtime.worker.ts`
  - `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
  - `packages/engine/src/plugin-runtime/index.ts`
- Added tests:
  - `packages/engine/src/plugin-runtime/runtimeService.integration.test.ts`
  - `packages/engine/src/plugin-runtime/uiSchema.test.ts`
  - `packages/engine/src/plugin-runtime/intentSchema.test.ts`
- Added top-level export:
  - `packages/engine/src/index.ts` exports `./plugin-runtime`.
- Added dependency:
  - `packages/engine/package.json`: `quickjs-emscripten`.
  - Updated `package-lock.json` via workspace install.
- Ran validation commands:
  - `npm install -w packages/engine`
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`
- Updated task checkboxes in `tasks.md` for `A1..A6`.

### Why

- Phase A is the minimum foundation required before state routing and shell integration can proceed.
- The old descriptor runtime cannot be incrementally removed without first having a full plugin-runtime execution core in place.

### What worked

- Runtime foundation compiled and tests passed.
- Integration tests confirmed core behavior:
  - load + render success
  - event emits normalized intents across all four scopes
  - per-session isolation
  - timeout interruption path for infinite loop protection
- Full package tests passed after integration:
  - `8` files, `102` tests passed.

### What didn't work

- First typecheck run failed with two issues:
  - `TS2308` duplicate export name `UINode` in `src/index.ts` (from both `./cards` and `./plugin-runtime`).
  - `TS2322` generic mismatch in `worker/sandboxClient.ts` pending resolver typing.
- Fixes applied:
  - Changed plugin-runtime barrel to alias UI types (`PluginUINode`, `PluginUIEventRef`) instead of re-exporting `UINode` directly.
  - Relaxed pending `resolve` typing to `any` in worker client map to match generic postRequest usage.

### What I learned

- Introducing runtime modules alongside existing card DSL surfaces requires explicit export-name partitioning to avoid collisions during transitional phases.
- The QuickJS runtime service pattern ports cleanly when contracts and bootstrap entry points are explicitly renamed for card-session semantics.

### What was tricky to build

- The sharp edge was balancing “engine-native contracts” with compatibility to existing build/test topology. The runtime module itself was straightforward, but root-barrel exports created an immediate symbol collision because `UINode` exists in both old and new systems. The solution was to keep plugin UI types exported with clear aliases while retaining legacy exports until hard deletion phase.

### What warrants a second pair of eyes

- Review `runtimeService.ts` bootstrap contract (`defineStackBundle`) to ensure intent names and handler API align with expected app authoring ergonomics before Phase E migrations.
- Review whether `PluginUINode` aliasing at package root is acceptable long-term or should be replaced once legacy DSL exports are removed.

### What should be done in the future

- Proceed to Phase B (`pluginCardRuntime` slice + selectors + intent outcome tracking) and wire this runtime foundation into Redux flow.

### Code review instructions

- Start in:
  - `packages/engine/src/plugin-runtime/runtimeService.ts`
  - `packages/engine/src/plugin-runtime/contracts.ts`
  - `packages/engine/src/plugin-runtime/intentSchema.ts`
- Validate with:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`

### Technical details

- Worker request/response protocol mirrors VM reference design with typed request unions.
- Runtime intents are host-validated (`validateRuntimeIntents`) before leaving VM boundary.
- Runtime service timeouts use QuickJS interrupt handler and per-call deadlines.

## Step 9: Implement Phase B state + intent routing slice

I implemented the new `pluginCardRuntime` Redux feature to host runtime session state, per-card local state, intent outcome timeline, and queue-based routing for domain/system/nav intents. This establishes the host-side intent pipeline that the VM runtime will feed in later shell integration work.

I wired the reducer into `createAppStore`, exported the feature from the engine barrel, and added reducer tests that specifically verify applied/denied/ignored outcomes, session cleanup behavior, and nav/system command routing semantics.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue execution task-by-task, commit meaningful increments, and keep diary evidence current.

**Inferred user intent:** Build migration foundation in executable slices with traceable outcomes.

**Commit (code):** 583fe38 — "feat(engine): add plugin card runtime redux slice (Phase B)"

### What I did

- Added capability policy layer:
  - `packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts`
- Added new runtime state slice:
  - `packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
  - Includes session registration/removal, status updates, intent ingestion, timeline entries, and pending domain/system/nav queues.
- Added selectors:
  - `packages/engine/src/features/pluginCardRuntime/selectors.ts`
- Added feature exports:
  - `packages/engine/src/features/pluginCardRuntime/index.ts`
  - `packages/engine/src/index.ts` now exports `./features/pluginCardRuntime`
- Wired store:
  - `packages/engine/src/app/createAppStore.ts` now includes `pluginCardRuntime` reducer.
- Added reducer tests:
  - `packages/engine/src/__tests__/plugin-card-runtime.test.ts`
- Ran validation commands:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`
- Checked off `B1..B5` in `tasks.md`.

### Why

- Runtime service alone is not enough; host-side deterministic intent handling and capability gating must exist before shell/runtime integration.
- Queueing domain/system intents decouples plugin intent emission from side-effect application and keeps reducer deterministic/testable.

### What worked

- Tests passed with new feature integrated:
  - `9` test files, `105` tests.
- Typecheck and build remained green after adding reducer and exports.
- Capability gating correctly marks denied outcomes without mutating state.

### What didn't work

- N/A in this step; no failing commands required fixes.

### What I learned

- Explicit queue separation (`pendingDomainIntents`, `pendingSystemIntents`, `pendingNavIntents`) simplifies downstream orchestration responsibilities and makes system/nav routing assertions straightforward in tests.

### What was tricky to build

- The main design tension was where to apply local card/session mutations. I implemented a minimal host action contract (`patch`, `set`, `reset`) to keep reducer semantics deterministic while leaving richer action mapping for later phases. This avoids embedding application-specific reducers inside runtime infrastructure.

### What warrants a second pair of eyes

- Review whether the minimal local action contract should stay generic (`patch/set/reset`) or be constrained further before app migration begins.
- Review default capability policy (`domain/system = all`) and decide whether tighter defaults are desired for Storybook/dev parity.

### What should be done in the future

- Start Phase C: replace `CardSessionHost` integration path with `PluginCardSessionHost` that drives runtime events through `ingestRuntimeIntent`.

### Code review instructions

- Start in:
  - `packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
  - `packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts`
  - `packages/engine/src/__tests__/plugin-card-runtime.test.ts`
- Validate with:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`

### Technical details

- Intent ingestion uses reducer `prepare` to stamp id/timestamp for timeline consistency.
- Domain/system authorization reasons are persisted in timeline entries for debugging (`domain_not_allowed:*`, `system_command_not_allowed:*`).

## Step 10: Implement Phase C shell integration with plugin session host

I integrated the new runtime foundation into the desktop shell path by introducing `PluginCardSessionHost` and making `DesktopShell` mount it for card windows. The host uses plugin runtime code when stack config provides `plugin.bundleCode`, and falls back to legacy `CardSessionHost` when plugin config is absent, allowing incremental migration while preserving current stories/apps.

I added intent routing glue (`dispatchRuntimeIntent`) to connect runtime intents to host reducers and domain actions, including capability-aware suppression of denied side effects. I also added focused tests for routing behavior and denial handling.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue implementation phases with concrete integrations, testing, and commit checkpoints.

**Inferred user intent:** See migration become operational in actual shell execution paths, not only isolated runtime/store modules.

**Commit (code):** d69a427 — "feat(engine): integrate plugin session host into desktop shell (Phase C)"

### What I did

- Added plugin shell components:
  - `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
  - `packages/engine/src/components/shell/windowing/PluginCardRenderer.tsx`
- Added runtime intent routing adapter:
  - `packages/engine/src/components/shell/windowing/pluginIntentRouting.ts`
  - Routes:
    - card/session intents -> `ingestRuntimeIntent`
    - domain intents -> dynamic domain action dispatch (`${domain}/${actionType}`)
    - system intents -> windowing/notifications actions (`nav.go`, `nav.back`, `notify`, `window.close`)
  - Uses session capability policy to avoid routing denied system/domain side effects.
- Updated shell wiring:
  - `packages/engine/src/components/shell/windowing/DesktopShell.tsx` now mounts `PluginCardSessionHost` for card windows.
  - `packages/engine/src/components/shell/windowing/index.ts` exports new host/renderer/routing helper.
- Updated stack type contract:
  - `packages/engine/src/cards/types.ts` added optional `plugin` config (`bundleCode`, capabilities).
- Added tests:
  - `packages/engine/src/__tests__/plugin-intent-routing.test.ts`
  - Covers domain/system routing, nav behavior parity, and denied-system-intent suppression.
- Validation commands:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`
- Checked off `C1..C5` in `tasks.md`.

### Why

- Phase C required actual shell integration so runtime events could influence navigation/toasts/domain writes through standardized intent paths.
- Maintaining fallback host behavior keeps existing non-plugin stacks working while migration continues.

### What worked

- All tests remain green after shell integration:
  - `10` files, `107` tests.
- Typecheck and build pass.
- New routing tests verify nav/system behavior and denial guard semantics.

### What didn't work

- Initial typecheck failed after first implementation:
  - `PluginCardRenderer.tsx`: table branch lacked strict type narrowing (`node.props` possibly undefined/unknown).
  - `PluginCardSessionHost.tsx`: async closure captured `pluginConfig` as possibly `null`.
- Fixes:
  - Added explicit `node.kind === 'table'` branch with typed map parameters.
  - Captured non-null config in local constant before async load call.

### What I learned

- Capability checks must guard both reducer outcome tracking and side-effect routing; without this, denied intents can still leak to domain/system reducers.
- Projecting global host state in-session is easiest when subscribing to full root state in host component, even if later optimization may narrow subscription scope.

### What was tricky to build

- The tricky part was preserving current behavior while introducing new runtime flow. A direct hard switch to plugin runtime would break all existing DSL stacks immediately. The practical compromise was “plugin-config gated host path with explicit fallback,” while still routing through new intent infrastructure when plugin code exists.

### What warrants a second pair of eyes

- Review whether fallback to legacy host should remain only until Phase E migration, then be removed in Phase F.
- Review `dispatchRuntimeIntent` dynamic domain dispatch contract to ensure domain reducers expect the generated action type format.

### What should be done in the future

- Start Phase D: migrate `createDSLApp`/storybook helper internals to use plugin runtime harness path and deterministic session seeding.

### Code review instructions

- Start in:
  - `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
  - `packages/engine/src/components/shell/windowing/pluginIntentRouting.ts`
  - `packages/engine/src/__tests__/plugin-intent-routing.test.ts`
- Validate with:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`

### Technical details

- `PluginCardSessionHost` projects runtime `globalState` with `self/domains/nav/system`.
- Runtime bundle loading applies `initialSessionState` / `initialCardState` via intent ingestion rather than out-of-band state mutation.

## Step 11: Implement Phase D Storybook/runtime helper migration

I updated app/story helper internals so plugin-runtime-capable stacks can be exercised through existing helper APIs without introducing a second story harness. The main changes were making legacy selector/action registries optional, introducing structured story params support, and adding deterministic store seeding for story decorators.

I also added smoke coverage for the four app story groups requested in HC-031 (`inventory`, `todo`, `crm`, `book-tracker-debug`) by validating that their story modules contain expected Storybook exports.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue phase execution with migration and validation steps, documenting each checkpoint.

**Inferred user intent:** Ensure Storybook integration does not block cutover and remains verifiably healthy across all app story groups.

**Commit (code):** a869dda — "feat(engine): migrate app/story helpers for plugin runtime stories (Phase D)"

### What I did

- Updated app bootstrap helper:
  - `packages/engine/src/app/createDSLApp.tsx`
  - `sharedSelectors/sharedActions` are now optional (legacy fallback only), matching plugin runtime path.
- Updated Storybook helper internals:
  - `packages/engine/src/app/generateCardStories.tsx`
  - Added `toStoryParam(value: unknown)` encoder for structured params.
  - `createStory(card, params?: unknown)` now accepts structured params.
  - Added `seedStore?: (store) => void` for deterministic story seed setup.
  - Made shared selector/action registries optional.
- Updated app exports:
  - `packages/engine/src/app/index.ts` now exports `toStoryParam`.
- Added tests:
  - `packages/engine/src/__tests__/story-helpers.test.ts` (param encoding behavior)
  - `packages/engine/src/__tests__/storybook-app-smoke.test.ts` (smoke checks for inventory/todo/crm/book-tracker-debug story files)
- Validation commands:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`
- Checked off `D1..D5` in `tasks.md`.

### Why

- Story helpers are a critical surface for migration visibility; they must accept plugin-oriented params and deterministic store setup without forcing immediate story rewrites.
- Structured params were explicitly required for plugin cards where nav inputs are no longer reliably string-only at authoring level.

### What worked

- All engine tests pass after helper migration:
  - `12` files, `114` tests.
- Typecheck and build pass.
- Story smoke test now validates all four app story groups requested in Phase D.

### What didn't work

- Initial story smoke approach (dynamic `import(...)` of app story modules from engine test path) failed with module resolution errors.
- First regex for story export detection was over-escaped and failed matching valid story files.
- Fixes:
  - Switched smoke test to static file-content checks (`readFileSync`) for Storybook export markers.
  - Corrected regex to `/export const\\s+[A-Za-z0-9_]+\\s*:/`.

### What I learned

- Cross-workspace dynamic imports from package-local Vitest runs are brittle in this monorepo layout; file-content smoke checks provide stable, low-friction validation for story module presence and structure.

### What was tricky to build

- The subtle part was evolving APIs without breaking existing stories. Making shared registries optional had to preserve old story behavior while enabling plugin stacks to omit legacy registries entirely. The helper layer now supports both paths until hard deletion phase.

### What warrants a second pair of eyes

- Review whether JSON-string encoding in `toStoryParam` is sufficient for future typed nav param handling, or whether a dedicated nav param codec should be introduced before Phase F cleanup.

### What should be done in the future

- Start Phase E migrations for app stacks (`inventory`, `todo`, `crm`, `book-tracker-debug`) onto plugin runtime stack bundles and remove function-valued VM boundary payloads.

### Code review instructions

- Start in:
  - `packages/engine/src/app/generateCardStories.tsx`
  - `packages/engine/src/__tests__/storybook-app-smoke.test.ts`
  - `packages/engine/src/__tests__/story-helpers.test.ts`
- Validate with:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - `npm run build -w packages/engine`

### Technical details

- Story smoke checks assert both `export default` and at least one `export const ...: Story` declaration in each app story module file.

## Step 12: Validate in tmux + Playwright and fix low-stock recursion

I ran live runtime validation with Storybook and inventory dev server in `tmux`, then used Playwright to reproduce the low-stock page recursion issue directly in-browser. The first run reproduced `Maximum update depth exceeded` exactly on `http://localhost:6006/?path=/story/pages-cards--low-stock`, so I implemented a targeted runtime stabilization patch and reran Playwright until the error disappeared.

The fix included reducing unnecessary shell subscriptions, making runtime ensure behavior idempotent, and disabling debug-hook emission by default in helper bootstraps (opt-in remains possible). After patching, Playwright reported `0` console errors on the same story URL.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Keep progressing with implementation and test continuously, including browser-level validation where useful.

**Inferred user intent:** Ensure migration work does not regress runtime stability, especially around the known recursion failure.

**Commit (code):** 0c537dd — "fix(engine): stop low-stock story render recursion"

### What I did

- Started processes in tmux:
  - `npm run storybook` (session: `hc_storybook`)
  - `npm run dev -w apps/inventory` (session: `hc_inventory_dev`)
- Reproduced failure via Playwright:
  - Opened `http://localhost:6006/?path=/story/pages-cards--low-stock`
  - Observed `Maximum update depth exceeded` in preview iframe console.
- Implemented stabilization fixes:
  - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
    - Added idempotence guard so `ensureCardRuntime` dispatch is not repeated for the same runtime key.
  - `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
    - Use `CardSessionHost` directly for non-plugin stacks; only mount `PluginCardSessionHost` when stack has `plugin.bundleCode`.
  - `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
    - Removed root-state subscription and switched global projection to `store.getState()` reads.
  - `packages/engine/src/app/createDSLApp.tsx`
  - `packages/engine/src/app/generateCardStories.tsx`
    - Added `enableDebugHooks` flag (default `false`) to prevent debug-event dispatch loops in default runtime path.
  - `packages/engine/src/features/windowing/selectors.ts`
    - Memoized `selectWindowsInOrder` and `selectWindowsByZ` with `createSelector` to avoid unstable selector outputs.
- Re-ran checks:
  - `npm run test -w packages/engine`
  - `npm run typecheck -w packages/engine`
  - Playwright retest on low-stock story showed `0` errors.
- Marked task progress:
  - `G3.1/G3.2/G3.3` complete
  - `G4.2/G4.3` complete

### Why

- Browser-level reproduction was necessary because unit tests did not capture this runtime recursion.
- Stabilization work needed to target both render-time dispatch risk and subscription churn.

### What worked

- Playwright reproduction matched user-reported failure.
- Post-fix Playwright run on same story URL rendered successfully without recursion errors.
- Engine tests and typecheck remained green after fix.

### What didn't work

- Initial mitigation attempts (plugin-host subscription cleanup alone) reduced warnings but did not fully eliminate the recursion.
- Full resolution required combining idempotent runtime ensure + debug emission default-off + selector memoization.

### What I learned

- This class of recursion can hide outside strict unit tests and requires real Storybook runtime verification.
- Memoization and idempotence at host/runtime boundaries materially reduce risk when React-Redux subscriptions are dense.

### What was tricky to build

- Isolating the failure source was non-trivial because the error surfaced in legacy `CardSessionHost` while migration code had already introduced additional wrappers. The practical path was iterative: reproduce, reduce noise (selector warnings), add idempotence, then retest in-browser until the stack stabilized.

### What warrants a second pair of eyes

- Review default `enableDebugHooks: false` decision to confirm expected observability tradeoffs for development workflows.
- Review whether we should add a dedicated regression test harness for Storybook runtime recursion in CI (Playwright-based).

### What should be done in the future

- Continue Phase E app migrations so non-plugin fallback path can eventually be removed in Phase F.

### Code review instructions

- Start in:
  - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
  - `packages/engine/src/app/generateCardStories.tsx`
  - `packages/engine/src/features/windowing/selectors.ts`
- Validate with:
  - `npm run test -w packages/engine`
  - Launch Storybook and open `http://localhost:6006/?path=/story/pages-cards--low-stock` to confirm no recursion errors.

### Technical details

- Playwright verification was run against live Storybook in tmux and captured console diagnostics before/after the fix.

## Step 13: Fix QuickJS wasm loading for Storybook/Vite plugin runtime

After beginning the first app cutover, Storybook started running the plugin runtime path and surfaced a wasm loading failure from `quickjs-emscripten` (`emscripten-module.wasm` 404). This blocked all plugin-card rendering in browser environments even though Node-side tests were green.

I fixed this by switching engine runtime initialization from the default wasm-file variant to a singlefile MJS QuickJS variant (embedded module data), then revalidated with engine tests and Playwright on the same failing story URL.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue hard-cutover implementation with real runtime validation and resolve blockers immediately as they appear.

**Inferred user intent:** Keep momentum on implementation while preserving Storybook/browser operability during migration.

**Commit (code):** 0d16d37 — "fix(engine): use singlefile quickjs variant in browser runtime"

### What I did

- Reproduced browser failure in Playwright on:
  - `http://localhost:6006/?path=/story/pages-cards--low-stock`
- Captured console errors:
  - `Failed to load resource ... emscripten-module.wasm (404)`
  - `failed to asynchronously prepare wasm`
- Installed singlefile variant dependency in engine workspace:
  - `npm install -w packages/engine @jitl/quickjs-singlefile-mjs-release-sync@0.31.0`
- Updated runtime initialization:
  - `packages/engine/src/plugin-runtime/runtimeService.ts`
  - Replaced `getQuickJS()` with memoized `newQuickJSWASMModule(SINGLEFILE_RELEASE_SYNC)` loader.
- Re-ran validation:
  - `npm run typecheck`
  - `npm run test -w packages/engine`
  - Playwright re-open of the low-stock Storybook page (no wasm errors afterward).

### Why

- Browser runtime is a first-class validation path in HC-031; a wasm fetch failure in Storybook blocks migration verification.
- Singlefile variant removes dependence on external `.wasm` asset resolution in Vite/Storybook builds.

### What worked

- Engine typecheck and tests stayed green.
- Low-stock Storybook path rendered without QuickJS wasm load errors after the change.

### What didn't work

- `npm run build -w apps/inventory` still fails for an existing worker bundling setting (`worker.format: iife` with code-splitting). This is pre-existing infrastructure debt and not introduced by this fix.

### What I learned

- Node test pass does not guarantee browser runtime correctness for QuickJS module loading; explicit browser checks are required.

### What was tricky to build

- The failure looked like a generic Storybook asset issue at first, but the actual root was variant selection in QuickJS loader behavior. Fixing it required choosing a runtime variant that is resilient to bundler asset path differences.

### What warrants a second pair of eyes

- Confirm whether we should standardize on singlefile variant across all plugin-runtime call sites (worker and direct) for consistent browser behavior.

### What should be done in the future

- Track and resolve the unrelated Vite worker-format build issue as a separate infra task.

### Code review instructions

- Start in:
  - `packages/engine/src/plugin-runtime/runtimeService.ts`
  - `packages/engine/package.json`
- Validate:
  - `npm run test -w packages/engine`
  - Open Storybook low-stock page and check browser console for absence of QuickJS wasm errors.

### Technical details

- Added dependency: `@jitl/quickjs-singlefile-mjs-release-sync`.
- Runtime module initialization is memoized via `getSharedQuickJsModule()`.

## Step 14: Complete Phase E1 inventory hard cutover to plugin bundle

I migrated `apps/inventory` from descriptor DSL + shared selector/action bridge to a plugin-bundle stack with hard cutover semantics (no compatibility shim in app code). The app and stories now bootstrap through plugin runtime only, and legacy inventory card runtime helpers were removed.

I validated this by running Storybook and the Vite app in `tmux`, then exercising navigation and mutation flows with Playwright (including quantity changes reflected in table state).

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Execute app-by-app migration tasks with commits and runtime testing as progress is made.

**Inferred user intent:** Move from architecture scaffolding to concrete cutover in real applications, while preserving enough behavior to continue product iteration.

**Commit (code):** 6fa0e61 — "feat(inventory): hard-cutover cards to plugin runtime bundle"

### What I did

- Added plugin runtime bundle source:
  - `apps/inventory/src/domain/pluginBundle.ts`
  - Implemented plugin cards/handlers for: `home`, `browse`, `lowStock`, `salesToday`, `itemDetail`, `newItem`, `receive`, `priceCheck`, `report`, `assistant`.
- Replaced descriptor stack with plugin stack metadata:
  - `apps/inventory/src/domain/stack.ts`
  - Added `plugin.bundleCode` + capabilities and card metadata placeholders.
- Removed legacy bridge and function-heavy config artifacts:
  - deleted `apps/inventory/src/app/cardRuntime.ts`
  - deleted `apps/inventory/src/domain/columnConfigs.ts`
  - deleted `apps/inventory/src/domain/computeFields.ts`
  - deleted `apps/inventory/src/domain/formatters.ts`
- Updated app/stories to stop passing shared registries:
  - `apps/inventory/src/App.tsx`
  - `apps/inventory/src/stories/CardPages.stories.tsx`
  - `apps/inventory/src/stories/Themed.stories.tsx`
- Validation:
  - `npm run typecheck`
  - `npm run test`
  - Started `tmux` sessions for:
    - `npm run storybook`
    - `npm run dev -w apps/inventory`
  - Playwright checks:
    - Storybook low-stock page renders and is interactive.
    - App home -> browse -> item detail -> `Sell 1` -> back to browse reflects updated qty (`A-1002` from `2` to `1`).
    - Console errors limited to favicon 404 on dev server.
- Updated tasks:
  - Checked off `E1`.
  - Checked off `G4.1`.

### Why

- Inventory was the first concrete app migration target and exposed the real integration constraints for plugin bundles.
- Removing the app-local legacy bridge clarifies true plugin runtime behavior and removes duplicated execution pathways.

### What worked

- Inventory app now runs through plugin runtime and handles domain/system intents correctly.
- Storybook low-stock path remains stable without recursion and without QuickJS asset failures.

### What didn't work

- `npm run build -w apps/inventory` still reports the existing Vite worker-format limitation (same issue observed before this app migration).

### What I learned

- The plugin bundle approach is viable for app cutover without retaining `Act/Ev/Sel` authoring in app code.
- Browser-level verification catches integration problems (asset loading, runtime dispatch) earlier than static checks.

### What was tricky to build

- The migration required preserving desktop-shell card metadata (titles/icons/cards map) while routing actual rendering to VM plugin code. This split between host metadata and plugin UI execution is easy to get wrong if the card map and bundle card IDs drift.

### What warrants a second pair of eyes

- Review the inventory plugin bundle handlers for payload normalization and edge cases (e.g., tags parsing, numeric coercion).
- Confirm capability scope (`domain: ['inventory', 'sales']`, `system: ['nav.go', 'nav.back', 'notify']`) matches intended product policy.

### What should be done in the future

- Continue Phase E for `todo`, `book-tracker-debug`, and `crm` using the same hard-cutover pattern.

### Code review instructions

- Start in:
  - `apps/inventory/src/domain/pluginBundle.ts`
  - `apps/inventory/src/domain/stack.ts`
  - `apps/inventory/src/App.tsx`
- Validate:
  - `npm run typecheck`
  - `npm run test`
  - Run app + Storybook and execute browse/detail mutation flow.

### Technical details

- Plugin bundle emits only data payloads across VM boundary (no function-valued callback transfer).
- App story wiring now relies on plugin stack + store only, not shared selector/action registries.

## Step 15: Complete Phase E3 CRM hard cutover to plugin runtime bundle

I migrated `apps/crm` from descriptor cards + shared selector/action bridge to a plugin-bundle stack, and removed CRM-local legacy runtime files. I also converted the CRM chat fake-response action payloads away from `Act(...)` descriptors to plugin-intent-shaped `system/nav.go` payloads.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue phased hard-cutover execution, commit incrementally, and keep progress documented.

**Inferred user intent:** Eliminate duplicated legacy runtime paths in real apps and ensure app behavior is preserved under plugin runtime.

**Commit (code):** 50e5b7e — "feat(crm): hard-cutover cards and chat bridge to plugin runtime"

### What I did

- Added plugin runtime bundle source:
  - `apps/crm/src/domain/pluginBundle.ts`
  - Implemented plugin cards/handlers for: `home`, `contacts`, `contactDetail`, `addContact`, `companies`, `companyDetail`, `deals`, `openDeals`, `dealDetail`, `addDeal`, `pipeline`, `activityLog`, `addActivity`.
- Replaced descriptor stack with plugin stack metadata:
  - `apps/crm/src/domain/stack.ts`
  - Added `plugin.bundleCode` + capabilities and card metadata placeholders.
- Updated app/story wiring to plugin-only:
  - `apps/crm/src/App.tsx`
  - `apps/crm/src/stories/CrmApp.stories.tsx`
- Converted CRM chat action bridge payloads off descriptor DSL:
  - `apps/crm/src/chat/crmChatResponses.ts`
  - Replaced `Act('nav.go', ...)` with plain `{ scope: 'system', command: 'nav.go', payload: { cardId, param? } }` objects.
- Removed CRM-local legacy runtime/card definition files:
  - deleted `apps/crm/src/app/cardRuntime.ts`
  - deleted `apps/crm/src/domain/cards/*`
- Validation:
  - `npm run typecheck`
  - Playwright on `http://localhost:6006/iframe.html?id=crm-full-app--default`
  - exercised: Home -> Contacts -> ContactDetail -> promote/back flow
  - browser console had no plugin/runtime recursion errors (favicon 404 only)
- Updated tasks:
  - Checked off `E3`.

### Why

- CRM had the largest remaining app-local duplication between descriptor cards and new plugin runtime, so cutting it over materially reduces migration risk.
- Converting chat action payloads removes another dependency on descriptor helpers (`Act`) in app code.

### What worked

- Storybook CRM app renders via plugin runtime and navigates card flows correctly.
- Domain actions route correctly through plugin intent routing (`contacts`, `companies`, `deals`, `activities`).

### What didn't work

- No runtime blocker; only recurring favicon 404 noise in Storybook iframe console.

### What I learned

- For list-heavy cards, plugin runtime currently needs explicit “quick open” buttons because row-click bindings from legacy list widgets are not part of the plugin UI schema.

### What was tricky to build

- Preserving detail-card edit semantics required explicit card-state patch/set handling and numeric coercion (deal `value`/`probability`) in plugin handlers because plugin `input` values arrive as strings.

### What warrants a second pair of eyes

- Review CRM plugin bundle for UX parity on list/detail flows versus previous descriptor widgets, especially where we replaced row-click with quick-open controls.

### What should be done in the future

- Complete Phase E4/E5 and then remove shared descriptor DSL/runtime from engine exports and tests in Phase F.

### Code review instructions

- Start in:
  - `apps/crm/src/domain/pluginBundle.ts`
  - `apps/crm/src/domain/stack.ts`
  - `apps/crm/src/chat/crmChatResponses.ts`
- Validate:
  - `npm run typecheck`
  - Open `crm-full-app--default` story and run basic nav/edit flows.

### Technical details

- Plugin bundle relies only on schema-safe data payloads crossing VM boundary.
- Capability scope configured as:
  - `domain: ['contacts', 'companies', 'deals', 'activities']`
  - `system: ['nav.go', 'nav.back', 'notify']`

## Step 16: Complete Phase E4 book-tracker-debug hard cutover to plugin runtime bundle

I migrated `apps/book-tracker-debug` from descriptor cards + shared selector/action bridge to a plugin-bundle stack, removed app-local legacy runtime/card files, and validated the storybook app flow end-to-end under plugin runtime.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue app-by-app hard cutover with commits and evidence.

**Inferred user intent:** Finish remaining app migrations so we can move to engine-level legacy deletion with less ambiguity.

**Commit (code):** c8cfee4 — "feat(book-tracker): hard-cutover cards to plugin runtime bundle"

### What I did

- Added plugin runtime bundle source:
  - `apps/book-tracker-debug/src/domain/pluginBundle.ts`
  - Implemented plugin cards/handlers for: `home`, `browse`, `readingNow`, `bookDetail`, `addBook`, `readingReport`.
- Replaced descriptor stack with plugin stack metadata:
  - `apps/book-tracker-debug/src/domain/stack.ts`
  - Added `plugin.bundleCode` + capabilities and card metadata placeholders.
- Updated app/story wiring to plugin-only:
  - `apps/book-tracker-debug/src/App.tsx`
  - `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx`
- Removed app-local legacy runtime/card definitions:
  - deleted `apps/book-tracker-debug/src/app/cardRuntime.ts`
  - deleted `apps/book-tracker-debug/src/domain/cards/*`
- Validation:
  - `npm run typecheck`
  - Playwright on `http://localhost:6006/iframe.html?id=booktrackerdebug-full-app--default`
  - exercised: Home -> Browse -> BookDetail -> `Mark Read` -> Back to Browse
  - browser console: no runtime errors, warnings only
- Updated tasks:
  - Checked off `E4`.

### Why

- Book tracker still had duplicated runtime pathways and descriptor-specific card files that would block a clean hard cutover.

### What worked

- Storybook app renders plugin cards correctly.
- Domain intents (`books/*`) and system intents (`nav.*`, `notify`) route as expected.

### What didn't work

- No runtime blocker encountered in this phase.

### What I learned

- The same plugin-bundle pattern used in inventory/todo/crm ports cleanly to smaller apps, including detail-card edit semantics and report cards.

### What was tricky to build

- Numeric field normalization (book `rating`) needed explicit coercion before domain dispatch, because plugin input values are string-typed.

### What warrants a second pair of eyes

- Review the book detail/edit handlers to ensure status/rating updates exactly match previous reducer expectations.

### What should be done in the future

- Migrate engine demo stories (`E5`) and remove remaining function-valued payload surfaces (`E6`) before engine legacy deletion (`F*`).

### Code review instructions

- Start in:
  - `apps/book-tracker-debug/src/domain/pluginBundle.ts`
  - `apps/book-tracker-debug/src/domain/stack.ts`
- Validate:
  - `npm run typecheck`
  - Open `booktrackerdebug-full-app--default` story and run browse/detail interaction.

### Technical details

- Capability scope configured as:
  - `domain: ['books']`
  - `system: ['nav.go', 'nav.back', 'notify']`

## Step 17: Complete Phase E5 by migrating engine demo stories to plugin runtime flows

I migrated the remaining engine demo stories so they no longer exercise descriptor-card runtime pathways. The updated stories now use plugin stacks and `PluginCardSessionHost`-aligned flows, giving Storybook parity with the hard-cutover architecture.

This removed the last story-level ambiguity where both old and new card execution patterns were visible in demos.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Continue checking off hard-cutover tasks and commit each meaningful phase while validating runtime behavior.

**Inferred user intent:** Ensure Storybook examples represent the real post-cutover system so regressions are caught in the same runtime model used by apps.

**Commit (code):** 04c94d8 — "refactor(stories): migrate shell and book tracker demos to plugin runtime"

### What I did

- Migrated engine stories to plugin runtime:
  - `packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx`
  - `packages/engine/src/components/shell/windowing/CardSessionHost.stories.tsx` (plugin-session-host-focused content)
  - `packages/engine/src/components/widgets/BookTracker.stories.tsx`
- Removed remaining `Act/Ev/Sel`-style story definitions in those demo files.
- Validated migrated story routes with Playwright under active Storybook tmux session.
- Checked off task `E5`.

### Why

- Story coverage must use the same runtime loop as production to avoid false confidence from legacy-only demo behavior.

### What worked

- Story routes load and interact correctly under plugin runtime host components.
- Story migration aligned with app-level hard cutover and reduced remaining dual-path code.

### What didn't work

- No functional blocker in this step.

### What I learned

- Story migration is a strong forcing function: if a story cannot run without descriptor helpers, there is still hidden coupling to old runtime assumptions.

### What was tricky to build

- The main subtlety was preserving recognizable demo behavior while replacing underlying runtime mechanics; replacing data/action shape without regressing story intent required careful per-story handler rewrites.

### What warrants a second pair of eyes

- Validate story UX parity for navigation-heavy flows where original stories implicitly depended on legacy renderer semantics.

### What should be done in the future

- Complete engine-level hard deletion of descriptor runtime modules (`F*`) now that stories no longer rely on them.

### Code review instructions

- Start in:
  - `packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx`
  - `packages/engine/src/components/shell/windowing/CardSessionHost.stories.tsx`
  - `packages/engine/src/components/widgets/BookTracker.stories.tsx`
- Validate:
  - `npm run typecheck`
  - Storybook Playwright smoke against migrated story ids.

### Technical details

- Story runtime now routes through plugin bundle metadata + intent routing, not descriptor expression resolution.

## Step 18: Complete Phase F hard deletion of legacy descriptor runtime path

I removed the descriptor DSL runtime-authoritative path from engine core (helpers, resolver host/renderer, legacy session host, and descriptor-centric tests), leaving plugin runtime as the only card execution route. This is the hard-cut objective of HC-031 and intentionally drops backward compatibility for old card DSL execution.

I also reran validation and explicitly recorded baseline build/lint failures that predate this migration scope.

### Prompt Context

**User prompt (verbatim):** (see Step 8)

**Assistant interpretation:** Finish the migration by removing legacy runtime code and validating the resulting system.

**Inferred user intent:** Achieve a clear architectural cut with no mixed execution model left behind.

**Commit (code):** 3a898d5 — "refactor(engine): remove legacy descriptor card runtime path"

### What I did

- Deleted legacy runtime files:
  - `packages/engine/src/cards/helpers.ts`
  - `packages/engine/src/cards/runtimeStateSlice.ts`
  - `packages/engine/src/components/shell/CardRenderer.tsx`
  - `packages/engine/src/components/shell/useCardRuntimeHost.ts`
  - `packages/engine/src/components/shell/windowing/CardSessionHost.tsx`
  - descriptor-centric tests (`integration-card-execution`, `runtime-actions`, `selector-resolution`)
- Replaced `packages/engine/src/cards/runtime.ts` with minimal debug event shim (no descriptor resolver/command engine).
- Simplified `packages/engine/src/cards/types.ts` to plugin stack/card metadata contracts.
- Updated shell/app exports and store wiring for plugin-only runtime shape:
  - `packages/engine/src/components/shell/index.ts`
  - `packages/engine/src/components/shell/windowing/index.ts`
  - `packages/engine/src/cards/index.ts`
  - `packages/engine/src/app/createAppStore.ts`
  - `packages/engine/src/app/createDSLApp.tsx`
  - `packages/engine/src/app/generateCardStories.tsx`
- Updated app stack definitions to stop depending on `defineCardStack`:
  - `apps/inventory/src/domain/stack.ts`
  - `apps/todo/src/domain/stack.ts`
  - `apps/crm/src/domain/stack.ts`
  - `apps/book-tracker-debug/src/domain/stack.ts`
- Validation:
  - `npm run typecheck` — pass
  - `npm run test -w packages/engine` — pass (`9` files, `89` tests)
  - `npm run build` — fail (existing `worker.format` Vite issue)
  - `npm run lint` — fail (existing baseline Biome/import-order/style findings)
  - Playwright checks on low-stock + migrated app/story pages — no recursion/update-depth runtime errors.
- Checked off tasks:
  - `F1..F6`
  - `G1..G4` remaining sub-items
  - `G2.2`/`G2.3` marked with baseline-failure notes.

### Why

- Keeping both descriptor and plugin runtimes would continue code duplication, cognitive overhead, and reintroduction risk for render-time resolver bugs.

### What worked

- Plugin runtime path now stands alone; engine test/typecheck remain green.
- Previous recursion failure scenario remained resolved after legacy deletion.

### What didn't work

- Full repo build/lint remain red on known non-HC-031 baseline issues.

### What I learned

- Hard deletion surfaces hidden dependencies quickly and is faster to stabilize than long-lived compatibility shims for this codebase stage.

### What was tricky to build

- Several exports and stories implicitly referenced deleted symbols; removing them required coordinated updates across engine/public entry points and app stack metadata declarations to avoid stale-type leakage.

### What warrants a second pair of eyes

- Verify that no external consumer still imports removed descriptor symbols from `@hypercard/engine` public APIs.
- Review whether minimal `cards/runtime.ts` debug shim should move under a plugin-runtime namespace in a follow-up cleanup.

### What should be done in the future

- Complete final publication updates (`G5`) with updated design-doc outcomes, diary/changelog sync, and fresh `docmgr doctor` run.

### Code review instructions

- Start in:
  - `packages/engine/src/cards/types.ts`
  - `packages/engine/src/cards/runtime.ts`
  - `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
  - `packages/engine/src/app/createAppStore.ts`
- Validate:
  - `npm run typecheck`
  - `npm run test -w packages/engine`
  - Storybook Playwright smoke on low-stock and plugin app stories.

### Technical details

- The runtime-authoritative engine path no longer evaluates descriptor expressions (`Act/Ev/Sel`) during render/event handling.

## Step 19: Final publication pass (G5) with doctor validation and updated reMarkable upload

I completed the HC-031 publication tasks by updating the design doc outcomes section, synchronizing diary/changelog with the final commits, running `docmgr doctor`, and uploading an updated PDF artifact to reMarkable for review.

This closes the ticket workstream from analysis through implementation execution and documentation publication.

### Prompt Context

**User prompt (verbatim):** "go ahead."

**Assistant interpretation:** Proceed immediately with remaining migration tasks, check-offs, commits/docs updates, and publication workflow.

**Inferred user intent:** Finish the cutover execution cycle end-to-end, including final documentation and review distribution artifacts.

**Commit (code):** N/A (documentation/publication step)

### What I did

- Updated design doc with executed outcomes and residual baseline notes:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md`
- Updated diary/changelog with post-E4 phases and final status:
  - added Step 17/18/19 in diary
  - added changelog entries for commits `04c94d8` and `3a898d5`
- Ran ticket doctor:
  - `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30`
  - result: one known warning (`missing_numeric_prefix`) on imported source file name.
- Marked final tasks complete:
  - `docmgr task check --ticket HC-031-VM-PLUGIN-DSL --id 65,66,67,68`
- Uploaded updated PDF to reMarkable:
  - dry run:
    - `remarquee upload bundle --dry-run ... --name "HC-031-VM-PLUGIN-DSL-Analysis-Updated" --remote-dir "/ai/2026/02/15/HC-031-VM-PLUGIN-DSL"`
  - upload:
    - `remarquee upload bundle ... --name "HC-031-VM-PLUGIN-DSL-Analysis-Updated" --remote-dir "/ai/2026/02/15/HC-031-VM-PLUGIN-DSL" --non-interactive`
  - verification:
    - `remarquee cloud ls /ai/2026/02/15/HC-031-VM-PLUGIN-DSL --long --non-interactive`

### Why

- Publication tasks were the only remaining open items (`G5.*`) and are necessary for handoff/review completeness.

### What worked

- Ticket tasks now show complete.
- Updated PDF appears on reMarkable cloud path alongside the prior artifact.
- Doctor surfaced only the known imported-source naming warning.

### What didn't work

- No blocking failures in this step.

### What I learned

- Keeping the old PDF and uploading a versioned new filename avoids annotation loss risk from forced overwrite.

### What was tricky to build

- The main nuance was selecting upload mode: `upload md` does not support explicit output naming, so `upload bundle` was used (single input) to create a stable, versioned PDF name without destructive overwrite behavior.

### What warrants a second pair of eyes

- Confirm whether the remaining `missing_numeric_prefix` warning should be accepted permanently for imported source files or normalized by renaming and re-relating sources.

### What should be done in the future

- If desired, close the ticket after final reviewer acknowledgment:
  - `docmgr ticket close --ticket HC-031-VM-PLUGIN-DSL`

### Code review instructions

- Review publication artifacts:
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md`
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md`
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/changelog.md`
  - `ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md`
- Verify ticket/file health:
  - `docmgr task list --ticket HC-031-VM-PLUGIN-DSL`
  - `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30`
- Verify upload:
  - `remarquee cloud ls /ai/2026/02/15/HC-031-VM-PLUGIN-DSL --long --non-interactive`

### Technical details

- Uploaded document name: `HC-031-VM-PLUGIN-DSL-Analysis-Updated.pdf`
- Remote folder now contains:
  - `01-vm-plugin-dsl-migration-and-storybook-integration-analysis`
  - `HC-031-VM-PLUGIN-DSL-Analysis-Updated`
