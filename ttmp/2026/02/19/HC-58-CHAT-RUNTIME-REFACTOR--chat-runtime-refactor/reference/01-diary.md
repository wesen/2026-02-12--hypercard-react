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
LastUpdated: 2026-02-20T20:45:00-05:00
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

**Commit (code):** d6bb799 — "docs(HC-58): start code-phase task breakdown and diary"

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

**Commit (code):** f334644 — "refactor(HC-58): remove projectionMode gating path"

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

**Commit (code):** 5788859 — "refactor(HC-58): remove shouldProjectEnvelope skip path"

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

## Step 10: HC-58 Validation Pass (Typecheck + Focused Tests)
With runtime gating paths removed, I ran a focused validation pass over touched chat runtime surfaces to confirm no type or behavior regressions in the inventory integration path.

This closes the current HC-58 execution slice with verified runtime behavior and updated task bookkeeping.

### Prompt Context

**User prompt (verbatim):** (see Step 7)

**Assistant interpretation:** Validate the implemented HC-58 runtime changes as a dedicated task before moving to next refactor slices.

**Inferred user intent:** Keep each HC-58 phase shippable and reviewable, not just code-complete.

**Commit (code):** 500c73b — "docs(HC-58): record validation and phase commit trace"

### What I did
- Ran:
  - `npm run typecheck`
- Ran focused tests:
  - `npx vitest run apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts apps/inventory/src/features/chat/eventBus.test.ts apps/inventory/src/features/chat/webchatClient.test.ts`
- Confirmed all tests passed and no type errors.

### Why
- HC-58 changes touched runtime connection/projection internals and caller-facing runtime props; this requires immediate post-change validation.

### What worked
- Typecheck passed.
- 3 test files passed, 12 tests passed.

### What didn't work
- None in this step.

### What I learned
- The no-gating runtime path remains compatible with current inventory projection and event bus behavior.

### What was tricky to build
- Selecting a focused but sufficient validation subset.
- I targeted tests that exercise projection pipeline ingress, event bus behavior, and websocket client ordering/replay expectations.

### What warrants a second pair of eyes
- Add engine-level runtime hook tests if we expand beyond this initial gating removal slice.

### What should be done in the future
- Continue HC-58 with the next structural cutover item (conversation-manager style shared connection ownership).

### Code review instructions
- Validate via command outputs in this step and inspect touched runtime files from Steps 8 and 9.

### Technical details
- Validation commands:
  - `npm run typecheck`
  - `npx vitest run apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts apps/inventory/src/features/chat/eventBus.test.ts apps/inventory/src/features/chat/webchatClient.test.ts`

## Step 11: Add Symbol-Level Task/Design References
You asked for more concrete symbols/references because the backlog was still too abstract to predict exact implementation targets. I tightened HC-58 planning artifacts by adding a symbol-level task map.

This makes each task reviewable up front and reduces ambiguity before implementation phases start.

### Prompt Context

**User prompt (verbatim):** "add more symbols / references to the design to make the tasks more detailed. It's hard to exactly know what you are going to tackle"

**Assistant interpretation:** Expand HC-58 tasks and design with explicit file/symbol references so implementation scope is concrete and traceable.

**Inferred user intent:** Improve predictability and reviewability of upcoming HC-58 execution by naming exact target APIs/files per task.

**Commit (code):** 8080c4e — "docs(HC-58): add symbol-level execution map and task refs"

### What I did
- Reworked `Implementation Backlog (Up Front)` in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Added explicit task IDs (`HC58-IMPL-01` ... `HC58-IMPL-19`) and concrete file/symbol targets.
- Added a mirrored execution map in design doc:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
  - section: `Execution Map (Task -> Symbols)`

### Why
- The previous backlog described goals but not enough concrete symbol/file touchpoints to forecast exact implementation edits.

### What worked
- Backlog now has stable task IDs and direct symbol references for code review and implementation planning.

### What didn't work
- None in this step.

### What I learned
- Having task IDs shared between `tasks.md` and design doc creates a useful “plan <-> architecture” lookup path during iterative refactor work.

### What was tricky to build
- Balancing specificity with ongoing design evolution.
- I solved this by marking new symbols in new modules as “to add” while linking existing symbols/files for current surfaces.

### What warrants a second pair of eyes
- Validate that proposed new symbol names (`ConversationManager`, `createConversationRuntime`, etc.) match preferred naming conventions before implementation starts.

### What should be done in the future
- Keep task IDs stable; if symbol names change during implementation, update both `tasks.md` and the execution map together.

