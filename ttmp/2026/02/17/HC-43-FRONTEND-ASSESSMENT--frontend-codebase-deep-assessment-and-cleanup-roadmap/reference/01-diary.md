---
Title: Diary
Ticket: HC-43-FRONTEND-ASSESSMENT
Status: active
Topics:
    - frontend
    - architecture
    - cleanup
    - storybook
    - state-management
    - css
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Central investigation target for chat subsystem analysis
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Central investigation target for shell/windowing analysis
    - Path: packages/engine/src/plugin-runtime/index.ts
      Note: Removed dead sandbox worker export path during HC-43 Phase 1
    - Path: packages/engine/src/theme/base.css
      Note: Central investigation target for CSS/design-system analysis
    - Path: ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/01-dead-file-archive-log.md
      Note: Dead file archive provenance for HC-43 Phase 1
    - Path: ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md
      Note: Primary deliverable documented by diary
ExternalSources: []
Summary: Investigation diary for HC-43 capturing repository reconnaissance, architecture evidence gathering, report authoring, and upload steps.
LastUpdated: 2026-02-17T16:25:00-05:00
WhatFor: Record exact analysis workflow, commands, findings, and review instructions for future continuation.
WhenToUse: Use when continuing HC-43, validating evidence sources, or auditing assessment provenance.
---



# Diary

## Goal

Capture the end-to-end investigation process for HC-43: what was examined, what evidence was collected, what failed, and how the final assessment was produced and delivered.

## Step 1: Ticket Setup and Context Recovery

I started by verifying whether the requested ticket workspace already existed and where it was located. There was an initial path mismatch between workspace-root assumptions and the actual repo-root `ttmp` location, so I corrected to the repository path and continued from there.

This step established the execution baseline: existing HC-43 docs were template placeholders, and pre-existing unrelated dirty changes under HC-037 had to be left untouched.

### Prompt Context

**User prompt (verbatim):** "Ok, let's create a new ticket to continue the cleanup, this time make a full assessment of the frontend codebase, how the different subsystems work and are built, things that are duplicated or deprecated, things that could be reorgnized, things that are problematic. Make a really detailed assessment, first a 5+ page section on the currenstate of affair, then for each subsystem you examined, a full review + assessment and proposals for improvement. 

Keep a detailed textbook style with prose paragraphs, code snippets, pseudocode, symbols and file references, diagrams, bullet point lists. Everything for a developer to really get into it even if the ydon't know the codebase. 

Store the document in the ticket and upload tor emarkable. Keep a diary as you investigate."

**Assistant interpretation:** Create/continue an HC-43 ticket document set, perform a deep architecture/code quality audit of the frontend, write an extensive report with concrete technical artifacts, keep a procedural diary, and upload the result to reMarkable.

**Inferred user intent:** Build a durable, onboarding-grade engineering reference that can drive cleanup execution by a new developer without prior context.

**Commit (code):** N/A (documentation and analysis only in this step)

### What I did

- Checked git status in repo root.
- Confirmed HC-43 ticket directory exists under repo-local `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap`.
- Loaded existing `design-doc/01-...assessment.md` and `reference/01-diary.md` to confirm they were still boilerplate templates.

### Why

- Needed to avoid duplicate ticket creation and ensure work lands in the correct workspace.
- Needed to start from actual draft state, not assumptions.

### What worked

- Ticket workspace and required docs already existed and were writable.
- Existing investigation artifacts from earlier exploration were still valid context.

### What didn't work

- Initial path assumption failed:

```bash
ls: cannot access '/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap': No such file or directory
```

- Resolution: switched to repo-root path:
`/home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/...`

### What I learned

- The active working repository is nested (`.../hypercard-add-webchat/2026-02-12--hypercard-react`), so ticket paths should always be resolved from repo root.

### What was tricky to build

- Context continuity was non-trivial because multiple prior ticket operations existed in the same day and there were unrelated modified files in HC-037. The invariant was: do not touch or revert unrelated changes.

### What warrants a second pair of eyes

- Ticket path conventions across workspace vs repo root should be standardized in team documentation to avoid repeat path errors.

### What should be done in the future

- Add a one-line repo-local helper note in ticket docs indicating canonical root path for `ttmp` operations.

