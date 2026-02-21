# Changelog

## 2026-02-15

- Initial workspace created


## 2026-02-15

Created HC-031 ticket docs, imported `/tmp/plugin-hypercard-dsl.md`, and mapped both runtime architectures (`vm-system/frontend` plugin runtime and current HyperCard card DSL runtime) with file-level evidence and migration impact metrics.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md — Imported proposal source used as migration baseline
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/packages/plugin-runtime/src/runtimeService.ts — Real plugin VM bootstrap and execution contract analyzed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/packages/plugin-runtime/src/redux-adapter/store.ts — Capability and dispatch timeline model analyzed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/cards/runtime.ts — Legacy DSL resolver/action runtime analyzed for removal


## 2026-02-15

Published full HC-031 design document with no-backwards-compat rip-out strategy for `Act/Ev/Sel` DSL and dedicated Storybook integration plan.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md — Primary 7+ page analysis deliverable
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Detailed work log with command-level evidence
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Updated task tracking for analysis and publication


## 2026-02-15

Completed ticket hygiene and publication flow: ran `docmgr doctor` (resolved unknown topics + source frontmatter issue, one intentional warning remains for imported source filename numeric prefix) and uploaded final PDF to reMarkable.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/vocabulary.yaml — Added `dsl` and `frontend` topics used by HC-031
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/sources/local/plugin-hypercard-dsl.md — Added frontmatter for doctor compatibility
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked T7/T8 complete

### Publication

- Uploaded: `01-vm-plugin-dsl-migration-and-storybook-integration-analysis.pdf`
- Remote directory: `/ai/2026/02/15/HC-031-VM-PLUGIN-DSL`
- Verification: `remarquee cloud ls /ai/2026/02/15/HC-031-VM-PLUGIN-DSL --long --non-interactive`


## 2026-02-15

Closed the earlier vm-system test execution gap by installing `../vm-system/frontend` dependencies and running plugin-runtime integration tests successfully.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/package.json — Workspace where dependencies were installed and tests executed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/vm-system/frontend/packages/plugin-runtime/src/runtimeService.integration.test.ts — Integration test suite executed (6 passing tests)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Step 6 with exact commands and outcomes

### Validation

- `pnpm --dir ../vm-system/frontend install` — success
- `pnpm --dir ../vm-system/frontend exec vitest run --config vitest.integration.config.ts packages/plugin-runtime/src/runtimeService.integration.test.ts` — pass (1 file, 6 tests)
- `pnpm --dir ../vm-system/frontend test:integration` — pass


## 2026-02-15

Expanded HC-031 execution planning into a phased hard-cutover backlog (A-G) with explicit runtime migration scope, legacy DSL deletion tasks, and test gates including tmux process checks and Playwright smoke validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Added detailed hard-cutover execution phases and validation checkpoints
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Added Step 7 describing planning expansion and rationale


## 2026-02-15

Implemented HC-031 Phase A runtime foundation in engine with QuickJS-backed plugin runtime modules, worker transport, schema validators, integration tests, and package exports. Fixed transitional typecheck issues (export symbol collision + worker pending typing) and completed Phase A validation.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.ts — Added session-scoped QuickJS runtime service (`loadStackBundle/renderCard/eventCard/disposeSession`)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/contracts.ts — Added engine-native worker/runtime contracts and intent schema types
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/worker/runtime.worker.ts — Added worker request handler wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/worker/sandboxClient.ts — Added host-side worker client transport
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.integration.test.ts — Added runtime integration coverage for load/render/event/dispose/timeout
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/index.ts — Exported plugin-runtime modules at package root
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/package.json — Added `quickjs-emscripten` dependency
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `A1..A6` complete
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Added Step 8 implementation log and validation details

### Validation

- `npm run test -w packages/engine` — pass (`8` files, `102` tests)
- `npm run typecheck -w packages/engine` — pass (after resolving initial TS2308/TS2322 issues)
- `npm run build -w packages/engine` — pass

### Commit