### Code review instructions
- Review refined backlog:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Review symbol mapping section:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`

### Technical details
- Source symbol baselines consulted before updating references:
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.ts`
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
  - `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`

## Step 12: Clarify Task Narratives with Explicit Bigger-Purpose Wording
I refined HC-58 task descriptions so each checkbox note is explicitly framed as both a concrete task explanation and its bigger role in the refactor.

This keeps the backlog readable for implementation while making architectural intent visible at task granularity.

### Prompt Context

**User prompt (verbatim):** "explaining the task and what it's bigger purpose in the refactor is"

**Assistant interpretation:** Reword task notes to explicitly explain what each task is and why it matters to the overall refactor.

**Inferred user intent:** Improve task readability so execution order and architectural value are both obvious during implementation.

**Commit (code):** N/A (documentation wording refinement in progress)

### What I did
- Updated wording in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Standardized annotation prefix from `Cleanup and purpose` to `Task explanation and bigger refactor purpose`.

### Why
- The new phrasing removes ambiguity and directly addresses the requested framing.

### What worked
- Existing task content already had strong intent; making the prefix explicit improved scanability without changing scope.

### What didn't work
- N/A

### What I learned
- Simple phrasing changes can significantly improve backlog usability in long multi-phase refactors.

### What was tricky to build
- Preserving existing task semantics while tightening phrasing consistently across all checklist items.

### What warrants a second pair of eyes
- Validate that this wording convention should be kept for future tickets for consistency.

### What should be done in the future
- Apply the same wording convention to upcoming HC-58 tasks as they are added.

### Code review instructions
- Review wording changes in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Technical details
- Mechanical replacement used:
  - `Cleanup and purpose` -> `Task explanation and bigger refactor purpose`

## Step 13: Remove Alias/Rekey/CID Design from HC-58
I updated HC-58 architecture docs to make stable `entityId` semantics a hard invariant. The plan now explicitly removes timeline aliasing and rekey flows from runtime/timeline design.

This keeps identity handling simple and deterministic: one stable `entity.id` path, version-aware merge, no alternate-ID maps.

### Prompt Context

**User prompt (verbatim):** "remove all that timeline.alias / timeline.rekey / canonicalId aliasing stuff from the timeline. EntityIDs are stable. that will simplify things. Update the 2026-02-12--hypercard-react/ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md and the tasks.md"

**Assistant interpretation:** Rewrite HC-58 design/task planning to remove alias/canonical/rekey identity mechanics and enforce stable entity IDs only.

**Inferred user intent:** Reduce timeline/runtime complexity and eliminate an unnecessary identity-mapping subsystem from the refactor plan.

**Commit (code):** N/A (documentation updates in progress)

### What I did
- Updated design blueprint in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- Removed alias/rekey/canonical identity model from:
  - runtime state shape,
  - mutation union,
  - dedup strategy section,
  - SEM handler helper surface,
  - execution map and validation text.
- Updated backlog task in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Replaced `HC58-IMPL-03` with stable entity ID invariant scope and adjusted unit-test wording.

### Why
- Stable IDs are a simpler and stronger invariant than maintaining client-side alias/canonical mapping and rekey operations.

### What worked
- The design is now cleaner and more direct for implementation planning.
- Task references now align with the simplified identity model.

### What didn't work
- N/A

### What I learned
- The alias/canonical layer created more operational complexity than value once stable IDs are guaranteed.

### What was tricky to build
- Ensuring all references to aliasing/rekey behavior were removed from multiple sections (contract types, execution map, validation, tasks) while keeping the plan internally consistent.

### What warrants a second pair of eyes
- Confirm whether unsupported alias/rekey envelopes should be dropped silently or logged as explicit unsupported-event diagnostics.

### What should be done in the future
- Carry the same stable-ID invariant into code implementation tasks (`HC58-IMPL-03`, `HC58-IMPL-14`, `HC58-IMPL-15`).

### Code review instructions
- Start with:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- Then verify task sync in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Technical details
- Key removals:
  - `timeline.alias`, `timeline.rekey` mutations
  - `aliasToCanonical` runtime state map
  - canonical ID resolution flow in dedup strategy

## Step 14: Rewrite HC-58 to One-Projection-Path Simplicity
I rewrote HC-58 documentation to enforce a simpler runtime model: all windows ingest the same SEM envelopes and run the same projection logic, with no per-window projection modes or filtering.

I also simplified the implementation tasks so they now track deterministic single-path projection work instead of introducing extra stream-channel abstractions in this phase.

### Prompt Context

**User prompt (verbatim):** "yes, rewrite it and the tasks too. definitely simpler"