### Code review instructions

- Review ticket existence and current state:
- `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/index.md`
- `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md`
- `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/reference/01-diary.md`

### Technical details

- Core verification command:

```bash
git status --short
```

---

## Step 2: Architecture and Quality Evidence Collection

I performed a broad but targeted evidence sweep, focusing on subsystem boundaries, large hotspots, duplication signals, state flows, and style system structure. The goal was to anchor every major claim in concrete files and line-level snippets.

I intentionally sampled both topology-level files (scripts/config/indexes) and runtime-critical implementation files (shell, chat, windowing, runtime host, diagnostics).

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Build an evidence-backed assessment with enough precision (APIs, files, snippets) for actionable cleanup design.

**Inferred user intent:** Avoid vague audit commentary; provide concrete, developer-usable technical findings.

**Commit (code):** N/A (analysis-only)

### What I did

- Enumerated workspace/apps/stories and line-count hotspots.
- Loaded Storybook config and app Vite configs.
- Loaded store factory and diagnostics implementation.
- Loaded windowing slice/selectors + shell + drag overlay + interaction controller.
- Loaded chat transport/projection/orchestration/reducer/event bus files.
- Loaded plugin runtime host and worker client exports.
- Loaded theming CSS and part constants.
- Queried duplicate patterns (`JSON.parse(JSON.stringify`, repeated stack metadata builders, repeated parsing helpers, inline style usage).

### Why

- Needed both architectural map and code-quality problem map to satisfy “full assessment + subsystem proposals”.

### What worked

- `rg` + `nl -ba` + targeted `sed` provided high-fidelity evidence quickly.
- Quantitative inventory identified actual complexity centers.
- Existing tests and diagnostics code were easy to map and reference.

### What didn't work

- Two path assumptions failed for windowing files due package structure drift:

```bash
nl: packages/engine/src/features/windowing/dragOverlayStore.ts: No such file or directory
nl: packages/engine/src/features/windowing/useWindowInteraction.ts: No such file or directory
nl: packages/engine/src/features/windowing/windowingSelectors.ts: No such file or directory
```

- Resolution: discovered drag/interaction files live under shell path:
`packages/engine/src/components/shell/windowing/*`

### What I learned

- Windowing durable state is in `features/windowing`, while fast interaction lane is now in `components/shell/windowing/dragOverlayStore.ts`.
- Storybook is globally scoped but physically inventory-hosted.
- `createDSLApp` and worker sandbox export are ambiguous in current usage.

### What was tricky to build

- Distinguishing “unused” from “library export for future use” required conservative framing. I documented candidates as ambiguity/deprecation-review targets rather than declaring hard dead code.

### What warrants a second pair of eyes

- Export surface decisions (`createDSLApp`, worker sandbox client) should be confirmed by maintainers before deprecation/removal.

### What should be done in the future

- Add API status annotations (`@public`, `@experimental`, `@deprecated`) for ambiguous exports.

### Code review instructions

- Start with these anchors:
- `packages/engine/src/app/createAppStore.ts`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/dragOverlayStore.ts`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/chatSlice.ts`
- `packages/engine/src/theme/base.css`
- `apps/inventory/.storybook/main.ts`

### Technical details

- Representative commands:

```bash
rg --files apps packages
wc -l $(rg --files packages/engine/src apps/inventory/src ... -g '*.ts' -g '*.tsx') | sort -nr | head -n 30
rg -n "style=\{\{" apps/inventory/src packages/engine/src
rg -n "createDSLApp\(" -S packages apps
```

---

## Step 3: Authoring the Deep Assessment Document

I replaced the template design doc with a full long-form report containing: a broad current-state baseline, subsystem-by-subsystem findings, proposals, pseudocode, diagrams, and a prioritized cleanup roadmap.

The structure was designed for a new developer to onboard quickly: general architecture first, then subsystem deep dives, then implementation prioritization and documentation recommendations.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Produce textbook-style prose with concrete engineering evidence and improvement designs.

**Inferred user intent:** Create a durable reference document that can directly drive cleanup execution.

**Commit (code):** N/A (doc authoring in ticket workspace)

### What I did

- Updated:
- `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md`
- Added sections:
- current state baseline (detailed)
- per-subsystem assessments
- proposals with pseudocode
- cleanup roadmap by phase
- docs-to-write list
- open questions
- concrete references list

