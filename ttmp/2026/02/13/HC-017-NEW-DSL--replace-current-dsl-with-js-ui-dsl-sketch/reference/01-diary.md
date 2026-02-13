---
Title: Diary
Ticket: HC-017-NEW-DSL
Status: active
Topics:
    - frontend
    - architecture
    - redux
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/01-current-dsl-deep-dive-and-migration-guide-to-new-screen-dsl.md
      Note: Primary deliverable documented by diary steps.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md
      Note: Follow-up design analysis for CardDefinition scoped state architecture.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/01-resolve-redux-selectors.mjs
      Note: Experiment verifying selectors over Redux-shaped state.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/03-current-dsl-gap-audit.sh
      Note: Experiment auditing migration surface and encountered/fixed script path bug.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/04-carddefinition-state-scope-simulation.mjs
      Note: Follow-up simulation script validating local scope precedence and action targeting.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/sources/local/js-ui-dsl.md
      Note: Imported spec source referenced throughout diary.
ExternalSources:
    - local:js-ui-dsl.md
Summary: Step-by-step implementation diary for HC-017 migration analysis, experiments, and publishing.
LastUpdated: 2026-02-13T10:17:00-05:00
WhatFor: Capture exact process, decisions, failures, and validation artifacts for replacing the current DSL with the new screen DSL sketch.
WhenToUse: Use when reviewing how the guide was produced and replaying experiments.
---



# Diary

## Goal

Record the exact work sequence for HC-017: ticket setup, source import, current/new DSL analysis, runtime experiments, and publication of the migration guide and artifacts.

## Step 1: Ticket Bootstrap and Source Import

I started by creating the ticket workspace and importing the source sketch exactly as requested. This established a clean docmgr context and ensured the migration analysis would reference the imported local source instead of an ad-hoc copy.

The main objective in this step was to satisfy hard prerequisites first (ticket + imported file), so all subsequent analysis and experiments could be linked and reproducible.

### Prompt Context

**User prompt (verbatim):** "creat ea new docmgr ticket HC-017-NEW-DSL that is about replacing our current problematic DSL with /tmp/js-ui-dsl.md . First, after creating the ticket, import the file with `docmgr import file --file /tmp/js-ui-dsl.md --ticket HC-017-NEW-DSL`, then read it, then study how to rip out the current DSL and use this new sketch (it's a sketch, it's possible it doesn't fully fit our react setup). Selectors should be able to access the redux store.

Creat ea detailed analysis and imlementation guide on how to switch over from the current DSL to the new one. Make it extensive and engaging and detailed and verbose for a programmer to read to get the full context: explain the current DSL in depth in a first section, then the new DSL, then how to integrate it, what the tricky parts are, what it would look like, and implementatino steps. No backwards compatibility needed, you can entirely replace the current DSL.

Use prose paragraphs and bullet point lists and pseudocode and diagrams and refer to symbols and filenames.

Store the document in the ticket and upload to remarkable when done. Keep a frequent detailed diary as you go. Feel free to run experiments. I think storybook is running in tmux.

Store your experiments and tests in the scripts/ folder of the ticket (inlcuding any other scripts you write, even temporary ones)."

**Assistant interpretation:** Create a new docmgr ticket, import and analyze the new DSL source, produce a comprehensive migration design doc, keep a detailed diary, run experiments in ticket scripts, and upload final docs to reMarkable.

**Inferred user intent:** Replace the existing DSL architecture decisively with a better runtime model and leave a thorough technical handoff package.

**Commit (code):** N/A

### What I did

- Ran `docmgr ticket create-ticket --ticket HC-017-NEW-DSL --title "Replace Current DSL with JS UI DSL Sketch" --topics frontend,architecture,redux`.
- Ran `docmgr import file --file /tmp/js-ui-dsl.md --ticket HC-017-NEW-DSL`.
- Created diary doc with `docmgr doc add --ticket HC-017-NEW-DSL --doc-type reference --title "Diary"`.

### Why

