---
Title: Stacks and Cards Persistence Architecture Analysis
Ticket: HC-035-PERSIST-CARDS-STACKS
Status: active
Topics:
    - architecture
    - frontend
    - backend
    - dsl
    - sqlite
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go
      Note: Reference timeline versioned SQLite persistence semantics
    - Path: apps/inventory/src/domain/pluginBundle.vm.js
      Note: Current plugin card logic and initial state model
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Hydration-before-live pattern for timeline snapshots
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/main.go
      Note: Backend route and persistence option wiring
    - Path: packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx
      Note: Runtime session lifecycle and bundle load path
    - Path: packages/engine/src/plugin-runtime/runtimeService.ts
      Note: QuickJS runtime API including defineCard/defineCardRender/defineCardHandler
    - Path: packages/engine/src/plugin-runtime/stack-bootstrap.vm.js
      Note: VM host bridge and runtime mutation entry points
ExternalSources: []
Summary: Deep architecture analysis and implementation design for durable stack/card persistence, runtime JS injection, hydration/loading, and code/data versioning across HyperCard frontend and Go backend.
LastUpdated: 2026-02-16T22:35:00-05:00
WhatFor: Provide an implementation-grade blueprint for adding persistence of stacks and cards (including runtime code injection) without regressing current QuickJS runtime behavior.
WhenToUse: Use when implementing or reviewing persistence, hydration, and versioning work for stack/card runtime state and injected card code.
---


# Stacks and Cards Persistence Architecture Analysis

## Executive Summary

The current codebase has a strong plugin runtime core but does not yet persist stack/card runtime state as a first-class feature. Frontend runtime behavior is solid and explicit in `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx` and `packages/engine/src/plugin-runtime/runtimeService.ts`: stack bundles load into QuickJS, render/event cycles work, and runtime mutation APIs (`defineCard`, `defineCardRender`, `defineCardHandler`) exist. However, this state is ephemeral and tied to process lifetime.

The backend in `go-inventory-chat` already demonstrates production-grade persistence patterns for related concerns: SQLite-backed timeline projection (`pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go`) and turn snapshots (`pinocchio/pkg/persistence/chatstore/turn_store_sqlite.go`) with migration logic and monotonic versions. This is the right persistence substrate to extend for stack/card persistence.

The central design recommendation is to split persistence into two independently versioned planes: code plane (stack/card code revisions, patch history, runtime-injected JS) and data plane (session/card state, window/nav/session layout state, optional domain snapshots). Hydration should load a consistent snapshot across both planes, then attach live streams. Runtime injection should become a validated, versioned operation persisted as immutable patches, not ad-hoc `bundleCode += ...` string concatenation.

## Problem Statement

Today, stack and card behavior is runtime-capable but not durable:

- Stack and card definitions are loaded from static files (`apps/*/src/domain/stack.ts`, `apps/*/src/domain/pluginBundle.vm.js`) and are not persisted dynamically.
- Runtime-injected card code exists as an API and a Storybook demo pattern (`packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx`) but is not wired to app/runtime/backend persistence.
- Session/card state in `pluginCardRuntime` and navigation/window state in `windowing` are Redux-only and lost on reload.
- There is no code/data compatibility model for evolved card code against previously persisted card data.

At the same time, the webchat path already has durable hydration patterns:

- `GET /api/timeline?conv_id=...` snapshot + `version` + `serverTimeMs` is available and consumed (`apps/inventory/src/features/chat/webchatClient.ts`, `apps/inventory/src/features/chat/InventoryChatWindow.tsx`).
- Turn snapshots are durable when `--turns-dsn`/`--turns-db` is configured (`go-inventory-chat/cmd/hypercard-inventory-server/main.go`).

The challenge is to bring stack/card persistence up to the same operational quality level as timeline/turn persistence, while preserving QuickJS isolation and capability boundaries.

## Current Architecture (What Exists Today)

### Frontend Runtime and State Topology

`DesktopShell` opens windows and per-window sessions (`packages/engine/src/components/shell/windowing/DesktopShell.tsx`). For plugin windows, `PluginCardSessionHost` does the heavy lifting:

1. Register Redux runtime session (`registerRuntimeSession`).
2. Load stack bundle into QuickJS (`loadStackBundle`).
3. Apply `initialSessionState` and `initialCardState` from bundle metadata.
4. Render card via VM (`renderCard`).
5. Dispatch event handlers to VM (`eventCard`) and route returned intents.

Relevant symbols:

- `PluginCardSessionHost` in `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- `QuickJSCardRuntimeService` in `packages/engine/src/plugin-runtime/runtimeService.ts`
- `pluginCardRuntimeSlice` in `packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
- `windowingSlice` in `packages/engine/src/features/windowing/windowingSlice.ts`

Architecture sketch:

```text
DesktopShell
  -> WindowLayer
     -> PluginCardSessionHost(sessionId, cardId)
        -> QuickJSCardRuntimeService.loadStackBundle(stack.plugin.bundleCode)
        -> VM __stackHost.getMeta() -> initialSessionState/initialCardState
        -> dispatchRuntimeIntent(...) -> pluginCardRuntime + domain/system actions
        -> renderCard/eventCard loop
```

Important observation: this loop is deterministic and composable, but state durability is external to it and currently absent.

### Runtime JS Injection Capability (Present but Not Productized)

The VM supports live mutation:

- `defineCard(sessionId, cardId, code)`
- `defineCardRender(sessionId, cardId, code)`
- `defineCardHandler(sessionId, cardId, handler, code)`

(see `packages/engine/src/plugin-runtime/runtimeService.ts` and `packages/engine/src/plugin-runtime/stack-bootstrap.vm.js`)

However, app runtime does not currently expose a production path using these APIs. The explicit implementation exists in Storybook only:

- `packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx`

The story injects by mutating in-memory stack metadata and appending a `defineCard(...)` call string to `stack.plugin.bundleCode`. That proves feasibility but is not durable, auditable, or concurrency-safe.

### Backend Persistence Capabilities Already in Place

The Go backend provides strong patterns we should reuse:

- Router-level timeline store selection from flags (`timeline-dsn` / `timeline-db` / in-memory fallback): `pinocchio/pkg/webchat/router.go`
- Timeline snapshot API with incremental support (`since_version`): `pinocchio/pkg/webchat/http/api.go`
- SQLite timeline store with per-conversation monotonic `version`: `pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go`
- Turn store with migration/backfill and normalized block storage: `pinocchio/pkg/persistence/chatstore/turn_store_sqlite.go`

The `go-inventory-chat` command already wires this in:

- `go-inventory-chat/cmd/hypercard-inventory-server/main.go`

This is the strongest signal for implementation approach: stack/card persistence should follow the same composition model (router-level option + service + store) and the same operational guarantees (SQLite WAL, schema migrations, monotonic versions, explicit snapshot APIs).

### Hydration Pattern Already Proved for Chat

`InventoryChatWindow` currently bootstraps by fetching timeline snapshot before opening websocket:

- `fetchTimelineSnapshot(...)` in `apps/inventory/src/features/chat/webchatClient.ts`
- `hydrateFromTimelineSnapshot(...)` in `apps/inventory/src/features/chat/InventoryChatWindow.tsx`

Flow sketch:

```text
mount chat window
  -> GET /api/timeline?conv_id=...
  -> replay entities into Redux (messages, timeline items, artifacts)
  -> connect /ws?conv_id=...
  -> merge live frames by id
```

This is the exact loading/hydration shape we want for stack/card runtime too.

## Gaps and Constraints

### Functional Gaps

1. No persisted stack code revisions or patch log for runtime card injections.
2. No persisted `pluginCardRuntime.sessions[*].sessionState` / `cardState`.
3. No persisted `windowing.windows` and `windowing.sessions.nav` for workspace restore.
4. No compatibility contract between persisted card data and newer card code.
5. No backend API surface for stack snapshot load/save/inject operations.

### Architectural Constraints

1. Runtime sandbox safety must remain in QuickJS boundary (`runtimeService.ts` timeouts/memory limits).
2. Capability policy must remain enforced (`capabilityPolicy.ts`, `pluginIntentRouting.ts`).
3. Backend request policy is strict (runtime overrides rejected in `go-inventory-chat/internal/pinoweb/request_resolver.go`), so new persistence APIs should preserve this style.
4. Existing timeline/turn persistence ownership should remain in Pinocchio primitives, not duplicated ad hoc.

## Proposed Solution

## 1) Persistence Domain Model

Separate into four bounded records:

1. Stack code state
- Base bundle + immutable patch events (define card/render/handler).
- Revisioned and hash-addressed.

2. Runtime session state
- Session state and per-card state keyed by `session_id`.
- Versioned snapshots, independent from code revisions.

3. Workspace/window state
- Open windows, z-order, bounds, focused window, nav stacks.
- Enables real workspace restore.

4. Domain data state (optional projection)
- Inventory/sales/artifacts/chat are already persisted partially via backend stores.
- Keep domain persistence separated from runtime code persistence to avoid coupling.