### Why

- User requested depth, pedagogical style, and practical implementation guidance.

### What worked

- Existing file-level evidence mapped cleanly into subsystem sections.
- Pseudocode patterns were straightforward to express for decomposition proposals.

### What didn't work

- N/A (no blocking authoring issues).

### What I learned

- The codebase is architecturally coherent; cleanup leverage is primarily decomposition and standardization, not foundational redesign.

### What was tricky to build

- Balancing breadth (all subsystems) with actionable specificity required strict section discipline. I used repeated structure: baseline -> evidence -> risk -> proposal -> tasks.

### What warrants a second pair of eyes

- Prioritization order for chat decomposition vs shell decomposition should be validated against current product roadmap.

### What should be done in the future

- Convert roadmap phases into explicit ticket tasks with ownership and acceptance criteria.

### Code review instructions

- Read in this order:
1. `.../design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md` (Executive Summary + Current State)
2. Same file (subsystem sections B-L)
3. Same file (Cleanup Roadmap + Docs-to-Write)

### Technical details

- Report includes flow diagrams and pseudocode for:
- shell decomposition
- chat parse/project pipeline
- CSS design-system restructuring

---

## Step 4: Ticket Bookkeeping and Delivery Prep

I prepared the final packaging phase: diary completion, task/changelog updates, file relations, and upload plan to reMarkable.

This step ensures the document is not only written, but operationally discoverable and linked to implementation context.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Ensure all requested deliverables are complete: ticket doc + diary + upload.

**Inferred user intent:** Receive a finished, auditable handoff artifact.

**Commit (code):** N/A

### What I did

- Finalized this diary with command-level provenance.
- Planned docmgr relation updates for key code anchors.
- Planned upload path: `/ai/2026/02/17/HC-43-FRONTEND-ASSESSMENT/`.

### Why

- Without linkage and upload, the report would remain local and less discoverable.

### What worked

- Ticket structure already included required directories and docs.

### What didn't work

- N/A.

### What I learned

- The best continuation experience for future developers requires both deep prose and explicit file relations.

### What was tricky to build

- Ensuring diary remains useful rather than verbose required focusing on decision-relevant events and command evidence.

### What warrants a second pair of eyes

- Verify that related-file linking remains concise (avoid overlinking noise).

### What should be done in the future

- Add a small ticket automation script for:
- `doc relate`
- `tasks/changelog`
- optional `remarquee upload bundle`

### Code review instructions

- Verify diary completeness:
- `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/reference/01-diary.md`

### Technical details

- Planned upload command pattern:

```bash
remarquee upload bundle \
  <design-doc.md> <diary.md> \
  --name "HC-43 Frontend Assessment" \
  --remote-dir "/ai/2026/02/17/HC-43-FRONTEND-ASSESSMENT" \
  --toc-depth 2
```

---

## Related

- `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/design-doc/01-frontend-current-state-and-subsystem-cleanup-assessment.md`


---

## Step 4: HC-43 Phase 1 Low-Risk Cleanup Kickoff (Dead Marker + Dead File Archive/Removal)

I paused the attempted HC-46 namespace-cutover path and explicitly reverted it to return to the requested HC-43 Phase 1 scope. The first executed low-risk item from the HC-43 roadmap was to remove legacy dead-file markers and archive/remove actual dead files.

I validated file deadness by reference search, archived snapshots under the HC-43 ticket, removed active-source files, and revalidated with full typecheck and engine tests.

### Prompt Context

**User prompt (verbatim):** "ok hold on, what are the tasks you have lined up. I was talking about \"remove legacy dead-file markers and archive actual dead files and all that\" from our original HC-43 document."

**Assistant interpretation:** Drop the temporary HC-46 direction and execute the HC-43 Phase 1 low-risk dead-file cleanup item first.

**Inferred user intent:** Build momentum with safe cleanup tasks that reduce noise and future migration complexity before larger refactors.

**Commit (code):** `d92e426` — "cleanup(hc-43): archive and remove dead legacy marker files"

### What I did

- Reverted in-progress HC-46 direction:
  - restored uncommitted cutover edits,
  - created revert commits for committed HC-46 namespace work.
