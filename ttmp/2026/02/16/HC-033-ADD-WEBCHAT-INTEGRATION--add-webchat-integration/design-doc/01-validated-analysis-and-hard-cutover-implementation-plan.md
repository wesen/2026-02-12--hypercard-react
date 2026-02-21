---
Title: Validated Analysis and Hard-Cutover Implementation Plan
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - frontend
    - inventory
    - sqlite
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: pinocchio/cmd/web-chat/main.go
      Note: Glazed + Pinocchio reference command to mirror for backend composition
    - Path: glazed/pkg/doc/tutorials/05-build-first-command.md
      Note: Required Glazed command-authoring pattern reference
    - Path: pinocchio/pkg/webchat/router.go
      Note: Core server/router wiring including runtime composer and sink wrapper hooks
    - Path: pinocchio/pkg/webchat/http/api.go
      Note: App-owned chat/ws/timeline HTTP handlers and request resolver contract
    - Path: pinocchio/cmd/web-chat/profile_policy.go
      Note: Conv-id/runtime/override policy reference for app-owned resolver behavior
    - Path: geppetto/pkg/inference/middleware/middleware.go
      Note: Middleware chain model used for artifact/card generation logic
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Structured extractor and filtering behavior for widget/card event emission
    - Path: pinocchio/pkg/sem/registry/registry.go
      Note: Registry used to map custom events into SEM frames for frontend
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Current inventory shell entrypoint and upcoming chat app-window integration point
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Current minimal chat state that must be replaced for SEM streaming
ExternalSources:
    - local:webchat-hyper-integration.md
Summary: Validated and updated implementation plan using Glazed command composition, Pinocchio webchat reuse, and middleware-driven artifact/card generation under hard-cutover constraints.
LastUpdated: 2026-02-16T13:22:00-05:00
WhatFor: Align implementation sequencing with latest architectural constraints before coding starts.
WhenToUse: Use this as the source-of-truth plan before implementing backend/frontend integration work.
---

# Validated Analysis and Hard-Cutover Implementation Plan

## Executive Summary

Core design is unchanged at the architecture level, but changed at the composition level.

1. Architecture stays the same:
- Pinocchio webchat transport (`/chat`, `/ws`, `/api/timeline`) drives the backend.
- Inventory frontend consumes SEM websocket frames and renders chat/widgets/cards.

2. Composition changes now locked:
- Backend command is built with Glazed in the same style as `pinocchio/cmd/web-chat/main.go`.
- Artifact and card generation logic is implemented as Geppetto middleware behavior.
- Timeline and turn persistence are owned by Pinocchio stores (`timeline-*` and `turns-*` settings), not custom persistence code.

3. Hard-cutover remains strict:
- Inventory app cuts to one real backend flow.
- Keep temporary mocks/intermediate constructs minimal and short-lived.

## Problem Statement

We need an end-to-end inventory assistant that:

1. Streams assistant output into inventory chat over websocket.
2. Calls SQLite-backed inventory tools.
3. Produces structured artifacts and card proposals from assistant/tool outcomes.
4. Renders widgets in chat and opens card windows from those artifacts.
5. Persists timeline and turn history through Pinocchio persistence primitives.

## Non-Negotiable Constraints

1. Use Glazed for server configuration and command wiring.
2. Reuse `pinocchio/pkg/webchat` as much as possible.
3. Do artifact/card generation through Geppetto middlewares.
4. Use Pinocchio timeline/turn persistence paths.
5. Hard cutover with minimum mock/intermediate code.

## Locked Decisions (2026-02-16)

1. No fallback artifact/card synthesis.
- If model-authored structured blocks are missing or invalid, backend emits explicit error lifecycle events.
- Backend does not fabricate `ready` widget/card events from tool outputs.

2. Progressive lifecycle events are required.
- Widget and card proposal extractors emit progressive events during YAML growth.

3. `*.start` emission is title-gated.
- `hypercard.widget.start` and `hypercard.card.start` are emitted only after the extractor can parse a non-empty `title`.