**Assistant interpretation:** Rewrite HC-58 design doc and tasks to codify a minimal architecture: one shared projection path across windows and less abstraction overhead.

**Inferred user intent:** Reduce architectural complexity and remove over-engineered concepts before implementation starts.

**Commit (code):** N/A (documentation updates in progress)

### What I did
- Rewrote:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- New core policy in design:
  - one SEM projection path for all windows,
  - no projection-mode behavior differences,
  - adapters are side-effects only,
  - stable entity IDs.
- Updated backlog in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Task simplifications included:
  - `HC58-IMPL-02` renamed to one-path projection enforcement,
  - `HC58-IMPL-04` renamed to deterministic envelope apply ordering,
  - selector and test tasks aligned to one-path behavior.

### Why
- This keeps runtime behavior predictable and easier to reason about while matching pinocchio web-chat flow semantics.

### What worked
- The document is now internally consistent around a small set of hard invariants.
- Tasks map cleanly to the simplified design.

### What didn't work
- N/A

### What I learned
- Most complexity came from trying to design future-general stream abstractions too early; SEM-first projection + timeline upsert already covers current needs.

### What was tricky to build
- Keeping all sections aligned after simplifying assumptions (execution map, plan phases, validation, and task wording) so no stale abstraction language remained.

### What warrants a second pair of eyes
- Confirm whether `rekeyEntity` support should be removed entirely in HC-58 code phase or temporarily left only for legacy fixtures/tests.

### What should be done in the future
- Carry these invariants directly into runtime code tasks (`HC58-IMPL-02`, `HC58-IMPL-04`, `HC58-IMPL-14`, `HC58-IMPL-15`).

### Code review instructions
- Start with:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`
- Then review task alignment in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Technical details
- Key architectural simplification:
  - same envelopes + same projection path for every window,
  - no projection mode controls,
  - adapters constrained to post-projection side-effects.

## Step 15: Clarify "Conversation Mutations" as Simple Projection Ops
I tightened HC-58 wording to remove ambiguity around "conversation mutations." The plan now uses "projection ops" terminology to reflect simple reducer-facing operations (`addEntity`, `upsertEntity`, `clearConversation`, meta/cursor updates), not a separate protocol.

This keeps the simplified one-path model clear and avoids introducing conceptual overhead in task names.

### Prompt Context

**User prompt (verbatim):** "so the tasks still reference conversation mutations, what's that about now?"

**Assistant interpretation:** Clarify what that term means in the simplified design and remove confusing terminology from tasks/design docs.

**Inferred user intent:** Ensure HC-58 language stays aligned with the simplified architecture and does not imply hidden complexity.

**Commit (code):** N/A (documentation updates in progress)

### What I did
- Updated task wording in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Replaced symbols:
  - `ConversationMutation` -> `ConversationProjectionOp`
  - `applyConversationMutations` -> `applyProjectionOps`
- Updated one task sentence:
  - `mutation handlers` -> `projection handlers`
- Updated execution map + explanatory sentence in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`

### Why
- "Mutation" wording suggested a new abstraction layer that we explicitly decided not to introduce in HC-58.

### What worked
- Symbols and prose now match the one-path SEM projection model.

### What didn't work
- N/A

### What I learned
- Even small symbol names can signal architecture complexity; naming should reinforce simplification decisions.

### What was tricky to build
- Keeping task symbols and design execution map synchronized so implementation references stay coherent.

### What warrants a second pair of eyes
- Confirm naming preference (`ConversationProjectionOp` / `applyProjectionOps`) before code phase starts.

### What should be done in the future
- Keep future task additions using "projection" terminology unless we intentionally introduce a broader abstraction.