- Confirmed deadness candidates from HC-43:
  - `apps/inventory/src/stories/decorators.tsx`
  - `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
  - `packages/engine/src/plugin-runtime/worker/runtime.worker.ts`
- Archived snapshots into:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/`
- Removed files from active code and removed dead barrel export in:
  - `packages/engine/src/plugin-runtime/index.ts`
- Ran validation:
  - `npm run typecheck`
  - `npm run -w packages/engine test`

### Why

- This is the explicit first item in HC-43 Phase 1 (low risk, high clarity).
- It reduces codebase ambiguity and removes a known source of worker-side effects through dead exports.

### What worked

- Deadness verification was straightforward (`rg` found no active references).
- All tests/typecheck passed after removal.
- Archive-first approach preserved auditability/history.

### What didn't work

- Cleanup commands like `rm -rf` and `git clean` were blocked by environment policy.
- Resolution: used file-level `apply_patch` deletions and explicit staging.

### What I learned

- The dead worker export path was not only unused but also risked non-browser import side effects (Worker global assumptions).

### What was tricky to build

- Keeping rollback safe while preserving unrelated dirty workspace changes required strict path-level restores and targeted revert commits.

### What warrants a second pair of eyes

- Confirm there are no external consumers relying on `plugin-runtime/worker/sandboxClient` barrel export.

### What should be done in the future

- Continue HC-43 Phase 1 with the remaining low-risk tasks:
  - SEM helper consolidation
  - Storybook/app boot ownership docs

### Code review instructions

- Review code deletion/export cleanup:
  - `packages/engine/src/plugin-runtime/index.ts`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/apps-inventory-src-stories-decorators.tsx`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/packages-engine-src-plugin-runtime-worker-sandboxClient.ts`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/packages-engine-src-plugin-runtime-worker-runtime.worker.ts`
- Validate commands:
  - `npm run typecheck`
  - `npm run -w packages/engine test`

### Technical details

- Revert commits created before resuming HC-43 scope:
  - `1fa1070` Revert "test(engine): add desktop namespace export parity coverage"
  - `5daf495` Revert "refactor(engine): add desktop namespace compatibility barrels"

---

## Step 5: Complete Remaining HC-43 Phase 1 Tasks (SEM Helper Consolidation + Storybook/App-Boot Documentation)

After completing dead-file cleanup, I finished the two remaining low-risk HC-43 Phase 1 tasks: consolidating duplicated SEM helper utilities and adding explicit ownership documentation for Storybook and app boot boundaries.

This kept changes low-risk: mostly pure extraction/reuse of existing helper logic and additive documentation.

### Prompt Context

**User prompt (verbatim):** (see Step 4)

**Assistant interpretation:** Continue Phase 1 low-risk tasks from HC-43, not broader refactor/cutover work.

**Inferred user intent:** Reduce maintenance friction and ambiguity first, so later higher-risk cleanups have a cleaner baseline.

**Commit (code):** `cf09373` — "refactor(inventory-chat): centralize shared sem parsing helpers"

### What I did

- Added shared SEM helper module:
  - `apps/inventory/src/features/chat/semHelpers.ts`
- Replaced duplicated helper implementations in:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/artifactRuntime.ts`
  - `apps/inventory/src/features/chat/timelineProjection.ts`
  - `apps/inventory/src/features/chat/chatSlice.ts`
- Added ownership doc:
  - `docs/frontend/storybook-and-app-boot-model.md`

### Why

- HC-43 Phase 1 explicitly called out duplicate SEM helpers and docs for Storybook/app boot ownership.
- Consolidation reduces drift risk (e.g., differing parsing behavior between projection and artifact extraction paths).

### What worked

- Consolidation was mostly mechanical replacement with no behavior change.
- Targeted inventory chat tests and full typecheck passed.

### What didn't work

- N/A for this step.

### What I learned

- Duplicated parser helper logic was spread across at least three chat modules; centralizing it materially improves readability and future edits.

### What was tricky to build

- Ensuring extraction stayed behavior-identical required touching multiple files while preserving function names/semantics and avoiding circular dependencies.

### What warrants a second pair of eyes

- Quick scan of helper call-sites for any subtle semantic coupling to previous local helper implementations.