- `c92c26b` — `feat(engine): add plugin runtime foundation (Phase A)`


## 2026-02-15

Implemented HC-031 Phase B host-state layer: `pluginCardRuntime` Redux slice with capability-gated intent ingestion, outcome timeline, and domain/system/nav pending intent queues. Wired reducer into `createAppStore` and added reducer tests for routing and lifecycle cleanup.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/pluginCardRuntime/pluginCardRuntimeSlice.ts — New runtime host-state reducer and intent ingestion pipeline
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/pluginCardRuntime/capabilityPolicy.ts — Domain/system capability authorization logic
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/pluginCardRuntime/selectors.ts — Selectors for sessions, card/session state, timeline, and pending queues
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — Added `pluginCardRuntime` reducer to default app store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/plugin-card-runtime.test.ts — Added reducer behavior coverage for applied/denied/ignored and nav/system routing
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked B1-B5 complete

### Validation

- `npm run test -w packages/engine` — pass (`9` files, `105` tests)
- `npm run typecheck -w packages/engine` — pass
- `npm run build -w packages/engine` — pass

### Commit

- `583fe38` — `feat(engine): add plugin card runtime redux slice (Phase B)`


## 2026-02-15

Implemented HC-031 Phase C shell integration: Desktop now mounts `PluginCardSessionHost` for card windows, plugin runtime intents are routed through host adapters, and a plugin UI renderer was added for VM tree output. Added tests for routing and denial behavior to preserve windowing/nav semantics.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx — New plugin-aware card session host with runtime load/render/event flow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/pluginIntentRouting.ts — Runtime intent routing adapter to pluginCardRuntime + windowing/notifications/domain reducers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/PluginCardRenderer.tsx — Data-tree renderer for plugin runtime UINode output
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Updated card window body mount to plugin session host
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/cards/types.ts — Added optional stack plugin config contract (`bundleCode`, capabilities)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/plugin-intent-routing.test.ts — Routing/nav parity tests and denied-system-intent behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked C1-C5 complete

### Validation

- `npm run test -w packages/engine` — pass (`10` files, `107` tests)
- `npm run typecheck -w packages/engine` — pass
- `npm run build -w packages/engine` — pass

### Commit

- `d69a427` — `feat(engine): integrate plugin session host into desktop shell (Phase C)`


## 2026-02-15

Implemented HC-031 Phase D helper migration for Storybook/runtime integration: app/story helper APIs now support plugin-runtime path with optional legacy registries, structured params encoding, deterministic store seeding, and smoke checks for inventory/todo/crm/book-tracker-debug story groups.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createDSLApp.tsx — Updated helper contract to optional legacy shared registries
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/generateCardStories.tsx — Added structured params support (`params?: unknown`), deterministic `seedStore`, and `toStoryParam`
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/index.ts — Exported `toStoryParam`
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/story-helpers.test.ts — Added helper behavior tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/storybook-app-smoke.test.ts — Added app story group smoke checks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked D1-D5 complete

### Validation

- `npm run test -w packages/engine` — pass (`12` files, `114` tests)
- `npm run typecheck -w packages/engine` — pass
- `npm run build -w packages/engine` — pass

### Commit

- `a869dda` — `feat(engine): migrate app/story helpers for plugin runtime stories (Phase D)`


## 2026-02-15

Ran tmux + Playwright runtime validation and fixed the low-stock Storybook recursion (`Maximum update depth exceeded`) by stabilizing runtime ensure flow, reducing unnecessary shell subscriptions, memoizing window selectors, and making debug hook emission opt-in (default off) in app/story helper bootstraps.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/useCardRuntimeHost.ts — Added idempotent ensure-runtime guard to prevent repeated ensure dispatch cycles
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Mount legacy `CardSessionHost` directly for non-plugin stacks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx — Removed root-state selector churn and switched global projection strategy
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/windowing/selectors.ts — Memoized window list selectors to avoid unstable selector outputs
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createDSLApp.tsx — Added `enableDebugHooks` option (default `false`)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/generateCardStories.tsx — Added `enableDebugHooks` option (default `false`) for story runtime path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked G3 and partial G4 verification tasks complete

