---
Title: Diary
Ticket: HC-55-CHAT-HYDRATION-ROOTCAUSE
Status: active
Topics:
    - chat
    - debugging
    - frontend
    - architecture
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Confirmed SEM mapping coverage vs timeline projection coverage
    - Path: packages/engine/src/chat/sem/semRegistry.ts
      Note: Diary captures direct timeline.upsert and SEM handler overlap findings
    - Path: packages/engine/src/chat/ws/wsManager.ts
      Note: Verified hydration and buffered replay behavior on frontend
    - Path: ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md
      Note: Primary analysis artifact updated in this step
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go
      Note: Verified snapshot ordering and per-entity version semantics
    - Path: /home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/webchat/timeline_projector.go
      Note: Verified server projection path and handler dispatch
ExternalSources: []
Summary: Step-by-step diary for HC-55 root-cause investigation and documentation updates.
LastUpdated: 2026-02-22T00:00:00Z
WhatFor: Preserve implementation and investigation context for future contributors.
WhenToUse: Use when continuing HC-55 work or reviewing why specific investigation paths were chosen.
---


# Diary

## Goal

Capture exact investigation steps and conclusions while expanding HC-55 with backend/frontend timeline-path details, so a new intern can continue without re-discovering context.

## Step 1: Map Both Timeline Paths and Document Ordering Mismatch

This step focused on proving whether timeline reorder originates in frontend-only logic or in backend projection semantics. The main output was a substantial rewrite of the HC-55 bug report with line-level evidence for both live stream and hydration paths.

The work also clarified the ring-buffer question: buffering exists and stores all SEM frames up to capacity, but hydration does not currently read from that buffer.

### Prompt Context

**User prompt (verbatim):** "Ok research also how the timeline is handled and the SEM events projected in the 2026-02-12--hypercard-react/go-inventory-chat application, which is what populates the timeline. I suspect that it's using a different projection. ... Analyze the go side of things. suggestions are fine, those were first injected by the frontend and disappear. Focus on the go / frontend discrepancies and update the document significantly, by adding all the detailed information on the two paths to a timeline and how hydration reloads it from where. Idfeally we want both sides to mostly line up."

**Assistant interpretation:** Investigate end-to-end Go and frontend timeline pipelines, identify discrepancies causing reorder on focus/hydrate, and significantly expand HC-55 with intern-ready technical detail.

**Inferred user intent:** Establish a complete root-cause quality handoff that enables a clean implementation fix instead of patch-level mitigations.

**Commit (code):** N/A (documentation-only step)

### What I did

- Traced route wiring in inventory app for websocket and timeline hydration endpoints.
- Traced backend fan-out callback that broadcasts SEM, buffers SEM, and projects timeline.
- Traced timeline projector persistence semantics and snapshot ordering from both SQLite and in-memory stores.
- Traced frontend websocket hydration flow, buffered replay, and reducer merge/version guards.
- Traced frontend direct SEM projection handlers and compared against backend `timeline.upsert` projection to identify dual-projection behavior.
- Verified hypercard suggestions are mapped to SEM events but not persisted by inventory timeline handlers.
- Rewrote `analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md` with a full discrepancy map and fix strategy.
- Updated `tasks.md` with concrete follow-up implementation tasks.
- Updated `changelog.md` to record this investigation update.

### Why

- Prior HC-55 document covered lifecycle hypotheses but not enough backend projection detail to explain the observed before/after ordering shift.
- The user specifically asked to compare Go and frontend paths and explain hydration source of truth.

### What worked

- The provided before/after YAML aligned with backend `ORDER BY version ASC` snapshot behavior.
- Frontend hydration mapping explained equalized version values after hydration.
- Coverage comparison showed an actionable suggestions persistence gap.

### What didn't work

- Initial attempt to read shared `pinocchio` files under `2026-02-12--hypercard-react/pinocchio/...` failed because the module is a sibling repo in this workspace.
- Exact error: `No such file or directory` from `nl` commands targeting wrong path root.
- Resolved by locating correct paths via `rg --files` and reading from `pinocchio/...`.

### What I learned

