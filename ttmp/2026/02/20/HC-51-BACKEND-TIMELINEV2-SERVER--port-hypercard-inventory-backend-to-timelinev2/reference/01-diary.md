---
Title: Diary
Ticket: HC-51-BACKEND-TIMELINEV2-SERVER
Status: active
Topics:
    - backend
    - chat
    - inventory
    - sqlite
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/main.go
      Note: Startup command entrypoint used in reproduction and validation
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Step-by-step migration and verification diary focuses on this file
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:08:01.986371568-05:00
WhatFor: Preserve exact backend TimelineV2 migration investigation, implementation, validation, and follow-ups for rapid continuation.
WhenToUse: Read before changing go-inventory-chat timeline projection code or debugging hypercard-inventory-server startup failures after pinocchio timeline changes.
---


# Diary

## Goal

Capture the full implementation trail for porting the hypercard inventory backend to TimelineV2 so backend startup succeeds and the migration remains auditable.

## Step 1: Reproduce backend failure and identify exact breakage scope

The first objective was to reproduce your failure exactly with the same command and verify whether this was a single stale reference or a wider backend migration gap. I focused on proving the concrete compile boundary first so fixes stayed minimal and safe.

Once the failure reproduced, I inspected the failing code path and scanned `go-inventory-chat` for V1-only references to estimate migration blast radius before patching.

### Prompt Context

**User prompt (verbatim):** "Add a new ticket to port the backend server to use timelinev2 as well: 

❯ go run ./cmd/hypercard-inventory-server  hypercard-inventory-server --timeline-db /tmp/timeline3.db --turns-db /tmp/turns.db --ai-engine gpt-5-mini --log-level debug --ai-api-type openai-responses --with-caller --log-file /tmp/gpt-5.log --log-to-stdout
# github.com/go-go-golems/hypercard-inventory-chat/internal/pinoweb
internal/pinoweb/hypercard_events.go:303:45: undefined: timelinepb.TimelineEntityV1
internal/pinoweb/hypercard_events.go:306:27: undefined: timelinepb.TimelineEntityV1_Status
internal/pinoweb/hypercard_events.go:367:45: undefined: timelinepb.TimelineEntityV1
internal/pinoweb/hypercard_events.go:370:27: undefined: timelinepb.TimelineEntityV1_ToolResult

Analyze what needs to be done, create tasks, work them off and keep a diary and commit as you go, so I can start the backend service."

**Assistant interpretation:** Reproduce the backend compile failure, migrate affected TimelineEntityV1 usage to TimelineEntityV2, document all findings/tasks in a new ticket diary, and commit in incremental slices.

**Inferred user intent:** Unblock immediate backend service startup with a robust, documented TimelineV2 cutover path that can be reviewed and continued safely.

**Commit (code):** N/A

### What I did
- Ran your exact startup command in `go-inventory-chat`.
- Confirmed compile break in `internal/pinoweb/hypercard_events.go` for removed symbols:
  - `TimelineEntityV1`
  - `TimelineEntityV1_Status`
  - `TimelineEntityV1_ToolResult`
- Inspected the failing region and identified two stale projections in `registerHypercardTimelineHandlers()`:
  - status upserts
  - tool_result upserts
- Scanned the backend module for remaining V1 references and confirmed the stale usage was localized to this file.

### Why
- Reproducing the exact command ensured we were fixing the real startup blocker, not a neighboring issue.
- Scoping all V1 references before editing avoided unnecessary migration churn.

### What worked
- Exact reproduction gave deterministic errors tied to line numbers.
- Search pass showed the fix could remain focused to one backend file.

### What didn't work
- N/A (this phase was investigation and completed as expected).

### What I learned
- The backend was already mostly TimelineV2-ready; only custom pinoweb projection handlers lagged behind pinocchio transport changes.

### What was tricky to build
- Main risk was preserving projection contract semantics while changing transport type. The tricky part was not compile fixes, but maintaining entity IDs, kinds, and snapshot field shape in `props` so frontend behavior would remain stable.

### What warrants a second pair of eyes
- Validate that `status` and `tool_result` renderers consume the V2 `props` shape exactly as emitted after migration.

### What should be done in the future
- Add targeted tests that assert `hypercard.*` timeline handlers produce expected V2 props payloads.

