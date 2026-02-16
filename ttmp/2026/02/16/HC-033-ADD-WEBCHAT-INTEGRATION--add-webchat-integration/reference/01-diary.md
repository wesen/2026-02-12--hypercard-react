---
Title: Diary
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - frontend
    - inventory
    - sqlite
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md
      Note: Primary planning output documented in diary
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/sources/local/webchat-hyper-integration.md
      Note: Imported source analyzed and validated against real code
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md
      Note: Task decomposition referenced by diary steps
    - Path: apps/inventory/src/App.tsx
      Note: Phase 2.5 app-window cutover wiring
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Chat UI integration with SEM events
    - Path: apps/inventory/src/features/chat/chatSlice.test.ts
      Note: Reducer validation tests
    - Path: apps/inventory/src/features/chat/chatSlice.ts
      Note: Streaming reducer path
    - Path: apps/inventory/src/features/chat/webchatClient.ts
      Note: Frontend webchat transport implementation
    - Path: apps/inventory/vite.config.ts
      Note: Proxy configuration for backend endpoints
    - Path: ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/scripts/smoke-roundtrip-playwright.mjs
      Note: Playwright smoke script for round-trip gate
ExternalSources:
    - local:webchat-hyper-integration.md
Summary: Detailed planning diary for the webchat integration ticket before implementation starts.
LastUpdated: 2026-02-16T13:25:00-05:00
WhatFor: Preserve detailed planning trace and decision rationale before coding.
WhenToUse: Use when reviewing why the implementation plan was shaped this way.
---



# Diary

## Goal

Capture a detailed, command-level planning trail for `HC-033-ADD-WEBCHAT-INTEGRATION`, including what was validated against code, what mismatches were discovered in the imported document, and how the hard-cutover implementation plan was refined before coding.

## Step 1: Ticket Setup and Source Import

I started by creating the ticket workspace and importing the provided design document into the ticket using `docmgr`, then I validated the local docmgr setup and command syntax before proceeding.

This step established the baseline artifacts and avoided guessing paths by reading generated ticket files directly from disk.

### Prompt Context

**User prompt (verbatim):** "Create a new ticket HC-033-ADD-WEBCHAT-INTEGRATION with docmgr and use docmgr import file --file /tmp/webchat-hyper-integration.md --ticket HC-033-ADD-WEBCHAT-INTEGRATION. Read it in detail and do your own analysis, since you have the code as well. Store that analysis and implementation plan (making sure things laid out in the imported document are correct) in the ticket and upload it to remarkable. Make a detailed breakdown of tasks and add them to the ticket as well. Keep a frequent detailed diary as you work.

