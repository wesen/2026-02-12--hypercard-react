---
Title: Standalone go-go-os launcher architecture and composable app runtime
Ticket: OS-02-STANDALONE-LAUNCHER
Status: active
Topics:
    - go-go-os
    - frontend
    - backend
    - architecture
    - launcher
    - desktop
    - binary
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: Current advanced desktop contributions and app window instantiation
    - Path: apps/todo/src/App.tsx
      Note: Minimal standalone app shell pattern used by multiple apps
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/main.go
      Note: Inventory-specific backend boot and route mount composition
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/tools_inventory.go
      Note: Hardcoded inventory tool registration surface
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Inventory hypercard event mapping and timeline projection hooks
    - Path: go-inventory-chat/internal/pinoweb/request_resolver.go
      Note: Request-level profile/runtime resolution and override policy
    - Path: go-inventory-chat/internal/pinoweb/runtime_composer.go
      Note: Runtime composition and inventory runtime-key restrictions
    - Path: package.json
      Note: Workspace scripts reveal app-by-app boot/build entrypoint assumptions
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Static reducer composition constraints for launcher host design
    - Path: packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx
      Note: App-window adapter chain for content.kind=app
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.ts
      Note: Contribution contract and deterministic composition semantics
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Core shell command/icon routing and startup window orchestration
    - Path: tooling/vite/createHypercardViteConfig.ts
      Note: Current frontend to backend proxy path assumptions
ExternalSources: []
Summary: Detailed architecture investigation for moving go-go-os to a single-binary launcher model with composable frontend app modules and optional backend app modules, using a single global store and hard cutover.
LastUpdated: 2026-02-24T10:44:18.337638536-05:00
WhatFor: Define an evidence-backed target architecture and rollout plan for a standalone launcher that can host all current apps and optional app backends in one binary.
WhenToUse: Use when implementing the launcher runtime, app/module contracts, backend composition, and single-binary packaging/testing plan.
---


# Standalone go-go-os launcher architecture and composable app runtime

## 1. Executive summary

This investigation shows that go-go-os already has most frontend shell primitives needed for an OS-style launcher (desktop icons, command routing, startup windows, app-window rendering hooks), but it lacks a first-class "app module" contract and a host runtime that composes multiple apps into one desktop session.

On the backend, only inventory has a Go server (`go-inventory-chat`) and its runtime is inventory-specific (runtime key, tools, middleware wiring, routes), so there is no current multi-app backend module composition model.

Recommended direction:

1. Introduce a dedicated `packages/desktop-os` host layer (frontend + backend integration contracts) with explicit module contracts.
2. Convert each app into a `LaunchableAppModule` with manifest + contributions + window renderers.
3. Add backend `AppBackendModule` composition to allow optional app APIs/runtimes in one server.
4. Ship a single `go-go-os-launcher` binary that serves embedded launcher UI and mounted app backends.
5. Execute a hard cutover with no compatibility wrappers or legacy route aliases.

## 2. Problem statement and scope

### 2.1 Requested outcome

Build a standalone "real OS launcher" for go-go-os where:

1. one binary launches the OS shell,
2. current apps are launchable icons,
3. launching an icon instantiates an app,
4. app backends are optional and composable.

### 2.2 In scope

1. Current-state architecture mapping (frontend + backend).
2. Gap analysis against target launcher model.
3. Proposed composable architecture and contracts.
4. Phased implementation and validation strategy.

### 2.3 Out of scope

1. Implementing the new launcher in this ticket.
2. Choosing final app UX/theme details.
3. Migrating all app features end-to-end in one step.

## 3. Current-state architecture (evidence-backed)

### 3.1 Frontend app packaging and boot model

Observed:

1. Repo is workspace monorepo with separate app packages under `apps/*` (`inventory`, `todo`, `crm`, `book-tracker-debug`) and shared engine package (`go-go-os/package.json:4-17`, `go-go-os/README.md:36-66`).
2. Root `dev` script runs only inventory app (`go-go-os/package.json:9`).
3. All apps are independently buildable Vite apps with their own `main.tsx` + `App.tsx` (`go-go-os/apps/*/package.json:6-10`, `go-go-os/apps/*/src/main.tsx`).
4. App entrypoints are not currently aggregated into one runtime. `todo`, `crm`, and `book-tracker-debug` each mount `<DesktopShell stack={STACK} />` as standalone apps (`go-go-os/apps/todo/src/App.tsx:1-6`, `go-go-os/apps/crm/src/App.tsx:1-6`, `go-go-os/apps/book-tracker-debug/src/App.tsx:1-6`).

Implication:

- Current model is "one built app at a time" rather than one host runtime loading multiple apps.

### 3.2 Desktop shell already exposes composition seams

Observed:

1. `DesktopShellProps` already supports `contributions` and `renderAppWindow` extension points (`go-go-os/packages/engine/src/components/shell/windowing/desktopShellTypes.ts:6-26`).
2. Contribution model includes menus, icons, commands, window content adapters, startup windows (`go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.ts:31-46`).
3. Contribution composition behavior is deterministic and tested (menu merge by ID, command priority sort, icon collision handling) (`go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.test.ts:9-67`).
4. Icon open semantics already map to `icon.open.{id}` and route through command handlers (`go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:396-405`).
5. App windows are first-class via `content.kind === 'app'` + `appKey` and rendered through adapter chain (`go-go-os/packages/engine/src/desktop/core/state/types.ts:10-24`, `go-go-os/packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx:4-13`, `go-go-os/packages/engine/src/components/shell/windowing/windowContentAdapter.ts:11-31`).

Implication:

- Frontend shell is already near launcher-ready; missing piece is an app module registry and host orchestration.

### 3.3 Inventory demonstrates advanced contribution usage

Observed:

1. Inventory app defines explicit desktop contributions: icons, menus, commands, startup windows (`go-go-os/apps/inventory/src/App.tsx:472-643`).
2. Inventory command handlers launch app windows with `content: { kind: 'app', appKey }` (`go-go-os/apps/inventory/src/App.tsx:568-637`).
3. Inventory resolves runtime app windows via `renderAppWindow(appKey)` switch (`go-go-os/apps/inventory/src/App.tsx:430-470`).

Implication:

- Desired launcher behavior exists locally inside one app; it is not generalized across all apps.

### 3.4 Store and state coupling constraints

Observed:

1. `createAppStore` statically configures reducers at app boot (`go-go-os/packages/engine/src/app/createAppStore.ts:48-61`).
2. All current app stores are created once per app package (`go-go-os/apps/*/src/app/store.ts`).
3. Windowing state is global in the app store (`go-go-os/packages/engine/src/desktop/core/state/windowingSlice.ts:4-14`).

Implication:

- A launcher host needs either reducer injection or app-local store boundaries; current model assumes per-app static composition.

### 3.5 Backend reality: only inventory exists, and it is inventory-specific

Observed:

1. The only Go code under go-go-os is in `go-inventory-chat` (`find go-go-os -name '*.go'`).
2. Server runtime is strongly inventory-bound:
   - runtime key defaults to `inventory` (`go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:48-54`),
   - runtime overrides are rejected (`go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:39-41`, `go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:109-113`),
   - inventory tools are hardcoded and registered (`go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/tools_inventory.go:18-25`, `go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go:178-180`).
3. Route mounting is fixed in `main.go` (`/chat`, `/ws`, `/api/timeline`, `/api/*`, `/confirm`) (`go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go:190-204`).
4. Event middleware/extractors are inventory-specific (`NewInventory...` names and constants) (`go-go-os/go-inventory-chat/internal/pinoweb/hypercard_middleware.go:20-31`, `go-go-os/go-inventory-chat/internal/pinoweb/hypercard_extractors.go:17-58`, `go-go-os/go-inventory-chat/internal/pinoweb/hypercard_events.go:31-34`).

