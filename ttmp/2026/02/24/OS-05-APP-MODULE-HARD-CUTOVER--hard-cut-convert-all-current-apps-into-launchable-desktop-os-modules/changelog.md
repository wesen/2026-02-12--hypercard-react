# Changelog

## 2026-02-24

- Initial workspace created


## 2026-02-24

Added detailed implementation plan and granular execution checklist for app module hard cutover ticket split.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-05-APP-MODULE-HARD-CUTOVER--hard-cut-convert-all-current-apps-into-launchable-desktop-os-modules/design-doc/01-os-05-implementation-plan.md — Per-app migration sequence and constraints
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-05-APP-MODULE-HARD-CUTOVER--hard-cut-convert-all-current-apps-into-launchable-desktop-os-modules/tasks.md — Granular implementation tasks


## 2026-02-24

Added OS-05 diary and initialized planning baseline entry.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-05-APP-MODULE-HARD-CUTOVER--hard-cut-convert-all-current-apps-into-launchable-desktop-os-modules/reference/01-diary.md — Ticket diary


## 2026-02-24

Hard-cut app module wiring landed (commit 2490060): added launcher modules in each app, replaced os-launcher placeholder factory with real app-owned modules, and wired desktop-os dependency/path references across app workspaces.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/book-tracker-debug/src/launcher/module.tsx — Book tracker LaunchableAppModule implementation
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/crm/src/launcher/module.tsx — CRM LaunchableAppModule implementation
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/module.tsx — Inventory LaunchableAppModule implementation
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/app/modules.tsx — Launcher host now consumes app-owned modules
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/todo/src/launcher/module.tsx — Todo LaunchableAppModule implementation


## 2026-02-24

Expanded host regression coverage (commit 625447d): added all-app icon launch assertions, per-module launch+render payload smoke checks, and guardrails against placeholder/legacy entrypoint references in module wiring.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — OS-05 module behavior regression tests


## 2026-02-24

Validation pass recorded: `pnpm --filter @hypercard/os-launcher build`, `pnpm --filter @hypercard/os-launcher test`, `pnpm test`, and per-app builds all passed. `pnpm lint` still fails with broad pre-existing repository diagnostics (generated pluginBundle authoring files and unrelated engine lint findings).

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/package.json — Validated build/test scripts
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/package.json — Recorded repository-wide test/lint command outcomes

## 2026-02-24

Updated README with desktop-os launcher module authoring pattern and host aggregation example (OS05-18).

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/README.md — Documented module-based extension model for launcher-first architecture


## 2026-02-24

Ticket closed


## 2026-02-24

Removed legacy standalone desktop boot wiring from app root entry components (commit 288d8ea); app roots now render through launcher modules only, and regression coverage asserts no direct DesktopShell boot remains in app App.tsx files.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/book-tracker-debug/src/App.tsx — Book tracker app root now delegates to bookTrackerLauncherModule.renderWindow
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/crm/src/App.tsx — CRM app root now delegates to crmLauncherModule.renderWindow
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/App.tsx — Inventory app root now delegates to inventoryLauncherModule.renderWindow
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — Added guardrail for removed standalone DesktopShell boot wiring
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/todo/src/App.tsx — Todo app root now delegates to todoLauncherModule.renderWindow