### Data model diagram

```text
stack_definition (stack_id, active_revision_id)
  1 -> N stack_revision (revision_id, stack_id, parent_revision_id, base_bundle_hash, code_version)
          1 -> N stack_patch (patch_id, revision_id, op_type, target_card_id, target_handler, code_blob, code_hash)

workspace_session (workspace_id, stack_id, session_id, revision_id, created_at, updated_at)
  1 -> 1 session_state_snapshot (workspace_id, session_id, data_version, session_state_json)
  1 -> N card_state_snapshot (workspace_id, session_id, card_id, data_version, card_state_json)

workspace_window (workspace_id, window_id, session_id, bounds, z, focused, nav_json)
```

## 2) Backend APIs

Add explicit stack persistence endpoints in `go-inventory-chat` (or mounted through Pinocchio router extension):

- `GET /api/stacks/:stack_id/snapshot?workspace_id=...`
- `POST /api/stacks/:stack_id/injections`
- `POST /api/workspaces/:workspace_id/session-state`
- `POST /api/workspaces/:workspace_id/window-state`

Response for stack snapshot should include:

- `stackId`
- `activeRevision`
- `bundle.baseCode`
- `bundle.patches[]`
- `workspace.sessions[]` (session + card states)
- `workspace.windows[]`
- `codeVersion` and `dataVersion`

Pseudo-contract:

```json
{
  "stackId": "inventory",
  "activeRevision": "rev_20260216_001",
  "bundle": {
    "baseCode": "defineStackBundle(...)",
    "patches": [
      {
        "patchId": "p_001",
        "op": "defineCard",
        "cardId": "detailedReport",
        "code": "({ ui }) => ({ ... })",
        "codeHash": "sha256:...",
        "appliedAtMs": "1771300000000"
      }
    ]
  },
  "workspace": {
    "workspaceId": "ws_abc",
    "sessions": [...],
    "windows": [...]
  },
  "codeVersion": "42",
  "dataVersion": "17"
}
```

## 3) Runtime Injection Pipeline (Productized)

Current production path from chat does not include JS card code injection; it only handles structured widget/card proposal data in `go-inventory-chat/internal/pinoweb/hypercard_extractors.go` and frontend `artifactRuntime.ts`.

Recommended runtime injection pipeline:

1. Generate candidate card code (new structured event type, e.g. `hypercard.code_patch.v1`).
2. Validate syntax and contract server-side (and optionally preflight in isolated QuickJS).
3. Persist immutable patch with `code_hash` and parent revision.
4. Return patch ack + updated revision.
5. Frontend applies patch in live sessions via `defineCard*` and records revision update.
6. New sessions always rebuild from base + persisted patches.

Sequence diagram:

```text
User -> Chat backend: "create card"
Chat backend -> Extractor: parse <hypercard:code_patch:v1>
Extractor -> StackStore: persist patch(revision+hash)
StackStore -> API: new revision + patch id
API -> Frontend: patch ack
Frontend -> RuntimeSessionRegistry: defineCard(sessionA), defineCard(sessionB), ...
Frontend -> Backend: save workspace state snapshot
```

## 4) Hydration and Loading Lifecycle

### Startup Hydration

1. Resolve `workspace_id` (local storage key or URL).
2. Load stack snapshot from backend.
3. Build effective bundle: base code + ordered patches.
4. Initialize Redux with preloaded `windowing` and runtime state.
5. Mount `DesktopShell` with hydrated stack definition.
6. Lazily activate VM sessions for visible/open windows.

Pseudo-implementation (frontend):

```ts
async function bootWorkspace(stackId: string, workspaceId: string) {
  const snap = await api.getStackSnapshot(stackId, workspaceId);

  const effectiveBundle = composeBundle(snap.bundle.baseCode, snap.bundle.patches);
  const hydratedStack = applyCardMetadataPatches(BASE_STACK, snap.bundle.patches);

  hydratedStack.plugin.bundleCode = effectiveBundle;

  const preloadedState = {
    windowing: hydrateWindowing(snap.workspace.windows),
    pluginCardRuntime: hydrateRuntimeSlices(snap.workspace.sessions),
  };

  const store = createInventoryStore({ preloadedState });
  renderApp({ store, stack: hydratedStack });
}
```

### Session Activation

On first render of each session window:

1. Load VM with effective bundle for active revision.
2. Apply hydrated session/card state deltas.
3. Render card.
4. Subscribe to runtime-intent-derived save scheduler (debounced writes).

Pseudo-implementation (host):