Implication:

- There is no generic backend app module contract today.

### 3.6 Single-binary status today

Observed:

1. Current Go server embeds `static/` (`go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go:34-35`) but static payload is placeholder HTML (`go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/static/index.html:1-14`).
2. Frontend runs independently through Vite with optional proxy for inventory backend (`go-go-os/tooling/vite/createHypercardViteConfig.ts:57-64`).
3. Inventory chat frontend is coupled to chat endpoints through base prefix (`go-go-os/packages/engine/src/chat/runtime/http.ts:51-103`, `go-go-os/packages/engine/src/chat/ws/wsManager.ts:71-97`).

Implication:

- There is no current production path for one binary serving the full multi-app launcher UI.

## 4. Gap analysis

### 4.1 Gap summary

1. No launcher host app that composes all app modules.
2. No shared app manifest/registry contract for frontend.
3. No backend module registry for optional app backends.
4. No end-to-end embed pipeline from launcher frontend build into a single Go binary.
5. Store composition not designed for runtime app-module onboarding.

### 4.2 Frontend gap details

1. Desktop shell composition exists, but app discovery is ad hoc and app-local.
2. `renderAppWindow` is callback-based without standard app module lifecycle.
3. Current apps are peer Vite apps, not modules consumed by a single launcher runtime.

### 4.3 Backend gap details

1. Inventory runtime composer/request resolver are domain-specific.
2. No `AppBackendModule` abstraction for route/runtime/tool registration.
3. No backend API that publishes installed app manifest to frontend launcher.

## 5. Proposed architecture

## 5.1 Design principles

1. Preserve existing shell primitives (`DesktopContribution`, `openWindow`, adapter chain).
2. Introduce minimal contracts for app discovery/launch.
3. Keep backend optional per app and isolated behind module boundaries.
4. Prefer compile-time composition for deterministic single binary.
5. Keep package dependency direction strict: `packages/desktop-os` may depend on `packages/engine`, and `packages/engine` must not depend on `packages/desktop-os`.
6. Use hard cutover semantics: no backwards wrappers, no legacy API aliases.

## 5.1.1 Package boundary decision (current rollout)

For this rollout we are **not** splitting `packages/engine` yet. We add a dedicated OS-level orchestration package:

1. `packages/engine` continues to own desktop/windowing primitives and reusable runtime building blocks.
2. `packages/desktop-os` owns launcher/app-registry composition, app availability policy, and host-level orchestration.
3. Any feature needed by both layers must live in `packages/engine` (or lower), never by importing upward from `engine` into `desktop-os`.

## 5.2 Frontend target model

### 5.2.1 New contract: `LaunchableAppModule`

```ts
export type AppStateKey = `app_${string}`;
export type LaunchReason = 'icon' | 'menu' | 'command' | 'startup';

export interface AppManifest {
  id: string;                  // "inventory", "todo", ...
  name: string;                // display name
  icon: string;                // desktop icon glyph or asset token
  version: string;
  launch: {
    mode: 'window' | 'workspace';
    defaultWindow?: { width: number; height: number };
    singleton?: boolean;
  };
  backend?: {
    required: boolean;         // when true, launcher startup fails if backend module is unavailable
    basePath: string;          // e.g. /api/apps/inventory
    wsBasePath?: string;       // e.g. /api/apps/inventory/ws
  };
}

export interface LauncherHostContext {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
  openWindow: (payload: OpenWindowPayload) => void;
  closeWindow: (windowId: string) => void;
  resolveApiBase: (appId: string) => string;
  resolveWsBase: (appId: string) => string;
}

export interface LauncherRenderContext {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
  stateKey: AppStateKey;
}

export interface LaunchableAppModule {
  manifest: AppManifest;
  stateKey: AppStateKey; // top-level reducer key in the single global store
  reducer: Reducer;
  buildLaunchWindow: (ctx: LauncherHostContext, reason: LaunchReason) => OpenWindowPayload;
  createContributions: (ctx: LauncherHostContext) => DesktopContribution[];
  renderWindow: (params: { appKey: string; windowId: string; ctx: LauncherRenderContext }) => ReactNode | null;
  onRegister?: (ctx: LauncherHostContext) => void;
}
```