## Current State Validation (Code-Backed)

### Confirmed available and reusable

1. Glazed command pattern exists and is production-ready (`pinocchio/cmd/web-chat/main.go`).
2. Pinocchio app-owned handler model exists:
- `webchat.NewServer(...)`
- `webhttp.NewChatHandler(...)`
- `webhttp.NewWSHandler(...)`
- `webhttp.NewTimelineHandler(...)`
3. Runtime composition hooks exist:
- `webchat.WithRuntimeComposer(...)`
- `webchat.WithEventSinkWrapper(...)`
4. Persistence hooks already integrated in router settings (`timeline-dsn`, `timeline-db`, `turns-dsn`, `turns-db`) in `pinocchio/pkg/webchat/router.go`.
5. Geppetto middleware chain supports pre/post turn mutation and generation logic.
6. Structured sink can emit typed events while stripping structured blocks from visible chat text.

### Gaps to implement in this ticket

1. Inventory backend executable under `2026-02-12--hypercard-react/go-inventory-chat`.
2. Inventory-specific runtime composer and strict resolver policy.
3. Inventory tools and SQLite repository/seed pipeline.
4. Artifact/card middleware package(s) and custom extractors/events.
5. Inventory frontend transport + SEM reducer + widget/card actions.

## Target Backend Design (`go-inventory-chat`)

### 1) Command/bootstrap (Glazed-first)

Implement `cmd/hypercard-inventory-server/main.go` with the same pattern as Pinocchio web-chat:

1. `cobra.Command` root + logging init.
2. `clay.InitGlazed(...)`.
3. Glazed command description with strongly typed flags.
4. Geppetto section wiring for model/provider settings.
5. `RunIntoWriter(ctx, parsed, w)` composition entrypoint.

### 2) Server construction (Pinocchio reuse-first)

Use `webchat.NewServer(...)` and mount app-owned routes only:

1. `POST /chat` -> `webhttp.NewChatHandler(...)`
2. `GET /ws` -> `webhttp.NewWSHandler(...)`
3. `GET /api/timeline` -> `webhttp.NewTimelineHandler(...)`
4. `GET /api/*` -> `srv.APIHandler()`
5. `GET /` optional UI/static depending on run mode

No custom websocket broker, no custom timeline subsystem, no custom router fork.

### 3) Request resolver policy (strict)

Resolver behavior:

1. Websocket requires `conv_id`.
2. Chat accepts missing `conv_id` and generates UUID.
3. Runtime key fixed to `inventory` for MVP.
4. Request overrides are denied by default for hard-cutover consistency.
5. Optional override mode can be added later behind explicit flag.

### 4) Runtime composer

Runtime composer implementation mirrors Pinocchio reference style:

1. Build engine from Geppetto step settings parsed from Glazed values.
2. Register middleware factories map.
3. Register tool factories map.
4. Restrict allowed tools to inventory tool set.
5. Seed inventory-specific system prompt.

### 5) Middleware-driven artifact/card generation

Artifact/card workflow is owned by middleware + structured sink extraction.

Planned middleware chain:

1. `inventory_artifact_policy` middleware.
- Ensures model instructions for structured output contract are always present.
- Injects stable tag schemas and action semantics.

2. `inventory_artifact_generator` middleware.
- Handles artifact/card orchestration metadata only.
- Does not synthesize missing structured blocks (no fallback policy).
- Validation and progressive event emission come from extractors attached to event sink.

3. Existing standard middleware from runtime composer remains:
- tool result reorder
- system prompt middleware
- optional logging middleware

### 6) Structured extraction + SEM mapping

1. Wrap sink via `webchat.WithEventSinkWrapper(...)`.
2. Use `structuredsink.NewFilteringSink(...)` with custom extractors for:
- `hypercard/widget/v1`
- `hypercard/cardproposal/v1`
3. Extractors emit progressive custom Geppetto events (`start`, `update`, `ready`, `error`).
4. `start` events are emitted only once title is available from parsed YAML snapshots.
5. Register SEM translation handlers in Pinocchio SEM registry for:
- Widget lifecycle:
  - `hypercard.widget.start`
  - `hypercard.widget.update`
  - `hypercard.widget.v1` (ready/final)
  - `hypercard.widget.error`
