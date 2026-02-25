# Tasks

## Execution Checklist

- [x] `OS05-01` Create migration inventory table mapping each app from current boot entrypoint to new module file.
- [x] `OS05-02` Add `apps/inventory/src/launcher/module.ts` implementing `LaunchableAppModule`.
- [x] `OS05-03` Add/adjust inventory launch window builder to return module-owned window payload.
- [x] `OS05-04` Add inventory renderer adapter for launcher window content.
- [x] `OS05-05` Add `apps/todo/src/launcher/module.ts` and wire todo app root rendering.
- [x] `OS05-06` Add `apps/crm/src/launcher/module.ts` and wire crm app root rendering.
- [x] `OS05-07` Add `apps/book-tracker-debug/src/launcher/module.ts` and wire book-tracker rendering.
- [x] `OS05-08` Add app manifest metadata for labels/icons/order across all modules.
- [x] `OS05-09` Add optional reducer + `stateKey` metadata where each app owns launcher state.
- [x] `OS05-10` Build consolidated module list export consumed by launcher host.
- [x] `OS05-11` Ensure module list passes registry validation with no ID or state-key collisions.
- [x] `OS05-12` Remove superseded standalone app launch wiring from app-local `App.tsx` and `main.tsx` paths.
- [x] `OS05-13` Remove unused exports/utilities introduced solely for old standalone boot mode.
- [x] `OS05-14` Add per-app module smoke tests for render + launch metadata.
- [x] `OS05-15` Add integration test that each app icon opens a valid window.
- [x] `OS05-16` Add regression assertion that no legacy standalone entrypoint is referenced by launcher host.
- [x] `OS05-17` Run `npm run lint test build` and record output in changelog.
- [x] `OS05-18` Update docs/README snippets to point to module-based extension pattern.
- [x] `OS05-19` Run `docmgr doctor --ticket OS-05-APP-MODULE-HARD-CUTOVER --stale-after 30`.

## Definition of Done

- [x] All current frontend apps are represented as launchable modules.
- [x] Standalone app boot paths replaced by launcher-first composition.
- [x] Module registry is collision-free and fully test-covered.