Locked invariants:

1. `manifest.id` must be globally unique.
2. `stateKey` must be globally unique and stable across releases.
3. `buildLaunchWindow` must return `content.kind === 'app'`.
4. `appKey` must begin with `${manifest.id}:` for deterministic module resolution.

### 5.2.2 Launcher host responsibilities

1. Register app modules.
2. Compose contributions from all modules.
3. Publish desktop icons for each app manifest.
4. Resolve icon command to `openWindow({ content: { kind: 'app', appKey } })`.
5. Delegate app window rendering to owning module.

### 5.2.3 Launch flow pseudocode

```ts
for (const app of registry.list()) {
  contributions.push(...app.createContributions(hostCtx));
  contributions.push(createLauncherIconContribution(app.manifest));
}

const renderAppWindow = (appKey: string, windowId: string) => {
  const { appId } = parseAppKey(appKey);
  const mod = registry.get(appId);
  return mod?.renderWindow(appKey, windowId, renderCtx) ?? <UnknownAppWindow appKey={appKey} />;
};

<DesktopShell stack={launcherStack} contributions={contributions} renderAppWindow={renderAppWindow} />
```

### 5.2.4 Store composition strategy

Decision (locked for v1): **single global store with eager reducer composition at launcher startup**.

1. Launcher builds one reducer map: engine core reducers + exactly one reducer per app module (`stateKey` => `reducer`).
2. Reducer key collisions fail startup.
3. No runtime reducer injection in v1.
4. App windows interact through host APIs and scoped selectors into the global store.

Reasoning:

- Keeps one shell state graph, minimizes orchestration complexity, and supports hard cutover refactoring speed.

## 5.3 Backend target model

### 5.3.1 New contract: `AppBackendModule`

```go
type AppBackendManifest struct {
    ID           string   `json:"id"`
    Name         string   `json:"name"`
    Version      string   `json:"version"`
    Required     bool     `json:"required"`
    APIBasePath  string   `json:"apiBasePath"`   // /api/apps/{id}
    WSBasePath   string   `json:"wsBasePath,omitempty"`
    HealthPath   string   `json:"healthPath,omitempty"`
    Capabilities []string `json:"capabilities,omitempty"`
}

type AppBackendModule interface {
    Manifest() AppBackendManifest
    MountRoutes(mux *http.ServeMux) error
    Start(ctx context.Context) error
    Stop(ctx context.Context) error
}
```

Locked invariants:

1. `Manifest().ID` must match frontend app module `manifest.id`.
2. `APIBasePath` is mandatory and namespaced under `/api/apps/{id}`.
3. No legacy aliases are mounted.
4. If `Required == true` and module mount/start fails, launcher server startup fails.

### 5.3.2 Host server composition

1. Build one launcher server binary (`cmd/go-go-os-launcher`).
2. Register core shell routes (`/`, static assets, `/api/os/apps`).
3. Mount each app backend module under stable namespace (`/api/apps/{appId}/...`).
4. Hard cutover policy: do **not** mount compatibility aliases (`/chat`, `/ws`, `/api/timeline`).

### 5.3.3 Backend manifest endpoint

`GET /api/os/apps` returns merged frontend/backend view:

```json
{
  "apps": [
    {
      "id": "inventory",
      "name": "Inventory",
      "icon": "📦",
      "frontend": { "launchMode": "window" },
      "backend": { "required": true, "apiBasePath": "/api/apps/inventory" }
    }
  ]
}
```

## 5.4 Single-binary packaging model

### 5.4.1 Build pipeline

