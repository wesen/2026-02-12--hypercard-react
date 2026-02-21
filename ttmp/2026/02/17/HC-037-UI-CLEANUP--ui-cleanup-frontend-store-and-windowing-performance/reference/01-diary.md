---
Title: Diary
Ticket: HC-037-UI-CLEANUP
Status: active
Topics:
    - frontend
    - redux
    - performance
    - ux
    - debugging
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/changelog.md
      Note: Ticket-level lifecycle updates logged
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/01-redux-event-pipeline-and-window-dragging-performance-analysis.md
      Note: Primary output documented in diary
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/reference/01-diary.md
      Note: Execution log and failure recovery notes
    - Path: ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/02-frontend-storybook-state-management-and-css-design-system-cleanup-investigation.md
      Note: Second investigation deliverable documented in diary
    - Path: ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/03-chat-window-message-and-timeline-widget-virtualization-performance-investigation.md
      Note: Third focused investigation deliverable logged in diary
    - Path: ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/reference/01-diary.md
      Note: Execution log for both investigations
ExternalSources: []
Summary: Step-by-step diary of HC-037 execution, including ticket lifecycle actions, analysis workflow, failure recovery, and reMarkable upload.
LastUpdated: 2026-02-17T08:38:00-05:00
WhatFor: Detailed implementation log for reproducibility and review.
WhenToUse: Read when auditing what was done for HC-037 and why.
---





# Diary

## Goal

Capture the full execution trail for HC-037: closing legacy tickets, opening a new cleanup ticket, performing deep frontend performance analysis (Redux event path + window dragging path), and publishing the final 6+ page analysis to reMarkable.

## Step 1: Ticket Lifecycle Reset and Workspace Setup

I first handled ticket lifecycle hygiene so the new work would start from a clean planning boundary. The goal in this step was purely operational: close all tickets through HC-034, verify status boundaries, and create the new HC-037 workspace with dedicated analysis + diary docs.

This step included one command-level failure due zsh word-splitting behavior in a bulk close loop; I recorded and corrected it immediately with a line-safe loop.

### Prompt Context

**User prompt (verbatim):** "Close docmgr ticket all the way up to HC-34 (included).

Then create a new docmgr ticket to cleanup the ui. Keep a frequent detailed diary as you work.

We will first analyze the hypercard JS frontend and improve the performance of the redux store. We don't want to store all the received events from the LLM directly into the main store, because they are high frequency and used mostly to project to timeline entities. Analyze how the dispatching of these events is done, and propose a set of designs that allows us to keep the workings intact, including the events debugging window, while lowering the burden on redux and state management.

Be really thorough and explore different solutions of tackling this.

Then do the same for window managemnet, especially dragging. However here we do want to keep windowing state overall in redux, it's just about reducing the load of dragging windows around hitting the store.

Store your detaile analysis 6+ pages in the ticket and upload to remarkable."

**Assistant interpretation:** Close all HC tickets up to HC-034 inclusive, create a fresh UI cleanup ticket, and perform/report deep frontend performance analysis with a detailed diary and reMarkable upload.

**Inferred user intent:** Reset task context, then produce a high-rigor architecture/performance design document that can guide immediate implementation while preserving current behavior and debugging observability.

**Commit (code):** N/A — no git commit was created.

### What I did

- Ran ticket inventory/status checks:
  - `docmgr status --summary-only`
  - `docmgr ticket list`
  - `docmgr ticket tickets --with-glaze-output --output json`
- Attempted bulk close with a zsh `for` loop over multiline command substitution.
- Hit failure because zsh treated multiline ticket IDs as one value; `docmgr` received a combined invalid ticket string.
- Re-ran with robust line-based loop:
  - `... | while IFS= read -r t; do docmgr ticket close --ticket "$t" ...; done`
- Verified status boundary after close:
  - `HC-001` through `HC-034` => `complete`
  - `HC-035`, `HC-036` => `active`
- Created new ticket:
  - `docmgr ticket create-ticket --ticket HC-037-UI-CLEANUP ...`
- Added working docs:
  - `docmgr doc add --ticket HC-037-UI-CLEANUP --doc-type design-doc --title "Redux Event Pipeline and Window Dragging Performance Analysis"`
  - `docmgr doc add --ticket HC-037-UI-CLEANUP --doc-type reference --title "Diary"`

### Why