```ts
async function activateSession(sessionId: string, revision: StackRevision, persisted: PersistedSessionState) {
  const bundle = await runtime.loadStackBundle(revision.stackId, sessionId, revision.effectiveCode);
  dispatch(registerRuntimeSession({ sessionId, stackId: revision.stackId, status: 'ready' }));

  dispatch(applyHydratedSessionState({ sessionId, state: persisted.sessionState }));
  for (const [cardId, data] of Object.entries(persisted.cardStates)) {
    dispatch(applyHydratedCardState({ sessionId, cardId, state: data }));
  }
}
```

### Save Policy

Use hybrid save policy:

- Immediate save on structural operations (window open/close, nav changes, code injection accepted).
- Debounced save (200-500ms) for high-frequency card/session state changes.
- Include `expected_data_version` and `expected_code_version` for optimistic concurrency.

## 5) Versioning Strategy (Code and Data)

Code and data must evolve independently.

### Code Versioning

Each stack revision has:

- `revision_id`
- `parent_revision_id`
- `effective_bundle_hash`
- `created_at_ms`
- `author/source` metadata (chat/manual/system)

Each patch has:

- `patch_id`
- `op_type` (`defineCard`, `defineCardRender`, `defineCardHandler`)
- `target_card_id`
- `target_handler`
- `code_blob`
- `code_hash`

Rules:

1. Patches are immutable append-only records.
2. Rebuild runtime code by deterministic ordering (`revision`, `patch_order`).
3. Any replay mismatch must fail fast with hash mismatch error.

### Data Versioning

Track data version per workspace session/card snapshot:

- `data_schema_version` (integer)
- `data_version` (monotonic per record)
- `code_revision_id` used when data was saved

Migration contract:

```ts
interface CardDataMigrator {
  cardId: string;
  fromSchema: number;
  toSchema: number;
  migrate(input: Record<string, unknown>): Record<string, unknown>;
}
```

On hydration:

1. Detect `snapshot.schemaVersion < runtimeExpectedSchemaVersion`.
2. Run ordered migrators.
3. Persist migrated snapshot with bumped `data_schema_version`.

Compatibility matrix (recommended):

```text
if codeRevision == snapshot.codeRevision -> load directly
if codeRevision > snapshot.codeRevision and migrators exist -> migrate + load
if codeRevision > snapshot.codeRevision and no migrator -> quarantine state + load defaults + show warning
if codeRevision < snapshot.codeRevision -> reject downgrade unless explicit override
```

### Timeline Version Interop

Chat timeline already exposes `version` and `serverTimeMs` in snapshot (`pinocchio` timeline store/service). Keep this independent from stack code/data versions. Do not overload timeline `version` with stack revision semantics.

## 6) Security and Safety

Runtime injection raises obvious risk surfaces. Keep existing boundaries and add explicit gates:

1. QuickJS sandbox remains mandatory execution environment (`runtimeService.ts`).
2. Capability policy remains enforced per session (`capabilityPolicy.ts`).
3. Validate incoming code patch format before persistence.
4. Optional preflight execute in isolated ephemeral session before accepting patch.
5. Keep audit log of accepted/rejected patches (`patch_decision_log`).

## Design Decisions

1. Use immutable patch log for code, not mutable monolithic `bundleCode` strings.
Rationale: deterministic replay, diffability, audit, rollback.

2. Keep code version and data version separate.
Rationale: code changes and state migrations move at different cadences.

3. Hydrate before live stream attach.
Rationale: already proven in chat timeline flow; avoids racey merges.

4. Reuse Pinocchio-style SQLite stores and router wiring patterns.
Rationale: existing migration/version/reliability behavior is already battle-tested in this workspace.

5. Preserve capability and resolver strictness.
Rationale: runtime overrides and unrestricted commands are intentionally blocked; persistence must not open a side door.

## Alternatives Considered

### Alternative A: Persist full rewritten bundle only

Pros:

- Simple read path.

Cons:

- Loses provenance and patch-level rollback.
- Harder conflict resolution and review.

Decision: rejected.

### Alternative B: Frontend-only localStorage persistence

Pros:

- Quick to prototype.

Cons:

- No multi-client consistency.
- No backend audit trail.
- Fragile for large payloads and migrations.

Decision: rejected for primary persistence (could still be a cache layer).

### Alternative C: Event-sourcing everything from timeline only

Pros:

- Reuse existing timeline infrastructure.

Cons:

- Timeline is projection-oriented and chat-centric, not a full workspace/state ledger.
- Replay semantics for full workspace code+state are awkward.