- Reorder is not just frontend sorting; backend snapshot ordering by last-write version is a major contributor.
- Current architecture intentionally supports both raw SEM and projected `timeline.upsert` on frontend, which increases reconciliation complexity.
- Ring buffer presence does not imply hydration usage.

### What was tricky to build

- The hardest part was separating three different "orders" that look similar in UI output:
  - websocket arrival order,
  - backend projection version order,
  - frontend first-seen insertion order.
- These orders can align temporarily and then diverge during reconnect/hydrate, making symptoms appear intermittent.
- I resolved this by anchoring every conclusion to specific code locations and explicitly labeling which path each behavior belongs to.

### What warrants a second pair of eyes

- Whether to keep dual projection on frontend or collapse to backend canonical projection for persisted entities.
- Proto contract decision for per-entity version in snapshots (cross-language impact).
- Suggestions persistence policy choice (ephemeral vs persisted) because it changes debug/export expectations.

### What should be done in the future

- Implement instrumentation-driven proof for focus-triggered reconnect trigger.
- Decide canonical ordering contract and enforce it end-to-end.
- Add regression tests for focus/reconnect/hydrate ordering stability.

### Code review instructions

- Start with the updated report:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md`
- Validate source evidence in:
  - `go-inventory-chat/cmd/hypercard-inventory-server/main.go`
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
  - `../pinocchio/pkg/webchat/conversation.go`
  - `../pinocchio/pkg/webchat/timeline_projector.go`
  - `../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go`
  - `packages/engine/src/chat/ws/wsManager.ts`
  - `packages/engine/src/chat/sem/semRegistry.ts`
- Validation command examples:
  - `rg -n "timeline.upsert|GetSnapshot|ORDER BY version" pinocchio/pkg/webchat pinocchio/pkg/persistence/chatstore`
  - `rg -n "mergeSnapshot|hydrate|buffered.sort" 2026-02-12--hypercard-react/packages/engine/src/chat`

### Technical details

- Backend snapshot ordering query:
  - `timeline_store_sqlite.go` full snapshot: `ORDER BY version ASC, entity_id ASC`.
- Frontend hydrated mapping behavior:
  - `timelineEntityFromProto(entity, snapshot.version)` applies same version to each entity in one snapshot.
- Suggestions discrepancy:
  - frontend starter suggestions come from `ChatConversationWindow` local dispatch, while Go inventory timeline handlers do not register `hypercard.suggestions.*` projection.

## Step 2: Refresh reMarkable Handoff Bundle

After the documentation expansion was committed, this step refreshed the reMarkable handoff so onboarding material on-device matches the latest ticket analysis. This avoids intern confusion from stale PDFs.

The step was intentionally narrow: upload updated docs, record it in changelog, and preserve continuity in the diary.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Continue the HC-55 workflow from the prior completed state, including remaining operational handoff steps.

**Inferred user intent:** Keep momentum and complete any obvious missing deliverables after the analysis/doc commit.

**Commit (code):** N/A (documentation/ops-only step)

### What I did

- Checked `remarquee` command help and current auth status.
- Uploaded a bundled PDF containing updated analysis + diary:
  - `remarquee upload bundle ... --name HC-55-CHAT-HYDRATION-ROOTCAUSE-update --remote-dir /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`
- Appended changelog entry documenting refreshed upload.
- Appended this diary step for traceability.

### Why

- The previous reMarkable upload predated the expanded Go/frontend discrepancy analysis.
- Intern handoff quality requires device copy and repo copy to stay aligned.

### What worked

- Upload succeeded on first try with result:
  - `OK: uploaded HC-55-CHAT-HYDRATION-ROOTCAUSE-update.pdf -> /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`

### What didn't work

- N/A

### What I learned

- Keeping device handoff artifacts synchronized with ticket docs is low effort and prevents avoidable onboarding churn.

### What was tricky to build

- No implementation complexity; main risk was forgetting to update changelog/diary after successful upload.

### What warrants a second pair of eyes

- Verify the uploaded PDF opens correctly on device and includes both analysis and diary pages.

### What should be done in the future

- Continue uploading refreshed bundles whenever major ticket docs materially change.

### Code review instructions

- Confirm changelog includes refreshed upload entry:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/changelog.md`
- Confirm diary includes Step 2 and command/result details:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/reference/01-diary.md`

### Technical details

- Command used:
  - `remarquee upload bundle 2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/analysis/01-bug-report-focus-triggered-reconnect-and-timeline-hydration-instability.md 2026-02-12--hypercard-react/ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/reference/01-diary.md --name HC-55-CHAT-HYDRATION-ROOTCAUSE-update --remote-dir /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`
- Output:
  - `OK: uploaded HC-55-CHAT-HYDRATION-ROOTCAUSE-update.pdf -> /ai/2026/02/22/HC-55-CHAT-HYDRATION-ROOTCAUSE`

## Step 3: Lock Contracts and Break Work into Executable Tasks

This step converted the analysis recommendations into fixed implementation contracts based on explicit user decisions. The goal was to remove ambiguity before touching runtime behavior.

I translated the decisions into task ordering so implementation can proceed with one clear invariant at a time instead of mixing policy and code changes in a single pass.

### Prompt Context

**User prompt (verbatim):** "11.1 canonical -> chronological first -seen. 
11.2 yes
11.3 you decide, we should only show the last one in the UI. 


Add tasks to the ticket, the nexecute the tasks one by one , committing as you go, and keeping a detailed diary."

**Assistant interpretation:** Accept architecture choices, update ticket tasks accordingly, then implement step-by-step with incremental commits and diary updates.

**Inferred user intent:** Move from analysis to disciplined execution with auditable progress and handoff-quality documentation.

**Commit (code):** pending (this step is included in the next docs/code commit sequence)

### What I did

- Updated `tasks.md` to reflect fixed contracts and concrete implementation steps.
- Marked architecture decisions as completed tasks:
  - canonical ordering = chronological first-seen
  - persisted source-of-truth = backend `timeline.upsert`
  - suggestion display policy = latest block only
- Added changelog entry recording the contract lock.

### Why

- Implementation without locked contracts risks refactors that conflict later.
- A sequential task list makes commit history and review checkpoints much clearer.

### What worked

- Existing HC-55 structure already had enough context; task conversion was straightforward.

### What didn't work

- N/A

### What I learned

- Explicitly marking decision tasks as done is useful guardrail when multiple repos are involved.

### What was tricky to build

- The tricky part is sequencing cross-repo changes (pinocchio + app frontend) while preserving testability after each commit.
- I resolved this by front-loading contract decisions into ticket tasks before code edits.

### What warrants a second pair of eyes

- Task sequencing order for cross-repo commits (backend ordering first, then suggestion projection, then frontend source-of-truth behavior).

### What should be done in the future

- Keep task checkboxes synchronized with commit boundaries; avoid batching multiple semantic changes in one commit.

### Code review instructions

- Review the updated task contract and ordering:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/tasks.md`
- Review changelog entry describing the shift from analysis to execution:
  - `ttmp/2026/02/21/HC-55-CHAT-HYDRATION-ROOTCAUSE--investigate-focus-triggered-chat-reconnect-and-hydration-root-cause/changelog.md`