### Validation

- `npm run test -w packages/engine` — pass (`12` files, `114` tests)
- `npm run typecheck -w packages/engine` — pass
- tmux sessions:
  - `npm run storybook`
  - `npm run dev -w apps/inventory`
- Playwright:
  - Reproduced and then re-tested `http://localhost:6006/?path=/story/pages-cards--low-stock`
  - Final run: `0` console errors, recursion resolved

### Commit

- `0c537dd` — `fix(engine): stop low-stock story render recursion`


## 2026-02-15

Fixed plugin-runtime browser loading by switching engine QuickJS initialization to a singlefile MJS variant, eliminating Storybook/Vite `.wasm` fetch failures (`emscripten-module.wasm` 404) during plugin-card rendering.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.ts — Runtime module loader now uses memoized singlefile QuickJS variant
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/package.json — Added `@jitl/quickjs-singlefile-mjs-release-sync` dependency

### Validation

- `npm run typecheck` — pass
- `npm run test -w packages/engine` — pass
- Playwright low-stock story reload — no QuickJS wasm fetch errors

### Commit

- `0d16d37` — `fix(engine): use singlefile quickjs variant in browser runtime`


## 2026-02-15

Completed HC-031 Phase E1 inventory hard cutover to plugin runtime bundle and removed app-local legacy selector/action bridge and function-valued inventory card config surfaces.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.ts — New inventory plugin bundle with plugin card render/handler logic
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts — Stack migrated to plugin metadata + `bundleCode` capabilities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Removed shared selector/action runtime wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/stories/CardPages.stories.tsx — Story helper config now plugin-only
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/stories/Themed.stories.tsx — Story shell now plugin-only
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/app/cardRuntime.ts — Deleted legacy shared selector/action bridge
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/columnConfigs.ts — Deleted function-valued list column config
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/computeFields.ts — Deleted legacy computed-field callback config
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/formatters.ts — Deleted legacy formatter/cell-state callback config
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `E1` and `G4.1` complete

### Validation

- `npm run typecheck` — pass
- `npm run test` — pass
- tmux sessions:
  - `npm run storybook`
  - `npm run dev -w apps/inventory`
- Playwright:
  - low-stock Storybook page renders and is interactive
  - app home -> browse -> item detail -> sell action -> browse reflects updated quantity
  - console errors limited to dev favicon 404

### Commit

- `6fa0e61` — `feat(inventory): hard-cutover cards to plugin runtime bundle`

## 2026-02-15

Completed HC-031 Phase E3 CRM hard cutover to plugin runtime bundle, removed CRM-local descriptor runtime/card files, and migrated CRM chat fake-response navigation actions away from `Act(...)` descriptors.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/domain/pluginBundle.ts — New CRM plugin bundle with plugin card render/handler logic
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/domain/stack.ts — Stack migrated to plugin metadata + `bundleCode` capabilities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/App.tsx — Removed shared selector/action runtime wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/stories/CrmApp.stories.tsx — Story helper config now plugin-only
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/chat/crmChatResponses.ts — Replaced descriptor actions with plugin-intent-shaped nav payloads
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/app/cardRuntime.ts — Deleted legacy shared selector/action bridge
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/domain/cards/ — Deleted descriptor card definitions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `E3` complete

### Validation

- `npm run typecheck` — pass
- Playwright:
  - `http://localhost:6006/iframe.html?id=crm-full-app--default`
  - verified home/contacts/contact-detail flow and no runtime recursion/update-depth errors

### Commit

- `50e5b7e` — `feat(crm): hard-cutover cards and chat bridge to plugin runtime`

## 2026-02-15

