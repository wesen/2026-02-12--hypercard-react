---
Title: Diary
Ticket: HC-58-CHAT-RUNTIME-REFACTOR
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
    - developer-experience
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md
      Note: Primary output produced during this work session
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md
      Note: Imported source reviewed in diary steps
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md
      Note: Task execution tracked and checked off
ExternalSources:
    - local:chat-runtime-chatgpt-pro.md
Summary: Detailed implementation diary for HC-58 ticket setup, source import, proposal review, and concrete architecture analysis write-up.
LastUpdated: 2026-02-19T17:22:58.200990477-05:00
WhatFor: Preserve a step-by-step record of decisions, findings, and follow-up checks for the chat runtime refactor analysis.
WhenToUse: Use when reviewing how HC-58 analysis was produced and why specific corrections were made.
---


# Diary

## Goal
Capture the exact workflow used to set up HC-58, import and review the external proposal, validate it against current engine/inventory runtime code, and produce a corrected concrete blueprint focused on reusable multi-window chat runtime architecture.

## Step 1: Ticket Lifecycle and Source Import
I started by validating ticket state before making changes, because we already had two HC-57 variants and the instruction was to explicitly close HC-57, create HC-58, and import a specific local file.

This step focused on deterministic ticket/bookkeeping actions first, then source ingestion, so the analysis work would be anchored in the requested workspace.

### Prompt Context

**User prompt (verbatim):** "Ok, we asked our big brother about a better design for reusable chat conversation work. close HC-57 and create a new ticket HC-58-CHAT-RUNTIME-REFACTOR and import  /tmp/chat-runtime-chatgpt-pro.md using `docmgr import file --file  /tmp/chat-runtime-chatgpt-pro.md --ticket HC-58-CHAT-RUNTIME-REFACTOR` and read it. Then do your analysis to see how you understand it, and write a fleshed out version with more concrete details to show me that you understand it. I think some aspects are not fully correct, for example, the stream append /finalize the delta is not just a string but can be more sturctured data (for example in the case of a hypercard widget ot tool call or so). 

Store your detailed analysis in the new ticket, keep a detailed frequent diary as you work."

**Assistant interpretation:** Close the active HC-57 ticket, create HC-58 with the exact requested ID, import the provided Markdown source into HC-58 via `docmgr`, then produce and store a concrete corrected architecture analysis plus a detailed diary in the ticket.

**Inferred user intent:** Establish HC-58 as the canonical runtime-refactor ticket and get a high-confidence analysis that improves on the imported proposal, especially around non-text streaming structures.

**Commit (code):** dda91ff — "docs(HC-58): add chat runtime refactor analysis and diary"

### What I did
- Ran `docmgr status --summary-only` and `docmgr ticket list` to confirm current state.
- Confirmed `HC-57` (exact ID) was still active.
- Closed `HC-57` using `docmgr ticket close --ticket HC-57`.
- Created `HC-58-CHAT-RUNTIME-REFACTOR` using:
  - `docmgr ticket create-ticket --ticket HC-58-CHAT-RUNTIME-REFACTOR --title "Chat Runtime Refactor" --topics architecture,chat,frontend,timeline,webchat,developer-experience`
- Confirmed source file exists:
  - `ls -l /tmp/chat-runtime-chatgpt-pro.md`
- Imported exactly as requested:
  - `docmgr import file --file /tmp/chat-runtime-chatgpt-pro.md --ticket HC-58-CHAT-RUNTIME-REFACTOR`

### Why
- Ticket lifecycle operations needed to be correct before analysis artifacts were added, to avoid writing into the wrong workspace.
- Importing first ensured the analysis references the exact user-specified source artifact inside docmgr-managed sources.