### Technical details

- Decision mapping:
  - 11.1 -> first-seen chronological ordering
  - 11.2 -> backend-projected persisted entities
  - 11.3 -> latest suggestions block displayed in UI

## Step 4: Implement Canonical First-Seen Ordering in Backend Timeline Stores

This step implemented the core ordering contract change in the backend storage layer so hydration snapshots are deterministic by first appearance instead of last update. That directly targets the timeline reorder seen after reconnect/hydrate.

I changed both SQLite and in-memory timeline stores together to keep behavior consistent across runtime configurations.

### Prompt Context

**User prompt (verbatim):** (see Step 3)

**Assistant interpretation:** Execute Task 1 by enforcing chronological first-seen ordering in snapshot reads.

**Inferred user intent:** Remove backend/frontend ordering mismatch at the source.

**Commit (code):** `82e3c99` — "timeline: return snapshots in first-seen entity order"

### What I did

- Updated SQLite snapshot queries to sort by `created_at_ms ASC, entity_id ASC` for both full and incremental snapshot reads.
- Updated in-memory snapshot sort logic to use first-seen `createdAtMs` ordering.
- Updated SQLite and in-memory store tests to assert first-seen ordering.
- Ran tests:
  - `go test ./pinocchio/pkg/persistence/chatstore -count=1`