- Ticket-first keeps all outputs traceable.
- Importing source into ticket avoids drift between local scratch files and documented source of truth.

### What worked

- Ticket created successfully under `ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch`.
- Source imported and indexed in ticket `sources/local/js-ui-dsl.md`.

### What didn't work

- N/A.

### What I learned

- The imported sketch is complete and long-form (641 lines), sufficient for a full architecture plan without external dependencies.

### What was tricky to build

- No technical complexity yet; this step was operational setup.

### What warrants a second pair of eyes

- N/A.

### What should be done in the future

- N/A.

### Code review instructions

- Verify ticket/doc creation outputs and imported source path under `ttmp/.../sources/local/js-ui-dsl.md`.

### Technical details

- Core command required by prompt was executed exactly: `docmgr import file --file /tmp/js-ui-dsl.md --ticket HC-017-NEW-DSL`.

## Step 2: Current DSL and Runtime Architecture Mapping

I performed a code-level survey of engine and app integration points to map the exact migration surface. The intent was to avoid writing a generic plan and instead tie the migration guide to concrete symbols and files.

This step established the delta between "current card-type + override" architecture and "target AST + runtime" architecture.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Study current code deeply enough to produce a realistic full-replacement strategy.

**Inferred user intent:** Get a migration plan that can actually be implemented, not just conceptual.

**Commit (code):** N/A

### What I did

