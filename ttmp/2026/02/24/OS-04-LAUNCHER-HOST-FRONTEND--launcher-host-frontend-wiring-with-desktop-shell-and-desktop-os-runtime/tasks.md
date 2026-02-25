# Tasks

## Execution Checklist

- [x] `OS04-01` Create or repurpose launcher app package (`apps/os-launcher`) with workspace scripts.
- [x] `OS04-02` Add launcher app `tsconfig.json` and Vite config using repo conventions.
- [x] `OS04-03` Implement `src/main.tsx` provider bootstrap and theme wiring.
- [x] `OS04-04` Implement `src/app/store.ts` using `desktop-os/createLauncherStore`.
- [x] `OS04-05` Implement `src/app/modules.ts` assembling launchable modules list.
- [x] `OS04-06` Implement `src/app/registry.ts` using `createAppRegistry`.
- [x] `OS04-07` Implement icon model derivation using `buildLauncherIcons`.
- [x] `OS04-08` Wire desktop launcher grid component to manifest-driven icon list.
- [x] `OS04-09` Implement `openWindow` host action using engine window primitives.
- [x] `OS04-10` Implement app-key creation and attach it to window payload metadata.
- [x] `OS04-11` Implement app window renderer using `renderAppWindow`.
- [x] `OS04-12` Ensure unknown app/window payload fails safely with explicit UI fallback.
- [x] `OS04-13` Add smoke test for launcher boot with valid module set.
- [x] `OS04-14` Add negative test for registry collision boot failure.
- [x] `OS04-15` Add interaction test: click icon opens corresponding app window.
- [x] `OS04-16` Add test/assertion that host remains orchestration-only (no app-specific business logic).
- [x] `OS04-17` Validate desktop and mobile layout behavior for shell + window surfaces.
- [x] `OS04-18` Run `pnpm --filter @hypercard/os-launcher test` and `build` and capture results in changelog.
- [x] `OS04-19` Run full frontend smoke (`pnpm run lint`, `pnpm run test`) before handoff.
- [x] `OS04-20` Run `docmgr doctor --ticket OS-04-LAUNCHER-HOST-FRONTEND --stale-after 30`.

## Notes

- `OS04-19` is partially blocked: `pnpm run test` passes, but `pnpm run lint` currently fails due pre-existing repository-wide lint diagnostics outside OS-04 scope.

## Definition of Done

- [x] Launcher host boots with single store and manifest-driven icons.
- [x] App windows are opened and rendered only through desktop-os runtime APIs.
- [x] Tests cover core host behavior and failure paths.