- Pre-commit hook additionally ran full pinocchio checks (`go test ./...`, generate/build/lint/vet) and passed.

### Why

- Existing full hydration ordered by entity last-write `version`, which can reorder previously displayed entities after reconnect.

### What worked

- Store tests passed with updated expectations.
- Full repository pre-commit checks passed.

### What didn't work

- N/A

### What I learned

- `created_at_ms` was already persisted and stable per entity, so the ordering contract change did not require schema migrations.

### What was tricky to build

- Incremental snapshots historically implied "projection order" by version. Changing them to first-seen required consciously preserving the version filter (`version > since`) while sorting by created-at for UI order stability.

### What warrants a second pair of eyes

- Any consumers relying on incremental snapshot version-sort semantics (outside chat UI hydration) should be validated.

### What should be done in the future

- Validate incremental snapshot consumers against the new ordering contract.

### Code review instructions

- Review query/sort changes first:
  - `/home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go`
  - `/home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_memory.go`
- Then verify updated tests:
  - `/home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_sqlite_test.go`
  - `/home/manuel/workspaces/2026-02-21/hypercard-qol/pinocchio/pkg/persistence/chatstore/timeline_store_memory_test.go`

### Technical details

- Old full snapshot order: `ORDER BY version ASC, entity_id ASC`
- New full snapshot order: `ORDER BY created_at_ms ASC, entity_id ASC`

## Step 5: Persist Hypercard Suggestions via Backend Timeline Projection

This step made assistant suggestions part of backend timeline projection so they survive hydration and do not disappear when frontend-only state is replaced/merged.

I intentionally projected all `hypercard.suggestions.*` event variants into one canonical timeline entity (`suggestions:assistant`) to enforce latest-block semantics.

### Prompt Context

**User prompt (verbatim):** (see Step 3)

**Assistant interpretation:** Execute Task 2 by adding backend timeline handlers for suggestions and ensuring a single visible latest block.

**Inferred user intent:** Keep suggestions aligned between live view and hydrated view, with no stale multi-block clutter.

**Commit (code):** `b798ac2` — "go-inventory-chat: project hypercard suggestions into timeline"

### What I did

- Added timeline handlers for:
  - `hypercard.suggestions.start`
  - `hypercard.suggestions.update`
  - `hypercard.suggestions.v1`
- Each handler now upserts:
  - `id: suggestions:assistant`
  - `kind: suggestions`
  - `props: { source: assistant, items: [...], consumedAt: null }`
- Added regression test:
  - `TestHypercardTimelineHandlers_SuggestionsProjectToSingleAssistantEntity`
- Ran tests:
  - `go test ./2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb -count=1`

### Why

- Suggestions previously arrived via raw SEM but were not persisted in backend timeline snapshot, causing hydrate mismatch.

### What worked

- Projection test confirms a single assistant suggestions entity is persisted and overwritten by the newest block.

### What didn't work

- First implementation passed `[]string` directly to `structpb.NewStruct`, which failed with:
  - `proto: invalid type: []string`
- Fixed by converting to `[]any` before struct construction.

### What I learned

- `structpb.NewStruct` requires JSON-compatible `[]any` for arrays; typed slices need explicit conversion.

### What was tricky to build

- Clearing consumed state correctly for new suggestion blocks required explicit `consumedAt: null` in projected props, otherwise generic prop merge can preserve old consumed markers.

### What warrants a second pair of eyes

- Confirm `consumedAt: null` behavior is consistent across all mappers and debug exports.

### What should be done in the future

- Add e2e validation around selecting a suggestion and receiving a new suggestion block.

### Code review instructions

- Review new suggestions timeline handlers:
  - `go-inventory-chat/internal/pinoweb/hypercard_events.go`
