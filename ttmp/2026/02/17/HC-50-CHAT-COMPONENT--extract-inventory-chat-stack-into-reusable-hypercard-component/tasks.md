# Tasks

## TODO

- [x] Add tasks here
- [x] Analyze Inventory chat architecture and coupling in detail
- [x] Write 4+ page extraction design doc with reusable architecture options
- [x] Compare Inventory chat implementation to Pinocchio web-chat/debug-ui
- [x] Upload analysis document to reMarkable and verify cloud path

## Implementation: HyperCard Subsystem Extraction

- [x] A1. Update HC-50 implementation plan section for hard cutover of artifact/card/editor subsystem into `@hypercard/engine`
- [x] A2. Add/expand diary entries for implementation phase kickoff and task breakdown
- [x] B1. Create new engine module structure for reusable hypercard chat tooling (`artifacts`, `widgets`, `event-viewer`, `runtime-card-tools`, `window-adapters`)
- [x] B2. Move artifact domain logic to engine (`artifactRuntime`, `timelineProjection`, `artifacts` redux slice/selectors)
- [x] B3. Move timeline/artifact panel UI to engine and decouple from Inventory-only type imports
- [x] B4. Move event viewer and event bus to engine with reusable envelope/event contracts
- [x] B5. Move code editor and runtime-card debug tooling to engine (runtime-card tools subsystem)
- [x] C1. Introduce/implement updated window adapter contracts in engine (`WindowHost`, `ChatWindowAdapter`, `ArtifactWindowAdapter`, `RuntimeCardToolsAdapter`)
- [x] C2. Export new subsystem from engine barrel (`packages/engine/src/index.ts` and local subsystem index)
- [x] D1. Cut Inventory over to engine subsystem imports/exports (remove direct ownership of moved logic)
- [x] D2. Keep only Inventory-specific glue where appropriate (for example stack binding for runtime debug window)
- [x] E1. Update/add tests affected by module moves (artifacts/timeline projection/event bus)
- [x] E2. Run targeted test commands for engine + inventory chat paths and fix regressions
- [x] F1. Update diary with step-by-step implementation results, failures, and review instructions
- [x] F2. Update ticket changelog + related files and run `docmgr doctor`