### Code review instructions
- Start at `go-inventory-chat/internal/pinoweb/hypercard_events.go`, function `registerHypercardTimelineHandlers`.
- Validate failure reproduction and then re-run build/startup checks from Step 2.

### Technical details
```bash
go run ./cmd/hypercard-inventory-server hypercard-inventory-server \
  --timeline-db /tmp/timeline3.db \
  --turns-db /tmp/turns.db \
  --ai-engine gpt-5-mini \
  --log-level debug \
  --ai-api-type openai-responses \
  --with-caller \
  --log-file /tmp/gpt-5.log \
  --log-to-stdout
```

Observed compile errors:
- `internal/pinoweb/hypercard_events.go:303:45: undefined: timelinepb.TimelineEntityV1`
- `internal/pinoweb/hypercard_events.go:306:27: undefined: timelinepb.TimelineEntityV1_Status`
- `internal/pinoweb/hypercard_events.go:367:45: undefined: timelinepb.TimelineEntityV1`
- `internal/pinoweb/hypercard_events.go:370:27: undefined: timelinepb.TimelineEntityV1_ToolResult`

## Step 2: Migrate pinoweb projections to TimelineEntityV2 and validate startup

This step implemented the actual code migration by replacing `TimelineEntityV1` oneof wrappers with `TimelineEntityV2(kind + props)` payloads. I deliberately preserved existing snapshot types (`StatusSnapshotV1`, `ToolResultSnapshotV1`) and converted them to `props` via protojson to avoid field drift.

After patching, I ran build/tests/startup smoke to confirm you can now start the backend service.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Apply a hard cutover fix that restores backend startup and keep it documented/committed as part of the new ticket.

**Inferred user intent:** Resolve the blocker now, not just analyze it.

**Commit (code):** `f833702` — "fix(backend): migrate hypercard timeline handlers to TimelineEntityV2"

### What I did
- Updated `go-inventory-chat/internal/pinoweb/hypercard_events.go`:
  - Replaced V1 status upserts with:
    - `timelineEntityFromProtoMessage(entityID, "status", &timelinepb.StatusSnapshotV1{...})`
  - Replaced V1 tool_result upserts with:
    - `timelineEntityFromProtoMessage(ev.ID+\":result\", \"tool_result\", &timelinepb.ToolResultSnapshotV1{...})`
  - Added helper functions:
    - `timelineEntityFromProtoMessage`
    - `timelineStructFromProtoMessage`
  - Added imports:
    - `google.golang.org/protobuf/encoding/protojson`
    - `google.golang.org/protobuf/proto`
- Formatted and validated:
  - `gofmt -w internal/pinoweb/hypercard_events.go`
  - `go build ./cmd/hypercard-inventory-server`
  - `go test ./... -count=1` (from `go-inventory-chat`)
  - `timeout 12s go run ./cmd/hypercard-inventory-server ...` (startup smoke)

### Why
- V2 migration needed to preserve existing semantics while aligning with current pinocchio APIs.
- Proto-based conversion keeps `props` aligned with snapshot schema without hand-maintained maps.

### What worked
- Build succeeded.
- `go test ./...` succeeded.
- Server started successfully and mounted webchat routes before timeout shutdown:
  - `starting web-chat server addr=:8091`
  - graceful shutdown on timeout signal.

### What didn't work
- Cleanup of generated local binary via `rm` was blocked by command policy in this environment:
  - `Rejected("... rm -f go-inventory-chat/hypercard-inventory-server ... blocked by policy")`
- Workaround: avoided staging untracked artifacts and committed only targeted file changes.

### What I learned
- This backend can stay app-owned for projection specifics, but conversion helper duplication may grow if multiple apps repeat this pattern.

### What was tricky to build
- The tricky part was payload typing: `TimelineEntityV2.props` is a `Struct`, so preserving nested snapshot shape requires a reliable conversion path. Converting the proto snapshot via protojson -> map -> struct ensured the emitted shape remained schema-consistent without relying on fragile manual assembly.

### What warrants a second pair of eyes
- Confirm frontend/tooling decoding of `tool_result.props` still interprets nested `result` exactly as expected for widget/card artifacts.