- Review regression test:
  - `go-inventory-chat/internal/pinoweb/hypercard_timeline_handlers_test.go`

### Technical details

- Canonical entity id for assistant suggestions is now always `suggestions:assistant`.

## Step 6: Make Backend Projection Authoritative on Frontend for Persisted Entities

This step removed local frontend projection writes for persisted llm/tool/hypercard entities and shifted to consuming backend `timeline.upsert` as the authoritative path. Telemetry/session metadata updates remain from raw llm metadata events.

I also updated tests to validate the new projection contract and added a regression test for suggestion re-visibility when a new backend suggestion block arrives.

### Prompt Context

**User prompt (verbatim):** (see Step 3)

**Assistant interpretation:** Execute Tasks 3-5 by enforcing backend timeline authority and confirming latest-suggestions behavior with tests.

**Inferred user intent:** Remove dual-projection drift and stabilize UI state across hydration/reconnect.

**Commit (code):** `6a827ed` — "engine: make timeline.upsert authoritative for persisted entities"

### What I did

- In `semRegistry`:
  - removed local timeline entity writes from direct `llm.*` handlers
  - removed local timeline entity writes from direct `tool.*` handlers
  - kept stream/session metadata handling and `timeline.upsert` processing
- In hypercard module bootstrap:
  - stopped registering direct hypercard SEM timeline mutators
  - kept renderer registration
- Updated tests:
  - `semRegistry.test.ts`
  - `registerChatModules.test.ts`
  - `hypercardWidget.test.ts`
  - `hypercardCard.test.ts`
- Added regression test:
  - assistant suggestions become visible again when backend sends a new block after previous consumption.
- Ran tests:
  - `pnpm vitest packages/engine/src/chat/sem/semRegistry.test.ts packages/engine/src/chat/runtime/registerChatModules.test.ts packages/engine/src/hypercard/timeline/hypercardWidget.test.ts packages/engine/src/hypercard/timeline/hypercardCard.test.ts`

### Why

- Dual projection paths caused semantic drift risk and inconsistent ordering/visibility after hydrate.

### What worked

- Updated tests now pass using backend `timeline.upsert` mapping path.
- Suggestion re-visibility regression is covered.

### What didn't work

- Initial test updates failed in two places:
  - `registerChatModules.test.ts` assumed local timeline conversation exists after `llm.delta`
  - `hypercardCard.test.ts` expected card title from `name` while mapper defaults to `title` (or fallback)
- Resolved by:
  - asserting session telemetry instead of local timeline message creation
  - including `title` in test timeline-upsert payload

### What I learned

- Existing tests captured prior hybrid projection behavior; switching authority to backend projection requires explicit test-contract updates.

### What was tricky to build

- Preserving chat telemetry while removing local persisted entity writes required separating "session/stream signals" from "timeline materialization" responsibilities in handlers.

### What warrants a second pair of eyes

- Confirm no user-visible latency regressions from relying on timeline.upsert path for message/tool materialization.

### What should be done in the future

- Add targeted UX check for first-token display timing under high latency.

### Code review instructions

- Start with semantic change:
  - `packages/engine/src/chat/sem/semRegistry.ts`
- Then module wiring:
  - `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts`
- Then contract tests:
  - `packages/engine/src/chat/sem/semRegistry.test.ts`
  - `packages/engine/src/chat/runtime/registerChatModules.test.ts`
  - `packages/engine/src/hypercard/timeline/hypercardWidget.test.ts`
  - `packages/engine/src/hypercard/timeline/hypercardCard.test.ts`

### Technical details

- Persisted timeline entities now enter frontend state via `timeline.upsert`.
- Direct llm/tool handlers remain for stream/session metadata only.

## Step 7: Instrument and Verify Focus Remount Lifecycle After Projection Contract Changes

This step closes the final HC-55 execution task by adding deterministic lifecycle tracing to the websocket manager and validating the strict-mode remount path with a dedicated regression test.

The test target is the exact sequence we care about after the architecture decisions: mount/connect, teardown/disconnect, reconnect, hydrate snapshot, then replay buffered frames without timeline loss.