- Card lifecycle:
  - `hypercard.card.start`
  - `hypercard.card.update`
  - `hypercard.card_proposal.v1` (ready/final)
  - `hypercard.card.error`

### 7) Persistence through Pinocchio

No custom timeline/turn persistence implementation in this ticket.

Use router-native persistence settings:

1. `timeline-dsn` / `timeline-db`
2. `turns-dsn` / `turns-db`

This enables:

1. durable timeline snapshots (`/api/timeline`)
2. durable turn snapshots in turn store

## Target Data/Tools Design

### SQLite domain

1. Tables: `items`, `sales`.
2. Seed scripts provide deterministic mock inventory data.
3. Seed/reset script is repeatable and idempotent for local dev/testing.

### Inventory tools (MVP)

1. `inventory_search_items`
2. `inventory_get_item`
3. `inventory_low_stock`
4. `inventory_report`
5. `inventory_update_qty`
6. `inventory_record_sale`

## Target Frontend Design (Inventory App)

### Transport/state

1. Replace local-only mock path with Pinocchio transport module.
2. Manage `conv_id` persistence in app state/local storage.
3. Consume SEM envelopes from websocket.
4. Update chat reducer to streaming SEM model (`llm.start/delta/final`, widget/card lifecycle events, timeline upserts).

### UI integration

1. Render inventory chat via app-window (`DesktopShell.renderAppWindow`).
2. Use `ChatWindow` with custom widget renderer.
3. Auto-open one chat window at startup with dedupe key.

### Artifact/card flow

1. On `hypercard.widget.v1`, upsert artifact and attach widget content block.
2. On `hypercard.card_proposal.v1`, expose card creation actions.
3. Card open action dispatches `openWindow` with card template and `artifactId` param.

## Event Contract (MVP)

### Inbound SEM frames consumed by frontend

1. `llm.start`
2. `llm.delta`
3. `llm.final`
4. `tool.start`
5. `tool.result`
6. `tool.done`
7. `hypercard.widget.start` (title-gated)
8. `hypercard.widget.update`
9. `hypercard.widget.v1` (ready/final)
10. `hypercard.widget.error`
11. `hypercard.card.start` (title-gated)
12. `hypercard.card.update`
13. `hypercard.card_proposal.v1` (ready/final)
14. `hypercard.card.error`
15. `timeline.upsert`

### Progressive event semantics

1. `*.start`
- Emitted once the extractor can parse a valid non-empty title.
- Used by UI to show spinner/progress row with stable item id.

2. `*.update`
- Emitted on debounced successful YAML snapshots during stream.
- Used to update title/preview/progress details.

3. `*.v1` / `*.card_proposal.v1`
- Final success event with canonical payload consumed by widget/card renderer/actions.

4. `*.error`
- Emitted on malformed or failed final parse (`success=false`).
- No fallback conversion to a success payload.

### Structured payloads (recommended)

```yaml
# Widget
type: report | item | table
title: string
artifact:
  id: string
  data: map
actions:
  - label: string
    action:
      kind: create_card
      template: string
```

```yaml
# Card Proposal
template: reportViewer | itemViewer
title: string
artifact:
  id: string
  data: map
window:
  dedupe_key: optional-string
```

## Timeline Projection Plan (HC-033 additions)

Projection mechanism remains Pinocchio-native (`TimelineProjector.ApplySemFrame` + `RegisterTimelineHandler`).

Custom timeline handlers to add:

1. `hypercard.widget.start`
- Upsert `status` entity (info) keyed by extractor item id for spinner state.

2. `hypercard.widget.update`
- Upsert same `status` entity with latest title/progress text.

3. `hypercard.widget.v1`
- Upsert `tool_result` entity with `custom_kind = "hypercard.widget.v1"` and structured payload.