### Code review instructions
- Check updated symbols in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Check execution map + clarifying note in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/01-chat-runtime-refactor-analysis-and-concrete-blueprint.md`

### Technical details
- No behavioral/code changes. Documentation terminology alignment only.

## Step 16: Start Implementation Execution with Section 1 Runtime Scaffolding
I started HC-58 execution from the new sectioned task list and implemented Section 1 in full: conversation runtime module scaffolding, manager cache lifecycle behavior, React provider/hooks selectors, and manager identity tests.

This step intentionally avoids invasive integration changes yet. The goal was to establish the new runtime ownership primitives first so downstream migration tasks (connection ownership, metadata migration, and UI cutover) have a stable target.

### Prompt Context

**User prompt (verbatim):** "Ok, now start working on the ticket, task by task, checking tasks off as you go, keeping a detailed diary as you work, committing at appropriate times."

**Assistant interpretation:** Begin immediate HC-58 implementation in strict task order, mark tasks complete as done, maintain a detailed diary entry for each concrete step, and commit in reviewable increments.

**Inferred user intent:** Move from planning to concrete execution with clear progress traceability and low ambiguity for continuation/review.

**Commit (code):** f2de089 — "feat(HC-58): scaffold conversation runtime module and finish section 1 tasks"

### What I did
- Implemented new conversation runtime module files:
  - `packages/engine/src/hypercard-chat/conversation/types.ts`
  - `packages/engine/src/hypercard-chat/conversation/runtime.ts`
  - `packages/engine/src/hypercard-chat/conversation/manager.ts`
  - `packages/engine/src/hypercard-chat/conversation/context.tsx`
  - `packages/engine/src/hypercard-chat/conversation/selectors.ts`
  - `packages/engine/src/hypercard-chat/conversation/index.ts`
- Added manager identity/disposal tests:
  - `packages/engine/src/hypercard-chat/conversation/manager.test.ts`
- Wired exports:
  - `packages/engine/src/hypercard-chat/index.ts`
- Updated HC-58 task checklist by checking off completed Section 1 tasks:
  - `HC58-S1-T01`
  - `HC58-S1-T02`
  - `HC58-S1-T03`
  in `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
- Validation commands run:
  - `npm run typecheck` (repo root `2026-02-12--hypercard-react`)
  - `npm run test -w packages/engine -- manager.test.ts`

### Why
- Section 1 is foundational and low-risk. It introduces the ownership model and API surface without breaking existing inventory behavior.
- Completing and validating Section 1 before touching lifecycle integration reduces blast radius.

### What worked
- Typecheck passed cleanly.
- New manager tests passed:
  - same conversation ID returns same runtime instance,
  - different IDs return different runtime instances,
  - last release disposes and allows clean recreation.
- Task bookkeeping remained synchronized with implementation progress.

### What didn't work
- An early status command in parallel output returned empty stdout, so I reran status checks directly in the repo to confirm working tree state.
- No build/test failures occurred in this step.

### What I learned
- The conversation runtime primitives can be introduced incrementally without immediate coupling to Redux app store migration.
- Manager reference counting for `getRuntime/releaseRuntime` is straightforward to enforce and test in isolation.

### What was tricky to build
- The main design edge was balancing "new runtime core" with current projection pipeline dependencies.
- I kept runtime ingestion on existing `projectSemEnvelope/hydrateTimelineSnapshot` so behavior stays aligned with current semantics while still exposing the new ownership API.
- Another subtle point was hook/runtime lifetime: `useConversationRuntime` now pairs `getRuntime` with `releaseRuntime` in effect cleanup so manager ref counting stays correct.

### What warrants a second pair of eyes
- `conversation/runtime.ts` currently wires adapters through the runtime-owned projection dispatch path. This is a deliberate transitional setup, but it should be reviewed before Section 4 (adapter boundary hardening) to ensure no implicit side-effect assumptions creep in.
- Selector hooks currently subscribe to full runtime snapshots; Section 5/6 may later want finer-grained selector memoization for render isolation.

### What should be done in the future
- Next immediate work item is Section 2 (`HC58-S2-T01..T04`): move active connection lifecycle ownership from `useProjectedChatConnection` to `ConversationRuntime` claim/refcount semantics.

### Code review instructions
- Start with new contracts:
  - `packages/engine/src/hypercard-chat/conversation/types.ts`
  - `packages/engine/src/hypercard-chat/conversation/runtime.ts`
  - `packages/engine/src/hypercard-chat/conversation/manager.ts`
- Then review React integration:
  - `packages/engine/src/hypercard-chat/conversation/context.tsx`
  - `packages/engine/src/hypercard-chat/conversation/selectors.ts`
- Validate manager behavior in:
  - `packages/engine/src/hypercard-chat/conversation/manager.test.ts`
- Confirm export surface change:
  - `packages/engine/src/hypercard-chat/index.ts`
- Confirm task updates:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Technical details
- Commands run:
  - `npm run typecheck`
  - `npm run test -w packages/engine -- manager.test.ts`
- Validation outputs:
  - TypeScript build: success.
  - Vitest: `3 passed` in `manager.test.ts`.

## Step 17: Complete Section 2 Runtime-Owned Connection Lifecycle
I continued HC-58 execution with Section 2 and moved active transport lifecycle control into `ConversationRuntime`, including claim-based connection refcounting and runtime-owned hydrate/buffer/replay behavior.

I completed the section in one code commit plus task bookkeeping updates after rerunning the section verification commands.

### Prompt Context