### Prompt Context

**User prompt (verbatim):** (see Step 3)

**Assistant interpretation:** Complete the remaining HC-55 task by instrumenting and verifying reconnect/hydrate behavior with explicit evidence.

**Inferred user intent:** Ensure the focus-triggered remount path is observable and regression-tested, not only inferred from code reading.

**Commit (code):** `21a7643` — "ws: trace reconnect hydrate lifecycle and close hc-55"

### What I did

- Added an optional `onLifecycle` hook to `WsManager` connect args.
- Added lifecycle phase emissions for:
  - `connect.begin`, `connect.reuse`, `disconnect`
  - `ws.open`, `ws.close`, `ws.error`
  - `hydrate.start`, `hydrate.snapshot.applied`, `hydrate.fetch.failed`, `hydrate.fetch.error`, `hydrate.complete`
  - `frame.buffered`, `replay.begin`, `replay.complete`
- Added a new regression test in `wsManager.test.ts` that simulates strict-mode style remount:
  - first connect with `hydrate: false`
  - disconnect
  - reconnect with hydrate enabled
  - inject message while hydrate fetch is pending
  - assert timeline includes replayed event and lifecycle phases progress in the expected order constraints
- Updated existing `wsManager` tests to use `timeline.upsert` SEM frames (matching backend-authoritative projection contract).
- Ran targeted tests:
  - `pnpm vitest packages/engine/src/chat/ws/wsManager.test.ts`
  - `pnpm vitest packages/engine/src/chat/ws/wsManager.test.ts packages/engine/src/chat/sem/semRegistry.test.ts`

### Why

- HC-55 still had one unchecked task requiring explicit instrumentation and verification of the remount/hydrate path.
- Prior tests covered hydration merge behavior but did not capture the full lifecycle trace for remount sequencing.

### What worked

- Lifecycle tracing provided direct evidence of the reconnect/hydrate path.
- Regression test confirms buffered frame replay still materializes timeline entities after reconnect/hydrate.
- Updated test payloads (`timeline.upsert`) now align with the backend-authoritative timeline contract from Step 6.

### What didn't work

- Initial test command failed due incorrect invocation:
  - `pnpm --dir /path vitest ...` produced `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL ... EACCES`
- Resolved by running:
  - `cd /path && pnpm vitest ...`
- Initial lifecycle assertion expected strict ordering of `hydrate.start` before `frame.buffered`; async scheduling allowed the inverse order in one run.
- Resolved by asserting ordering constraints (both occur after reconnect open and before snapshot/replay completion) instead of a brittle exact list position.

### What I learned

- With promise scheduling around open/hydrate startup, buffered-frame callbacks can race with lifecycle marker callback ordering while still representing correct behavior.
- Tests for this path should assert causal ordering boundaries rather than over-constraining adjacent async events.

### What was tricky to build

- The strict-mode remount simulation had to preserve realism while staying deterministic; delaying hydrate fetch and sending a buffered event during that delay provided a stable test harness.

### What warrants a second pair of eyes

- Whether to surface lifecycle events directly in higher-level debug UI (currently the hook is available at websocket manager boundary and used by tests).

### What should be done in the future

- Add one conversation-manager-level test around ref-counted mount/unmount behavior if focus diagnostics need to include multi-subscriber attach/detach paths.

### Code review instructions

- Review instrumentation hook and lifecycle emission points:
  - `packages/engine/src/chat/ws/wsManager.ts`
- Review lifecycle regression and updated payload contract tests:
  - `packages/engine/src/chat/ws/wsManager.test.ts`
- Re-run targeted checks:
  - `pnpm vitest packages/engine/src/chat/ws/wsManager.test.ts packages/engine/src/chat/sem/semRegistry.test.ts`

### Technical details

- Lifecycle emission is intentionally optional and side-effect-free when no `onLifecycle` callback is provided.
- Regression flow verifies:
  - first connect without hydrate
  - explicit disconnect
  - reconnect with hydrate fetch
  - in-flight buffered `timeline.upsert` frame
  - replay completion and timeline state containing `msg-remount`.