### What worked
- Close/create/import commands all succeeded without retries.
- Imported source landed in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`

### What didn't work
- None in this step.

### What I learned
- `HC-57` had been active (while a descriptive HC-57 variant was already complete), so explicit closure was necessary to satisfy the request unambiguously.

### What was tricky to build
- Not technically tricky, but there was naming ambiguity from prior HC-57 variants. I resolved by targeting the exact ticket ID specified by the user (`HC-57`).

### What warrants a second pair of eyes
- Confirm whether any team process expects closure of both HC-57 tickets (exact + descriptive variant) for audit consistency.

### What should be done in the future
- Keep future ticket IDs exact and singular to avoid split tracking when iterating quickly.

### Code review instructions
- Validate ticket operations in:
  - `ttmp/2026/02/19/HC-57--timelinechatruntimewindow-api-surface-analysis/changelog.md`
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/index.md`
- Validate imported source presence in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`

### Technical details
- Commands run:
  - `docmgr ticket close --ticket HC-57`
  - `docmgr ticket create-ticket --ticket HC-58-CHAT-RUNTIME-REFACTOR --title "Chat Runtime Refactor" --topics architecture,chat,frontend,timeline,webchat,developer-experience`
  - `docmgr import file --file /tmp/chat-runtime-chatgpt-pro.md --ticket HC-58-CHAT-RUNTIME-REFACTOR`

## Step 2: Proposal Review Against Current Runtime Implementation
I read the imported proposal in full, then validated it against the current engine and inventory implementation to separate directionally correct points from assumptions that would not hold in our codebase.

The key correction identified here is that streaming primitives cannot stay text-only (`append/finalize string`), because current runtime traffic already includes structured partial payloads and non-message lifecycle state.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Perform an in-depth technical review of the imported design and identify where it mismatches current runtime semantics.

**Inferred user intent:** Ensure the final HC-58 document reflects real system constraints, not only a generic architecture sketch.

**Commit (code):** dda91ff — "docs(HC-58): add chat runtime refactor analysis and diary"

### What I did
- Read imported proposal in three chunks from:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`
- Reviewed current engine runtime code:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
  - `packages/engine/src/hypercard-chat/sem/timelineMapper.ts`
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`
  - `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`
  - `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
  - `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts`
- Reviewed real host integration:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/webchatClient.ts`
  - `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`

### Why
- The imported proposal is abstract by design; grounding it in actual reducer/SEM/adapter/UI implementation avoids proposing incompatible interfaces.

### What worked
- Existing codebase already contains key building blocks aligned with proposal direction:
  - version-aware upserts,
  - `rekeyEntity`,
  - envelope pipeline + adapters,
  - conversation-keyed timeline state.

### What didn't work
- Initial search command targeted wrong roots (`packages`, `src` from repo root), producing:
  - `rg: packages: No such file or directory (os error 2)`
  - `rg: src: No such file or directory (os error 2)`
- Corrected by searching under `2026-02-12--hypercard-react/...`.

### What I learned
- Current runtime already demonstrates the central HC-58 concern:
  - projection is not purely message-text streaming; tool/widget/card events are structured and often not semantically representable as string append.
- Global renderer registration with namespace/refcount works but still remains module-global state, which complicates per-window rendering policy isolation.

### What was tricky to build
- The trickiest part was separating “imported proposal intent” from “actual current constraints” without overfitting to one app.
- I handled this by mapping each design claim to at least one concrete runtime file and one host integration file.

### What warrants a second pair of eyes
- Validate whether the proposed stream-channel model should be introduced as first-class runtime state now, or staged behind compatibility wrappers to reduce migration risk.

### What should be done in the future
- Add explicit conformance tests for replay/idempotency/ordering before shipping the refactor.

### Code review instructions
- Start with current seam and policy:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- Then projection path:
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
- Then host usage:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

### Technical details
- Key mismatch identified:
  - Imported mutation examples use text-based stream ops.
  - Current real events include structured data (`tool.delta` patch, `hypercard.*` lifecycle payload `data`).

## Step 3: Write Corrected Concrete Blueprint and Ticket Bookkeeping
After reconciling proposal and implementation, I authored a detailed design document in HC-58 with a corrected runtime contract, typed stream channel model, phased adapters, migration map, and validation plan.

I also created this diary document as requested and prepared ticket task/changelog bookkeeping so the work is traceable.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Store a fleshed-out corrected analysis in HC-58 and keep a detailed diary trail of the work process.

**Inferred user intent:** Make the analysis implementation-ready and reviewable, not just conceptual.

**Commit (code):** dda91ff — "docs(HC-58): add chat runtime refactor analysis and diary"

### What I did
- Created design doc:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- Created diary doc:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md`
- Included in analysis:
  - what to keep from imported proposal,
  - what to correct (especially structured streaming),
  - concrete TypeScript contracts for state/mutations/channels,
  - phased implementation plan and validation strategy.