**User prompt (verbatim):** "continue, you have full permissions now"

**Assistant interpretation:** Resume from the saved in-progress Section 2 state, finish implementation and verification, check off tasks, and continue following task-by-task execution discipline.

**Inferred user intent:** Keep momentum on HC-58 implementation with explicit progress tracking and no ambiguity around completed work.

**Commit (code):** e07604e — "feat(HC-58): move projected connection lifecycle into conversation runtime"

### What I did
- Updated runtime lifecycle ownership in:
  - `packages/engine/src/hypercard-chat/conversation/runtime.ts`
- Updated projected hook wiring in:
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
- Added Section 2 tests:
  - `packages/engine/src/hypercard-chat/conversation/runtime.test.ts`
  - `packages/engine/src/hypercard-chat/conversation/runtime.integration.test.ts`
- Implemented and validated:
  - runtime `claimConnection()` refcount with single connect / last-release disconnect,
  - runtime-owned `ensureConnected()` / `maybeDisconnect()` flow,
  - optional hydration gate (`waitForHydration`) with envelope buffering and deterministic replay sorted by `stream_id` then `seq`,
  - callback passthrough hooks (`onRawEnvelope`, `onStatus`, `onError`) from runtime client handlers.
- Checked off Section 2 tasks in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
  - `HC58-S2-T01`
  - `HC58-S2-T02`
  - `HC58-S2-T03`
  - `HC58-S2-T04`

### Why
- Section 2 is required before metadata/UI migration sections, because runtime must own transport and hydration lifecycle semantics for multi-window correctness.

### What worked
- Typecheck passed after lifecycle refactor.
- Runtime and integration tests passed:
  - one-connect/two-claims behavior,
  - buffered replay on hydration,
  - single disconnect on last release.
- Hook no longer directly calls `client.connect()` / `client.close()`.

### What didn't work
- Initial grep verification command returned exit code `1` with empty output. This was expected because no direct client lifecycle calls remained in the hook file.

### What I learned
- Centralizing lifecycle in runtime significantly simplifies the hook contract and creates a clean seam for manager-based sharing in later sections.

### What was tricky to build
- Replay ordering needed safe `seq` comparison for both numeric and string representations; I used `BigInt` parsing with fallback handling to keep ordering deterministic.

### What warrants a second pair of eyes
- `useProjectedChatConnection` currently creates/disposes runtime per hook instance; this is acceptable for Section 2 but should be revisited when wiring shared manager ownership into the primary runtime UI path in later tasks.

### What should be done in the future
- Continue with Section 3 (`HC58-S3-T01..T03`) to lock single projection-path invariants and deterministic reducer/replay behavior in tests.

### Code review instructions
- Review lifecycle changes first:
  - `packages/engine/src/hypercard-chat/conversation/runtime.ts`
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
- Then verify tests:
  - `packages/engine/src/hypercard-chat/conversation/runtime.test.ts`
  - `packages/engine/src/hypercard-chat/conversation/runtime.integration.test.ts`
- Confirm Section 2 checklist state:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Technical details
- Commands run:
  - `rg -n "createClient\(|client.connect\(|client.close\(" packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - `npm run typecheck`
  - `npm run test -w packages/engine -- runtime.test.ts runtime.integration.test.ts`
- Validation outputs:
  - TypeScript build: success.
  - Vitest: `3 files passed`, `7 tests passed` (including `runtime.test.ts` and `runtime.integration.test.ts`).

## Step 18: Complete Section 3 Projection-Path and Determinism Tasks
I completed Section 3 by validating one projection path usage, tightening `SemRegistry` determinism, and adding missing reducer/runtime tests that codify replay and version-merge invariants.

I also checked off all Section 3 tasks after passing the required verification commands.

### Prompt Context

**User prompt (verbatim):** "continue, you have full permissions now"

**Assistant interpretation:** Keep executing the backlog in order beyond Section 2, with concrete implementation/test changes and immediate checklist updates.

**Inferred user intent:** Progress steadily through HC-58 sections with strict test-backed completion evidence.

**Commit (code):** ae7f348 — "feat(HC-58): harden deterministic projection and replay invariants"

### What I did
- Updated deterministic fallback-id behavior in:
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
  - changed fallback ID generation from `Date.now()` to `ctx.now()` via `eventId(..., now)` so registry projection is replay/test deterministic.
- Added/updated tests:
  - `packages/engine/src/hypercard-chat/sem/registry.test.ts`
    - unknown event type returns no-op result,
    - missing event ID uses deterministic fallback from `ctx.now`.
  - `packages/engine/src/hypercard-chat/conversation/runtime.test.ts`
    - duplicate buffered envelopes replay idempotently (single timeline entity after hydrate).
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts`
    - versionless patch merge keeps versioned entity version and merges props correctly.