Decision: rejected as sole source; keep timeline as complementary observability/hydration channel.

## Implementation Plan

### Phase 1: Stack Persistence Backend Primitive

Files to add/modify:

- `go-inventory-chat/cmd/hypercard-inventory-server/main.go`
- new package: `go-inventory-chat/internal/stackstore/*`
- new package: `go-inventory-chat/internal/stackapi/*`

Work:

1. Add SQLite store for stack revisions + patches.
2. Add migrations and DSN/file flags (`stack-dsn` / `stack-db`).
3. Add snapshot and injection endpoints.

### Phase 2: Frontend Boot/Hydration Plumbing

Files to add/modify:

- `apps/inventory/src/main.tsx`
- `apps/inventory/src/app/store.ts`
- `apps/inventory/src/App.tsx`
- new module: `apps/inventory/src/features/stackPersistence/*`

Work:

1. Add async bootstrap that fetches stack/workspace snapshot.
2. Add preloaded state support for `createAppStore` pipeline.
3. Hydrate stack metadata and effective bundle before `DesktopShell` mount.

### Phase 3: Runtime Session Registry + Injection Application

Files to add/modify:

- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- new module: `packages/engine/src/plugin-runtime/sessionRegistry.ts`

Work:

1. Track live runtime service handles per session.
2. Apply accepted code patches to active sessions via `defineCard*`.
3. Ensure newly opened sessions replay full effective revision.

### Phase 4: Data Versioning + Migration Hooks

Files to add/modify:

- `packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
- `apps/inventory/src/domain/pluginBundle.vm.js` (card schema bumps as needed)
- new module: `apps/inventory/src/features/stackPersistence/migrations.ts`

Work:

1. Add schema version metadata per persisted session/card state.
2. Implement migrator registry and run during hydration.
3. Add fallback behavior for incompatible snapshots.

### Phase 5: Testing and Operational Validation

Test focus:

1. Backend migration tests for stack store schema.
2. End-to-end test: inject code -> persist -> reload -> card still available.
3. Version migration test: old card state migrates to new schema.
4. Conflict test: stale `expected_version` write rejected.
5. Crash/restart test: open windows + nav restored.

Suggested commands:

```bash
cd 2026-02-12--hypercard-react/go-inventory-chat && go test ./...
cd 2026-02-12--hypercard-react && npm exec vitest run packages/engine/src/plugin-runtime/runtimeService.integration.test.ts apps/inventory/src/features/chat/InventoryChatWindow.timeline.test.ts
```

## Open Questions

1. Should stack revisions be per tenant/workspace or global per `stack_id`?
2. Do we allow runtime code injection in production by default, or behind feature flag?
3. Is rollback user-facing (revision picker) or operator-only?
4. Should domain slices (`inventory`, `sales`) be snapshotted with workspace state or remain backend-of-record only?
5. Do we require signed code patches for multi-user environments?

## References

Primary frontend/runtime files:

- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx`
- `packages/engine/src/components/shell/windowing/pluginIntentRouting.ts`
- `packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`
- `packages/engine/src/features/windowing/windowingSlice.ts`
- `packages/engine/src/plugin-runtime/runtimeService.ts`
- `packages/engine/src/plugin-runtime/stack-bootstrap.vm.js`
- `packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx`
- `apps/inventory/src/domain/stack.ts`
- `apps/inventory/src/domain/pluginBundle.vm.js`
- `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- `apps/inventory/src/features/chat/webchatClient.ts`

Primary backend files:

- `go-inventory-chat/cmd/hypercard-inventory-server/main.go`
- `go-inventory-chat/internal/pinoweb/request_resolver.go`
- `go-inventory-chat/internal/pinoweb/runtime_composer.go`
- `go-inventory-chat/internal/pinoweb/hypercard_extractors.go`
- `go-inventory-chat/internal/pinoweb/hypercard_events.go`
- `go-inventory-chat/internal/inventorydb/store.go`
- `go-inventory-chat/cmd/hypercard-inventory-server/main_integration_test.go`

Pinocchio persistence/timeline internals used by this design:

- `pinocchio/pkg/webchat/router.go`
- `pinocchio/pkg/webchat/http/api.go`
- `pinocchio/pkg/webchat/timeline_service.go`
- `pinocchio/pkg/persistence/chatstore/timeline_store_sqlite.go`
- `pinocchio/pkg/persistence/chatstore/timeline_store_memory.go`
- `pinocchio/pkg/persistence/chatstore/turn_store_sqlite.go`
- `pinocchio/pkg/sem/pb/proto/sem/timeline/transport.pb.go`