### What should be done in the future

- With Phase 1 complete, next step is Phase 2 decomposition tasks (`InventoryChatWindow` split and `DesktopShell` concern split).

### Code review instructions

- Review helper module and call-site updates:
  - `apps/inventory/src/features/chat/semHelpers.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/artifactRuntime.ts`
  - `apps/inventory/src/features/chat/timelineProjection.ts`
  - `apps/inventory/src/features/chat/chatSlice.ts`
- Review new docs:
  - `docs/frontend/storybook-and-app-boot-model.md`
- Validate commands:
  - `npm run typecheck`
  - `npx vitest run apps/inventory/src/features/chat/chatSlice.test.ts apps/inventory/src/features/chat/artifactRuntime.test.ts apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`

### Technical details

- No API-level behavior changes were introduced; this is an internal deduplication and documentation-only boundary clarification step.

---

## Step 6: Reopen HC-43 for Hard-Cutover Phase 1 Replay

I reopened HC-43 as an in-progress ticket and explicitly reframed Phase 1 as a hard-cutover replay with no backward compatibility shims. This aligns with the current directive to execute the same low-risk tasks in order, while documenting the execution path as a new run.

This step only updates ticket control-plane artifacts (`tasks.md`, `index.md`, `changelog.md`, and this diary) before execution checks begin, so later task-by-task evidence can map cleanly to a strict task list.

### Prompt Context

**User prompt (verbatim):** "once reverted, do the same work: add tasks (no backwards compatibility) for the low risk phase 1 HC-43 work (in the HC-43 ticket), and work on them task by task, comimtting as appropriate, keeping a frequent diary."

**Assistant interpretation:** Re-open HC-43 workflow, add an explicit no-backward-compatibility Phase 1 task block, then execute each task sequentially with commits and diary updates.

**Inferred user intent:** Ensure Phase 1 cleanup is tracked and executed as a strict hard cutover, with high traceability for future developers.

### What I did

- Set ticket status back to in-progress in:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/index.md`
- Added a dedicated hard-cutover task section in:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/tasks.md`
- Added kickoff entry in:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/changelog.md`

### Why

- The request was explicit: repeat Phase 1 work in HC-43 with no compatibility/migration buffers.
- Reopening and re-tasking first keeps execution unambiguous before touching any runtime code.

### What worked

- Existing HC-43 structure cleanly supports replay task tracking.
- `docmgr task add` + markdown task updates provide a concrete checklist to execute sequentially.

### What didn't work

- N/A in this step.

### What I learned

- A ticket replay benefits from explicitly separating "historical completion" from "current replay pass" to avoid ambiguity.

### What was tricky to build

- Avoiding confusion between previously completed tasks and the replay tasks required adding a clearly named hard-cutover subsection rather than mutating historical records.

### What warrants a second pair of eyes

- Confirm the replay task naming is clear enough that future readers do not confuse it with the original Phase 1 completion block.

### What should be done in the future

- Execute replay tasks 13-16 in strict order with evidence-driven verification and commits.

### Code review instructions

- Review ticket-control changes:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/index.md`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/tasks.md`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/changelog.md`

### Technical details

- Replay mode constraints: hard cutover only; no feature flags, no compatibility wrappers, no migration layers.

---

## Step 7: Task-by-Task Hard-Cutover Verification - Dead Files and Exports

I executed the dead-file verification pass for the replayed Phase 1 checklist. The objective was to prove hard cutover conditions still hold: removed files stay removed, removed exports stay removed, and archival evidence remains available.

This step is evidence-only and intentionally does not introduce compatibility wrappers or restoration shims.

### Prompt Context

**User prompt (verbatim):** (see Step 6)

**Assistant interpretation:** Execute the dead-file Phase 1 task in HC-43 as a hard-cutover verification step and record evidence.

**Inferred user intent:** Keep source tree clean of deprecated artifacts while preserving enough provenance to audit removals.

### What I did

- Verified files remain absent from active source tree:
  - `apps/inventory/src/stories/decorators.tsx`
  - `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
  - `packages/engine/src/plugin-runtime/worker/runtime.worker.ts`
- Verified no active references remain via:
  - `rg -n "sandboxClient|runtime\.worker|stories/decorators" packages apps -S`
- Verified archive evidence exists in:
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/`
- Re-checked active plugin-runtime barrel exports in:
  - `packages/engine/src/plugin-runtime/index.ts`