- Closing HC-001..HC-034 met the explicit user request and created a clear archival cutoff.
- Creating HC-037 before analysis ensured all outputs (design + diary) were ticket-scoped from the start.
- Fixing the loop robustly avoided partial/manual close drift and preserved reproducibility.

### What worked

- Structured ticket listing with JSON output made deterministic filtering possible.
- `docmgr ticket close` accepted closing even when tasks remained open (with warnings), matching reset intent.
- New ticket/doc scaffolding generated correct workspace paths.

### What didn't work

- Initial bulk-close loop failure:
  - Command pattern: `for t in $TICKETS; do ...`
  - Error:
    - `Error: failed to find ticket directory: ticket not found: HC-001-IMPORT-JSX
      HC-002-SCAFFOLD
      ...`
- Root cause: zsh word-splitting behavior with multiline scalar in that loop form.

### What I learned

- In this environment, line-oriented `while IFS= read -r` loops are safer than `$var` iteration for multiline command output.
- `docmgr ticket close` is suitable for deliberate lifecycle closure even with incomplete task lists, provided warnings are acknowledged.

### What was tricky to build

- The tricky part was making the closure operation both broad (34 tickets) and safe (exact cutoff). The first script conflated all IDs into one argument due shell behavior, causing a hard failure and no progress.
- I resolved this by switching to a line-safe loop and keeping deterministic numeric filtering (`$2 <= 34`) from ticket IDs.

### What warrants a second pair of eyes

- Confirm the organizational intent behind mass-closing incomplete tickets is acceptable for downstream reporting/metrics.
- Confirm no automation depends on HC-001..HC-034 remaining `active` or `review`.

### What should be done in the future

- Add a reusable `docmgr` helper script for numeric-range lifecycle operations (close/archive) with dry-run mode and summary output.

### Code review instructions

- Review command history for the two closure attempts (failed loop then fixed loop).
- Validate ticket statuses via:
  - `docmgr ticket tickets --with-glaze-output --output json | jq -r '.[] | "\(.ticket)\t\(.status)"'`

### Technical details

- Primary operational files touched by `docmgr` lifecycle updates:
  - `ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/index.md`
  - `ttmp/2026/02/16/HC-034-BETTER-UI--chat-ui-polish-and-developer-experience-improvements/index.md`
  - plus associated `changelog.md` in each closed ticket.
