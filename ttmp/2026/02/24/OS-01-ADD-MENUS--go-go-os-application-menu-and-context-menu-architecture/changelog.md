# Changelog

## 2026-02-24

- Initial workspace created
- Added comprehensive design doc: focused-window dynamic menu architecture, context-menu runtime design, API references, pseudocode, migration phases, and test strategy
- Added investigation diary with chronological commands, findings, and rationale
- Updated index and tasks to reflect deliverables and remaining upload step


## 2026-02-24

Completed exhaustive architecture analysis for focused-window dynamic menus and shell context menus; authored design doc + investigation diary with API proposals, pseudocode, migration phases, and testing guidance for intern onboarding.

### Related Files

- /home/manuel/workspaces/2026-02-23/add-profile-registry/go-go-os/apps/inventory/src/App.tsx — Primary app integration reference for menu command behavior and focused chat debug flows.
- /home/manuel/workspaces/2026-02-23/add-profile-registry/go-go-os/packages/engine/src/chat/state/profileSlice.ts — Highlighted global profile selection limitation requiring scoped profile model for focused-window menus.
- /home/manuel/workspaces/2026-02-23/add-profile-registry/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Primary controller analyzed for dynamic menu/context-menu insertion design.


## 2026-02-24

Uploaded bundled ticket documentation to reMarkable as 'OS-01-ADD-MENUS Menu Architecture Analysis.pdf' in /ai/2026/02/24/OS-01-ADD-MENUS and verified remote listing.

### Related Files

- /home/manuel/workspaces/2026-02-23/add-profile-registry/geppetto/ttmp/2026/02/24/OS-01-ADD-MENUS--go-go-os-application-menu-and-context-menu-architecture/design-doc/01-go-go-os-dynamic-window-menus-and-context-menus-design.md — Primary analysis document included in the uploaded bundle.
- /home/manuel/workspaces/2026-02-23/add-profile-registry/geppetto/ttmp/2026/02/24/OS-01-ADD-MENUS--go-go-os-application-menu-and-context-menu-architecture/reference/01-investigation-diary.md — Investigation diary included in the uploaded bundle.


## 2026-02-25

Expanded `OS-01` from research-only TODOs into a full execution checklist covering contract work, shell runtime wiring, right-click/title-bar integration, context-menu component upgrade, inventory adoption, profile scoping, regression tests, validation, and ticket closure gates.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-01-ADD-MENUS--go-go-os-application-menu-and-context-menu-architecture/tasks.md — Detailed implementation task plan replacing research-only list.

Implemented OS-01 Phase 0/1/2/3 foundations in engine windowing: action contracts, command invocation metadata, focused-window runtime menu registry APIs/hooks, shell-integrated window context menu state/rendering, right-click title-bar/window handling, and upgraded command-capable context menu widget.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts — Added `DesktopAction*` contracts and `DesktopCommandInvocation` metadata with backward-compatible aliases.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.ts — Added deterministic `mergeActionSections` helper and invocation-aware contribution routing.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx — New runtime provider/scope/hook APIs for focused-window menu section registration.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Added runtime menu state, context-menu state, right-click command routing, and runtime registration plumbing.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx — Wired context-menu overlay rendering and runtime provider wrapping.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/WindowSurface.tsx — Added right-click handling and title-bar/surface context-menu delegation with focus-first behavior.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/widgets/ContextMenu.tsx — Added command/action entries, disabled/checked/shortcut support, and Escape close behavior while preserving string-item compatibility.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.test.ts — Added merge and invocation metadata tests.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/widgets/ContextMenu.stories.tsx — Added action-entry story coverage.

Validation for this slice:

- `pnpm --filter @hypercard/engine test -- src/components/shell/windowing/desktopContributions.test.ts`
- `pnpm --filter @hypercard/engine typecheck`
- `pnpm --filter @hypercard/os-launcher test`
- `pnpm --filter @hypercard/os-launcher build`
- `docmgr doctor --ticket OS-01-ADD-MENUS --stale-after 30` (clean after adding topic vocabulary slugs `menus` and `ui`)
