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
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Current inventory shell entrypoint and upcoming chat app-window integration point
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts
      Note: Current minimal chat state that must be replaced for SEM streaming
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Confirms app-window rendering support via renderAppWindow
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Inline widget rendering contract used by planned frontend integration
    - Path: 2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.ts
      Note: Defines dynamic card APIs and runtime behavior constraints
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Structured extractor and filtering behavior for widget event emission
    - Path: pinocchio/pkg/webchat/http/api.go
      Note: Canonical app-owned chat/ws/timeline HTTP handlers
ExternalSources:
    - local:webchat-hyper-integration.md
Summary: Validated implementation plan for hard-cutover webchat integration in the inventory app, with minimal intermediate mocking and explicit decision points.
LastUpdated: 2026-02-16T12:05:00-05:00
WhatFor: Align implementation sequencing with current code reality before coding starts.
WhenToUse: Use this as the source-of-truth plan before implementing backend/frontend integration work.
---


# Validated Analysis and Hard-Cutover Implementation Plan

## Executive Summary

This ticket will implement a real inventory chat integration by adding a Go backend under `2026-02-12--hypercard-react/go-inventory-chat`, then hard-cutting the inventory frontend from mock/fake chat behavior to backend-driven SEM streaming.

The imported document is directionally strong (Pinocchio WebChat transport + Geppetto tools + structured sink extraction + HyperCard chat window + artifact-to-card flow), but it requires updates to match this repository state and the requested hard-cutover constraint.

Most important validated decisions:

1. Keep one runtime path for inventory chat (real backend). Do not keep a parallel fake streaming path in inventory once cutover begins.
2. Use existing engine capabilities already present in the repo (`DesktopShell.renderAppWindow`, app windows, `ChatWindow` inline widgets, plugin runtime card navigation/param support).
3. Delay dynamic VM card code injection until after inventory chat + tools + widget + artifact-to-card flow is stable.

## Problem Statement

We need an end-to-end inventory assistant that:

1. Streams assistant output into the inventory app chat window over WebSocket.
2. Uses tools backed by SQLite inventory/sales data (seeded with mock content at first).
3. Emits structured widget artifacts from model output and renders them inline in chat.
4. Supports “Create card” from widget artifacts so chat outputs can become persistent/inspectable card windows.

The current inventory app has no real backend chat integration yet.

## Current State Validation (Against Repository)

### Verified accurate from imported document

1. Engine supports app-owned windows and card windows split.
2. Engine supports inline chat widgets (`ChatWindow` content blocks with custom widget renderer).
3. Plugin runtime already supports dynamic card mutation APIs (`defineCard`, `defineCardRender`, `defineCardHandler`).
4. Pinocchio webchat server composition pattern (`webchat.NewServer`, app-owned route mounting, `WithEventSinkWrapper`) is available and suitable.
5. Geppetto structured sink (`structuredsink.NewFilteringSink`) is available with extractor model and malformed policies.

### Corrections required for this workspace

1. Backend location:
- Imported doc proposes `pinocchio/cmd/hypercard-inventory-server`.
- Requested target is `2026-02-12--hypercard-react/`.
- Plan adjustment: build backend as a dedicated module under `2026-02-12--hypercard-react/go-inventory-chat`.

2. Existing inventory chat implementation is minimal and local-only:
- `apps/inventory/src/features/chat/chatSlice.ts` currently stores plain `ChatMessage[]` and has no streaming/event model.
- Inventory app does not yet mount a dedicated chat app window.

3. Existing engine fake streaming path exists but should not drive inventory after cutover:
- `packages/engine/src/chat/useChatStream.ts` is fake-stream based.
- Plan adjustment: inventory app must bypass/remove fake path from its flow once transport is integrated.

4. `go-inventory-chat` directory currently has data files and empty/internal scaffolding only; no backend runtime implementation is present.

## Hard-Cutover Constraints (Applied)

1. No dual long-lived chat stacks for inventory (fake + real).
2. Keep temporary compatibility shims to the minimum needed for migration safety.
3. Frontend reducers/contracts should move directly to SEM-based shape rather than adding another temporary intermediate model.
4. Prefer explicit event contracts and deterministic tests over fallback heuristics.

## Proposed Architecture

## Backend (Go) in `go-inventory-chat`

### Core

1. Build a small HTTP app with Pinocchio webchat core.
2. Mount app-owned routes:
- `POST /chat`
- `GET /ws`
- `GET /api/timeline`
- `GET /api/*` passthrough to `srv.APIHandler()` for debug parity
3. Use strict request resolver:
- `conv_id` required for websocket
- `conv_id` optional for chat (generate when missing)
- runtime key fixed to `inventory`
- ignore/deny runtime overrides in MVP

### Runtime composer

1. Compose engine from geppetto step settings.
2. System prompt inventory-specific and tool-first.
3. Allowed tools limited to inventory tool set (plus optional calculator).

### Data

1. SQLite DB with `items` and `sales` tables.
2. Seed command/script that mirrors frontend seed baseline fields.
3. Store package exposes migration + seed + query/update methods.

### Tools (initial set)

1. `inventory_search_items`
2. `inventory_get_item`
3. `inventory_low_stock`
4. `inventory_report`
5. `inventory_update_qty`
6. `inventory_record_sale`

### Structured widget extraction

1. Tag format: `<hypercard:Widget:v1> ... </hypercard:Widget:v1>`.
2. YAML payload parsed via extractor session.
3. Emit custom event type `hypercard.widget.v1`.
4. Register SEM mapping handler for websocket broadcast.
5. FilteringSink strips structured block from user-visible text automatically.

## Frontend (Inventory app)

### Transport + state