- Re-verified one projection path usage via grep:
  - `projectSemEnvelope` and `applySemTimelineOps` remain centralized in runtime + projection pipeline.
- Checked off Section 3 tasks in:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`
  - `HC58-S3-T01`
  - `HC58-S3-T02`
  - `HC58-S3-T03`

### Why
- Section 3 establishes the deterministic behavior contract required before metadata migration and UI cutover tasks.

### What worked
- Typecheck passed.
- Focused engine tests passed, including new determinism/replay cases.
- Projection-path grep confirms centralization remains intact.

### What didn't work
- An initial edit attempt invoked `apply_patch` through `exec_command`; tooling warned to use the dedicated `apply_patch` tool. I corrected immediately and continued with proper edit calls.

### What I learned
- Small non-deterministic utilities (like fallback ID generation) can undermine replay guarantees even when reducer/version logic is otherwise correct.

### What was tricky to build
- The reducer’s versionless-merge branch has nuanced semantics; test assertions needed to explicitly pin version retention and partial props merge in one case.

### What warrants a second pair of eyes
- `rekeyEntity` remains in reducer/registry op plumbing for compatibility; if later sections remove old identity mechanics completely, this path should be reevaluated for deprecation/removal timing.

### What should be done in the future
- Continue with Section 4 (`HC58-S4-T01..T03`) to migrate runtime metadata ownership out of inventory adapters and narrow adapter responsibilities to side-effects only.

### Code review instructions
- Review determinism fix:
  - `packages/engine/src/hypercard-chat/sem/registry.ts`
- Review invariant tests:
  - `packages/engine/src/hypercard-chat/sem/registry.test.ts`
  - `packages/engine/src/hypercard-chat/conversation/runtime.test.ts`
  - `packages/engine/src/hypercard-chat/timeline/timelineSlice.test.ts`
- Confirm Section 3 task state:
  - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Technical details
- Commands run:
  - `rg -n "applySemTimelineOps\(|projectSemEnvelope\(" packages/engine/src/hypercard-chat`
  - `npm run typecheck`
  - `npm run test -w packages/engine -- registry.test.ts timelineSlice.test.ts runtime.test.ts runtime.integration.test.ts`
- Validation outputs:
  - TypeScript build: success.
  - Vitest: `8 files passed`, `33 tests passed` (including updated runtime/registry/timeline suites).

## Step 19: Complete Section 4 Runtime Metadata Ownership and Adapter Narrowing
I completed Section 4 by moving generic LLM/WS metadata extraction into engine `ConversationRuntime`, migrating inventory status/footer consumers to runtime selectors, and reducing inventory adapters to side-effects-only responsibilities.

I kept the section in two disciplined phases: code+tests first, then checklist/docs bookkeeping.

### Prompt Context

**User prompt (verbatim):** "continue, you have full permissions now"

**Assistant interpretation:** Continue sequential task execution and keep checking off sections only after implementation and verification are complete.

**Inferred user intent:** Keep momentum while preserving high-confidence traceability and low ambiguity across each section.

**Commit (code):** 45fea65 — "feat(HC-58): migrate metadata ownership into conversation runtime"

### What I did
- Engine runtime metadata ownership:
  - `packages/engine/src/hypercard-chat/conversation/runtime.ts`
  - Added runtime-owned envelope metadata handling for:
    - `llm.start`: `modelName`, stream start/reset
    - `llm.delta`: stream output token updates
    - `llm.final`: turn stats + derived TPS + stream reset
    - `ws.error`: runtime `lastError`
  - Added safe/meta-diff update utility and error->meta propagation in `setConnectionStatus`.
- Runtime/connection hook integration:
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - Added optional injected `runtime` support so hook can claim/release existing manager-owned runtimes without disposing them.
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`
  - Added optional `runtime` prop and passed through to connection hook.
- Adapter boundary hardening:
  - `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
  - Documented adapter side-effects-only contract.
  - Added dev assertion that throws if adapters mutate projection output (`ops/effects`).
- Inventory migration off chat metadata adapter:
  - `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
  - Removed `createChatMetaProjectionAdapter`; kept artifact-only side-effect adapter.
  - `apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`
  - Updated tests to validate timeline+artifact behavior without inventory chat metadata reducer coupling.