### What should be done in the future
- Consider exposing a shared utility from pinocchio for app-side `proto.Message -> TimelineEntityV2.props` to avoid repeated local helper code.

### Code review instructions
- Review diff in `go-inventory-chat/internal/pinoweb/hypercard_events.go`.
- Validate with:
  - `cd go-inventory-chat && go build ./cmd/hypercard-inventory-server`
  - `cd go-inventory-chat && go test ./... -count=1`
  - `cd go-inventory-chat && timeout 12s go run ./cmd/hypercard-inventory-server hypercard-inventory-server --timeline-db /tmp/timeline3.db --turns-db /tmp/turns.db --ai-engine gpt-5-mini --log-level debug --ai-api-type openai-responses --with-caller --log-file /tmp/gpt-5.log --log-to-stdout`

### Technical details
- Entity contract preserved:
  - Status entity ID: `ev.ID + ":status"`
  - Tool result entity ID: `ev.ID + ":result"`
  - Kinds unchanged: `status`, `tool_result`
- Snapshot proto contracts preserved in `props`:
  - `StatusSnapshotV1`
  - `ToolResultSnapshotV1`

## Step 3: Compare bookmark branch and document migration tasks/follow-ups

I also followed your suggestion to compare with `bookmark/2026-02-16/problematic-codex-webchat-integration` for backend migration ideas. The branch exists, but its `go-inventory-chat` is an earlier shape without `internal/pinoweb`, so it did not provide direct implementation guidance for this TimelineV2 fix.

I then created ticket `HC-51-BACKEND-TIMELINEV2-SERVER`, added concrete tasks, checked off completed items, and left explicit follow-up tasks open (including one-time bootstrap registration cleanup).

### Prompt Context

**User prompt (verbatim):** "You can compare the backend in bookmark/2026-02-16/problematic-codex-webchat-integration which was a failed refactoring branch for the frontend but I think the backend was decent. 

Maybe that will give you some ideas in your analysis. 

Continue."

**Assistant interpretation:** Mine the old branch for reusable backend patterns and continue the current migration with that context.

**Inferred user intent:** Ensure the fix is informed by prior work and not regressing previously good backend structure.

**Commit (code):** N/A (documentation/task management step)

### What I did
- Queried tree contents of `bookmark/2026-02-16/problematic-codex-webchat-integration`.
- Verified `go-inventory-chat` in that branch lacks current `internal/pinoweb` timeline projection code.
- Created new ticket workspace and docs:
  - design doc
  - diary
  - tasks list with completion tracking and follow-up task.

### Why
- Branch comparison was requested and could have yielded reusable patterns.
- Ticket bookkeeping preserves decisions and remaining work for later continuation.

### What worked
- Branch analysis produced a clear conclusion: no directly reusable pinoweb migration code in that branch.
- Task list now tracks both completed migration steps and remaining architecture follow-up.

### What didn't work
- Direct file lookup in bookmark branch failed because target file does not exist there:
  - `fatal: path 'go-inventory-chat/internal/pinoweb/hypercard_events.go' exists on disk, but not in 'bookmark/2026-02-16/problematic-codex-webchat-integration'`

### What I learned
- The comparison branch represents a pre-pinoweb backend phase, so it is useful only for broad architecture context, not for this concrete TimelineV2 projection fix.

### What was tricky to build
- Branch-vs-current-tree comparisons can mislead when backend directory shape changed significantly; I had to confirm tree contents explicitly before inferring design parity.

### What warrants a second pair of eyes
- Decide whether bootstrap registration centralization belongs in this ticket or a dedicated follow-up backend architecture ticket.

### What should be done in the future
- Keep follow-up task open for explicit one-time global module bootstrap registration.

### Code review instructions
- Review `tasks.md` for checked-off steps and open follow-up.
- Review `design-doc/01-timelinev2-backend-port-plan.md` for rationale and decisions.

### Technical details
Commands used for branch inspection:
```bash
git ls-tree --name-only bookmark/2026-02-16/problematic-codex-webchat-integration
git ls-tree -r --name-only bookmark/2026-02-16/problematic-codex-webchat-integration go-inventory-chat
git show bookmark/2026-02-16/problematic-codex-webchat-integration:go-inventory-chat/internal/pinoweb/hypercard_events.go
```
