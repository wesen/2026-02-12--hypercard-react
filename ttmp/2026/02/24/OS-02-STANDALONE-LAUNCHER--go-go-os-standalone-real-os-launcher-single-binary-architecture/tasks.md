# Tasks

## Completed Research and Delivery

- [x] Create ticket `OS-02-STANDALONE-LAUNCHER` and initialize design + diary docs
- [x] Map current frontend app/shell architecture with line-anchored evidence
- [x] Map current backend/server composition with line-anchored evidence
- [x] Analyze single-binary readiness gaps across frontend build + backend embedding
- [x] Produce detailed design investigation document with API sketches, pseudocode, phased rollout, and test strategy
- [x] Produce chronological investigation diary with commands, findings, failed attempts, and rationale
- [x] Run `docmgr doc relate` and update changelog metadata notes
- [x] Run `docmgr doctor --ticket OS-02-STANDALONE-LAUNCHER --stale-after 30`
- [x] Upload analysis outputs to reMarkable and verify remote listing
- [x] Refine plan to use `packages/desktop-os` with strict dependency direction `desktop-os -> engine`
- [x] Lock decisions to single global store and hard cutover (no backwards wrapper)

## Implementation Backlog (Granular)

## Phase 0: Contract and Boundary Lock

- [x] `P0.1` Create `packages/desktop-os/package.json`
- [x] `P0.2` Add `packages/desktop-os/tsconfig.json` and build script wiring
- [x] `P0.3` Add `packages/desktop-os/src/index.ts` public exports
- [x] `P0.4` Add architecture guardrail doc in `packages/desktop-os/README.md` stating `desktop-os -> engine` only
- [ ] `P0.5` Add lint rule or static check preventing `packages/engine` imports from `packages/desktop-os`

## Phase 1: Frontend Contracts in `packages/desktop-os`

- [x] `P1.1` Add `src/contracts/appManifest.ts` with `AppManifest`, `AppStateKey`, launch metadata
- [x] `P1.2` Add `src/contracts/launchableAppModule.ts` with locked `LaunchableAppModule` interface
- [x] `P1.3` Add `src/contracts/launcherHostContext.ts` with host APIs (`openWindow`, `resolveApiBase`, etc.)
- [x] `P1.4` Add `src/contracts/launcherRenderContext.ts`
- [x] `P1.5` Add runtime validation helpers for manifest uniqueness and `appKey` format
- [x] `P1.6` Add unit tests for contract validation failures

## Phase 2: Registry and Orchestration Core

- [x] `P2.1` Add `src/registry/createAppRegistry.ts`
- [x] `P2.2` Enforce unique `manifest.id` and unique `stateKey` at registry build time
- [x] `P2.3` Add `src/runtime/appKey.ts` parser/formatter (`${appId}:${instanceId}`)
- [x] `P2.4` Add `src/runtime/buildLauncherIcons.ts` to derive top-level desktop icons from manifests
- [x] `P2.5` Add `src/runtime/buildLauncherContributions.ts` to compose cross-app contributions
- [x] `P2.6` Add `src/runtime/renderAppWindow.ts` resolver delegating to owning module
- [x] `P2.7` Add registry/orchestration tests for collisions and deterministic ordering

## Phase 3: Single Store Builder (Locked Strategy)

- [x] `P3.1` Add `src/store/createLauncherStore.ts`
- [x] `P3.2` Compose reducer map: engine core reducers + `{ [stateKey]: reducer }` per module
- [x] `P3.3` Fail startup on duplicate reducer keys
- [x] `P3.4` Add typed selector helper utilities for app state access by `stateKey`
- [x] `P3.5` Add store tests ensuring one global store and stable reducer map

## Phase 4: Launcher App Entry Point

- [x] `P4.1` Create `apps/os-launcher` package (thin host app)
- [x] `P4.2` Add `apps/os-launcher/src/app/store.ts` using `createLauncherStore`
- [x] `P4.3` Add `apps/os-launcher/src/App.tsx` wiring `DesktopShell` with desktop-os registry outputs
- [x] `P4.4` Add `apps/os-launcher/src/main.tsx` with provider/theme bootstrap
- [x] `P4.5` Add launcher Vite config using existing shared helper
- [x] `P4.6` Add initial shell smoke story/test for launcher host