- Read current DSL contracts:
- `packages/engine/src/dsl/types.ts`
- `packages/engine/src/dsl/resolver.ts`
- `packages/engine/src/app/dispatchDSLAction.ts`
- Read shell/rendering path:
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/shell/CardRenderer.tsx`
- `packages/engine/src/components/shell/NavBar.tsx`
- Read app-level renderer overrides and stack definitions:
- `apps/inventory/src/overrides/*.tsx`
- `apps/todo/src/overrides/*.tsx`
- `apps/inventory/src/domain/stack.ts`
- `apps/todo/src/domain/stack.ts`
- Read selector/action registries and store wiring:
- `packages/engine/src/api/selectorRegistry.ts`
- `packages/engine/src/api/actionRegistry.ts`
- `apps/*/src/app/domainDataRegistry.ts`
- `apps/*/src/app/domainActionHandler.ts`
- Confirmed tmux sessions with `tmux ls` and found `sb` session.

### Why

- The migration requires replacing the old DSL entirely, so every major dependency edge had to be traced.

### What worked

- Architecture map was successfully reconstructed end-to-end.
- Confirmed that current behavior is distributed across app overrides, not centralized in engine runtime.

### What didn't work

- Initial attempt to read `apps/inventory/src/app/App.tsx` and `apps/todo/src/app/App.tsx` failed because paths are `apps/inventory/src/App.tsx` and `apps/todo/src/App.tsx`.
- Errors:
- `sed: can't read apps/inventory/src/app/App.tsx: No such file or directory`
- `sed: can't read apps/todo/src/app/App.tsx: No such file or directory`

### What I learned

- Current "selector" mechanism is mostly pre-projection into `domainData`, not expression-time evaluation over full Redux state.
- This is a major reason the new sketch is a better fit for dynamic UI AST.

### What was tricky to build

- The hardest part was preserving clear separation between current behavior that is declarative in stack files and behavior encoded imperatively in overrides.
- I handled this by always pairing each stack file read with corresponding override reads.

### What warrants a second pair of eyes

- Migration impact on `chat` and `report` cards, since they carry richer logic than base list/form/detail patterns.

### What should be done in the future

- N/A.

### Code review instructions

- Start with `packages/engine/src/dsl/types.ts` then follow the chain through `HyperCardShell` and override files.

### Technical details

- Confirmed current action dispatch path uses `dispatchDSLAction` with built-ins (`navigate`, `back`, `toast`) and domain fallback.

## Step 3: Runtime/Resolver Experiments in Ticket Scripts

I created explicit experiments in the ticket `scripts/` directory to validate two migration-critical assumptions: selector resolution against Redux-shaped state, and runtime update semantics for bindings/actions (including preview mode behavior).

These scripts provide executable proof points referenced by the final design document.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Run practical experiments and keep all experiment artifacts in ticket scripts.

**Inferred user intent:** De-risk migration with evidence, not only static analysis.

**Commit (code):** N/A

### What I did

- Created and ran:
- `scripts/01-resolve-redux-selectors.mjs`
- `scripts/02-runtime-update-semantics.mjs`
- `scripts/03-current-dsl-gap-audit.sh`
- Stored outputs:
- `scripts/01-resolve-redux-selectors.out.txt`
- `scripts/02-runtime-update-semantics.out.txt`
- `scripts/03-current-dsl-gap-audit.out.txt`

### Why

- The migration hinges on state selector semantics and runtime mutability contracts; these were verified with runnable prototypes.

### What worked

- Resolver experiment passed all checks, including nested `Ev("row.sku")` and selector args.
- Runtime experiment passed update semantics checks: binding updates, local-over-global action precedence, preview ignore behavior.
- Audit output enumerated card types/actions/override files and quantified migration surface.

### What didn't work

- First run of `03-current-dsl-gap-audit.sh` failed with:
- `rg: apps/*/src/domain/stack.ts: IO error for operation on apps/*/src/domain/stack.ts: No such file or directory (os error 2)`
- Root cause: script computed repository root relative to ticket script path incorrectly.
- Fix: replaced root logic with `ROOT="$(git rev-parse --show-toplevel)"` and reran successfully.

### What I learned

- A runtime-style interpreter with `updateBindings`/`updateActions` is straightforward to implement and test in isolation.
- Migration scope is broad but explicit; no hidden dynamic file generation layer was found.

### What was tricky to build

- Relative path resolution from `ttmp/.../scripts` is fragile due deep nesting.
- Symptom: glob paths failed even though files exist.
- Solution: derive repo root via git metadata instead of directory traversal.

### What warrants a second pair of eyes

- Confirm selector naming conventions before coding to avoid future rename churn across screens.

### What should be done in the future

- Keep extending script-based validation with fixture-driven screen snapshots once engine runtime code lands.

### Code review instructions

- Run:
- `node ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/01-resolve-redux-selectors.mjs`
- `node ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/02-runtime-update-semantics.mjs`
- `ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/03-current-dsl-gap-audit.sh`

### Technical details

- Script 01 demonstrates `Sel/Param/Ev` compatibility with Redux-shaped state.
- Script 02 demonstrates binding/action runtime mutability and preview semantics.
- Script 03 captures migration inventory for card/action/override usage.

## Step 4: Design Guide Authoring and Packaging

I created a dedicated design doc and wrote the no-backwards-compat migration guide requested: current DSL first, then new DSL, then integration architecture, tricky parts, examples, pseudocode, diagrams, phased implementation plan, file-by-file action list, and validation strategy.

This step transforms all prior analysis and experiments into a coherent implementation playbook for engineers.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Deliver a long-form, implementation-ready migration guide and store it in the ticket.

**Inferred user intent:** Provide enough context that another engineer can execute migration with confidence.

**Commit (code):** N/A

### What I did

- Added design doc:
- `design/01-current-dsl-deep-dive-and-migration-guide-to-new-screen-dsl.md`
- Included references to symbols and filenames across engine/apps.
- Included pseudocode for runtime core and React adapter.
- Included architecture diagrams and explicit phased rollout plan.

### Why

- A full replacement migration needs shared architectural language and deterministic implementation steps.

### What worked

- Document drafted in-depth with requested structure and content style.

### What didn't work

- N/A.

### What I learned

- The cleanest migration shape is replacing the card-type discriminated union with a runtime-centered screen AST model and moving all behavior routing through bindings/actions.

### What was tricky to build

- Balancing high-level architecture and file-level implementation detail without bloating ambiguity.
- I handled this by pairing each major concept with concrete filenames and pseudocode.

### What warrants a second pair of eyes

- Validate proposed runtime module boundaries (`dsl/*` vs `runtime/*`) before implementation starts.

### What should be done in the future

- After first implementation PR, update this diary with actual test failures/perf findings from production code.

### Code review instructions

- Read design doc sections in order (Current DSL -> New DSL -> Integration Plan).
- Verify that each proposed deletion/replacement file has a migration counterpart.

### Technical details

- The guide is designed as no-backwards-compat by intent and explicitly states complete removal of old DSL artifacts after cutover.

## Step 5: Upload to reMarkable and Verification

I executed the reMarkable upload workflow with the recommended safety sequence: status check, dry-run bundle upload, actual upload, and cloud listing verification. This finalized the delivery requirement and closed the last ticket task.

The upload included both the main design guide and the diary as one bundled PDF with table of contents.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Publish final documentation artifacts to reMarkable after storing them in the ticket.

**Inferred user intent:** Ensure deliverables are accessible both in repo docs and on device for review/reading.

**Commit (code):** N/A

### What I did

- Ran `remarquee status`.
- Ran dry-run:
- `remarquee upload bundle --dry-run ... --name \"HC-017 New DSL Migration Guide\" --remote-dir \"/ai/2026/02/13/HC-017-NEW-DSL\" --toc-depth 2`
- Ran upload:
- `remarquee upload bundle ... --name \"HC-017 New DSL Migration Guide\" --remote-dir \"/ai/2026/02/13/HC-017-NEW-DSL\" --toc-depth 2`
- Verified remote folder and file with:
- `remarquee cloud ls /ai/2026/02/13 --long --non-interactive`
- `remarquee cloud ls '/ai/2026/02/13/HC-017-NEW-DSL' --long --non-interactive`
- Marked final task complete (`docmgr task check --ticket HC-017-NEW-DSL --id 5`).

### Why

- Dry-run avoids accidental overwrite/mis-path surprises.
- Remote listing check confirms publish success, not only local command completion.

### What worked

- Upload succeeded: `OK: uploaded HC-017 New DSL Migration Guide.pdf -> /ai/2026/02/13/HC-017-NEW-DSL`.
- Remote listing confirmed file presence: `[f] HC-017 New DSL Migration Guide`.
- All ticket tasks are now complete.

### What didn't work

- Initial verification command returned:
- `Error: no matches for 'HC-017-NEW-DSL'`
- Follow-up parent directory listing and quoted path listing succeeded.

### What I learned

- `remarquee cloud ls` path matching can be sensitive; listing parent dir first is a reliable fallback.

### What was tricky to build

- Not code-tricky, but operationally important to verify exact remote path after upload.

### What warrants a second pair of eyes

- N/A.

### What should be done in the future

- If repeated uploads are expected, consider a tiny ticket-local helper script to standardize `remarquee` verification commands.

### Code review instructions

- Re-run verification command:
- `remarquee cloud ls '/ai/2026/02/13/HC-017-NEW-DSL' --long --non-interactive`

### Technical details

- Uploaded bundle name on reMarkable: `HC-017 New DSL Migration Guide`.

## Step 6: CardDefinition Scoped State Architecture Extension

I extended the analysis with a second design document that pivots from `ScreenDefinition` to `CardDefinition` and focuses specifically on scoped state management. The new guide defines local card state plus reusable shared Redux state/actions with explicit scope controls by `cardType` and `cardId`.

To keep the design grounded, I added a new runnable simulation script to validate scope precedence and scoped action routing across `card`, `cardType`, `background`, `stack`, and `global` layers.

### Prompt Context

**User prompt (verbatim):** "update the DSL to have CardDefinition instead of ScreenDefinition, and allow cards to have their own state (with actions to update it and selectors to select it). 
also the possibility to define shared state in the redux store and shared actions so that they can be reused from other widgets, in a scoped manner by card type / card id. 

Write a new document that analyzes how to best design that state management thing so that we can have flexible cards with scoped state, a bit like hypercard with its background + card + stack + global setup.

Store the detailed and thoughtful engineering implementation analysis, in the same writing style, in the ticket and upload it as a single docuoment to remarkable. Continue keeping your diary"

**Assistant interpretation:** Produce a new architecture doc that redesigns the runtime model around `CardDefinition` and scoped multi-level state/action/selector resolution, then publish that one document to reMarkable.

**Inferred user intent:** Evolve the DSL into a robust long-term state model that supports both local card flexibility and controlled shared-domain reuse.

**Commit (code):** N/A

### What I did

- Added design doc:
- `design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md`
- Included:
- new `CardDefinition` contract,
- scoped state hierarchy,
- selector/action scoping semantics,
- capability model for shared Redux access,
- pseudocode and migration sequence.
- Added experiment script and output:
- `scripts/04-carddefinition-state-scope-simulation.mjs`
- `scripts/04-carddefinition-state-scope-simulation.out.txt`
- Updated ticket index links to include new doc/script.
- Added and checked tasks for this follow-up scope.

### Why

- The first document established runtime replacement broadly, but this follow-up requires a dedicated, deeper state architecture analysis with explicit layering and policy semantics.

### What worked

- New document drafted in the same style and scoped exactly to `CardDefinition` state architecture.
- Simulation script passed and validated key precedence/handler behavior assumptions.

### What didn't work

- N/A in this step.

### What I learned

- A two-lane state model (scoped local runtime slice + capability-gated shared Redux bridge) is the cleanest way to balance flexibility and containment.

### What was tricky to build

- The sharp edge is combining override precedence with safe shared access.
- I resolved this by separating concerns:
- local resolution precedence for scoped handlers/selectors,
- explicit shared bridge with capability enforcement.

### What warrants a second pair of eyes

- Review proposed default capability mode (deny-by-default) against expected developer ergonomics for rapid card authoring.

### What should be done in the future

- Add lint rules for capability and selector namespace contracts once implementation starts.

### Code review instructions

- Read `design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md` first.
- Run:
- `node ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/04-carddefinition-state-scope-simulation.mjs`

### Technical details

- Simulation validates merged scoped state read precedence and scope-specific action handler dispatch for all five local scopes.


## Step 7: Remove Capability Layer from CardDefinition State Design

I simplified the follow-up architecture document by removing capabilities entirely, per request. The design now uses scoped local state plus namespaced shared registries, without allow-list policy mechanics.

This reduces implementation overhead for the first iteration while preserving the core layered-state model.

### Prompt Context

**User prompt (verbatim):** "ok, we dont need capabilities for now, remove them."

**Assistant interpretation:** Strip capability policy concepts from the new CardDefinition scoped-state design and keep the rest of the architecture intact.

**Inferred user intent:** Keep the architecture simpler and faster to implement by deferring access-control policy work.

**Commit (code):** N/A

### What I did

- Removed `capabilities` fields from `CardDefinition`, `BackgroundDefinition`, `CardTypeProfile`, and stack-global config examples in the design doc.
- Removed capability-guard behavior from selector/action pseudocode.
- Replaced capability sections with shared registry naming/registration guidance.
- Updated migration/test sections to reference shared registry resolver checks instead of capability guard checks.

### Why

- Capability policy adds complexity and governance overhead that is not needed for the immediate implementation milestone.

### What worked

- The architecture remains coherent after removal: scoped state model + shared bridge still fully defined.

### What didn't work

- N/A.

### What I learned

- The scoped-state architecture stands on its own; capability controls are an optional future hardening layer, not a core dependency.

### What was tricky to build

- Ensuring all references were removed consistently across type examples, pseudocode, migration sequence, and final summary.

### What warrants a second pair of eyes

- Confirm that namespaced shared registries alone are sufficient for current product safety and boundary expectations.

### What should be done in the future

- Revisit policy controls later only if cross-card misuse appears in practice.

### Code review instructions

- Search the document for `capab` to confirm no capability policy remains.
- Re-read sections 4, 5, 8, 11, 12, 13, and 15 in:
- `design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md`

### Technical details

- Updated doc path: `ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md`.


## Step 8: Task 9 - Introduce CardDefinition DSL Core Module

I implemented the first execution task by adding a new engine module dedicated to the new CardDefinition DSL contracts and JS helper API. This creates a clean foundation before runtime/shell migration work.

The main output is a standalone `packages/engine/src/cards` module with scope-aware expression/action types and helper constructors.

### Prompt Context

**User prompt (verbatim):** (see Step 6)

**Assistant interpretation:** Start executing migration tasks, committing each completed task and maintaining ticket diary updates.

**Inferred user intent:** Convert planning into code incrementally with verifiable progress checkpoints.

**Commit (code):** `34e268d` — "engine: add CardDefinition DSL core module"

### What I did

- Added `packages/engine/src/cards/types.ts` with:
- `CardDefinition`, `CardStackDefinition`, `UINode`
- `SelExpr`, `ParamExpr`, `EvExpr`, `ActionDescriptor`
- scope types (`card`, `cardType`, `background`, `stack`, `global`, `shared`, `auto`)
- selector/action registry contracts and runtime context contracts
- Added `packages/engine/src/cards/helpers.ts` with JS API helpers:
- `Sel`, `Param`, `Ev`, `Act`
- `ui.*` node constructors (including migration convenience nodes)
- `defineCardStack`
- Added `packages/engine/src/cards/index.ts` barrel export.
- Checked off Task 9 in `docmgr`.

### Why

- Runtime and app migration tasks need stable contracts first; implementing core types/helpers upfront avoids ad hoc shape drift.

### What worked

- New module compiled cleanly.
- Existing code path remained unaffected because this step was additive.

### What didn't work

- A temporary `index.ts` export of both old and new DSL contracts produced a `CardDefinition` name collision (`TS2308`), so I deferred root export unification to the old-DSL removal phase.

### What I learned

- Introducing new contracts in parallel with old contracts requires explicit export staging to avoid type-name collisions.

### What was tricky to build

- Ensuring contracts are future-proof enough for scoped runtime work while still lightweight enough to land as an isolated first task.

### What warrants a second pair of eyes

- Confirm naming in `cards/types.ts` aligns with expected public API stability before wider refactor consumers are updated.

### What should be done in the future

- Reconcile root barrel exports once old DSL types are deleted in Task 12.

### Code review instructions

- Inspect `packages/engine/src/cards/types.ts` and `packages/engine/src/cards/helpers.ts`.
- Verify helper semantics and scope type definitions match ticket design docs.

### Technical details

- Task tracking: Task 9 checked complete in `tasks.md`.
- Build check after this step: `npm run -s typecheck` (pass).


## Step 9: Task 10 - Add Scoped Runtime Redux State Slice

I implemented scoped runtime state in Redux to support card-local and layered scope state (`card`, `cardType`, `background`, `stack`, `global`) with reducer actions for initialization and mutation.

This is the persistence backbone required by the new CardDefinition model so selectors/actions can read/write scope state deterministically.

### Prompt Context

**User prompt (verbatim):** (see Step 6)

**Assistant interpretation:** Continue execution tasks with per-task commits and diary updates.

**Inferred user intent:** Land the scoped state mechanism as real code, not only design docs.

**Commit (code):** `4e20683` — "engine: add scoped runtime redux state slice"

### What I did

- Added `packages/engine/src/cards/runtimeStateSlice.ts` with:
- state shape for `hypercardRuntime` (`global`, `stacks`, `backgrounds`, `cardTypes`, `cards`)
- reducers:
- `ensureCardRuntime`
- `setScopedState`
- `patchScopedState`
- `resetScopedState`
- selectors:
- `selectScopedState`
- `selectMergedScopedState`
- Exported new runtime slice actions/types/selectors through `packages/engine/src/cards/index.ts`.
- Checked off Task 10 in `docmgr`.

### Why

- Runtime expression/action execution needs a concrete, centralized scoped state store before shell/runtime integration can be rewritten.

### What worked

- Scope initialization and mutation APIs compiled cleanly.
- Merge selector precedence aligns with design (`global -> stack -> background -> cardType -> card`).

### What didn't work

- N/A.

### What I learned

- Defining a single `ensureCardRuntime` path early simplifies all downstream runtime operations and avoids repeated guard logic.

### What was tricky to build

- Correctly creating nested scope records lazily while preserving reducer simplicity.
- Addressed by central `ensureStack` and `ensureCard` helpers.

### What warrants a second pair of eyes

- Review reset semantics for broad scopes (`global`/`stack`) since these are intentionally destructive across many cards.

### What should be done in the future

- Add focused reducer unit tests for scope initialization, path writes, and reset behavior.

### Code review instructions

- Start with `runtimeStateSlice.ts` helpers (`ensureStack`, `ensureCard`, `getScopeStateRef`).
- Verify payload contracts and merge order in `selectMergedScopedState`.

### Technical details

- Build check after this step: `npm run -s typecheck` (pass).


## Step 10: Task 11 - Rewrite Shell Runtime to Execute New CardDefinition DSL

I replaced the old shell execution path with a CardDefinition-oriented runtime that resolves expressions/selectors and executes action descriptors directly. This is the first runtime path that no longer depends on `dispatchDSLAction` and old card renderer contracts.

### Prompt Context

**User prompt (verbatim):** (see Step 6)

**Assistant interpretation:** Continue implementing migration tasks sequentially with commits and diary updates.

**Inferred user intent:** Move the running app architecture onto the new DSL runtime core instead of leaving contracts unused.

**Commit (code):** `2cd6b7c` — "engine: rewrite shell runtime for CardDefinition execution"

### What I did

- Added `packages/engine/src/cards/runtime.ts`:
- expression resolution (`resolveValueExpr`)
- scoped/shared selector resolution (`createSelectorResolver`)
- card context adapter (`createCardContext`)
- action execution pipeline (`executeCommand`, built-ins for nav/toast/state.*)
- local/shared action lookup
- Rewrote `packages/engine/src/components/shell/HyperCardShell.tsx` to:
- initialize scoped runtime state with `ensureCardRuntime`
- execute bindings/actions via new runtime functions
- pass runtime handlers into card renderer
- Rewrote `packages/engine/src/components/shell/CardRenderer.tsx` to render AST-style nodes and emit/execute action descriptors.
- Rewrote `packages/engine/src/components/shell/NavBar.tsx` to a DSL-agnostic API (`onBack`, `onGo`).
- Updated shell barrel export in `packages/engine/src/components/shell/index.ts`.
- Checked off Task 11 in ticket tasks.

### Why

- The shell had to move first before app-level porting; otherwise apps cannot consume the new CardDefinition stack model.

### What worked

- New runtime modules and shell compile internally.
- Binding/event/action flow is now centralized through one command pipeline.

### What didn't work

- Repository typecheck still fails at this point because app code and stories still target old shell props/types; this is expected and is addressed by upcoming Tasks 12-15.

### What I learned

- Keeping built-in compatibility aliases (`navigate`/`back`/`toast`) in action execution reduces migration friction while examples are being ported.

### What was tricky to build

- Keeping runtime context pure enough for selector/action execution while also exposing Redux and navigation helpers.

### What warrants a second pair of eyes

- Review whether current built-in action aliases should remain temporary compatibility only or be retained as permanent synonyms.

### What should be done in the future

- Consolidate runtime function signatures once old DSL compatibility aliases are fully removed.

### Code review instructions

- Start in `cards/runtime.ts`.
- Then follow runtime usage in `HyperCardShell.tsx` and UI event wiring in `CardRenderer.tsx`.

### Technical details

- This task intentionally landed before app/story ports, so interim type errors in old consumers were expected.