The goal is to have a working inventory chat (with the tools querying a sqlite db with mock data, make scripts to populate, but that's towards the end).

As you work things out and encounter problems, feel free to write little experiments in the ticket's scripts/ folder. Implement the go application in the 2026-02-12--hypercard-react/ folder. The projects are worktrees.

Be exhaustive and detailed in your planning.


----

Ask me about any part which requires making decisions. Btw we are doing a hard cutover, and want to keep the \"mocking / intermediate\" constructions to a minimum to simplify our work."

**Assistant interpretation:** Create/import the ticket docs, perform deep repo-grounded analysis, write a corrected implementation plan and detailed tasks into the ticket, keep a detailed diary, and upload the resulting planning docs to reMarkable.

**Inferred user intent:** De-risk implementation by validating assumptions first, then execute from a robust, concrete plan with minimal transitional architecture.

**Commit (code):** N/A (planning/docs only)

### What I did

- Verified `docmgr` workspace root and existing tickets.
- Created ticket: `HC-033-ADD-WEBCHAT-INTEGRATION`.
- Imported `/tmp/webchat-hyper-integration.md` into ticket sources.
- Inspected generated ticket structure (`index.md`, `tasks.md`, `changelog.md`, imported source file).

### Why

- Ticket/workspace creation and source import were mandatory prerequisites.
- I needed canonical file paths before writing any design artifacts.

### What worked

- `docmgr ticket create-ticket` succeeded on first run.
- `docmgr import file` succeeded and placed source under `sources/local/`.

### What didn't work

- Initial ticket list command used outdated syntax:
  - Command: `docmgr ticket list --all`
  - Error: `Error: unknown flag: --all`
- Resolved by switching to `docmgr list tickets`.

### What I learned

- This docmgr installation uses `docmgr list tickets` (not `ticket list --all`) for enumeration.
- Ticket root for this repo is correctly bound to `2026-02-12--hypercard-react/ttmp` via `.ttmp.yaml`.

### What was tricky to build

- Reconciling docmgr command variants quickly without slowing the workflow.
- Symptom: command help output showed valid alternatives but the first command path failed.
- Approach: immediately pivoted to `docmgr help` + `docmgr list tickets --with-glaze-output`.

### What warrants a second pair of eyes

- None functionally; setup is straightforward.

### What should be done in the future

- Keep using `--with-glaze-output --output json` for deterministic scripting in this repo.

### Code review instructions

- Verify ticket exists and source imported:
  - `docmgr list tickets --with-glaze-output --fields ticket,path`
  - `find ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration -maxdepth 3 -type f`

### Technical details

- Ticket path:
  - `ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration`
- Imported source path:
  - `ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/sources/local/webchat-hyper-integration.md`

## Step 2: Deep Validation and Planning-Only Pivot

I read the imported source in detail, then cross-validated key claims against actual code in `apps/inventory`, `packages/engine`, `pinocchio`, and `geppetto`.

During this validation, the user explicitly changed scope to planning-only, so I halted implementation intent and produced only analysis/plan/task artifacts.

### Prompt Context

**User prompt (verbatim):** "don't start the implementation for now, just analyze and design an implementation plan and then upload to remarkable"

**Assistant interpretation:** Stop before code changes and deliver planning artifacts only, then upload ticket docs to reMarkable.

**Inferred user intent:** Lock architecture and execution sequence before spending implementation cycles.

**Commit (code):** N/A (planning/docs only)

### What I did

- Validated imported plan against code reality, including:
  - app-window support in `DesktopShell`
  - inline widget support in `ChatWindow`
  - plugin runtime mutation APIs in `runtimeService`
  - current inventory chat slice limitations
  - current inventory Vite config (no backend proxy)
  - backend composition hooks in Pinocchio (`WithEventSinkWrapper`, app-owned HTTP handlers)
  - structured sink extractor APIs in Geppetto.
- Created ticket planning docs:
  - `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
  - updated `tasks.md` with detailed phase/task breakdown.
- Created and maintained this diary.

### Why

- Imported document was strong but had location and sequencing assumptions that needed correction for this workspace and hard-cutover constraints.
- Planning-only directive required stopping before implementation.

### What worked

- Most architectural assumptions from imported doc matched actual code capabilities.
- Existing engine and pinocchio extension points are sufficient for MVP design without engine-level rewrites.

### What didn't work

- One file lookup assumption was wrong during source inspection:
  - Command: `sed -n '1,320p' geppetto/pkg/events/structuredsink/extractor.go`
  - Error: `sed: can't read .../extractor.go: No such file or directory`
- Resolution: extractor interfaces are defined in `filtering_sink.go` in this codebase version.

### What I learned

- Hard-cutover is feasible with minimal transitional scaffolding because core primitives already exist.
- The largest implementation risk is contract consistency (tool schemas, widget payload schema, and frontend reducer event handling), not missing infrastructure.

### What was tricky to build

- Distinguishing what is already implemented in reusable engine/pinocchio code versus what is inventory-app-specific.
- Symptoms: imported plan included accurate architecture but proposed backend path under `pinocchio/cmd`, while requested target is a different worktree folder.
- Approach: built a “validation matrix” in the design doc (keep/adjust/defer) and moved backend location accordingly.

### What warrants a second pair of eyes

- Decision points before implementation:
  - model provider/runtime default
  - whether to retain plugin assistant card after chat window cutover
  - timeline persistence default behavior
  - create-card dedupe policy.

### What should be done in the future

- Next step after approval is phase-by-phase implementation from `tasks.md`, starting with backend scaffolding and request resolver tests.

### Code review instructions

- Read design plan first:
  - `ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Then inspect task decomposition:
  - `ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md`

### Technical details

- Key validated files:
  - `apps/inventory/src/App.tsx`
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/vite.config.ts`
  - `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
  - `packages/engine/src/components/widgets/ChatWindow.tsx`
  - `packages/engine/src/plugin-runtime/runtimeService.ts`
  - `pinocchio/pkg/webchat/http/api.go`
  - `pinocchio/pkg/webchat/router_options.go`
  - `pinocchio/pkg/sem/registry/registry.go`
  - `geppetto/pkg/events/structuredsink/filtering_sink.go`

## Related

- Plan doc: `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Task list: `tasks.md`

## Step 3: Doc Hygiene and reMarkable Upload

After writing the planning docs, I ran docmgr hygiene checks, fixed vocabulary/frontmatter issues in the new ticket workspace, and uploaded a bundled planning PDF to reMarkable.

This locked in the planning deliverable without starting implementation work.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Assistant interpretation:** Finalize planning artifacts, ensure they are clean and discoverable, and deliver them to reMarkable.

**Inferred user intent:** Have a review-ready planning package available in both repo ticket docs and reMarkable.

**Commit (code):** N/A (planning/docs only)

### What I did

- Ran `docmgr doctor --ticket HC-033-ADD-WEBCHAT-INTEGRATION --stale-after 30`.
- Added missing topic vocabulary entries (`inventory`, `sqlite`) to remove unknown-topic warning.
- Added YAML frontmatter wrapper to imported source copy under `sources/local/`.
- Ran `remarquee upload bundle --dry-run ...` for ticket docs.
- Uploaded bundle to reMarkable:
  - name: `HC-033 Planning Package`
  - remote dir: `/ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION`
- Verified upload with `remarquee cloud ls --long --non-interactive`.

### Why

- Planning artifacts needed hygiene and a distributable output for review.
- Dry-run first reduced risk of upload mistakes.

### What worked

- `remarquee` status and upload flow worked end-to-end.
- Bundle upload succeeded and appears in cloud listing.
- Topic vocabulary warnings were resolved.

### What didn't work

- `docmgr doctor` still reports one pre-existing error in another directory with the same ticket id slug:
  - `.../ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory`
  - issue: missing `index.md`
- This appears to be a stale, separate workspace path, not the newly created ticket directory.

### What I learned

- Ticket-level doctor output can include stale sibling directories sharing the ticket slug pattern.
- `sources/local` imported files can benefit from frontmatter if strict validation is desired.

### What was tricky to build

- Distinguishing between issues introduced in this planning pass versus stale pre-existing ticket-directory artifacts.
- Symptom: doctor reported an error for a different dated path than the active ticket workspace.
- Approach: validated active ticket path via `docmgr list tickets` and left stale-path cleanup as a separate follow-up decision.

### What warrants a second pair of eyes

- Whether to clean/remove the stale `2026/02/15/...HC-033...` directory now or leave it untouched.

### What should be done in the future

- If desired, normalize/clean stale duplicate ticket directories so `docmgr doctor` runs clean for this ticket id.

### Code review instructions

- Confirm uploaded document exists:
  - `remarquee cloud ls /ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION --long --non-interactive`
- Re-run doctor and inspect remaining stale-path warning:
  - `docmgr doctor --ticket HC-033-ADD-WEBCHAT-INTEGRATION --stale-after 30`

### Technical details

- Uploaded document name: `HC-033 Planning Package`
- Uploaded remote folder: `/ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION`
- Included bundle inputs:
  - `index.md`
  - `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
  - `tasks.md`
  - `reference/01-diary.md`
  - `changelog.md`

## Step 4: Plan Revision for Glazed + Pinocchio Reuse + Middleware Artifact/Card Generation

After upload, the user added explicit design constraints: use Glazed command composition like `pinocchio/cmd/web-chat/main.go`, maximize reuse of `pinocchio/pkg/webchat`, perform artifact/card generation through Geppetto middlewares, and keep timeline/turn persistence in Pinocchio.

I treated this as a plan-level architecture update only (no implementation code changes), then rewrote the design and task docs accordingly.

### Prompt Context

**User prompt (verbatim):** "no that's fine. A few changes:

  Then, I want to use the glazed framework to configure the server, like in pinocchio/cmd/web-chat/main.go
  (see glazed/pkg/doc/tutorials/05-build-first-command.md ).
 
  I also want to use as much of pinocchio/pkg/webchat as possible, and do the artifact and card generation
  using geppetto middlewares.
 
  Update your plan accordingly.
 
  timeline persistence and turn persistence is done through pinocchio/.

Does this impact your core design? 

Walk me through your target design quickly."

**Assistant interpretation:** Keep the overall architecture but revise plan details so composition and implementation strategy strictly follow these framework/reuse constraints.

**Inferred user intent:** Avoid unnecessary custom infrastructure and push behavior into existing framework extension points for a cleaner hard cutover.

**Commit (code):** N/A (planning/docs only)

### What I did

- Reviewed and cross-checked:
  - `pinocchio/cmd/web-chat/main.go`
  - `glazed/pkg/doc/tutorials/05-build-first-command.md`
  - `pinocchio/pkg/webchat/router.go`
  - `pinocchio/pkg/webchat/http/api.go`
  - `pinocchio/pkg/webchat/router_options.go`
  - `geppetto/pkg/inference/middleware/middleware.go`
  - `pinocchio/pkg/middlewares/agentmode/middleware.go`
- Rewrote design doc to lock:
  - Glazed-first command bootstrap pattern
  - Pinocchio reuse-first backend composition
  - middleware-driven artifact/card generation
  - Pinocchio-native timeline/turn persistence
- Rewrote tasks to match updated phases and responsibilities.
- Updated changelog with this plan revision.
- Uploaded refreshed reMarkable bundle:
  - name: `HC-033 Planning Package v2`
  - remote dir: `/ai/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION`

### Why

- The previous plan was directionally correct, but not explicit enough on Glazed command wiring and middleware ownership for artifact/card generation.
- The user requested precise framework alignment before implementation starts.

### What worked

- Existing Pinocchio and Geppetto extension points already support requested design without framework forks.
- Router settings already cover timeline/turn persistence through Pinocchio stores.

### What didn't work

- Some file guesses were wrong while validating:
  - `pinocchio/cmd/web-chat/profile_resolver.go` does not exist; relevant resolver code is in `profile_policy.go`.
  - `pinocchio/pkg/webchat/config.go` and `parameters.go` do not exist in this repo snapshot.
- Corrected by locating actual files via `rg` and reading the concrete implementations.

### What I learned

- This is a composition refinement, not an architecture rewrite.
- Artifact/card behavior can be made deterministic with middleware + structured sink extraction while still keeping clean Pinocchio transport and persistence ownership.

### What warrants a second pair of eyes

- The exact middleware strategy for card generation fallback:
  - strict model-authored structured blocks only
  - or middleware-generated canonical blocks when model output is incomplete

### What should be done in the future

- Before coding, lock this one decision so middleware behavior is unambiguous and test cases are stable.

### Code review instructions

- Read revised design:
  - `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Confirm tasks now track Glazed/Pinocchio/middleware split:
  - `tasks.md`

### Technical details

- Persistence path now explicitly references Pinocchio router settings:
  - `timeline-dsn` / `timeline-db`
  - `turns-dsn` / `turns-db`
- Middleware responsibilities now explicit in plan:
  - artifact policy middleware
  - artifact/card generation middleware

## Step 5: Lock No-Fallback Policy and Progressive Lifecycle Events

After plan revision, the user locked two concrete behavior rules: no fallback success synthesis, and progressive widget/card lifecycle events with title-gated start emission.

I updated design and task artifacts so implementation will enforce these behaviors directly in extractor/SEM/timeline wiring.

### Prompt Context

**User prompt (verbatim):** "no fallback. 

for the events: can we generate more events based on the progressive parsing of the YAML? for example \"widget.start\" with a title, so we can show a spinner, etc... ? I don't remember how the structured event sinks work."

**Assistant interpretation:** Confirm structured sink progressive behavior and lock event lifecycle design with concrete start/update/ready/error semantics.

**Inferred user intent:** Make frontend UX responsive during streaming parse while keeping backend behavior strict and deterministic under hard cutover.

**Commit (code):** N/A (planning/docs only)

### What I did

- Verified structured sink session lifecycle behavior:
  - `OnStart`, `OnRaw`, `OnCompleted`
  - malformed completion semantics
- Verified Pinocchio timeline projection extension points:
  - `TimelineProjector.ApplySemFrame`
  - `RegisterTimelineHandler`
- Updated design plan with locked decisions:
  - no fallback synthesis
  - progressive lifecycle events
  - title-gated start event rule
- Updated tasks to include:
  - lifecycle event emission tasks
  - title-gated start tests
  - timeline projection handler tasks
- Updated index decision gates/locked decisions.
- Updated changelog for this decision lock.

### Why

- The event model had to be explicit before implementation to avoid reducer and timeline contract churn.
- Title-gated start avoids noisy spinner events with unusable labels.

### What worked

- Existing extractor session APIs directly support progressive events.
- Existing timeline custom handler registry supports mapping these lifecycle events into projection entities.

### What didn't work

- None functionally in this step.

### What I learned

- We can provide progressive UX without fallback synthesis by emitting lifecycle updates during `OnRaw` YAML snapshots and explicit error completion when parse fails.

### What warrants a second pair of eyes

- Naming consistency for lifecycle events (`hypercard.widget.v1` as final-success event vs introducing `hypercard.widget.ready`) before coding starts.

### What should be done in the future

- Freeze final event names in one place in code constants before implementing extractor + frontend parser.

### Code review instructions

- Review new locked decisions and event contract:
  - `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Review task updates for lifecycle and timeline projection:
  - `tasks.md`
- Review index decision status:
  - `index.md`

### Technical details

- Structured sink hooks used for progressive events:
  - `geppetto/pkg/events/structuredsink/filtering_sink.go`
- Incremental YAML snapshot helper:
  - `geppetto/pkg/events/structuredsink/parsehelpers/helpers.go`
- Timeline extension points:
  - `pinocchio/pkg/webchat/timeline_projector.go`
  - `pinocchio/pkg/webchat/timeline_registry.go`

## Step 6: Apply Final Decision Lock to Planning Artifacts

The user then explicitly requested that these decisions be written into the design/implementation plan. I treated this as a documentation deliverable update and patched the ticket docs only.

I synchronized design, tasks, and index so the implementation phases now assume strict model-authored final events and progressive lifecycle emissions with title-gated start.

### Prompt Context

**User prompt (verbatim):** "only emit start when the title is there. 

Ok, update your deseign document / implementation plan with these decisions."

**Assistant interpretation:** Persist the just-agreed event policy directly into ticket planning artifacts.

**Inferred user intent:** Freeze behavior contracts before coding begins to avoid implementation ambiguity.

**Commit (code):** N/A (planning/docs only)

### What I did

- Updated design doc event contract and timeline projection sections.
- Updated tasks with lifecycle-specific implementation/testing tasks and checked decision-lock items.
- Updated index pending/locked decision sections.
- Updated changelog and this diary.
- Re-ran frontmatter validation and doctor checks.

### Why

- The planning docs are the execution contract for implementation; the agreed policy must be explicit there.

### What worked

- Frontmatter validation passed for updated planning docs.
- Decision lock is now reflected consistently across core ticket docs.

### What didn't work

- `docmgr doctor` still reports the pre-existing stale sibling ticket directory and numeric-prefix warning for imported source filename.

### What I learned

- Explicitly locking event semantics early avoids rework in backend extractors, frontend reducers, and timeline projection handlers.

### What warrants a second pair of eyes

- None beyond previously tracked stale doc workspace hygiene warning.

### What should be done in the future

- If desired, clean stale duplicate ticket directory to make `docmgr doctor` fully clean.

### Code review instructions

- Review finalized behavior contract:
  - `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Review task-level execution implications:
  - `tasks.md`
- Review decision summary:
  - `index.md`

### Technical details

- Validation commands:
  - `docmgr validate frontmatter --doc ...`
  - `docmgr doctor --ticket HC-033-ADD-WEBCHAT-INTEGRATION --stale-after 30`

## Step 7: Insert Early Frontend Round-Trip Cutover Phase

The user requested an explicit frontend cutover checkpoint immediately after backend Phase 2 so the team can validate the real chat round-trip before artifact/card work.

I updated the implementation phases and tasks to include this milestone as Phase 2.5, and re-scoped later frontend work as artifact-aware expansion rather than first-time cutover.

### Prompt Context

**User prompt (verbatim):** "After phase 2, add a cutover on the frontend so we can already test a minimal chat experience (without artifacts, but with streaming events). That way we can already test the round trip."

**Assistant interpretation:** Re-sequence the execution plan to include an earlier frontend milestone for minimal streaming chat E2E validation.

**Inferred user intent:** De-risk integration earlier by validating transport and streaming UX before adding artifact complexity.

**Commit (code):** N/A (planning/docs only)

### What I did

- Updated delivery phases in design doc:
  - inserted `Phase 2.5` early frontend cutover
  - clarified acceptance criteria for minimal round-trip validation
  - reworded later frontend phase to artifact-aware expansion
- Updated tasks:
  - added `2.5 Early frontend cutover` task block (`F2.5.*`)
  - split old frontend tasks so post-2.5 work focuses on lifecycle/artifact expansion
- Updated index summary to mention early round-trip checkpoint.
- Updated changelog and diary.

### Why

- Early end-to-end validation catches transport/protocol/reducer issues before artifact lifecycle complexity is introduced.

### What worked

- Existing phased plan structure made insertion of a new checkpoint straightforward.
- Task split keeps ownership clear between minimal transport cutover and later feature expansion.

### What didn't work

- None functionally in this step.

### What I learned

- The most pragmatic cutover path here is: backend transport stable -> minimal frontend round-trip -> artifact lifecycle/features.

### What warrants a second pair of eyes

- Ensure phase labels in team tracking (if mirrored outside docmgr) match new `Phase 2.5` numbering.

### What should be done in the future

- At implementation start, mark a hard acceptance gate for Phase 2.5:
  - successful streamed `llm.start/delta/final` round-trip in UI
  - fake stream path inactive for primary inventory chat surface

### Code review instructions

- Verify phase resequencing:
  - `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Verify inserted task block and renumbered frontend scope:
  - `tasks.md`
- Verify index overview note:
  - `index.md`

### Technical details

- New early cutover block in tasks:
  - `F2.5.1` to `F2.5.7`

## Step 8: Implement Phase 2.5 Frontend Hard Cutover and Validate in Tmux

This step executed the early frontend cutover milestone from plan Phase 2.5. I replaced the inventory frontend chat path with a real `/chat` + `/ws` transport flow, wired it into an app-window in `DesktopShell`, and validated a real round-trip with Playwright.

I treated this as a hard-cut implementation slice (no backward-compat behavior retained for the primary chat surface), and committed code before ticket-bookkeeping updates per the requested task-by-task flow.

### Prompt Context

**User prompt (verbatim):** "Alright, let's go. Build task by task, commit at regular intervals, update your diary as you work, and check off tasks."

**Assistant interpretation:** Start implementation immediately in phased increments, commit regularly, and keep ticket tasks/diary continuously updated.

**Inferred user intent:** Execute the agreed HC-033 plan with visible progress, durable documentation, and runnable validation loops.

**Commit (code):** 42a085d — "HC-033: hard-cut inventory frontend to /chat+/ws streaming"

### What I did

- Replaced inventory chat state with a streaming-aware reducer in:
  - `apps/inventory/src/features/chat/chatSlice.ts`
- Added selectors for conversation/connection/stream status:
  - `apps/inventory/src/features/chat/selectors.ts`
- Added minimal real transport client with persisted `conv_id`, WS attach, and `/chat` submit:
  - `apps/inventory/src/features/chat/webchatClient.ts`
- Added chat app-window component that consumes SEM frames (`llm.start/delta/final`, optional `tool.*`):
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- Cut over inventory shell to open a dedicated app-window chat on startup:
  - `apps/inventory/src/App.tsx`
- Added Vite proxy routing for backend endpoints:
  - `apps/inventory/vite.config.ts`
- Added reducer tests:
  - `apps/inventory/src/features/chat/chatSlice.test.ts`
- Added Playwright smoke script under ticket scripts:
  - `ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/scripts/smoke-roundtrip-playwright.mjs`
- Ran validations:
  - `npm exec -w apps/inventory vitest run src/features/chat/chatSlice.test.ts`
  - `npm exec -w apps/inventory tsc -b`
  - `node ./ttmp/.../scripts/smoke-roundtrip-playwright.mjs`
- Started backend/frontend in tmux sessions:
  - `hc033-backend`
  - `hc033-frontend`

### Why

- Phase 2.5 requires early end-to-end round-trip validation before artifact/card lifecycle work.
- Hard-cut frontend rewrite avoids carrying mock-stream compatibility into the new webchat path.

### What worked

- Streaming reducer path correctly handled `llm.start -> llm.delta -> llm.final` in tests.
- Frontend connected through proxied `/ws` and posted prompts to `/chat` with persisted `conv_id`.
- Playwright smoke test passed with real streamed output:
  - `OK: received AI stream output: To provide an accurate`
- Backend logs confirmed conversation stream + inference loop execution under test run.

### What didn't work

- Attempt to mark task IDs via `docmgr task check` failed because the command expects numeric indexes:
  - command: `docmgr task check --ticket HC-033-ADD-WEBCHAT-INTEGRATION --id F2.5.1,...`
  - error: `strconv.Atoi: parsing "F2.5.1": invalid syntax`
- `pnpm dev` from `apps/inventory` failed in this workspace because `vite` binary is not linked there under current install layout:
  - command: `pnpm dev --host 127.0.0.1 --port 5173`
  - error: `sh: 1: vite: not found`
- Existing workspace build issue (not introduced by this step) still occurs on full `vite build`:
  - error: `Invalid value "iife" for option "worker.format"`
- First frontend tmux launch attempt hit a stale session name:
  - error: `duplicate session: hc033-frontend`

### What I learned

- Running `pnpm dev` from repo root (which delegates to npm workspace script) works in this mixed workspace setup, while direct app-level `pnpm dev` does not.
- The minimal SEM handler set is sufficient for the Phase 2.5 gate; artifact/card rendering can stay disabled until later phases.

### What was tricky to build

- The tricky part was keeping the UI responsive before first `llm.start` while still enforcing single in-flight request semantics.
- I solved this by adding a pending streaming AI placeholder on submit, then rebinding it to the real LLM message id when `llm.start` arrives.

### What warrants a second pair of eyes

- Confirm whether we should fully delete/replace the plugin `assistant` card path now or in later cleanup (primary surface is already cut over).
- Confirm desired UX if `/chat` succeeds but no `llm.*` frame arrives before timeout (currently surfaces stream error via reducer).

### What should be done in the future

- Proceed to Phase 3 (SQLite domain + seed scripts), then wire inventory tools and geppetto middleware extraction.

### Code review instructions

- Start with frontend cutover wiring:
  - `apps/inventory/src/App.tsx`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/webchatClient.ts`
- Review reducer/event semantics:
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/chatSlice.test.ts`
- Review dev routing and smoke script:
  - `apps/inventory/vite.config.ts`
  - `ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/scripts/smoke-roundtrip-playwright.mjs`
- Re-run validations:
  - `npm exec -w apps/inventory vitest run src/features/chat/chatSlice.test.ts`
  - `npm exec -w apps/inventory tsc -b`
  - with tmux sessions running: `node ./ttmp/.../scripts/smoke-roundtrip-playwright.mjs`

### Technical details

- Backend tmux launch:
  - `go run ./cmd/hypercard-inventory-server hypercard-inventory-server --addr :8091`
- Frontend tmux launch:
  - `INVENTORY_CHAT_BACKEND=http://127.0.0.1:8091 pnpm dev -- --host 127.0.0.1 --port 5173`
- Smoke acceptance evidence:
  - backend log shows `stream coordinator: started` and `starting inference loop`
  - Playwright script returns non-empty AI output from the chat window