4. `hypercard.widget.error`
- Upsert `status` entity with `type = error`.

5. `hypercard.card.start`
- Upsert `status` entity (info) keyed by extractor item id.

6. `hypercard.card.update`
- Upsert status progression entity.

7. `hypercard.card_proposal.v1`
- Upsert `tool_result` entity with `custom_kind = "hypercard.card_proposal.v1"`.

8. `hypercard.card.error`
- Upsert `status` entity with `type = error`.

## Updated Delivery Phases (Planning-Only)

### Phase 0: Freeze contracts

1. Freeze middleware responsibilities and ordering.
2. Freeze structured tag/payload schemas.
3. Freeze frontend SEM reducer shape.

### Phase 1: Glazed command + Pinocchio server

1. Scaffold backend module and command.
2. Add resolver/runtime composer.
3. Mount app-owned handlers and verify transport tests.

### Phase 2: SQLite + inventory tools

1. Migrations and seed pipeline.
2. Tool registration and contract tests.
3. Runtime allowed-tools restrictions.

### Phase 2.5: Early frontend cutover for round-trip validation

1. Cut inventory frontend to real backend transport for minimal chat only (no artifacts yet).
2. Support streaming `llm.start` / `llm.delta` / `llm.final` and basic `tool.*` visibility.
3. Remove active inventory reliance on fake stream path at this checkpoint.
4. Validate round-trip flow end-to-end (`UI -> /chat -> /ws -> streamed assistant text`).
5. Keep artifact/card UI disabled until later phases.

### Phase 3: Middleware artifact/card generation

1. Implement artifact policy middleware.
2. Implement artifact/card generator middleware.
3. Add middleware unit tests for generation and determinism.

### Phase 4: Structured extraction + SEM mappings

1. Add custom extractors and event types.
2. Add sink wrapper integration.
3. Register custom SEM handlers and websocket integration tests.

### Phase 5: Frontend artifact-aware expansion

1. Extend already-cut-over frontend reducer/UI to widget/card lifecycle events.
2. Add spinner/progressive UI driven by title-gated `*.start` and `*.update`.
3. Wire final artifact/card actions and renderer integration.

### Phase 6: Artifact-to-card UX and hydration

1. Add artifact/card slices and actions.
2. Add card template wiring.
3. Add timeline hydration merge policy and tests.

## Risks and Mitigations

1. Middleware-generated artifacts diverge from UI schema.
- Mitigation: single canonical schema package + contract tests.

2. Model/provider drift affects structured output quality.
- Mitigation: strict schema instructions + extractor parse validation + explicit `*.error` events (no fallback synthesis).

3. Event ordering issues between live stream and timeline hydration.
- Mitigation: version/id based merge policy and replay tests.

4. Hard cutover introduces UX regressions.
- Mitigation: explicit acceptance checklist before removing fake path.

## Resolved Decisions

1. Runtime overrides remain fully disabled in MVP.
2. Card open behavior defaults to dedupe per artifact.
3. Existing plugin assistant surface is removed as the primary cutover path (one assistant surface).
4. `hypercard.widget.v1` schema is frozen for MVP.
5. `hypercard.card_proposal.v1` schema is frozen for MVP.

## References

1. Imported source: `sources/local/webchat-hyper-integration.md`
2. Glazed tutorial reference: `glazed/pkg/doc/tutorials/05-build-first-command.md`
3. Pinocchio command reference: `pinocchio/cmd/web-chat/main.go`
4. Pinocchio router/runtime/persistence: `pinocchio/pkg/webchat/router.go`
5. Pinocchio app-owned HTTP handlers: `pinocchio/pkg/webchat/http/api.go`
6. Geppetto middleware contract: `geppetto/pkg/inference/middleware/middleware.go`
7. Structured sink: `geppetto/pkg/events/structuredsink/filtering_sink.go`
8. SEM handler registry: `pinocchio/pkg/sem/registry/registry.go`
