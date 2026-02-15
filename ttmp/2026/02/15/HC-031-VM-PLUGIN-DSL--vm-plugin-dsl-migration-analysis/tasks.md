# Tasks

## TODO

- [x] [T1] Create HC-031 ticket workspace and import `/tmp/plugin-hypercard-dsl.md`.
- [x] [T2] Inspect and map `../vm-system/frontend` real plugin runtime implementation (worker, runtime service, contracts, redux adapter, docs).
- [x] [T3] Inspect and map current HyperCard card DSL/runtime implementation (`Act/Ev/Sel`, resolver, card runtime host, renderer, state slices, story helpers).
- [x] [T4] Produce detailed migration analysis document (7+ pages) with no-backwards-compat rip-out plan and file-level impact.
- [x] [T5] Add dedicated section on Storybook integration for plugin-DSL migration.
- [x] [T6] Write detailed implementation diary covering commands, findings, failure cases, and evidence.
- [x] [T7] Run `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30` and resolve/report findings.
- [x] [T8] Upload final HC-031 analysis document to reMarkable and capture upload confirmation in diary/changelog.
- [x] [T9] Expand migration execution backlog into phased hard-cutover tasks with explicit test gates (`tmux` dev/storybook + Playwright smoke checks).

## Hard Cutover Execution Backlog (Engine-Native VM Runtime)

### Phase A: Runtime Foundation

- [x] [A1] Create `packages/engine/src/plugin-runtime/contracts.ts` (engine-specific runtime contracts: load/render/event/dispose + intent/schema types).
- [x] [A2] Create `packages/engine/src/plugin-runtime/uiSchema.ts` and `packages/engine/src/plugin-runtime/intentSchema.ts` validators.
- [x] [A3] Create `packages/engine/src/plugin-runtime/runtimeService.ts` (QuickJS runtime manager with per-session VM map, limits, timeout guards, bootstrap loader).
- [x] [A4] Create worker transport:
  - [x] [A4.1] `packages/engine/src/plugin-runtime/worker/runtime.worker.ts`
  - [x] [A4.2] `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
- [x] [A5] Add runtime tests:
  - [x] [A5.1] `runtimeService.integration.test.ts` (load/render/event/dispose, timeout interrupt)
  - [x] [A5.2] validator tests for UI and intents
- [x] [A6] Add engine exports for new runtime modules (`packages/engine/src/index.ts`, `packages/engine/src/plugin-runtime/index.ts`).

### Phase B: Engine State + Intent Routing

- [x] [B1] Add new Redux slice `packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts`:
  - sessions map
  - card-state map
  - session-state map
  - timeline entries with outcome/reason
- [x] [B2] Add selectors `packages/engine/src/features/pluginCardRuntime/selectors.ts`.
- [x] [B3] Implement capability policy layer for domain/system intents.
- [x] [B4] Wire `pluginCardRuntimeReducer` into `createAppStore` and document store-shape change.
- [x] [B5] Add reducer tests covering:
  - applied/denied/ignored outcomes
  - session lifecycle cleanup
  - nav/system intent routing behavior

### Phase C: Shell Integration

- [x] [C1] Add `PluginCardSessionHost` under `packages/engine/src/components/shell/windowing/`.
- [x] [C2] Update `DesktopShell` to mount `PluginCardSessionHost` for card windows.
- [x] [C3] Project host `globalState` for each render (`self`, `domains`, `nav`, `system`).
- [x] [C4] Route runtime intents:
  - [x] [C4.1] card/session intents -> `pluginCardRuntime` reducers
  - [x] [C4.2] system intents -> windowing/notifications reducers
  - [x] [C4.3] domain intents -> shared/domain action adapters
- [x] [C5] Preserve current windowing behavior (open/focus/close/session nav) with parity tests.

### Phase D: Storybook Runtime Migration

- [x] [D1] Replace internals of `createDSLApp` to bootstrap plugin runtime instead of descriptor runtime.
- [x] [D2] Replace internals of `createStoryHelpers` to plugin-runtime adapter flow.
- [x] [D3] Add helper API for per-card Storybook scenarios with structured params (`params?: unknown`).
- [x] [D4] Add Storybook decorator/runtime harness for deterministic store + session seeds.
- [x] [D5] Add Storybook smoke specs for each app story group (`inventory`, `todo`, `crm`, `book-tracker-debug`).

### Phase E: App Authoring Migration (Hard Cut)

- [ ] [E1] Migrate `apps/inventory` card definitions to plugin modules.
- [ ] [E2] Migrate `apps/todo` card definitions to plugin modules.
- [ ] [E3] Migrate `apps/crm` card definitions and chat action bridges to plugin modules.
- [ ] [E4] Migrate `apps/book-tracker-debug` card definitions to plugin modules.
- [ ] [E5] Migrate engine demo stories:
  - `packages/engine/src/components/shell/windowing/*.stories.tsx`
  - `packages/engine/src/components/widgets/BookTracker.stories.tsx`
- [ ] [E6] Remove function-valued config payloads crossing VM boundary (`cellState`/format callbacks etc.) by converting to declarative schema or host format registry IDs.

### Phase F: Legacy DSL Hard Deletion (No Backwards Compat)

- [ ] [F1] Delete `packages/engine/src/cards/helpers.ts`.
- [ ] [F2] Delete descriptor resolver/action engine in `packages/engine/src/cards/runtime.ts` (or replace file with plugin-runtime-facing minimal API).
- [ ] [F3] Remove `Act/Ev/Sel/Param` and descriptor types from `packages/engine/src/cards/types.ts`.
- [ ] [F4] Remove DSL exports from:
  - `packages/engine/src/cards/index.ts`
  - `packages/engine/src/index.ts`
- [ ] [F5] Remove legacy DSL tests:
  - `packages/engine/src/__tests__/selector-resolution.test.ts`
  - descriptor-specific integration tests and fixtures
- [ ] [F6] Repo-wide grep gate is clean (no `Act(`, `Sel(`, `Ev(` usage in runtime-authoritative code).

### Phase G: End-to-End Validation and Tooling

- [ ] [G1] Unit/integration tests:
  - [ ] [G1.1] `npm run test` (engine)
  - [ ] [G1.2] plugin-runtime integration tests in this repo
- [ ] [G2] Static checks:
  - [ ] [G2.1] `npm run typecheck`
  - [ ] [G2.2] `npm run build`
  - [ ] [G2.3] `npm run lint` (record baseline issues separately if unrelated)
- [ ] [G3] Manual runtime checks via tmux:
  - [ ] [G3.1] Start app dev server in tmux (`npm run dev -w apps/inventory`)
  - [ ] [G3.2] Start Storybook in tmux (`npm run storybook`)
  - [ ] [G3.3] Verify both processes healthy and stable for 5+ minutes
- [ ] [G4] Playwright smoke interaction checks:
  - [ ] [G4.1] Open app home and navigate cards/windows
  - [ ] [G4.2] Open representative Storybook story pages and trigger handlers
  - [ ] [G4.3] Assert no runtime recursion/update-depth errors in browser console
- [ ] [G5] Final HC-031 publication updates:
  - [ ] [G5.1] Update design doc with implementation outcomes
  - [ ] [G5.2] Update diary + changelog per phase/commit
  - [ ] [G5.3] Run `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30`