- Inventory runtime selector usage:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - Added `ConversationManagerProvider`, manager/runtime wiring, and runtime hook reads:
    - `useConversationConnection`
    - `useConversationMeta`
    - `useConversationRuntime`
  - Footer/status now consume runtime metadata.
  - Submit-error path now sets runtime connection error directly.
  - `apps/inventory/src/features/chat/selectors.ts`
  - Removed deprecated chat metadata selectors.
  - `apps/inventory/src/features/chat/chatSlice.ts`
  - Added migration note that inventory-local metadata is legacy and runtime metadata is primary.
- Runtime metadata tests:
  - `packages/engine/src/hypercard-chat/conversation/runtime.test.ts`
  - Added envelope-driven metadata extraction assertions.

### Why
- Section 4 is the ownership cut: generic runtime metadata must live in engine runtime, not inventory adapters/slice, to make chat runtime reusable across apps.

### What worked
- Typecheck passed after migration.
- Full engine test suite passed.
- Updated inventory projection adapter test passed via direct vitest invocation.
- Required greps for removed inventory metadata adapter calls and removed InventoryChatWindow metadata selectors returned no matches.

### What didn't work
- `apps/inventory` workspace has no `npm test` script; I validated inventory tests with:
  - `npx vitest run apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`
- I encountered expected local `// XXX` comments in SEM files and retained them per user instruction.

### What I learned
- The most reliable migration path was to keep timeline entity reads on Redux for now while shifting connection/meta ownership to runtime hooks; this allows incremental cutover without destabilizing UI rendering.

### What was tricky to build
- Preventing `useProjectedChatConnection` from disposing manager-owned runtime instances required adding explicit ownership tracking (`ownsRuntime`) in hook cleanup.

### What warrants a second pair of eyes
- `InventoryChatWindow` now creates a per-component conversation manager. This is acceptable for current wiring, but Section 7/8 may want a higher-level shared manager boundary if multiple runtime surfaces mount concurrently.

### What should be done in the future
- Continue with Section 5 (`HC58-S5-T01..T03`) to cut over primary rendering path to `TimelineConversationView` and demote `TimelineChatRuntimeWindow` to compatibility wrapper status.

### Code review instructions
- Runtime metadata extraction + contract:
  - `packages/engine/src/hypercard-chat/conversation/runtime.ts`
  - `packages/engine/src/hypercard-chat/runtime/projectionPipeline.ts`
- Inventory migration:
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/runtime/projectionAdapters.ts`
  - `apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`
  - `apps/inventory/src/features/chat/selectors.ts`
- Runtime metadata tests:
  - `packages/engine/src/hypercard-chat/conversation/runtime.test.ts`
- Hook/wrapper integration:
  - `packages/engine/src/hypercard-chat/runtime/useProjectedChatConnection.ts`
  - `packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx`

### Technical details
- Commands run:
  - `npm run typecheck`
  - `npm run test -w packages/engine`
  - `npx vitest run apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`
  - `rg -n "setModelName|markStreamStart|updateStreamTokens|setTurnStats" apps/inventory/src/features/chat/runtime/projectionAdapters.ts || true`
  - `rg -n "selectConnectionStatus|selectModelName|selectCurrentTurnStats|selectStream" apps/inventory/src/features/chat/InventoryChatWindow.tsx || true`
- Validation outputs:
  - TypeScript build: success.
  - Engine vitest suite: `27 files passed`, `196 tests passed`.
  - Inventory projection pipeline test: `1 file passed`, `2 tests passed`.

## Step 20: Section 5-8 Hard Cutover and Runtime Cleanup
I completed the remainder of the HC-58 V1 implementation with a hard cutover policy: deprecated compatibility layers were removed instead of retained.

This step includes timeline-native view cutover, wrapper/projection-chain deletion, per-window widget registry migration, explicit inventory runtime extension bootstrap, and inventory chat slice removal.

### Prompt Context

**User prompt (verbatim):** "remove deprecated / backwards compatibility as well. hard cutover."

**Assistant interpretation:** Replace compatibility/deprecation strategy with immediate hard-cut removal of legacy runtime UI layers and global widget registry behavior.

**Inferred user intent:** Finish HC-58 with one clear primary architecture and no transitional wrappers.

**Commit (code):** 0d84a3d — "feat(HC-58): hard-cut to timeline conversation view and local widget registries"

### What I did
- Section 5 hard cutover:
  - Added new primary UI:
    - `packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx`
  - Removed legacy timeline message projection chain:
    - deleted `packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx`
    - deleted `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.ts`
    - deleted `packages/engine/src/hypercard-chat/runtime/timelineDisplayMessages.test.ts`
  - Removed wrapper story surfaces:
    - deleted `packages/engine/src/components/widgets/TimelineChatWindow.stories.tsx`
    - deleted `packages/engine/src/components/widgets/TimelineChatRuntimeWindow.stories.tsx`
  - Removed stale exports from:
    - `packages/engine/src/hypercard-chat/index.ts`
- Section 6 widget registry de-globalization:
  - Replaced global registry API with per-window instance API in:
    - `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
  - Added/updated tests:
    - `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.test.ts`
    - includes independent registry isolation test.
  - Ported widget pack to injected registry in:
    - `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`
    - `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.test.ts`
