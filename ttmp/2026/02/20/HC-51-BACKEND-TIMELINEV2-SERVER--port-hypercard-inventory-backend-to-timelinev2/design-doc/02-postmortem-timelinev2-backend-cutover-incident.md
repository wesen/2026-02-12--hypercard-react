---
Title: 'Postmortem: TimelineV2 backend cutover incident'
Ticket: HC-51-BACKEND-TIMELINEV2-SERVER
Status: active
Topics:
    - backend
    - chat
    - inventory
    - sqlite
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Primary failure and remediation locus for TimelineEntityV1 to TimelineEntityV2 migration
    - Path: ttmp/2026/02/20/HC-51-BACKEND-TIMELINEV2-SERVER--port-hypercard-inventory-backend-to-timelinev2/reference/01-diary.md
      Note: Detailed incident execution diary referenced by postmortem
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:13:48.573440192-05:00
WhatFor: Incident postmortem for the backend startup failure caused by stale TimelineEntityV1 usage after TimelineV2 cutover, including technical root cause and prevention steps.
WhenToUse: Read when debugging backend startup regressions in pinoweb timeline handlers or planning TimelineV2 migrations for app-owned SEM projections.
---


# Postmortem: TimelineV2 backend cutover incident

## Executive Summary

On February 20, 2026, `hypercard-inventory-server` failed to start because app-owned timeline handlers still referenced removed `TimelineEntityV1` types while pinocchio transport had hard-cut to `TimelineEntityV2`. The failure was compile-time and fully blocked backend startup.

The incident was resolved by migrating `go-inventory-chat/internal/pinoweb/hypercard_events.go` to emit `TimelineEntityV2{kind, props}` entities, preserving existing `status` and `tool_result` payload semantics by serializing `StatusSnapshotV1` and `ToolResultSnapshotV1` into V2 `props`. Build/tests/startup smoke passed immediately after the patch (`f833702`).

The core lesson is that app-owned custom timeline projector code is a migration boundary independent from pinocchio core migration completion. Future protocol upgrades must include a compatibility scan for downstream app handlers before assuming cutover completeness.

## Problem Statement

The backend startup command:

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

failed with:

- `internal/pinoweb/hypercard_events.go:303:45: undefined: timelinepb.TimelineEntityV1`
- `internal/pinoweb/hypercard_events.go:306:27: undefined: timelinepb.TimelineEntityV1_Status`
- `internal/pinoweb/hypercard_events.go:367:45: undefined: timelinepb.TimelineEntityV1`
- `internal/pinoweb/hypercard_events.go:370:27: undefined: timelinepb.TimelineEntityV1_ToolResult`

Operational impact:

- Backend could not compile or start.
- Local development of inventory chat backend was blocked.
- Timeline persistence path for hypercard status/result events was unavailable.

Scope:

- Breakage was localized to app-owned `pinoweb` timeline projection handlers.
- Pinocchio core TimelineV2 transport and store APIs were already migrated.

## Proposed Solution

Apply a focused hard cutover in `hypercard_events.go`:

1. Replace removed V1 wrapper upserts in `registerHypercardTimelineHandlers()` with V2 upserts.
2. Preserve semantic contracts:
   - same entity IDs (`<id>:status`, `<id>:result`)
   - same entity kinds (`status`, `tool_result`)
   - same snapshot field schema, now encoded into V2 `props`.
3. Add local helper conversion path:
   - `proto.Message` -> `protojson` map -> `*structpb.Struct` -> `TimelineEntityV2.Props`
4. Validate end-to-end with build/tests/startup smoke.

Result:

- Startup command now runs and binds webchat server endpoint (`:8091`).
- Tests pass in `go-inventory-chat`.
- Ticket `HC-51` now only has one open follow-up: central bootstrap registration cleanup.

## Design Decisions

1. Keep `status` and `tool_result` kind names unchanged.
Reason: avoid downstream renderer/mapper contract changes.

2. Keep entity ID derivation unchanged.
Reason: maintain hydration and replace/upsert behavior by stable IDs.

3. Serialize existing snapshot proto types into `props` instead of hand-assembling maps.
Reason: reduces field drift risk and preserves schema shape.

4. Do not add compatibility shim for V1.
Reason: transport has already hard-cut; shim would extend dead contract surface and increase maintenance burden.

5. Keep registration topology unchanged in this incident fix.
Reason: bootstrap registration architecture changes are orthogonal; kept as explicit follow-up task to minimize incident repair scope.

## Alternatives Considered

1. Manual `map[string]any` assembly for all status/tool payloads.
Rejected because it duplicates schema and invites silent drift.

2. Temporary V1 compatibility wrappers in app code.
Rejected because it prolongs removed API usage and obscures migration completion.

3. Reusing backend implementation from `bookmark/2026-02-16/problematic-codex-webchat-integration`.
Investigated, but the branch predates current `internal/pinoweb` layout and had no directly reusable handler code for this migration.

## Implementation Plan

Executed steps:

1. Reproduce failure with user-provided startup command.
2. Scope stale V1 symbol usage in backend module.
3. Patch `hypercard_events.go` to V2 projections.
4. Run:
   - `go build ./cmd/hypercard-inventory-server`
   - `go test ./... -count=1`
   - startup smoke (`timeout 12s go run ...`)
5. Capture migration analysis, tasks, and diary in `HC-51` ticket docs.

Commits:

- `f833702` — backend code fix.
- `44f6cee` — ticket docs, tasks, diary/design rationale.

## Open Questions

- Should app-owned timeline handlers use a shared pinocchio helper for `proto -> TimelineEntityV2.props` conversion to avoid duplication?
- Should all SEM and timeline registration (including default handlers) move to one explicit backend bootstrap module for consistency across services?

## Prevention and Follow-ups

- Add pre-start scan/check in backend CI to fail fast on references to removed timeline transport symbols.
- Add regression tests for `hypercard.*` projection handlers asserting emitted V2 shape.
- Complete open ticket task: global one-time module/handler bootstrap centralization.

## References

- `go-inventory-chat/internal/pinoweb/hypercard_events.go`
- `ttmp/2026/02/20/HC-51-BACKEND-TIMELINEV2-SERVER--port-hypercard-inventory-backend-to-timelinev2/design-doc/01-timelinev2-backend-port-plan.md`
- `ttmp/2026/02/20/HC-51-BACKEND-TIMELINEV2-SERVER--port-hypercard-inventory-backend-to-timelinev2/reference/01-diary.md`
