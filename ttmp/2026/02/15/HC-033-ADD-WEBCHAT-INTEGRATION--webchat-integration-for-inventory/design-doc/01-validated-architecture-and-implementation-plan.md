---
Title: Validated Architecture and Implementation Plan
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - go
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: |-
        Current inventory app entrypoint and DesktopShell host.
        Desktop app-window chat integration entrypoint
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Host chat orchestration and artifact rendering
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/chat/cardInjector.ts
      Note: Card injection strategy and dedupe guard
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js
      Note: Existing plugin assistant card behavior and card set.
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Stack metadata and plugin capabilities that chat integration must respect.
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/app/server.go
      Note: Chat transport endpoints and streaming frame contract
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/chat/planner.go
      Note: Tool-backed response and artifact planning logic
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/internal/store/sqlite.go
      Note: SQLite schema and tool query implementation
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: App-window extension point via renderAppWindow.
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Target chat surface with inline widget support.
    - Path: 2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.ts
      Note: Injection and runtime validation APIs (defineCard/renderCard/eventCard).
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: |-
        Structured extraction model used by imported design.
        Reference extractor/tag model for future phase
    - Path: pinocchio/pkg/webchat
      Note: |-
        Reference implementation for chat+ws+timeline architecture.
        Reference architecture for chat transport and lifecycle
ExternalSources: []
Summary: Validates imported webchat design against current codebase, records corrected assumptions, and defines an exhaustive phased implementation plan for a working inventory chat backed by SQLite tools.
LastUpdated: 2026-02-16T10:18:00-05:00
WhatFor: Ground-truth architecture and execution plan for HC-033 implementation.
WhenToUse: Use before and during implementation to verify assumptions and sequencing.
---


# Validated Architecture and Implementation Plan

## Executive Summary
The imported document is directionally strong and maps closely to existing architecture in all three repositories (HyperCard, Pinocchio, Geppetto). It correctly identifies the key leverage points: `DesktopShell` app windows, `ChatWindow` inline widgets, and QuickJS runtime card injection (`defineCard`, `defineCardRender`, `defineCardHandler`).

The largest gaps are practical and scope-related:

1. `2026-02-12--hypercard-react` currently has no Go backend.
2. The inventory app currently has only a VM-local assistant (no real backend/tools/sqlite).
3. The documented Pinocchio/Geppetto end-to-end flow is larger than needed for an initial working deliverable in this worktree.

The implementation will therefore use a staged approach:

1. Build a working Go backend inside `2026-02-12--hypercard-react` with SQLite-backed inventory tools and WS token streaming.
2. Integrate an app-owned chat window in inventory using existing `ChatWindow`.
3. Support inline widgets and card proposals in chat.
4. Support card injection into the HyperCard runtime (host metadata + plugin code patch).
5. Add scripts to initialize/populate mock SQLite data.

This keeps the final shape compatible with later Pinocchio/Geppetto integration while delivering the requested working inventory chat now.

## Problem Statement
We need a working inventory chat in the `2026-02-12--hypercard-react` worktree where:

1. Chat responses are grounded by tool calls over SQLite mock data.
2. Chat is presented as a first-class desktop window.
3. Responses can include rich inline widgets.
4. Chat can propose and create new plugin cards in the runtime.
5. The workflow and decisions are fully documented in the ticket with a detailed diary and task decomposition.

Without this integration, the current inventory assistant remains a local deterministic function inside the plugin VM and cannot query external or persistent data.

## Proposed Solution
### 1) Backend: New Go inventory-chat service in `2026-02-12--hypercard-react`

Implement a self-contained Go service that:

1. Opens/initializes a SQLite database.
2. Exposes tool-like query functions (`low_stock`, `inventory_value`, `sales_summary`, `item_lookup`).
3. Accepts chat completion requests (`POST /api/chat/completions`).
4. Streams responses over WebSocket (`GET /ws?...`) with token events.
5. Emits structured artifacts in the same stream (widget proposals, card proposals).
6. Includes a seeding pathway for mock data.