1. Build launcher frontend host using `packages/desktop-os` as the orchestration layer (with a thin app entrypoint as needed).
2. Copy generated assets to Go embed directory (`internal/ui/dist`).
3. Embed via `//go:embed dist` and serve through HTTP handler.
4. `go build ./cmd/go-go-os-launcher` yields one binary.

### 5.4.2 Why this fits current code

1. Existing inventory server already demonstrates `embed.FS` pattern (`main.go:34-35`).
2. Existing shell primitives already enable icon/command/window composition.
3. Existing frontend chat transport already supports base path prefixing, allowing module namespacing (`http.ts:59`, `wsManager.ts:83-97`).

## 6. Fit into current model (frontend + backend)

## 6.1 Frontend fit

1. Keep `DesktopShell` as the shell engine.
2. Introduce launcher host app that owns one shell session.
3. Convert current app packages into module exports (manifest + contributions + renderers).
4. Inventory custom behavior moves from app root into inventory module implementation.

## 6.2 Backend fit

1. Keep inventory backend implementation, but wrap it behind inventory module contract.
2. Add neutral host for module registration + route mounting.
3. Allow apps with no backend module by setting `backend.required=false` in manifest.

## 6.3 Composability model for apps with backend components

1. Frontend module declares backend requirement and route base.
2. Launcher host checks backend manifest endpoint at boot.
3. If a required backend module is missing or fails startup, launcher startup fails fast.
4. App windows can use host-provided `resolveApiBase(appId)` and `resolveWsBase(appId)` helpers.

## 7. Phased implementation plan

## Phase 0: Decisions and contracts

1. Finalize module interfaces (`LaunchableAppModule`, `AppBackendModule`).
2. Lock reducer strategy to single global store (eager composition at startup).
3. Lock route namespace policy to `/api/apps/{appId}` with no legacy aliases.

## Phase 1: Frontend launcher host skeleton

Files:

1. Add `packages/desktop-os/src/contracts/*` for launcher/app module contracts.
2. Add `packages/desktop-os/src/registry/*` for module registry + composition logic.
3. Add `packages/desktop-os/src/runtime/*` for launcher command routing, icon launch helpers, and availability policy.
4. Add a thin launcher app entrypoint (`apps/os-launcher` or equivalent) that wires `DesktopShell` using `packages/desktop-os`.

Deliverables:

1. Desktop shows app icons from static manifests.
2. Icon double-click opens placeholder app windows via `content.kind='app'`.

## Phase 2: App module extraction

Files:

1. Add module exports in each app package (`apps/*/src/launcher/module.ts`).
2. Refactor inventory `App.tsx` logic into inventory module contribution/render functions.

Deliverables:

1. Launcher opens real app windows for all current apps.
2. Existing standalone app boot entrypoints are removed as part of hard cutover.

## Phase 3: Backend module host

Files:

1. Add new Go module or package for launcher host server.
2. Add inventory backend adapter implementing `AppBackendModule`.
3. Add `/api/os/apps` manifest endpoint.

Deliverables:

1. One server process mounts inventory under app namespace.
2. No legacy API aliases are available; frontend uses namespaced app routes only.

## Phase 4: Single-binary embed pipeline

Files:

1. Add frontend build + copy scripts.
2. Add Go embed assets path and static handler.
3. Add CI job that builds frontend then launcher binary.

Deliverables:

1. One binary serves launcher UI + backend APIs.

## Phase 5: Hard-cut stabilization

1. Verify all frontend network paths already target namespaced app backend bases.
2. Add startup diagnostics for required backend module failures.
3. Remove dead code from pre-launcher app entrypoints and obsolete routing assumptions.

## 8. Testing and validation strategy

## 8.1 Frontend unit tests

1. Registry composition tests: icon collision policy, command routing precedence.
2. Launcher flow tests: icon open => window payload => module render invocation.
3. Route helper tests: appId -> API/WS base URL resolution.