- New ticket path:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/`

## Step 2: Frontend Runtime and Dispatch Path Audit

With workspace setup complete, I moved to the core technical analysis: trace how incoming LLM/SEM events and window drag interactions flow through dispatch/reducers/selectors/render layers. The goal was to identify concrete high-load points, not just abstract architecture concerns.

I intentionally focused on inventory app chat flow and engine windowing flow, because those are the active surfaces for the user’s requested optimizations.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Build a thorough, code-anchored analysis of current dispatch behavior and state pressure in chat events and dragging.

**Inferred user intent:** Get practical redesign options grounded in real code paths and current behavior constraints.

**Commit (code):** N/A — no git commit was created.

### What I did

- Enumerated target frontend files using `rg` and narrowed to:
  - `apps/inventory/src/features/chat/*`
  - `packages/engine/src/features/windowing/*`
  - `packages/engine/src/components/shell/windowing/*`
- Read key flow files with line references:
  - `InventoryChatWindow.tsx`
  - `chatSlice.ts`
  - `eventBus.ts`
  - `EventViewerWindow.tsx`
  - `timelineProjection.ts`
  - `useWindowInteractionController.ts`
  - `DesktopShell.tsx`
  - `windowingSlice.ts`
  - `windowing/selectors.ts`
  - `ChatWindow.tsx`
- Mapped event dispatch fan-out by SEM event type and identified reducer/work patterns.
- Mapped drag dispatch path from pointermove through reducers and render tree.
- Collected specific evidence points for duplicated sort/focus dispatch opportunities and broad rerender fan-out.

### Why

- The requested designs needed to preserve behavior, so the first requirement was understanding exact current pathways and invariants.
- File/line-anchored evidence prevents speculative recommendations.

### What worked

- `InventoryChatWindow` gave a clear single choke point for incoming event-to-dispatch logic.
- `eventBus` + `EventViewerWindow` confirmed debugging is already decoupled from Redux.
- Windowing path (`useWindowInteractionController` -> `DesktopShell` -> `windowingSlice`) made drag pressure source explicit.

### What didn't work

- No runtime profiler pass was executed in this step (analysis remained static/code-driven), so precise measured CPU percentages are not included yet.

### What I learned

- Current architecture already has the right conceptual split for debugging (raw bus separate from Redux), but not for high-frequency state projection.
- Biggest load source is action frequency + broad render invalidation, not an explicit "raw events array" in Redux.

### What was tricky to build

- The difficult part was distinguishing true root causes from adjacent noise. Many files mention events/windows, but only a few determine throughput:
  - `onSemEnvelope` in `InventoryChatWindow`
  - timeline upsert reducers in `chatSlice`
  - pointermove handler in `useWindowInteractionController`
  - shell/window selector + rendering topology.
- I handled this by tracing end-to-end for each high-frequency source and ignoring unrelated story/test scaffolding.

### What warrants a second pair of eyes

- Validate whether any external consumers rely on per-event Redux action granularity for tooling/diagnostics.
- Validate whether strict-order replay requirements exist beyond current UI semantics.

### What should be done in the future

- Add opt-in profiling markers/counters to capture live baseline action rates and render counts.

### Code review instructions

- Start with `apps/inventory/src/features/chat/InventoryChatWindow.tsx` around `onSemEnvelope` and hydration helpers.
- Then inspect `apps/inventory/src/features/chat/chatSlice.ts` upsert/search/sort behavior.
- Then inspect drag path:
  - `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
  - `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
  - `packages/engine/src/features/windowing/selectors.ts`

### Technical details

- Key findings are documented in the design doc with issue IDs E1-E6 and W1-W5.
- Evidence snippets were taken directly from source files with line-numbered reads (`nl -ba ... | sed -n`).

## Step 3: Design Synthesis and 6+ Page Analysis Authoring

After mapping current behavior, I transformed findings into a structured design document with multiple solution families and phased recommendations. The target was a practical implementation guide, not just a review note.

I wrote this as a long-form design doc with explicit options for event-stream load reduction and drag-path load reduction, while preserving functional behavior and event debugging UX.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Produce a thorough design doc with multiple approaches and tradeoffs, large enough to serve as execution reference.

**Inferred user intent:** Choose among concrete architecture options with clear risk/benefit breakdown before coding changes.

**Commit (code):** N/A — no git commit was created.

### What I did

- Replaced scaffold content in:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/01-redux-event-pipeline-and-window-dragging-performance-analysis.md`
- Included:
  - runtime flow maps
  - issue-by-issue evidence (problem/location/snippet/why/sketch)
  - event-pipeline options A-E
  - windowing/drag options W-A..W-E
  - comparison tables
  - phased rollout plan
  - validation strategy
- Verified length:
  - `wc -w .../01-redux-event-pipeline-and-window-dragging-performance-analysis.md`
  - Result: `3128` words (comfortably 6+ pages).

### Why

- The user explicitly requested thoroughness and multiple design approaches.
- A 6+ page document is more useful when organized by option families and rollout phases.

### What worked

- The final doc captures both low-risk immediate options and larger structural options.
- It keeps event debugging behavior as a first-class invariant, not an afterthought.

### What didn't work

- No direct microbenchmark data was embedded yet; validation is specified as a follow-up test plan.

### What I learned

- A mixed strategy (quick coalescing + targeted render isolation + optional structural refactors) provides better delivery sequencing than a single large rewrite.

### What was tricky to build

- The hardest part was balancing breadth (many options) and decision usefulness (clear recommended sequence). Listing alternatives alone is easy; turning them into a pragmatic phased plan requires explicit tradeoffs.
- I resolved this by providing per-option comparison tables plus a recommended phase path.

### What warrants a second pair of eyes

- Validate option sequencing against team appetite for risk (A/W-A first vs deeper B/C/W-C moves).
- Validate proposed acceptance targets against real UX/performance expectations.

### What should be done in the future

- Add baseline/perf telemetry and then convert recommended options into implementation tickets with acceptance tests.

### Code review instructions

- Review the design doc sections in order:
  - Current Runtime Flow
  - High-Impact Findings
  - Proposed Solutions (Event then Window)
  - Unified Architecture Proposal
  - Implementation Plan / Validation Plan

### Technical details

- Document path:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/01-redux-event-pipeline-and-window-dragging-performance-analysis.md`
- Word count check command:
  - `wc -w <design-doc-path>`

## Step 4: Upload to reMarkable and Verification

Once the analysis doc was complete, I published it to reMarkable using the recommended bundle workflow with a dry-run first. This step also included a sandbox-network failure when listing cloud contents, followed by elevated verification.

This preserves auditability: upload success was confirmed by both upload command output and cloud listing.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Upload the final analysis document to reMarkable and verify placement.

**Inferred user intent:** Ensure the analysis is available off-repo for review/reading.

**Commit (code):** N/A — no git commit was created.

### What I did

- Verified tool availability:
  - `remarquee status`
- Ran dry-run bundle upload:
  - `remarquee upload bundle --dry-run <analysis-doc> --name "HC-037 Redux and Windowing Performance Analysis" --remote-dir "/ai/2026/02/17/HC-037-UI-CLEANUP" --toc-depth 2`
- Ran actual upload with same args (without `--dry-run`).
- Attempted cloud verification in sandbox:
  - `remarquee cloud ls /ai/2026/02/17/HC-037-UI-CLEANUP --long --non-interactive`
- Hit DNS/network failure in sandbox.
- Re-ran cloud verification with elevated permissions; confirmed uploaded file exists.

### Why

- Dry-run reduced upload mistake risk.
- Explicit cloud listing confirmed target folder/name after upload.

### What worked

- Upload command succeeded and reported:
  - `OK: uploaded HC-037 Redux and Windowing Performance Analysis.pdf -> /ai/2026/02/17/HC-037-UI-CLEANUP`
- Elevated cloud listing confirmed presence:
  - `[f] HC-037 Redux and Windowing Performance Analysis`

### What didn't work

- Sandbox network verification failed with DNS errors:
  - `dial tcp: lookup internal.cloud.remarkable.com: no such host`
  - `dial tcp: lookup webapp-prod.cloud.remarkable.engineering: no such host`

### What I learned

- In this environment, upload can succeed while direct cloud-list verification may require elevated network permissions.

### What was tricky to build

- The tricky part was distinguishing upload success from verification transport failure. The first failing command looked like a cloud/auth issue, but the error was clearly network-resolution related in sandbox.
- Resolution was to rerun verification with elevated permissions and keep the same non-interactive listing command.

### What warrants a second pair of eyes

- Confirm the generated PDF rendering quality (headings/code blocks/tables) on actual reMarkable device display.

### What should be done in the future

- Add a post-upload automation step that captures rendered-page count checksum/metadata when supported.

### Code review instructions

- Re-run verification command (with network capability):
  - `remarquee cloud ls /ai/2026/02/17/HC-037-UI-CLEANUP --long --non-interactive`
- Confirm expected filename appears.

### Technical details

- Uploaded source doc:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/01-redux-event-pipeline-and-window-dragging-performance-analysis.md`
- Upload destination:
  - `/ai/2026/02/17/HC-037-UI-CLEANUP`
- Uploaded artifact name:
  - `HC-037 Redux and Windowing Performance Analysis.pdf`

## Step 3: Second Deep Investigation (Frontend Status + Storybook + State + CSS Design System)

After completing the first performance-focused report, I executed a second broad inspection pass focused on frontend cleanliness, structure, and long-term reusability. This step emphasized identifying duplicated/deprecated/problematic code paths and producing a substantially longer design document with explicit cleanup and reorganization recommendations.

A key extension in this step was CSS architecture analysis for a reusable HyperCard design-system path. I used quantitative checks (token/part/style counts) and code-level tracing to ground recommendations in measurable drift, not just subjective style concerns.

### Prompt Context

**User prompt (verbatim):** "Nlow do a second investigation where you investigate the current status of the frontend codebase, storybook structure, state management, with an eye towards duplicated or deprecated or problematic or messy code, and detail a way to reorganize and clean things up and suggestions of what could be removed, and what documentation could be written. Be extremely thorough, write prose paragraphs and bullet points and mention files and APIs and pseudocode and code snippets. 8+ pages. Store in remarkable as well."

**User prompt (verbatim):** "also go over CSS structure and how to make this potentially reusable as a hypercard design system."

**Assistant interpretation:** Produce a second, larger audit report that covers the full frontend architecture quality surface (not only event/drag performance), including Storybook, state topology, duplication/deprecation, cleanup roadmap, removal candidates, documentation plan, and a design-system extraction strategy for CSS.

**Inferred user intent:** Build a practical cleanup blueprint that can guide multiple implementation tickets and reduce technical debt while preserving development velocity and product behavior.

**Commit (code):** N/A — no git commit was created.

### What I did

- Loaded skill guidance and followed the `code-quality-review-cleanup`, `docmgr`, `diary`, and `remarkable-upload` workflows.
- Enumerated codebase footprint and concentration points:
  - total files, story distribution, store/slice counts, largest files.
- Inspected and compared core architecture files:
  - app bootstraps (`main.tsx`, `store.ts`, `vite.config.ts`, `tsconfig.json`)
  - engine store creation (`createAppStore`, `createDSLApp`)
  - Storybook config and helper APIs
  - inventory chat/event pipeline files
  - windowing drag and selectors path.
- Collected concrete duplication evidence and checksums for repeated app scaffolding files.
- Performed CSS contract checks:
  - line count and structure of `base.css`/themes
  - `style={{...}}` usage count and top files
  - token definitions vs token usage drift
  - `data-part` usage vs `PARTS` registry drift.
- Used `docmgr doc add` to create:
  - `design-doc/02-frontend-storybook-state-management-and-css-design-system-cleanup-investigation.md`
- Wrote a full 8+ page equivalent report (3724 words; 964 lines) including:
  - prose analysis
  - issue lists
  - file references
  - pseudocode and implementation sketches
  - phased cleanup roadmap
  - removal/deprecation recommendations
  - documentation plan.

### Why

- The second investigation required wider architectural coverage than the first performance report.
- Quantitative evidence (counts/diffs/contracts) was necessary to prioritize and de-risk cleanup decisions.
- Design-system reuse depends on explicit contract verification (tokens + parts), so CSS analysis had to be first-class.

### What worked

- Existing repo structure allowed fast pattern comparison across apps and engine.
- Quantitative shell checks quickly surfaced high-value findings:
  - duplicate bootstrap/config files
  - inline style volume
  - missing token definitions
  - part registry drift.
- `docmgr doc add` created the second document with correct ticket metadata and path.

### What didn't work

- A few command invocations initially failed due command/flag mismatches and path assumptions:
  - `docmgr ticket show HC-037 --json` failed (`unknown flag: --json`).
  - `docmgr doc list --ticket HC-037` returned no docs because ticket ID needed full identifier (`HC-037-UI-CLEANUP`).
  - `docmgr changelog list --ticket ...` failed because this subcommand does not exist in this `docmgr` build.
  - `sed` path assumptions failed for files that did not exist (`packages/engine/src/app/providers.tsx`, `packages/engine/src/storybook/createStoryHelpers.tsx`).
  - `rg` pattern beginning with `--` needed explicit `-e` usage.
- All failures were corrected immediately with `docmgr help ...`, `rg --files`, and explicit ticket/path checks.

### What I learned

- Ticket IDs in this workspace are full identifiers (e.g., `HC-037-UI-CLEANUP`) for some `docmgr` filters.
- The design-system contract is partially present (`PARTS`, tokens), but enforcement is missing; drift can be detected cheaply with simple shell checks.
- Cleanup leverage is strongest at scaffolding and contract layers, not only component-level refactors.

### What was tricky to build

- The hardest part was balancing breadth and specificity while still producing an actionable 8+ page report. Many valid observations exist, but only some are high leverage.
- I approached this by forcing each recommendation to have one or more of:
  - measurable evidence,
  - concrete file location,
  - migration sketch/pseudocode,
  - rollout phase placement.
- Another tricky point was separating “present but strategic” modules from “dead/legacy” modules. I marked uncertain candidates as deprecations rather than immediate removals.

### What warrants a second pair of eyes

- Confirm product intent for engine generic chat APIs vs inventory-specific chat architecture.
- Confirm whether debug reducer should become opt-in by default.
- Validate deprecation/removal candidates (`createDSLApp`, CRM `streamingChat`, shell debug/sidebar paths) against roadmap expectations.
- Review design-system package boundary proposal before migration work starts.

### What should be done in the future

- Execute phased cleanup plan in small PRs with contract tests added first.
- Add CI checks for token/part drift and runtime hardcoded color literals.
- Track progress against acceptance metrics listed in `design-doc/02`.

### Code review instructions

- Read new report first:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/02-frontend-storybook-state-management-and-css-design-system-cleanup-investigation.md`
- Validate key evidence anchors:
  - `apps/inventory/.storybook/main.ts`
  - `packages/engine/src/app/createAppStore.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `packages/engine/src/components/shell/windowing/useWindowInteractionController.ts`
  - `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
  - `packages/engine/src/theme/base.css`
  - `packages/engine/src/parts.ts`
- Re-run key metrics if needed:
  - `rg -n "style=\{\{" apps packages | wc -l`
  - token drift diff (defined vs used `--hc-*`)
  - data-part drift diff (JSX vs `PARTS`).

### Technical details

- Document created via:
  - `docmgr doc add --ticket HC-037-UI-CLEANUP --doc-type design-doc --title "Frontend, Storybook, State Management, and CSS Design-System Cleanup Investigation"`
- Final second-analysis doc path:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/02-frontend-storybook-state-management-and-css-design-system-cleanup-investigation.md`
- File size checks:
  - `wc -w` => 3724 words
  - `wc -l` => 964 lines

## Step 4: Focused Investigation — Chat Window Message/Timeline Virtualization

This step created a dedicated third investigation focused specifically on chat rendering throughput, with emphasis on top-level message virtualization/windowing and timeline-widget rendering strategy. The design objective was to preserve chat semantics (streaming, auto-scroll, debug mode, inline widgets) while reducing render fan-out during long sessions.

I intentionally kept this report implementation-oriented: concrete file-path evidence, phased rollout options, API sketches, risks, and testing guidance for safe adoption.

### Prompt Context

**User prompt (verbatim):** "Add a section about improving the performance of the chat window by p otentially windowing the messages / timeline widgets shown. Create a new detailed investigation and design document and upload to remarable as well"

**Assistant interpretation:** Produce a separate detailed design investigation focused on chat window performance via message/timeline widget windowing (virtualization), then publish it in HC-037 and upload it to reMarkable.

**Inferred user intent:** De-risk and accelerate implementation of chat rendering performance improvements by having a standalone architecture plan, not just a subsection in previous docs.

**Commit (code):** N/A — no git commit was created.

### What I did

- Inspected current chat render path and widget internals:
  - `packages/engine/src/components/widgets/ChatWindow.tsx`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx`
  - `apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx`
- Confirmed current message rendering is full-list mapping and identified pre-render message transformation (`displayMessages.map(...)`) as additional cost layer.
- Confirmed widget-item caps (`MAX_TIMELINE_ITEMS=24`, `MAX_PANEL_ITEMS=16`) to separate top-level message scaling from nested widget scaling.
- Added new design doc via docmgr:
  - `design-doc/03-chat-window-message-and-timeline-widget-virtualization-performance-investigation.md`
- Wrote a detailed report covering:
  - baseline bottlenecks,
  - three design options,
  - recommended phased architecture,
  - scroll anchoring behavior,
  - API/pseudocode sketches,
  - rollout/test plan and risk controls.

### Why

- Chat render performance has different constraints than earlier store/drag analyses.
- A dedicated doc makes implementation planning and code review much simpler than extending broad prior reports.
- Distinguishing top-level virtualization (high priority) from nested widget virtualization (conditional/future) avoids overengineering.

### What worked

- Existing code structure made it straightforward to identify message-map hotspots and scroll behavior dependencies.
- The dedicated document path under HC-037 keeps this investigation clearly scoped and discoverable.

### What didn't work

- No live runtime profiling run was added in this step; recommendations remain code-path and architectural analysis based.

### What I learned

- Biggest immediate win is top-level message virtualization; nested timeline widget virtualization is usually secondary under current item caps.
- Streaming-safe bottom anchoring is the highest-risk behavior to preserve during migration.

### What was tricky to build

- The subtle challenge was avoiding a simplistic “just add virtualization” plan. Chat has variable row heights, streaming growth, and pinned/unpinned scroll semantics that can easily regress.
- I handled this by proposing phased rollout with feature flags and explicit anchoring hooks/tests, rather than immediate default cutover.

### What warrants a second pair of eyes

- Validate product expectations for pinned-bottom behavior during streams and user scroll overrides.
- Validate whether soft windowing fallback should remain permanent even after full virtualization.
- Validate library choice (`@tanstack/react-virtual`) against team standards.

### What should be done in the future

- Add benchmark/stress harness story (20/200/2000 rows, streaming active) before rollout.
- Instrument render-count and frame-drop telemetry in dev mode to track gains and regressions.

### Code review instructions

- Review new report:
  - `ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/03-chat-window-message-and-timeline-widget-virtualization-performance-investigation.md`
- Validate baseline code anchors:
  - `packages/engine/src/components/widgets/ChatWindow.tsx`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/InventoryTimelineWidget.tsx`

### Technical details

- New document word count: 2237 words (529 lines).
- Upload destination requested/used: `/ai/2026/02/17/HC-037-UI-CLEANUP`.
- Note: unrelated in-worktree app code changes (from earlier interruption) were not modified in this step; only HC-037 docs were updated.