Completed HC-031 Phase E4 book-tracker-debug hard cutover to plugin runtime bundle and removed app-local descriptor runtime/card files.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/domain/pluginBundle.ts — New book tracker plugin bundle
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/domain/stack.ts — Stack migrated to plugin metadata + `bundleCode` capabilities
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/App.tsx — Removed shared selector/action runtime wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx — Story helper config now plugin-only
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/app/cardRuntime.ts — Deleted legacy shared selector/action bridge
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/domain/cards/ — Deleted descriptor card definitions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `E4` complete

### Validation

- `npm run typecheck` — pass
- Playwright:
  - `http://localhost:6006/iframe.html?id=booktrackerdebug-full-app--default`
  - verified home/browse/book-detail flow and no runtime recursion/update-depth errors

### Commit

- `c8cfee4` — `feat(book-tracker): hard-cutover cards to plugin runtime bundle`


## 2026-02-15

Completed HC-031 Phase E5 by migrating remaining engine demo stories to plugin-runtime flows, removing descriptor-story dependencies from windowing and widget demo coverage.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx — Reworked shell story content to plugin runtime
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/CardSessionHost.stories.tsx — Migrated to plugin session-host story flow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/BookTracker.stories.tsx — Migrated widget demo to plugin stack bundle flow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `E5` complete

### Validation

- `npm run typecheck` — pass
- Storybook Playwright smoke for migrated story ids — pass

### Commit

- `04c94d8` — `refactor(stories): migrate shell and book tracker demos to plugin runtime`


## 2026-02-15

Completed HC-031 Phase F hard deletion of legacy descriptor runtime path and finished Phase G checks with explicit baseline reporting for unrelated build/lint failures.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/cards/runtime.ts — Replaced descriptor resolver/action engine with minimal debug shim
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/cards/types.ts — Removed descriptor DSL types; retained plugin metadata contracts
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — Removed legacy `hypercardRuntime` reducer from app store setup
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx — Runtime-authoritative card execution host
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx — Deleted legacy descriptor renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/useCardRuntimeHost.ts — Deleted legacy descriptor host bridge
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/CardSessionHost.tsx — Deleted legacy descriptor session host
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/__tests__/selector-resolution.test.ts — Deleted descriptor resolver tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `F1..F6`, `G1..G4`, and `G2.2/G2.3` with baseline notes

### Validation

- `npm run typecheck` — pass
- `npm run test -w packages/engine` — pass (`9` files, `89` tests)
- `npm run build` — fail (known Vite `worker.format` baseline issue)
- `npm run lint` — fail (known baseline Biome/style/import-order issues)
- Playwright runtime smoke (low-stock + migrated stories/apps) — pass, no update-depth recursion

### Commit

- `3a898d5` — `refactor(engine): remove legacy descriptor card runtime path`


## 2026-02-15

Completed HC-031 final publication pass (`G5`): updated design-doc outcomes, synchronized diary/changelog with final execution commits, ran `docmgr doctor`, and uploaded a versioned updated PDF to reMarkable.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md — Added implementation outcomes section for executed migration phases
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/reference/01-diary.md — Added Step 17/18/19 and final publication details
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/changelog.md — Added final migration and publication entries
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-031-VM-PLUGIN-DSL--vm-plugin-dsl-migration-analysis/tasks.md — Marked `G5`, `G5.1`, `G5.2`, `G5.3` complete

### Validation

- `docmgr doctor --ticket HC-031-VM-PLUGIN-DSL --stale-after 30` — one known warning (`missing_numeric_prefix`) on imported source file name
- `docmgr task check --ticket HC-031-VM-PLUGIN-DSL --id 65,66,67,68` — success; all tasks complete
- `remarquee upload bundle ... --name "HC-031-VM-PLUGIN-DSL-Analysis-Updated" --remote-dir "/ai/2026/02/15/HC-031-VM-PLUGIN-DSL" --non-interactive` — upload success
- `remarquee cloud ls /ai/2026/02/15/HC-031-VM-PLUGIN-DSL --long --non-interactive` — both original and updated documents present

## 2026-02-17

Bulk close through HC-034 per cleanup reset