## Phase 5: App Module Extraction (Hard Cutover)

- [x] `P5.1` Add inventory module at `apps/inventory/src/launcher/module.ts`
- [x] `P5.2` Move inventory launch window builders into module API (`buildLaunchWindow`, contributions, render)
- [x] `P5.3` Add todo module at `apps/todo/src/launcher/module.ts`
- [x] `P5.4` Add crm module at `apps/crm/src/launcher/module.ts`
- [x] `P5.5` Add book-tracker module at `apps/book-tracker-debug/src/launcher/module.ts`
- [x] `P5.6` Build consolidated module list in launcher host
- [ ] `P5.7` Remove obsolete standalone app boot entrypoints not used after cutover
- [x] `P5.8` Remove dead standalone launcher wiring code in app-local `App.tsx` files where superseded

## Phase 6: Backend Module Host (Hard Cutover Routes)

- [x] `P6.1` Create `go-go-os/go-os-launcher` module (or package inside existing Go workspace)
- [x] `P6.2` Add `AppBackendManifest` and `AppBackendModule` interfaces in Go
- [x] `P6.3` Add backend module registry and startup lifecycle manager
- [x] `P6.4` Add inventory backend adapter implementing `AppBackendModule`
- [x] `P6.5` Mount inventory endpoints under `/api/apps/inventory/*`
- [x] `P6.6` Add `/api/os/apps` manifest endpoint
- [x] `P6.7` Enforce hard cutover: do not mount legacy aliases (`/chat`, `/ws`, `/api/timeline`)
- [x] `P6.8` Fail startup when required backend module is missing/unhealthy

## Phase 7: Frontend Network Cutover to Namespaced APIs

- [x] `P7.1` Add desktop-os API path resolvers per app (`resolveApiBase`, `resolveWsBase`)
- [x] `P7.2` Update inventory chat integration to use `/api/apps/inventory` namespace
- [x] `P7.3` Update confirm-runtime base URL wiring for namespaced confirm routes
- [x] `P7.4` Update profile API usage paths to namespaced backend routes
- [x] `P7.5` Remove references to legacy endpoint strings from frontend code
- [x] `P7.6` Add regression tests asserting namespaced routes are used everywhere

## Phase 8: Single-Binary Build and Embed

- [x] `P8.1` Add build command for launcher frontend artifacts
- [x] `P8.2` Copy launcher dist output to Go embed target directory
- [x] `P8.3` Add `//go:embed` UI handler for launcher frontend assets
- [x] `P8.4` Create `cmd/go-go-os-launcher/main.go`
- [x] `P8.5` Ensure one command produces one binary containing UI + backend modules

## Phase 9: Test and Verification

- [x] `P9.1` Unit tests: desktop-os registry validation and app-key parsing
- [x] `P9.2` Unit tests: single-store creation and reducer-collision fail-fast
- [x] `P9.3` Integration tests: open each app icon -> app window renders
- [x] `P9.4` Integration tests: required backend missing -> launcher startup fails deterministically
- [x] `P9.5` Backend tests: module mount paths and `/api/os/apps` payload correctness
- [x] `P9.6` End-to-end test: one binary launches UI and inventory app chat flow works via namespaced routes
- [x] `P9.7` End-to-end test: verify no legacy alias routes are exposed

## Phase 10: Hard-Cut Cleanup

- [ ] `P10.1` Remove unused compatibility code paths in frontend and backend
- [ ] `P10.2` Remove stale docs that describe old standalone-app boot assumptions
- [ ] `P10.3` Update top-level README with launcher-first architecture
- [ ] `P10.4` Add operational runbook for launching/testing the single binary
- [ ] `P10.5` Run final `docmgr doctor --ticket OS-02-STANDALONE-LAUNCHER --stale-after 30`