- Section 6 inventory extension bootstrap:
  - Added centralized bootstrap module:
    - `apps/inventory/src/features/chat/runtime/registerInventoryConversationExtensions.ts`
  - Consolidates one-time creation of:
    - sem registry,
    - widget registry,
    - adapter list,
    - widget pack registration.
- Section 7 inventory integration cutover:
  - Reworked inventory integration to runtime primitives + timeline-native view:
    - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - Removed obsolete inventory chat runtime slice surface:
    - deleted `apps/inventory/src/features/chat/chatSlice.ts`
    - deleted `apps/inventory/src/features/chat/chatSlice.test.ts`
    - deleted `apps/inventory/src/features/chat/selectors.ts`
  - Removed chat reducer from inventory store:
    - `apps/inventory/src/app/store.ts`
  - Updated orphaned story type dependency:
    - `apps/inventory/src/features/chat/stories/ModelStats.stories.tsx`
- Section 8 docs/stories cleanup:
  - Updated architecture guide to hard-cut primary path:
    - `packages/engine/docs/chat-window-timeline-first-guide.md`
  - Updated HC-58 implementation plan metadata/status to reflect removed compatibility layers:
    - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/design-doc/02-hc58-v1-simplified-implementation-plan.md`
  - Updated task checklist to mark completed sections and hard-cut wording:
    - `ttmp/2026/02/19/HC-58-CHAT-RUNTIME-REFACTOR--chat-runtime-refactor/tasks.md`

### Why
- The user requested hard cutover explicitly.
- Maintaining both legacy and primary paths would keep ambiguity and prolong migration risk.

### What worked
- Full repo typecheck passed after deletions and API shifts.
- Full engine test suite passed after removals.
- Inventory projection adapter test passed with new bootstrap/layout.
- Storybook taxonomy check passed after story deletions and updates.

### What didn't work
- N/A for build/test behavior in this step.
- Manual multi-window UI smoke was not executed in this non-interactive terminal session.

### What I learned
- Deleting compatibility layers reduced complexity quickly, but required synchronized updates across exports, stories, docs, and inventory store wiring.

### What was tricky to build
- The most error-prone part was sequencing hard deletes with replacement APIs so typecheck remained green across story/test surfaces.

### What warrants a second pair of eyes
- `TimelineConversationView` now owns direct entity rendering semantics. Teams using prior message-projection behavior should review whether any removed grouping behavior from `timelineDisplayMessages` needs to be reintroduced intentionally in a runtime-native form.

### What should be done in the future
- Run a true interactive multi-window smoke test and record outcome in changelog before final ticket close.

### Code review instructions
- Start with hard cutover core:
  - `packages/engine/src/hypercard-chat/runtime/TimelineConversationView.tsx`
  - `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
  - `apps/inventory/src/features/chat/runtime/registerInventoryConversationExtensions.ts`
- Then verify widget registry migration:
  - `packages/engine/src/hypercard-chat/widgets/inlineWidgetRegistry.ts`
  - `packages/engine/src/hypercard-chat/widgets/hypercardWidgetPack.tsx`
- Then verify removals/cleanup:
  - `packages/engine/src/hypercard-chat/index.ts`
  - `apps/inventory/src/app/store.ts`
  - deleted files listed above

### Technical details
- Commands run:
  - `npm run typecheck`
  - `npm run test -w packages/engine`
  - `npx vitest run apps/inventory/src/features/chat/runtime/projectionPipeline.test.ts`
  - `npm run storybook:check`
  - `rg -n "buildTimelineDisplayMessages\\(" apps/inventory/src packages/engine/src/hypercard-chat/runtime || true`
  - `rg -n "setConnectionStatus|setModelName|markStreamStart|updateStreamTokens|setTurnStats" apps/inventory/src/features/chat || true`
- Validation outputs:
  - TypeScript build: success.
  - Engine vitest suite: `26 files passed`, `193 tests passed`.
  - Inventory projection pipeline test: `1 file passed`, `2 tests passed`.
  - Storybook taxonomy check: passed (`46 story files`).
