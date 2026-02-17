# Changelog

## 2026-02-17

- Initial workspace created
- Added comprehensive architecture assessment document for reusable desktop/windowing framework extraction
- Added phased implementation plan document with detailed workstreams, tasks, acceptance criteria, and migration strategy
- Updated ticket index/tasks metadata to reflect completed analysis and planning phase
- Added docmgr related-file links for analysis, plan, and diary artifacts
- Added `windowing` and `design-system` topic vocabulary entries and re-ran doctor checks
- Uploaded bundled design docs to reMarkable at `/ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK/HC-45 Desktop Framework Analysis and Plan`
- Added hard-cutover implementation task block (`T1`-`T4`) to ticket tasks
- Completed `T1`: moved windowing state from `features/windowing` to `desktop/core/state` and removed legacy source files
- Completed `T2`: extracted built-in desktop command routing into `desktopCommandRouter` with dedicated tests
- Completed `T3`: split monolithic `DesktopShell` into `useDesktopShellController` + `DesktopShellView` composition
- Updated engine exports/imports to desktop core state paths and validated with `npm run -w packages/engine test`
- Added Workstream C contracts: `desktopContributions` composer (menus/icons/commands/startup windows) and contribution command routing
- Added Workstream D contracts: `windowContentAdapter` chain with default app/card/fallback adapters
- Updated shell controller to use contribution command lane and adapter chain (no direct card-host rendering in controller)
- Migrated inventory desktop customization (`menus`/`icons`/`onCommand`/startup side-effects) to contribution objects
- Added C/D unit tests (`desktopContributions.test.ts`, `windowContentAdapter.test.ts`) and revalidated engine tests
- Completed Workstream E CSS hard cutover by splitting `theme/base.css` into modular packs under `theme/desktop/*`
- Replaced app and Storybook theme imports to use `@hypercard/engine/src/theme` modular entrypoint
- Removed legacy `packages/engine/src/theme/base.css` and updated theme/docs comments to new import contract
- Added `theme/desktop/theme/macos1.css` as dedicated desktop skin layer for explicit theming
- Revalidated with `npm run typecheck` and `npm run -w packages/engine test`
- Added postmortem document `design-doc/03-postmortem-hc-45-desktop-framework-execution-and-current-state.md` comparing original HC-45 A-G plan with implemented outcomes across HC-45/HC-47/HC-48 and listing deferred cleanup work
- Uploaded postmortem PDF to reMarkable path `/ai/2026/02/17/HC-45-DESKTOP-FRAMEWORK/03-postmortem-hc-45-desktop-framework-execution-and-current-state`