### Why
- The imported design needed concretization to be actionable for implementation planning and architectural review.

### What worked
- The corrected blueprint now maps proposed concepts directly to existing runtime files and migration phases.

### What didn't work
- None after path correction in Step 2.

### What I learned
- The fastest path is evolutionary, not greenfield:
  - preserve existing `SemRegistry`/timeline reducer concepts,
  - introduce manager + structured stream channels incrementally,
  - keep `TimelineChatRuntimeWindow` as a compatibility wrapper during migration.

### What was tricky to build
- Designing stream-channel abstractions that are generic enough for tool/widget/card payloads without exploding complexity.
- Approach: define a small set of fragment kinds (`text.*`, `object.patch`, `json.patch`, `parts.append`, `replace`) and keep channel names extensible.

### What warrants a second pair of eyes
- Merge semantics for mixed versioned/non-versioned updates across channels and timeline entities.
- Batched transaction boundaries to avoid transient inconsistent UI states.

### What should be done in the future
- N/A

### Code review instructions
- Read the final analysis doc first:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- Validate it against current runtime implementation:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`

### Technical details
- Files created:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md`
- Source imported and referenced:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`

## Step 4: Docmgr Hygiene and Validation Cleanup
After creating the main deliverables, I ran a ticket hygiene pass with `docmgr doctor` and fixed all blocking issues so the workspace is structurally valid.

This step intentionally happened after content authoring, because it is easier to fix vocabulary/frontmatter issues in one pass once document set and metadata are stable.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Keep the ticket in a robust, reviewable docmgr state, not just content-complete.

**Inferred user intent:** Ensure the final HC-58 workspace is maintainable and passes docmgr validation with no blocking errors.

**Commit (code):** 7a8635c — "docs(HC-58): fix docmgr hygiene and validation findings"

### What I did
- Ran `docmgr doctor --ticket HC-58-CHAT-RUNTIME-REFACTOR --stale-after 30`.
- Observed unknown topic warning for `developer-experience` and frontmatter parse error on imported source file.
- Added vocabulary entry:
  - `docmgr vocab add --category topics --slug developer-experience --description "Developer experience concerns such as API ergonomics, integration friction, and maintainability."`
- Prepended frontmatter to imported source file:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`
- Re-ran doctor and confirmed only a non-blocking warning remains:
  - `missing_numeric_prefix` on source filename.

### Why
- Ticket hygiene issues (especially frontmatter parse errors) create friction for search/validation pipelines and future updates.

### What worked
- Blocking doctor findings were eliminated.
- Remaining finding is advisory only (filename prefix convention).

### What didn't work
- None in this step.

### What I learned
- Imported source files in `sources/local` still get linted by docmgr frontmatter checks, so they need minimal frontmatter if stored as `.md`.

### What was tricky to build
- Balancing preservation of imported source text vs. docmgr compliance.
- Resolution: prepend metadata only; keep body content unchanged.

### What warrants a second pair of eyes
- Decide whether source files should be exempted from numeric-prefix conventions, or whether import tooling should auto-prefix source filenames.

### What should be done in the future
- Add a small helper around `docmgr import file` workflow that optionally applies compliant frontmatter + numeric prefix for source markdown files.

### Code review instructions
- Validate vocabulary update in:
  - `ttmp/vocabulary.yaml`
- Validate imported source frontmatter in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/sources/local/chat-runtime-chatgpt-pro.md`
- Validate latest changelog entry in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/changelog.md`

### Technical details
- Doctor before fix reported:
  - unknown topic `developer-experience`
  - frontmatter parse error (`frontmatter delimiters '---' not found`) on imported source file
