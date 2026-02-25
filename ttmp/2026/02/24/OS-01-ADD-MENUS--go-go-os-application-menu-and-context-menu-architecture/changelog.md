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

Implemented OS-01 inventory adoption slice (`OS01-50`..`OS01-55`): chat windows now register focused runtime menu sections and title-bar context actions, profile/debug menu entries are conversation-scoped, and command routing supports deterministic `inventory.chat.<convId>.*` targets.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — Added focused chat menu/context registration hooks and deterministic chat-scoped command parsing/routing.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx — Extended runtime APIs to register/unregister window context actions in addition to menu sections.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Composed app-registered window context actions into shell context-menu rendering.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx — Passed context-action runtime callbacks through provider wiring.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — Added regression test for deterministic inventory chat debug/profile command routing.

Validation for this slice:

- `pnpm --filter @hypercard/engine typecheck`
- `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherHost.test.tsx`
- `pnpm --filter @hypercard/os-launcher build`

Added right-click regression tests for title-bar context-menu open behavior and focus transfer on context-menu invocation.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx — New jsdom integration tests for `OS01-34` and `OS01-35`.

Validation for this slice:

- `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherContextMenu.test.tsx`

Implemented OS-01 profile-scope companion slice (`OS01-07`, `OS01-60`..`OS01-65`): chat profile selection now supports conversation-scoped keys with global fallback, runtime hooks consume optional scope keys, and inventory chat wires profile scope to `conv:<id>` for deterministic per-conversation profile menus.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/profileSlice.ts — Added `selectedByScope` state plus scoped `setSelectedProfile` and `clearScopedProfile`.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/selectors.ts — Updated `selectCurrentProfileSelection` to resolve scoped selection with global fallback.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useProfiles.ts — Added `scopeKey` option and scoped selection reconciliation during refresh.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useConversation.ts — Added optional `scopeKey` consumption for connection/send profile selection.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx — Added `profileScopeKey` prop and threaded through runtime hooks.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/inventory/src/launcher/renderInventoryApp.tsx — Scoped inventory profile menu reads/dispatches to `conv:<id>`.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/profileSlice.test.ts — Added scoped selection reducer coverage.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/state/selectors.test.ts — Added scoped selection + fallback selector coverage.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherHost.test.tsx — Updated profile command assertion to include scoped payload.

Validation for this slice:

- `pnpm --filter @hypercard/engine test -- src/chat/state/profileSlice.test.ts src/chat/state/selectors.test.ts src/chat/runtime/useProfiles.test.ts`
- `pnpm --filter @hypercard/engine typecheck`
- `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx`
- `pnpm --filter @hypercard/os-launcher build`

Completed OS-01 phase-6 regression/story coverage slice (`OS01-15`, `OS01-70`..`OS01-75`, `OS01-81`): added legacy menu-shape compatibility tests, context-menu invocation metadata integration test, multi-window focused menu recomposition test, non-chat app regression checks, and new stories for focused runtime menus/title-bar context actions/widget-targeted context actions.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.test.ts — Added compatibility regression for legacy `DesktopMenuSection` alias shapes.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.contextMenu.test.tsx — Added context-menu invocation metadata and multi-window focus/menu recomposition integration tests.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherMenuRuntime.test.tsx — Added non-chat app regression tests ensuring default menu/context behavior across `todo`/`crm`/`book-tracker-debug`.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx — Added focused runtime menubar and title-bar context-menu stories.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/widgets/ContextMenu.stories.tsx — Added widget-target payload action story.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-01-ADD-MENUS--go-go-os-application-menu-and-context-menu-architecture/tasks.md — Marked completed checklist items and DoD updates.

Validation for this slice:

- `pnpm --filter @hypercard/engine test -- src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/DesktopShell.contextMenu.test.tsx`
- `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherMenuRuntime.test.tsx`
- `pnpm --filter @hypercard/engine typecheck`
- `pnpm --filter @hypercard/os-launcher build`

Added engine menu runtime authoring guide (`OS01-76`) and completed full frontend validation run (`OS01-82`) for the entire workspace.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/docs/desktop-menu-runtime-authoring.md — New guidance for static/dynamic menu contributions, context actions, invocation metadata, profile scoping, and validation checklist.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/24/OS-01-ADD-MENUS--go-go-os-application-menu-and-context-menu-architecture/tasks.md — Marked docs + full validation tasks complete and updated DoD coverage.

Validation for this slice:

- `pnpm test`
- `pnpm build`

## 2026-02-25

Manual right-click verification passed; all OS-01 tasks complete; ticket closed.

