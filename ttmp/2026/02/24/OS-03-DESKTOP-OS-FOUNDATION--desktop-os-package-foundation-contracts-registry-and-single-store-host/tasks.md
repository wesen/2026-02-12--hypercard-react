# Tasks

## Execution Checklist

- [x] `OS03-01` Create `packages/desktop-os/package.json` and wire workspace scripts (`build`, `lint`, `test`, `typecheck`).
- [x] `OS03-02` Create `packages/desktop-os/tsconfig.json` extending repo TypeScript baseline.
- [x] `OS03-03` Create `packages/desktop-os/src/index.ts` public exports and keep surface minimal.
- [x] `OS03-04` Add `packages/desktop-os/README.md` with strict dependency rule `desktop-os -> engine`.
- [x] `OS03-05` Implement `contracts/appManifest.ts` with manifest model + validation helpers.
- [x] `OS03-06` Implement `contracts/launchableAppModule.ts` with locked module interface.
- [x] `OS03-07` Implement `contracts/launcherHostContext.ts` and `contracts/launcherRenderContext.ts`.
- [x] `OS03-08` Implement `registry/createAppRegistry.ts` with collision detection and deterministic ordering.
- [x] `OS03-09` Implement `runtime/appKey.ts` parser/formatter and error cases.
- [x] `OS03-10` Implement `runtime/buildLauncherIcons.ts` from registry manifests.
- [x] `OS03-11` Implement `runtime/buildLauncherContributions.ts` merged deterministic contribution view.
- [x] `OS03-12` Implement `runtime/renderAppWindow.ts` resolver delegating to module renderer.
- [x] `OS03-13` Implement `store/createLauncherStore.ts` with single-store reducer composition.
- [x] `OS03-14` Add fail-fast checks for duplicate reducer keys at startup.
- [x] `OS03-15` Add typed selector utilities for module state keyed by `stateKey`.
- [x] `OS03-16` Add unit tests for contract and manifest validation.
- [x] `OS03-17` Add unit tests for registry collision and ordering guarantees.
- [x] `OS03-18` Add unit tests for app-key parse/format roundtrips.
- [x] `OS03-19` Add unit tests for store creation and duplicate reducer key failures.
- [x] `OS03-20` Run `pnpm --filter @hypercard/desktop-os lint`, `test`, and `build` and capture results in changelog.
- [x] `OS03-21` Update ticket changelog + related files and run `docmgr doctor --ticket OS-03-DESKTOP-OS-FOUNDATION --stale-after 30`.

## Definition of Done

- [x] All tasks above are complete.
- [x] `packages/desktop-os` APIs are stable enough for OS-04 and OS-05 to consume.
- [x] No compatibility wrappers or legacy alias exports were added.