## 8.2 Frontend integration tests

1. Multi-app shell smoke: open all app icons, close/reopen, focus/stack order.
2. Inventory module regression: chat window + confirm queue still open and function.

## 8.3 Backend tests

1. Module host tests: route mounting, manifest endpoint contents.
2. Inventory module adapter tests: equivalent behavior to current `hypercard-inventory-server`.
3. Namespaced route tests only (explicitly assert legacy aliases are absent).

## 8.4 End-to-end tests

1. Single binary boot test: serve UI + API + WS from one process.
2. Playwright scenario: open launcher, launch inventory app, send chat prompt, receive timeline updates.
3. Failure scenario: required backend missing => launcher startup fails with deterministic diagnostics.

## 8.5 Release gates

1. `go test ./...` for backend modules and host.
2. Frontend typecheck/tests across launcher and app modules.
3. Binary smoke in CI on Linux/macOS.

## 9. Risks, alternatives, and open questions

## 9.1 Primary risks

1. Store coupling risk: app reducers currently assume app-specific store boot.
2. Hard-cut route risk: current frontend assumptions (`/chat`, `/ws`, `/api/timeline`) require coordinated same-branch cutover.
3. Scope risk: doing frontend + backend + packaging in one cut can destabilize app behavior.

## 9.2 Mitigations

1. Implement and validate namespaced route helper utilities in `packages/desktop-os` before wiring app modules.
2. Cut over inventory first in the launcher branch, then land remaining modules in short follow-up PRs.
3. Add CI and local smoke checks that fail if deprecated legacy route strings are reintroduced.

## 9.3 Alternatives considered

1. Keep separate binaries per app and add external launcher only.
   - Rejected: fails "single binary" requirement.
2. Hardcode all apps in one monolithic `App.tsx` without module contracts.
   - Rejected: not composable; high maintenance cost.
3. Dynamic plugin loading (`go plugin`/runtime JS import only).
   - Rejected for first rollout due portability and deterministic build/release concerns.

## 9.4 Open questions

1. Should app manifests be compile-time only for v1, or fetched from backend for runtime capability truth?
2. Should app icons be static layout or user-rearrangeable with persisted coordinates?

## 10. References

### Frontend architecture

1. `go-go-os/package.json:4-17`
2. `go-go-os/apps/inventory/src/App.tsx:396-646`
3. `go-go-os/apps/todo/src/App.tsx:1-6`
4. `go-go-os/apps/crm/src/App.tsx:1-6`
5. `go-go-os/apps/book-tracker-debug/src/App.tsx:1-6`
6. `go-go-os/packages/engine/src/components/shell/windowing/desktopShellTypes.ts:6-26`
7. `go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.ts:31-122`
8. `go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:123-177`
9. `go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx:345-405`
10. `go-go-os/packages/engine/src/components/shell/windowing/defaultWindowContentAdapters.tsx:4-32`
11. `go-go-os/packages/engine/src/desktop/core/state/types.ts:10-39`
12. `go-go-os/packages/engine/src/app/createAppStore.ts:48-61`

### Backend architecture

1. `go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go:34-227`
2. `go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/tools_inventory.go:18-270`
3. `go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go:39-112`
4. `go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go:21-145`
5. `go-go-os/go-inventory-chat/internal/pinoweb/hypercard_events.go:120-126`
6. `go-go-os/go-inventory-chat/internal/pinoweb/hypercard_events.go:300-408`
7. `go-go-os/go-inventory-chat/internal/pinoweb/hypercard_extractors.go:17-69`
8. `go-go-os/go-inventory-chat/internal/pinoweb/hypercard_extractors.go:459-479`
9. `go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/static/index.html:1-14`

### Supporting docs

1. `go-go-os/docs/frontend/storybook-and-app-boot-model.md:9-99`
2. `go-go-os/README.md:36-66`
3. `go-go-os/packages/engine/docs/theming-and-widget-playbook.md:1790-1849`