- Doctor after fix reports only:
  - `missing_numeric_prefix` warning on source filename.

## Step 5: Hard Cutover Decision (No Fallbacks)
You asked to remove fallback/backwards-compatibility framing and commit to a timeline-native UI path. I updated the HC-58 design analysis accordingly.

This step tightened the architecture policy from "phased compatibility" to "hard replacement" so implementation planning is unambiguous.

### Prompt Context

**User prompt (verbatim):** "no fallbacks, no backwards compatibility. Update the document to reflect that, and yes, timeline view."

**Assistant interpretation:** Update HC-58 documentation to explicitly remove fallback/compatibility/wrapper language and define a hard cutover to a timeline-native view.

**Inferred user intent:** Avoid diluted migration plans and force a single clear architecture target.

**Commit (code):** 56184a7 — "docs(HC-58): enforce hard-cut timeline-view architecture"

### What I did
- Updated design doc sections to enforce hard cutover:
  - added explicit "UI Hard Cutover" section,
  - removed compatibility wrapper strategy,
  - replaced migration phases with removal/deletion tasks for `TimelineChatRuntimeWindow`, `TimelineChatWindow`, and `ChatWindow` in timeline chat path,
  - removed deprecation language and replaced with API removal language.

### Why
- The prior draft still carried compatibility language that conflicted with your requested execution model.

### What worked
- Design document now states one target model: runtime + timeline-native view, no fallback layers.

### What didn't work
- None in this step.

### What I learned
- Architectural ambiguity in docs propagates to implementation ambiguity; explicit removal language is necessary when the strategy is hard cutover.

### What was tricky to build
- Preserving useful migration sequencing while deleting compatibility paths.
- Approach: keep phased work breakdown, but convert phases to direct replacement and deletion milestones.

### What warrants a second pair of eyes
- Confirm whether non-timeline use cases still need `ChatWindow` outside this ticket scope. The current HC-58 doc now assumes timeline-chat path only.

### What should be done in the future
- Add an explicit removal checklist PR template for files/exports/stories tied to removed layers.

### Code review instructions
- Review changed design doc:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`

### Technical details
- Core doc changes include:
  - "UI Hard Cutover" section,
  - removal of compatibility shim/wrapper language,
  - replacement of "deprecate" with "remove" actions.

## Step 6: Inventory `chatSlice` Extraction Details and Suggestion Removal Direction
You then asked for a concrete position on inventory `chatSlice` runtime ownership and how suggestion handling should be treated while the runtime is being simplified. I incorporated this into HC-58 as implementation-level guidance.

This step makes HC-58 explicit about ownership boundaries: runtime concerns move to the core conversation runtime, inventory keeps host-specific concerns, and suggestions are removed for now rather than migrated.

### Prompt Context

**User prompt (verbatim):** "Furthermore, I see a lot of toplevel runtime stuff (streamerrors, conversation management) in 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts and would like to move all that into the main runtime. What do you think, and how would do that? What parts would you keep in inventory and how would you handle suggestions and where would you put suggestion code?"

**Assistant interpretation:** Add concrete HC-58 implementation detail for moving connection/stream/meta ownership out of inventory `chatSlice` into main runtime and define suggestion strategy under current simplification goals.

**Inferred user intent:** Reduce architectural confusion by eliminating app-owned runtime concerns and avoid preserving suggestion behavior while runtime architecture is being refactored.

**Commit (code):** 9b94664 — "docs(HC-58,HC-59): remove-suggestions planning and publication"

### What I did
- Re-read and grounded updates against:
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
  - `apps/inventory/src/features/chat/selectors.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- Updated HC-58 design doc:
  - added related files for `chatSlice`, `projectionAdapters`, and selectors,
  - added explicit executive summary bullet that suggestions are removed for now,
  - added section `Inventory Runtime Ownership Cutover (chatSlice Extraction)` with:
    - ownership target,
    - state mapping table (current inventory -> target runtime APIs),
    - adapter/event handling mapping,
    - explicit “what remains in inventory” and “what is removed now” lists,
  - extended implementation phases with explicit inventory extraction and suggestion removal tasks.
