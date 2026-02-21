---
Title: TimelineV2 backend port plan
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
    - Path: ../../../../../../../pinocchio/pkg/webchat/timeline_entity_v2.go
      Note: Reference pattern for converting protobuf snapshots into TimelineEntityV2 props
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Backend TimelineV2 projection migration target and contract surface
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:08:02.151054607-05:00
WhatFor: Plan and rationale for fixing hypercard-inventory backend compile/runtime breakage after pinocchio TimelineEntityV2 cutover.
WhenToUse: Use when touching pinoweb SEM-to-timeline projection code or evaluating backend TimelineV2 migration follow-ups.
---


# TimelineV2 backend port plan

## Executive Summary

`go run ./cmd/hypercard-inventory-server ...` was failing because `go-inventory-chat/internal/pinoweb/hypercard_events.go` still emitted removed `timelinepb.TimelineEntityV1` wrappers. The backend now uses pinocchio TimelineV2 transport (`TimelineEntityV2{kind, props}`), so custom projection handlers must emit V2 entities directly.

This slice applies a hard cutover in `pinoweb` timeline handlers: status and tool-result projections are now encoded as V2 entities while preserving existing semantic shape (`StatusSnapshotV1` and `ToolResultSnapshotV1` fields serialized into `props`). Startup/build/tests now pass.

## Problem Statement

Backend startup command failed to compile with:

- `internal/pinoweb/hypercard_events.go:303:45: undefined: timelinepb.TimelineEntityV1`
- `internal/pinoweb/hypercard_events.go:306:27: undefined: timelinepb.TimelineEntityV1_Status`
- `internal/pinoweb/hypercard_events.go:367:45: undefined: timelinepb.TimelineEntityV1`
- `internal/pinoweb/hypercard_events.go:370:27: undefined: timelinepb.TimelineEntityV1_ToolResult`

Root cause: pinocchio transport moved to `TimelineEntityV2`, but inventory backend custom timeline handlers still used V1 oneof snapshot wrappers.

## Proposed Solution

1. Keep existing hypercard SEM event types and timeline handler registrations.
2. Replace V1 upserts in `registerHypercardTimelineHandlers` with V2 upserts.
3. Preserve payload contract by serializing existing proto snapshots (`StatusSnapshotV1`, `ToolResultSnapshotV1`) into V2 `props`.
4. Validate with:
   - `go build ./cmd/hypercard-inventory-server`
   - `go test ./... -count=1` (in `go-inventory-chat`)
   - Provided `go run ...` startup command (short timeout smoke run)

Implementation detail: add local helpers in `hypercard_events.go`:

- `timelineEntityFromProtoMessage(id, kind, msg)`
- `timelineStructFromProtoMessage(msg)`

These convert protobuf snapshots to JSON-shaped `*structpb.Struct` using `protojson` with `EmitUnpopulated: true`.

## Design Decisions

- Preserve entity IDs (`<event-id>:status`, `<event-id>:result`) to avoid changing frontend identity semantics.
- Keep entity `kind` values unchanged (`status`, `tool_result`) to preserve renderer selection behavior.
- Encode `props` from proto snapshots instead of hand-building ad-hoc maps to keep schema fidelity and field naming consistency.
- Keep registration path as-is for now (`RegisterInventoryHypercardExtensions` one-time `sync.Once` bootstrap), and track central bootstrap unification as follow-up.

## Alternatives Considered

1. Manually build `props` maps without snapshot proto messages.
   - Rejected for this fix because it risks field drift and duplicate mapping logic.
2. Add temporary compatibility wrappers for `TimelineEntityV1`.
   - Rejected: pinocchio already hard-cut to V2; compatibility shim would add dead-end maintenance.
3. Reuse implementation from `bookmark/2026-02-16/problematic-codex-webchat-integration`.
   - Not applicable: that branch’s `go-inventory-chat` predates `internal/pinoweb` and has no equivalent hypercard timeline handler implementation.

## Implementation Plan

1. Reproduce compile failure with provided `go run` command.
2. Scope all V1 usages in `go-inventory-chat`.
3. Migrate `hypercard_events.go` timeline upserts to V2 helpers.
4. Rebuild/retest backend and run startup smoke.
5. Document findings and follow-up tasks in ticket docs.
6. Follow-up task: evaluate moving registration wiring to a global explicit module bootstrap point.

## Open Questions

- Should `registerDefaultSemHandlers`-style wiring and app-specific handler registration be centralized in one backend bootstrap package for all services?
- Do we want to expose shared helper(s) from pinocchio for app-side `proto -> TimelineEntityV2.props` conversion to remove repeated local helper implementations?

## References

- `go-inventory-chat/internal/pinoweb/hypercard_events.go`
- `go-inventory-chat/cmd/hypercard-inventory-server`
- `pinocchio/pkg/webchat/timeline_entity_v2.go`