### 2) Frontend: App-owned chat window in Inventory Desktop

Integrate `ChatWindow` as a `DesktopShell` app window via `renderAppWindow`, with:

1. Conversation lifecycle and WS stream handling.
2. Inline widget rendering (`data-table`, `report-view`).
3. Action handlers for:
   - opening existing inventory plugin cards
   - creating new cards from proposals.

### 3) Card creation pipeline in frontend host

Implement a `CardInjector` utility that:

1. Adds `CardDefinition` metadata to `stack.cards`.
2. Appends `defineCard(...)` patch text into `stack.plugin.bundleCode`.
3. Opens the new card window.
4. Tracks dedupe IDs to prevent duplicate injection.

### 4) SQLite mock-data scripts

Add repeatable scripts/commands for:

1. schema creation,
2. mock data insertion/reset,
3. optional local verification queries.

## Design Decisions
### Imported-document validation findings

#### Verified as correct

1. HyperCard architecture split (host layer vs VM runtime).
2. `DesktopShell` supports app windows (`content.kind = 'app'`) and custom render via `renderAppWindow`.
3. QuickJS runtime supports `defineCard`, `defineCardRender`, and `defineCardHandler`.
4. Injection requires both host card metadata and VM registration.
5. Pinocchio webchat owns `/chat` and `/ws` transport patterns.
6. Geppetto `structuredsink.FilteringSink` supports streaming extraction via `<pkg:type:ver>` tags.

#### Correct but needs precision updates

1. UI table shape:
   - Imported examples show keyed row objects in VM DSL.
   - Actual current VM API is `ui.table(rows, { headers })` with `rows` as arrays.
2. System commands:
   - Imported design mentions `nav.go/nav.back/notify/window.close`.
   - Current inventory stack capabilities only grant `nav.go/nav.back/notify`; `window.close` is supported in routing but not currently granted in inventory capabilities.
3. Engine chat API:
   - Current `useChatStream` is still mock-stream based; real streaming must be wired in app code.

#### Out-of-scope for this MVP (but architecturally compatible)

1. Full Pinocchio+Geppetto runtime composer and structured sink integration inside this worktree.
2. Full Pinocchio taxonomy parity and Watermill/EventTranslator interop (baseline SEM + timeline hydration is implemented in this ticket).
3. Per-card capability policy extension in engine runtime.

### Implementation decisions for HC-033

1. Use a minimal dedicated Go backend in this worktree now.
Reason: Delivers working chat+tools quickly without cross-repo coupling.

2. Preserve compatibility with future Pinocchio/Geppetto migration.
Reason: Event shapes and separation of concerns are designed to map forward.

3. Keep injection approval explicit from UI action.
Reason: Avoid silent runtime mutation and align with safe proposal/apply pattern.

4. Use deterministic rule-based orchestration over SQLite as first backend behavior.
Reason: Guarantees stable local behavior independent of external model credentials while still satisfying "tools querying sqlite db".

## Alternatives Considered
### Alternative A: Full Pinocchio+Geppetto embed immediately
Rejected for MVP due to large integration surface, many moving parts, and higher risk to delivery speed in this turn.

### Alternative B: Keep assistant entirely in VM plugin card
Rejected because plugin VM cannot directly own backend/sqlite access and this does not meet the “tools querying sqlite db” goal.

### Alternative C: Synchronous REST-only assistant (no WS)
Rejected because current ecosystem and imported design both assume streaming UX and WS transport; streaming is part of desired behavior.

## Implementation Plan
### Phase 0: Ticket documentation baseline

1. Import source document into ticket.
2. Write validated analysis + architecture plan (this document).
3. Create running diary document with strict step format.
4. Create execution-notes/experiments reference.
5. Expand `tasks.md` into granular implementation checklist.

### Phase 1: Go backend skeleton

1. Create `go-inventory-chat/` module in `2026-02-12--hypercard-react`.
2. Add command entrypoint with `serve` and `seed` subcommands.
3. Add HTTP router:
   - `POST /api/chat/completions`
   - `GET /ws`
   - optional health endpoint.