### Why

- Hard cutover requires authoritative removal from active code paths, not just deprecation markers.

### What worked

- All three previously removed files are still absent.
- No grep matches found for those removed paths/symbols in active `apps/` and `packages/` code.
- Archive snapshots and archive log remain present.

### What didn't work

- N/A in this step.

### What I learned

- The previous cleanup held without regressions; there was no accidental reintroduction of dead worker/decorator files.

### What was tricky to build

- The only subtle point is ensuring evidence distinguishes "absent in source" from "present in ticket archive" so cleanup provenance is preserved without runtime leakage.

### What warrants a second pair of eyes

- Confirm no external tooling imports the archived paths by string from outside this monorepo.

### What should be done in the future

- Continue with Task 15 and Task 16 replay checks (SEM helper and Vite/app-boot documentation alignment).

### Code review instructions

- Validate absence and archive evidence:
  - `packages/engine/src/plugin-runtime/index.ts`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/01-dead-file-archive-log.md`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/apps-inventory-src-stories-decorators.tsx`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/packages-engine-src-plugin-runtime-worker-sandboxClient.ts`
  - `ttmp/2026/02/17/HC-43-FRONTEND-ASSESSMENT--frontend-codebase-deep-assessment-and-cleanup-roadmap/archive/dead-files/packages-engine-src-plugin-runtime-worker-runtime.worker.ts`

### Technical details

- Verification command outputs captured during this step:
  - `ABSENT:apps/inventory/src/stories/decorators.tsx`
  - `ABSENT:packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
  - `ABSENT:packages/engine/src/plugin-runtime/worker/runtime.worker.ts`

---

## Step 8: Task-by-Task Hard-Cutover Verification - SEM Helper Consolidation

I verified that SEM parsing/normalization helpers remain consolidated in a single shared module and that call sites consistently import from that module. The replay objective here is to ensure no local duplicate parsers were reintroduced.

I also ran targeted chat tests to confirm the consolidation remains behavior-stable.

### Prompt Context

**User prompt (verbatim):** (see Step 6)

**Assistant interpretation:** Execute the SEM helper Phase 1 task in HC-43 and verify hard-cutover deduplication invariants still hold.

**Inferred user intent:** Keep parsing behavior consistent across chat projection/runtime paths by maintaining one source of truth.

### What I did

- Verified helper function definitions exist only in:
  - `apps/inventory/src/features/chat/semHelpers.ts`
- Verified core chat modules import from shared helper:
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/timelineProjection.ts`
  - `apps/inventory/src/features/chat/artifactRuntime.ts`
- Ran targeted tests:
  - `npx vitest run apps/inventory/src/features/chat/chatSlice.test.ts apps/inventory/src/features/chat/artifactRuntime.test.ts apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`

### Why

- This is the Phase 1 deduplication item; hard cutover means no fallback duplicate helpers should remain in module-local code.

### What worked

- Regex checks found helper definitions only in `semHelpers.ts`.
- All targeted tests passed (`24/24`).

### What didn't work

- N/A in this step.

### What I learned

- The centralized helper surface remains clean and is actively consumed by the intended modules.

### What was tricky to build

- The primary verification risk is false positives/negatives from text search; validating both definitions and import graph reduced ambiguity.

### What warrants a second pair of eyes

- Confirm there are no SEM-like helper duplicates outside `apps/inventory/src/features/chat/` that should also be centralized.

### What should be done in the future

- Proceed to Task 16 and Task 17 replay verification (Vite centralization and Storybook/app-boot documentation alignment).

### Code review instructions

- Inspect helper and imports:
  - `apps/inventory/src/features/chat/semHelpers.ts`
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/timelineProjection.ts`
  - `apps/inventory/src/features/chat/artifactRuntime.ts`
- Re-run tests:
  - `npx vitest run apps/inventory/src/features/chat/chatSlice.test.ts apps/inventory/src/features/chat/artifactRuntime.test.ts apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts`

### Technical details

- Test result summary:
  - `Test Files 3 passed (3)`
  - `Tests 24 passed (24)`