- Added and checked ticket task:
  - `Add concrete inventory chatSlice extraction details and remove-suggestions policy`

### Why
- Prior HC-58 framing described runtime cutover goals but did not give enough file-level migration detail for inventory state ownership decisions.

### What worked
- Existing inventory code clearly maps to runtime ownership buckets, making the migration plan concrete and testable.
- Suggestion handling can be removed cleanly without blocking runtime correctness work.

### What didn't work
- None in this step.

### What I learned
- The highest value simplification is not just UI cutover; it is deleting app-owned runtime metadata management at the same time so ownership is unambiguous.

### What was tricky to build
- Balancing specificity against future refactor flexibility.
- I resolved this by using an ownership matrix and API-shape mapping rather than over-prescribing exact implementation classes.

### What warrants a second pair of eyes
- Confirm that runtime selectors for stream/turn stats meet all current `StatsFooter` needs before inventory selectors are fully removed.

### What should be done in the future
- Execute HC-59 to remove suggestions across all layers before beginning code-heavy HC-58 runtime extraction.

### Code review instructions
- Review HC-58 updates in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- Cross-check against source files:
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
  - `apps/inventory/src/features/chat/selectors.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

### Technical details
- Added explicit mappings for:
  - `connectionStatus`, `lastError`, `modelName`, `currentTurnStats`, `streamStartTime`, `streamOutputTokens`
- Declared suggestion path removal:
  - suggestion state/actions/selectors,
  - suggestion runtime props,
  - suggestion event handlers.

## Step 7: HC-58 Code-Phase Kickoff and Task Breakdown
You asked to actively work HC-58 in the same execution style as HC-59: task-by-task implementation, commits, and diary updates. I started by validating current runtime code state and converting HC-58 from “analysis complete” to an implementation backlog.

This step is intentionally a planning checkpoint commit so subsequent refactor commits map cleanly to specific runtime tasks.

### Prompt Context

**User prompt (verbatim):** "Ok, now let's work on HC-58. Same task by task, commits and diary as you go."

**Assistant interpretation:** Begin implementation work for HC-58 immediately, with explicit ticket tasks, incremental commits, and continuous diary/changelog bookkeeping.

**Inferred user intent:** Execute the runtime refactor pragmatically in controlled, reviewable slices.

**Commit (code):** Pending (recorded after staging/commit step)

### What I did
- Confirmed HC-58 ticket/doc state and existing completed tasks.
- Inspected current runtime chain and integration points:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- Added HC-58 implementation tasks for code phase:
  - remove `projectionMode`/`timeline-upsert-only` gating,
  - simplify connection hook path post-gating removal,
  - update runtime stories/inventory integration,
  - run typecheck/tests,
  - keep diary/changelog and phase commits.
- Cleaned duplicated task intent by preparing the task list for single-path execution.

### Why
- Existing HC-58 tasks only covered analysis work; implementation required explicit phase tasks to keep commit boundaries clean.

### What worked
- Runtime bottleneck and first refactor target (`projectionMode`) is clear and currently isolated in a few files.

### What didn't work
- Duplicate task entry appeared for diary/changelog updates and required cleanup.

### What I learned
- After HC-59 suggestion removal, the next high-value HC-58 cutover slice is eliminating projection gating (`timeline-upsert-only`) and its skip-path branches.

### What was tricky to build
- Balancing immediate code changes vs. traceable phase boundaries.
- I resolved this by creating a dedicated kickoff phase before changing runtime behavior.

### What warrants a second pair of eyes
- Confirm no external consumers rely on `projectionMode` as an integration escape hatch.

### What should be done in the future
- Execute the newly added runtime tasks in order with one code-phase commit per task.

### Code review instructions
- Start with HC-58 task list and this step:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/reference/01-diary.md`