1. Add `pinocchioTransport.ts` for:
- conversation id persistence
- websocket connect/parse
- `/chat` post
- optional `/api/timeline` hydration
2. Replace inventory chat slice with SEM-driven reducer model:
- messages with streaming status
- content blocks (text + widget)
- action payload support
- conv/session metadata

### UI integration

1. Render chat as app-window via `DesktopShell.renderAppWindow`.
2. Auto-open one chat app-window on app start (deduped).
3. Use engine `ChatWindow` and custom `renderWidget`.

### Artifact-to-card flow

1. Add artifacts slice keyed by artifact id.
2. On `hypercard.widget.v1`, upsert artifact and attach widget block to latest assistant message.
3. On “Create card” action, open card window with template card id + `param=artifactId`.
4. Add template cards (`reportViewer`, `itemViewer`) to plugin bundle + stack card metadata.

## Event Contract (MVP)

### Inbound SEM frames consumed by frontend

1. `llm.start`
2. `llm.delta`
3. `llm.final`
4. `tool.start` / `tool.result` / `tool.done` (optional UI use in MVP)
5. `hypercard.widget.v1`
6. `timeline.upsert` (optional live reconciliation)

### Custom widget event payload shape (recommended)

```yaml
kind: report | item | table
title: string
artifact:
  id: optional-string
  data: map
ui: optional-map
actions:
  - label: "Create card"
    action:
      kind: "create_card"
      template: "reportViewer"
```

## Delivery Phases (Planning-Only)

### Phase 0: Decisions and contracts

1. Finalize model provider/runtime flags for local dev.
2. Freeze widget payload schema.
3. Freeze frontend reducer message schema.

### Phase 1: Backend skeleton + transport

1. Create module and server bootstrap.
2. Implement resolver + mux + run lifecycle.
3. Validate ws/chat/timeline endpoints with integration tests.

### Phase 2: SQLite store + tools

1. Migrations + seed.
2. Tool handlers + registration.
3. Runtime composer prompt with tool-use policy.

### Phase 3: Structured widgets

1. Extractor package and event types.
2. Sink wrapping via `WithEventSinkWrapper`.
3. SEM mapping registration for widget events.

### Phase 4: Frontend hard cutover

1. Add Vite proxy.
2. Add transport module.
3. Replace inventory chat slice + selectors.
4. App-window chat UI integration.

### Phase 5: Artifact-to-card

1. Artifacts domain state.
2. Plugin bundle template cards.
3. Chat action wiring to `openWindow` card instances.

### Phase 6: Hydration

1. Backend durable timeline DSN config.
2. Frontend timeline bootstrap + merge policy.

### Phase 7: Advanced dynamic card proposal (deferred)

1. `hypercard.plugin_card.v1` extractor and SEM mapping.
2. Review/accept/reject UI.
3. Dynamic card registry + runtime injection path.

## Test and Validation Plan

### Backend

1. Unit:
- request resolver behavior
- store migrations/queries
- tool input/output contracts
- widget extractor parse success/failure
2. Integration:
- websocket hello/ping
- chat prompt streaming (`llm.*`)
- widget block emits `hypercard.widget.v1`

### Frontend

1. Reducer tests for SEM event sequencing and widget attachment.
2. Transport parsing tests for SEM envelope.
3. App-window smoke test for chat mount + send + streamed render.
4. Artifact-to-card action test opens card with correct `param`.

## Risks and Mitigations

1. Tool contract drift between prompt and function signatures.
- Mitigation: keep tool names/types frozen and add tests on marshaling and model prompt examples.

2. Widget parsing brittleness in streaming partials.
- Mitigation: use structuredsink malformed policy + extractor-level parse controller and tests with fragmented tags.

3. Hard-cut regressions in inventory app UX.
- Mitigation: phase cutover with explicit acceptance checks before removing old flow references.

4. Timeline hydration race with live websocket events.
- Mitigation: deterministic merge policy (hydrate first, then apply buffered/live frames with id/version guards).

## Imported Document Validation Matrix

### Keep as-is

1. Webchat route model and app-owned handler pattern.
2. Structured sink + extractor approach.
3. Widget-first artifact flow before dynamic plugin injection.
4. Timeline hydration as a separate phase.

### Adjusted

1. Backend path moved to target worktree module.
2. Inventory frontend state shape updated based on current minimal chat slice.
3. Hard-cutover requirement emphasized (remove reliance on fake stream path for inventory).

### Deferred intentionally

1. Dynamic plugin card code injection proposal flow.
2. Engine change for unknown card id fallback bypass.

## Open Questions Requiring User Decisions

1. Preferred default model/runtime for dev in this ticket:
- OpenAI-compatible endpoint
- Ollama local
- another provider

2. Should the existing plugin `assistant` card remain visible after chat app-window cutover, or should it be removed to prevent duplicate assistant surfaces?

3. Timeline persistence default for MVP:
- enabled by default with local sqlite path
- opt-in via flag only

4. For “Create card”, should card windows be deduped per artifact id, or always open a new window instance?

## References

1. Imported source: `sources/local/webchat-hyper-integration.md`
2. Inventory app root: `apps/inventory/src/App.tsx`
3. Inventory chat slice (current): `apps/inventory/src/features/chat/chatSlice.ts`
4. Engine app-window support: `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
5. Engine chat widget support: `packages/engine/src/components/widgets/ChatWindow.tsx`
6. Plugin runtime dynamic APIs: `packages/engine/src/plugin-runtime/runtimeService.ts`
7. Webchat composition options: `pinocchio/pkg/webchat/router_options.go`
8. Webchat HTTP handlers: `pinocchio/pkg/webchat/http/api.go`
9. SEM registry: `pinocchio/pkg/sem/registry/registry.go`
10. Structured sink implementation: `geppetto/pkg/events/structuredsink/filtering_sink.go`