4. Add CORS/origin handling suitable for Vite dev.

### Phase 2: SQLite schema + tool layer (with immediate validation)

1. Add schema for items and sales.
2. Add idempotent migration/ensure logic.
3. Add seed data loader matching inventory domain semantics.
4. Add query/tool functions:
   - low stock report
   - inventory valuation
   - sales summary
   - item lookup/search.
5. Interleaved validation after each sub-step:
   - run seed/reset command,
   - run `GOWORK=off go test ./...`,
   - run targeted query smoke requests.

### Phase 3: Response planner + SEM streaming payload model (with immediate validation)

1. Add message planner that maps user intents to tool calls.
2. Add artifact model:
   - widget artifact
   - card proposal artifact.
3. Emit SEM token/artifact/done events with typed names and monotonic sequence IDs.
4. Project conversation timeline while streaming (message status transitions, artifact/action accumulation).
5. Interleaved validation after each sub-step:
   - WS smoke run (SEM event classes),
   - timeline hydration check (`/api/timeline`),
   - `gofmt` + `go test` rerun.

### Phase 4: Frontend app-window chat integration (with immediate validation)

1. Add `InventoryChatAssistantWindow` component.
2. Pre-open chat app window on desktop startup.
3. Implement completion request + WS SEM stream client.
4. Implement timeline hydration call on startup.
5. Render streaming text into `ChatWindow`.
6. Render inline widgets via `renderWidget`.
7. Handle action clicks (open card, create card).
8. Interleaved validation after each sub-step:
   - run `npm exec -w apps/inventory tsc -b`,
   - verify hydrated transcript in browser,
   - verify live stream for a fresh user query.

### Phase 5: Card injection and runtime mutation safety (with immediate validation)

1. Implement `CardInjector` utility.
2. Enforce proposal-id/card-id dedupe.
3. Append patch code to bundle and register card metadata.
4. Rehydrate proposal cache from timeline artifacts so `create-card` works after reload.
5. Open injected card window.
6. Emit system messages in chat timeline for apply results/failures.
7. Interleaved validation after each sub-step:
   - create-card happy path,
   - duplicate proposal apply path,
   - missing/invalid proposal path.

### Phase 6: Tooling scripts, continuous validation, and packaging

1. Add seed/reset scripts for backend SQLite db.
2. Add smoke scripts in ticket `scripts/` for API/WS/timeline validation.
3. Keep validation interleaved while building:
   - backend tests after backend changes,
   - frontend typecheck after frontend changes,
   - tmux E2E smoke after protocol or action-handler changes.
4. Run production build and resolve packaging blockers.
5. Record failures/fixes in diary and execution notes as they happen.

### Phase 7: Ticket closure artifacts and upload

1. Finalize diary entries with exact commands/errors.
2. Update changelog and task status.
3. Relate key files via `docmgr doc relate`.
4. Upload ticket docs bundle to reMarkable under dated ticket folder.

### Phase 8: SEM Projection and Timeline Hydration (Implemented)

1. Add SEM envelope emission (`sem: true`) with typed event names and monotonic sequence IDs.
2. Add per-conversation timeline projection buffer/store.
3. Add hydration endpoint (`/api/timeline`) for reconnect and UI reconstitution.
4. Add frontend timeline hydration on startup and SEM-only stream parsing.
5. Remaining follow-up: align envelope/event naming and payload schema to full Pinocchio `semregistry` conventions.

## Open Questions
1. Should injected cards be persisted immediately in backend storage, or remain runtime-only for MVP?
2. Should the app hide the legacy plugin `assistant` card once app-window chat is enabled, or keep both?
3. Preferred default backend port and base URL contract for team workflows.

## References
1. `sources/local/webchat-hyper-integration.md` (imported source document).
2. `reference/01-diary.md` (step-by-step implementation log).
3. `reference/02-execution-notes-and-experiments.md` (commands and experiments).