### Technical details
- Core runtime files selected for first implementation slice:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`

## Step 8: Remove `projectionMode` Gating from Runtime and Callers
I implemented the first HC-58 runtime behavior change by deleting `projectionMode`/`timeline-upsert-only` gating from the runtime window API and all active callers.

This is the first direct cutover from analysis into runtime behavior changes and aligns with the no-fallback policy: projection correctness can no longer depend on a caller-side drop mode.

### Prompt Context

**User prompt (verbatim):** (see Step 7)

**Assistant interpretation:** Start code implementation for HC-58 task-by-task, with explicit commits and diary updates.

**Inferred user intent:** Convert HC-58 design decisions into concrete runtime code changes with clear incremental history.

**Commit (code):** Pending (recorded after staging/commit step)

### What I did
- Removed `TimelineProjectionMode` type and `projectionMode` prop from:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- Removed `timeline.upsert`-only filtering helper/branch in runtime window:
  - deleted `isTimelineUpsertEnvelope` gating check
  - retained `shouldProjectEnvelope` override hook path for now
- Updated active caller integration:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx` (removed `projectionMode="timeline-upsert-only"`)
- Updated runtime story:
  - `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx` (removed `projectionMode` arg)

### Why
- `projectionMode` represented exactly the class of correctness toggle HC-58 is removing.

### What worked
- API surface is now simpler and no active caller still depends on `projectionMode`.
- Search confirms no remaining `projectionMode`/`timeline-upsert-only` references in `packages/engine/src` and `apps/inventory/src`.

### What didn't work
- None in this step.

### What I learned
- The `projectionMode` cut is localized and low-risk, making it a good first HC-58 implementation slice.

### What was tricky to build
- Ensuring all story and app call sites were updated in the same commit to avoid transient compile churn.

### What warrants a second pair of eyes
- Confirm whether any out-of-repo consumers compile against the removed `projectionMode` prop.

### What should be done in the future
- Remove remaining optional envelope-skip branch (`shouldProjectEnvelope`) in the connection hook path as next simplification phase.

### Code review instructions
- Review API + caller updates:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx`

### Technical details
- Validation search:
  - `rg -n "projectionMode|TimelineProjectionMode|timeline-upsert-only" packages/engine/src apps/inventory/src`
  - no matches.

## Step 9: Remove Remaining Envelope-Skip Hook Path
After removing `projectionMode`, the runtime still had a secondary skip branch via `shouldProjectEnvelope` in `useProjectedChatConnection`. I removed that branch so all envelopes entering projected chat connections follow one projection path.

This finalizes the HC-58 “no event-drop correctness toggles” direction at the hook level.

### Prompt Context

**User prompt (verbatim):** (see Step 7)

**Assistant interpretation:** Continue HC-58 runtime cutover by simplifying projection flow and removing residual gating behavior.

**Inferred user intent:** Keep runtime behavior deterministic and reduce API complexity by deleting optional drop paths.

**Commit (code):** Pending (recorded after staging/commit step)

### What I did
- Removed `shouldProjectEnvelope` from runtime window API:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
- Removed `shouldProjectEnvelope` from projected connection hook:
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
- Deleted hook-time skip branch that called adapters with empty projection when skipped.
- Simplified imports and callback state in hook accordingly.

### Why
- Keeping a secondary filter switch after `projectionMode` removal would preserve the same class of correctness footgun under a different name.

### What worked
- Search confirms no remaining `shouldProjectEnvelope` references across engine/inventory source.
- Connection hook now has a single envelope handling path (`projectSemEnvelope`).

### What didn't work
- None in this step.

### What I learned
- Projection pipeline logic becomes substantially easier to reason about when all envelopes always project through the same path.

### What was tricky to build
- Ensuring no hidden caller depended on skip behavior.
- I mitigated this by searching all engine/inventory references before and after the change.

### What warrants a second pair of eyes
- If external downstream consumers used `shouldProjectEnvelope` out of tree, they will need adjustment.

### What should be done in the future
- Run full HC-58 touched-surface validation (typecheck + chat runtime tests/stories path checks) as the next step.

### Code review instructions
- Review hook/runtime simplification:
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`

### Technical details
- Validation search:
  - `rg -n "shouldProjectEnvelope" packages/engine/src apps/inventory/src`
  - no matches.
