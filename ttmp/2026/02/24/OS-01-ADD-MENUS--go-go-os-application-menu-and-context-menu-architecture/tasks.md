# Tasks

## Execution Checklist

### Ticket setup and decisions

- [x] `OS01-00` Create ticket `OS-01-ADD-MENUS` and initialize docs.
- [x] `OS01-01` Map current desktop/menu/window/profile architecture with concrete evidence.
- [x] `OS01-02` Produce design doc with API proposals, migration plan, and tests.
- [x] `OS01-03` Produce investigation diary and upload analysis bundle.
- [x] `OS01-04` Decide focused-window merge policy for dynamic sections (`append` vs `replace` defaults).
- [x] `OS01-05` Decide v1 shortcut behavior (`display-only` vs global execution handler).
- [x] `OS01-06` Decide title-bar default context entries for dialog windows.
- [x] `OS01-07` Decide profile-scope cache strategy (shared profile list + scoped selection).

### Phase 0: Contracts and compatibility

- [x] `OS01-10` Add `DesktopActionEntry`/`DesktopActionSection` types in windowing contracts.
- [x] `OS01-11` Add `DesktopCommandInvocation` metadata contract (`source`, `menuId`, `windowId`, `widgetId`, `payload`).
- [x] `OS01-12` Keep backward-compatible typing for existing `DesktopMenuItem`/`DesktopMenuSection` usage.
- [x] `OS01-13` Add/extend section merge helpers for deterministic section/item ordering.
- [x] `OS01-14` Add unit tests for merge precedence and stable ordering.
- [x] `OS01-15` Add unit tests confirming old contribution shapes still compile and behave.

### Phase 1: Shell runtime for dynamic menus/context menus

- [x] `OS01-20` Add runtime registry module for dynamic focused-window menu sections.
- [x] `OS01-21` Add runtime API/hook to register/unregister window menu sections.
- [x] `OS01-22` Add controller state for context-menu open/close and anchor position.
- [x] `OS01-23` Compose effective menu sections from static contributions + focused-window runtime sections.
- [x] `OS01-24` Ensure focused-window switches recompute effective menu sections correctly.
- [x] `OS01-25` Route context-menu command actions through existing desktop command router.
- [x] `OS01-26` Extend controller result contract with context-menu props/state.
- [x] `OS01-27` Render context-menu overlay in `DesktopShellView` using controller state.
- [x] `OS01-28` Export new runtime APIs from shell barrels (`windowing`, `desktop-react`, `desktop/react`).

### Phase 2: Window/title-bar right-click integration

- [x] `OS01-30` Add `onContextMenu` handling in `WindowSurface`.
- [x] `OS01-31` Add `onContextMenu` handling in `WindowTitleBar`.
- [x] `OS01-32` Ensure right-click focuses target window before showing context menu.
- [x] `OS01-33` Preserve drag/resize behavior: left button only, unchanged.
- [x] `OS01-34` Add unit tests for title-bar right-click interaction path.
- [x] `OS01-35` Add unit tests for focused-window transition on right-click.

### Phase 3: ContextMenu component upgrade

- [x] `OS01-40` Upgrade `ContextMenu` to support command-based action entries.
- [x] `OS01-41` Support separators, disabled states, checked states, and shortcut labels.
- [x] `OS01-42` Keep compatibility path for existing string-only entries.
- [x] `OS01-43` Add `Escape` close behavior.
- [x] `OS01-44` Add/update stories demonstrating action entries and compatibility mode.

### Phase 4: Inventory app adoption

- [x] `OS01-50` Pass `windowId` to chat-window render path used for menu registration.
- [x] `OS01-51` Register focused chat dynamic menu sections in inventory app runtime.
- [x] `OS01-52` Add profile-selection dynamic section for focused chat windows.
- [x] `OS01-53` Add debug actions (`event viewer`, `timeline debug`) as focused-window menu items.
- [x] `OS01-54` Add title-bar context menu actions for chat windows.
- [x] `OS01-55` Ensure commands target focused conversation/window deterministically.

### Phase 5: Profile selection scoping (companion)

- [x] `OS01-60` Refactor profile slice to support scoped selection keys.
- [x] `OS01-61` Update profile selectors to resolve scoped selection with global fallback.
- [x] `OS01-62` Update `useCurrentProfile`/`useSetProfile`/`useProfiles` for scope key support.
- [x] `OS01-63` Update `useConversation` to consume scoped profile selection.
- [x] `OS01-64` Wire inventory chat profile scope to `conv:<id>`.
- [x] `OS01-65` Add migration-safe tests for scoped + fallback behavior.

### Phase 6: Stories, docs, and regressions

- [x] `OS01-70` Add DesktopShell story for focused dynamic menubar sections.
- [x] `OS01-71` Add story for title-bar right-click context menu.
- [x] `OS01-72` Add story for widget-level context-menu target actions.
- [x] `OS01-73` Add unit/integration tests for context-menu invocation metadata.
- [x] `OS01-74` Add integration tests for multi-window focus/menu recomposition.
- [x] `OS01-75` Add regression tests ensuring existing apps (`todo`, `crm`, `book-tracker-debug`) are unaffected.
- [x] `OS01-76` Update engine/docs menu and context-menu authoring guidance.

### Validation and closure

- [x] `OS01-80` Run targeted engine tests for shell/windowing/menu suites.
- [x] `OS01-81` Run app-level tests for inventory focused menu and profile-scoping behavior.
- [x] `OS01-82` Run full frontend validation (`npm run test`, `npm run build`) and record results.
- [x] `OS01-83` Manually verify right-click behavior and native context-menu suppression.
- [x] `OS01-84` Update ticket changelog and diary with implementation details and failures.
- [x] `OS01-85` Run `docmgr doctor --ticket OS-01-ADD-MENUS --stale-after 30`.
- [x] `OS01-86` Close ticket `OS-01-ADD-MENUS` once DoD is satisfied.

## Definition of Done

- [x] Focused window can contribute and update top menubar sections at runtime.
- [x] Title bars and widget targets can open shell-integrated context menus.
- [x] Context-menu actions route through unified desktop command routing with invocation metadata.
- [x] Inventory chat menu/profile/debug flows are focused-window-scoped and deterministic.
- [x] Existing non-chat apps continue to function without new menu-runtime adoption.
- [x] Storybook/docs/tests cover both compatibility and new dynamic-runtime paths.
- [x] Ticket artifacts (tasks/changelog/diary) and `docmgr doctor` are clean.
