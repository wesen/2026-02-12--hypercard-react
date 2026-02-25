---
Title: Investigation diary
Ticket: OS-01-ADD-MENUS
Status: active
Topics:
    - frontend
    - architecture
    - ui
    - menus
    - go-go-os
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-go-os/apps/inventory/src/App.tsx
      Note: Primary integration target for app-specific menu and focused chat actions.
    - Path: go-go-os/packages/engine/src/chat/runtime/useConversation.ts
      Note: Evidence of global profile selection flow into websocket/session wiring.
    - Path: go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Primary investigation target for menu and command flow evidence.
    - Path: go-go-os/packages/engine/src/components/widgets/MacOS1Showcase.stories.tsx
      Note: Shows current ad-hoc context menu usage baseline.
    - Path: go-go-os/packages/engine/src/theme/desktop/primitives.css
      Note: Confirms context-menu styling primitives already available for shell integration.
ExternalSources: []
Summary: Chronological investigation log for OS-01-ADD-MENUS including commands, evidence, findings, design decisions, and delivery steps.
LastUpdated: 2026-02-24T22:52:55-05:00
WhatFor: Use this as a reproducible audit trail of how the menu/context-menu architecture analysis was performed and which files were used as evidence.
WhenToUse: Use when reviewing the design proposal, onboarding engineers, or continuing implementation planning in this ticket.
---


# Investigation diary

## Goal

Produce an exhaustive, implementation-ready architecture analysis for adding:

1. focused-window dynamic menu sections/actions,
2. right-click context menus for title bars and opt-in widgets,
3. clean command wiring for menu actions,

then store the analysis in the ticket and upload the deliverable to reMarkable.

## Context

The user requested a new docmgr ticket (`OS-01-ADD-MENUS`) and a deep analysis of `go-go-os/`, with intern-friendly detail, pseudocode, and API-level clarity.

Skills used in order:

1. `frontend-review-docmgr-remarkable` (primary workflow)
2. `docmgr` (ticket/document lifecycle + relate/changelog conventions)
3. `remarkable-upload` (bundle upload process)

## Chronological Log

## 2026-02-24 10:17 - Ticket Setup

### Commands

```bash
docmgr status --summary-only
docmgr ticket create-ticket --ticket OS-01-ADD-MENUS --title "go-go-os application menu and context-menu architecture" --topics frontend,architecture,ui,menus,go-go-os
docmgr doc add --ticket OS-01-ADD-MENUS --doc-type design-doc --title "go-go-os dynamic window menus and context menus design"
docmgr doc add --ticket OS-01-ADD-MENUS --doc-type reference --title "Investigation diary"
```

### Result

1. Ticket created under `geppetto/ttmp/2026/02/24/OS-01-ADD-MENUS--...`.
2. Primary design doc and diary doc created.

## 2026-02-24 10:18 - Repo and Surface Mapping

### Commands

```bash
pwd && ls -la
ls -la go-go-os
docmgr ticket list
find go-go-os -maxdepth 3 -type d
cat go-go-os/package.json
cat go-go-os/README.md
find go-go-os/packages -maxdepth 3 -type d
```

### Findings

1. `go-go-os` uses `packages/engine` as the shared desktop runtime and widgets package.
2. `apps/inventory` is the only app with substantial desktop contribution wiring.
3. Other apps (`todo`, `crm`, `book-tracker-debug`) use default `DesktopShell` configuration.

## 2026-02-24 10:19 - Menu/Window/Profile Evidence Sweep

### Commands

```bash
rg --files go-go-os/packages/engine/src
rg -n "menu|context|title bar|DesktopContribution|focus|profile" go-go-os/packages/engine/src go-go-os/apps/*/src -S
wc -l <key files>
```

### Findings

1. Menu system is in `components/shell/windowing/*`.
2. ContextMenu widget exists but is mostly isolated from shell runtime.
3. Profile registry integration exists in chat window header UI, not shell menus.

## 2026-02-24 10:20 - DesktopShell Architecture Read

### Commands

```bash
sed -n '1,260p' packages/engine/src/components/shell/windowing/{types.ts,desktopShellTypes.ts,desktopContributions.ts,desktopCommandRouter.ts}
sed -n '1,560p' packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
sed -n '1,260p' packages/engine/src/components/shell/windowing/{DesktopShell.tsx,DesktopShellView.tsx,DesktopMenuBar.tsx,WindowLayer.tsx,WindowSurface.tsx,WindowTitleBar.tsx}
sed -n '1,320p' packages/engine/src/desktop/core/state/{types.ts,windowingSlice.ts,selectors.ts}
```

### Findings

1. Menu sections are static (`id`, `label`, `items`).
2. Contribution menus are merged globally by section id with append semantics.
3. No focused-window dynamic menu registration path exists.
4. Command routing is deterministic but context-light (`commandId` centric).
5. Window focus state exists and is reliable (`focusedWindowId`), making it a good anchor for dynamic menu composition.

## 2026-02-24 10:21 - Inventory App Integration Read

### Commands

```bash
sed -n '1,760p' apps/inventory/src/App.tsx
sed -n '1,360p' packages/engine/src/chat/components/ChatConversationWindow.tsx
sed -n '1,260p' packages/engine/src/chat/state/profileSlice.ts
sed -n '1,260p' packages/engine/src/chat/runtime/{useProfiles.ts,useConversation.ts,useCurrentProfile.ts,useSetProfile.ts}
sed -n '1,220p' apps/inventory/src/app/store.ts
```

### Findings

1. Inventory uses `DesktopContribution` menus/commands heavily.
2. Focused-window chat conversation resolution is currently done manually in command handlers.
3. Profile selector is in `ChatConversationWindow` header, not in menubar/context-menu.
4. Profile selection state is global (`selectedProfile` + `selectedRegistry` singletons), which is a mismatch for true per-window/per-conversation profile switching.

## 2026-02-24 10:22 - Context Menu and Theme Sweep

### Commands

```bash
sed -n '1,220p' packages/engine/src/components/widgets/ContextMenu.tsx
sed -n '1,280p' packages/engine/src/components/widgets/MacOS1Showcase.stories.tsx
rg -n "context-menu|windowing-menu|windowing-window-title-bar" packages/engine/src/theme/desktop/*.css -S
sed -n '1,330p' packages/engine/src/theme/desktop/shell.css
sed -n '340,470p' packages/engine/src/theme/desktop/primitives.css
sed -n '70,170p' packages/engine/src/theme/desktop/tokens.css
```

### Findings

1. The visual primitives for context menus exist (`data-part="context-menu"`, related tokens).
2. Shell title bar has no right-click behavior.
3. Existing ContextMenu data model uses plain strings; no command IDs/payload metadata.

## 2026-02-24 10:23 - Line-Anchored Evidence Capture

### Commands

```bash
nl -ba <key files> | sed -n '<ranges>'
```

Captured line-anchored evidence for:

1. shell controller command and menu flow,
2. title bar/window pointer behavior,
3. context menu primitive limits,
4. inventory app contribution model,
5. global profile selection behavior.

This was used directly in the design doc’s current-state and gap-analysis sections.

## 2026-02-24 10:24 - Documentation Authoring

### Actions

1. Replaced design doc template with full architecture report:
- current-state map,
- gap analysis,
- API proposal,
- pseudocode,
- phase-by-phase implementation plan,
- test strategy,
- risk/alternatives/open questions.
2. Updated this diary with command trail and findings.

## Key Findings Summary

1. Current menu system is global and mostly static.
2. Focus state infrastructure is good and can power dynamic active-window menus.
3. Context menu UI exists but not shell-integrated and not command-aware.
4. Inventory app already demonstrates command routing extensibility and focus-aware debug behavior.
5. Profile selection is global and should be scoped to conversation to satisfy per-window profile menus cleanly.

## Tricky Points and Decision Rationale

### 1) Where to store dynamic menu/context runtime

Decision: keep runtime registries in `DesktopShell` controller local state/ref, not Redux.

Why:

1. menu/context UI state is transient and view-local,
2. avoids non-serializable function storage in Redux,
3. reduces global invalidation pressure.

### 2) How to wire actions cleanly

Decision: command-id-first model with optional payload + invocation context.

Why:

1. reuses existing contribution routing model,
2. keeps behavior deterministic,
3. avoids ad-hoc widget callback plumbing.

### 3) Profile menu semantics for focused chat windows

Decision: recommend scoped profile selections by conversation.

Why:

1. global selected profile conflicts with per-window expectations,
2. requested behavior implies conversation-local control.

## Quick Reference

### Most critical evidence files

1. `go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
2. `go-go-os/packages/engine/src/components/shell/windowing/desktopContributions.ts`
3. `go-go-os/packages/engine/src/components/shell/windowing/WindowTitleBar.tsx`
4. `go-go-os/packages/engine/src/components/widgets/ContextMenu.tsx`
5. `go-go-os/apps/inventory/src/App.tsx`
6. `go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx`
7. `go-go-os/packages/engine/src/chat/state/profileSlice.ts`
8. `go-go-os/packages/engine/src/chat/runtime/useConversation.ts`

### Deliverable doc

- `design-doc/01-go-go-os-dynamic-window-menus-and-context-menus-design.md`

## Usage Examples

### Example 1: Continue implementation in next session

1. Read design doc sections in order:
- executive summary,
- current-state evidence,
- proposed API,
- implementation phases.
2. Start from Phase 0 and Phase 1 file list.
3. Keep backward compatibility by preserving old `onCommand(commandId)` and existing contribution types.

### Example 2: Intern onboarding

1. Start with this diary’s chronological log to understand why each conclusion exists.
2. Open line-anchored files and compare to the proposed APIs.
3. Implement a minimal vertical slice:
- title-bar right-click -> context menu -> command routing,
- focused-window dynamic menu section registration.

## Related

1. Design doc in this ticket (`design-doc/01-go-go-os-dynamic-window-menus-and-context-menus-design.md`)
2. Ticket tasks (`tasks.md`)
3. Ticket changelog (`changelog.md`)

## 2026-02-24 22:00 - OS-01 implementation slice (Phase 0/1/2/3 foundations)

### Intent

Implement the first concrete menu/runtime slice from the OS-01 plan:

1. action + invocation contracts,
2. dynamic focused-window menu runtime registration APIs,
3. shell context-menu state/rendering with right-click title/surface hooks,
4. command-capable context-menu widget with compatibility.

### Commands

```bash
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os
rg -n "DesktopShell|ContextMenu|desktopContributions|WindowSurface|WindowTitleBar|useDesktopShellController" packages apps -S
sed -n '1,260p' packages/engine/src/components/shell/windowing/types.ts
sed -n '1,320p' packages/engine/src/components/shell/windowing/desktopContributions.ts
sed -n '1,560p' packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
sed -n '1,320p' packages/engine/src/components/shell/windowing/DesktopShellView.tsx
sed -n '1,260p' packages/engine/src/components/widgets/ContextMenu.tsx

pnpm --filter @hypercard/engine test -- src/components/shell/windowing/desktopContributions.test.ts
pnpm --filter @hypercard/engine typecheck
pnpm --filter @hypercard/os-launcher test
pnpm --filter @hypercard/os-launcher build
```

### Implementation notes

1. Added `DesktopActionItem`/`DesktopActionSection` and `DesktopCommandInvocation` in windowing types, while preserving existing `DesktopMenu*` aliases for compatibility.
2. Added `mergeActionSections` with deterministic order and section-level `merge: 'replace'` override support (default remains append).
3. Added invocation-aware command routing by extending `routeContributionCommand(..., invocation)` and `DesktopCommandHandler.run(..., invocation)`.
4. Added `desktopMenuRuntime.tsx` with:
   - `DesktopWindowMenuRuntimeProvider`
   - `DesktopWindowScopeProvider`
   - `useRegisterWindowMenuSections`
   - `useDesktopWindowId`
5. Updated shell controller to:
   - keep runtime menu sections keyed by `windowId`,
   - merge focused-window dynamic sections into menubar composition,
   - keep context-menu state with anchor and source metadata,
   - route context-menu commands through existing command router with invocation metadata,
   - expose runtime register/unregister callbacks.
6. Updated view/layer integration:
   - wrap `WindowLayer` with runtime provider,
   - wrap each window body with window scope provider,
   - render shell-integrated `ContextMenu` overlay from controller state.
7. Updated window primitives:
   - right-click handling in `WindowSurface` + `WindowTitleBar`,
   - right-click focuses target window first,
   - drag/resize still left-button only.
8. Upgraded `ContextMenu` widget:
   - supports action entries with `commandId`, `disabled`, `checked`, `shortcut`, `payload`,
   - preserves string-item compatibility via existing `onSelect(item: string)`,
   - adds Escape-to-close behavior.
9. Fixed action-item double-dispatch edge case:
   - action entry click now routes via `onAction` when provided,
   - falls back to `onSelect(commandId)` only when `onAction` is absent.

### Decisions locked in this slice

1. Dynamic section merge default is `append`; selective hard override is `merge: 'replace'`.
2. Shortcut behavior in v1 remains display-only (no global accelerator dispatch in this slice).
3. Default window right-click menu:
   - dialog windows: `Close Window`,
   - non-dialog windows: `Close Window`, separator, `Tile Windows`, `Cascade Windows`.

### Validation results

1. `pnpm --filter @hypercard/engine test -- src/components/shell/windowing/desktopContributions.test.ts` passed.
2. `pnpm --filter @hypercard/engine typecheck` passed.
3. `pnpm --filter @hypercard/os-launcher test` passed (with existing selector warnings from unrelated test paths).
4. `pnpm --filter @hypercard/os-launcher build` passed.
5. `docmgr doctor --ticket OS-01-ADD-MENUS --stale-after 30` passed after adding missing topic vocabulary entries (`menus`, `ui`).

### Remaining immediate follow-ups

1. Add explicit right-click interaction tests for window/title-bar path (`OS01-34`, `OS01-35`).
2. Adopt runtime focused-window menu registration in inventory chat windows (`OS01-50+`).
3. Implement profile-scoped selection model (`OS01-60+`) and connect dynamic profile menu section.

## 2026-02-24 22:27 - OS-01 inventory adoption (focused chat menus + title-bar context actions)

### Intent

Implement `OS01-50` through `OS01-55` so inventory chat windows provide focused dynamic menubar sections and chat-specific title-bar context actions, with deterministic conversation targeting.

### Commands

```bash
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os
sed -n '1,420p' apps/inventory/src/launcher/renderInventoryApp.tsx
sed -n '1,360p' apps/os-launcher/src/__tests__/launcherHost.test.tsx
pnpm --filter @hypercard/engine typecheck
pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherHost.test.tsx
pnpm --filter @hypercard/os-launcher build
```

### Implementation notes

1. Extended window runtime hooks in `desktopMenuRuntime.tsx`:
   - added `registerWindowContextActions` / `unregisterWindowContextActions`,
   - added `useRegisterWindowContextActions`.
2. Updated shell runtime/controller wiring so app-registered context actions are composed into window context-menu overlays.
3. Added inventory chat deterministic command model:
   - `inventory.chat.<convId>.debug.event-viewer`
   - `inventory.chat.<convId>.debug.timeline-debug`
   - `inventory.chat.<convId>.profile.select.<slug|__none__>`
4. Added parser/builders for these command IDs and command handlers that:
   - open debug windows for the specific `convId`,
   - update profile selection via `chatProfilesSlice.actions.setSelectedProfile`.
5. In `InventoryChatAssistantWindow`, added:
   - `useRegisterWindowMenuSections(...)` for focused `Chat` + `Profile` menu sections,
   - `useRegisterWindowContextActions(...)` for title-bar context actions.
6. Added launcher host regression test that asserts deterministic routing for chat-scoped debug/profile commands.

### Validation results

1. `pnpm --filter @hypercard/engine typecheck` passed.
2. `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherHost.test.tsx` passed.
3. `pnpm --filter @hypercard/os-launcher build` passed.

### Notes

1. Profile selection in this slice is still global state-backed; conversation-scoped profile selection remains tracked under `OS01-60`..`OS01-65`.

## 2026-02-24 22:34 - OS-01 right-click regression tests (`OS01-34`, `OS01-35`)

### Intent

Add direct integration tests for:

1. title-bar right-click opening a shell context menu,
2. right-click focusing the target unfocused window before menu open.

### Commands

```bash
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os
pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherContextMenu.test.tsx
```

### Implementation notes

1. Added `apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx` with jsdom integration coverage.
2. Test `opens shell context menu from title-bar right click` verifies context-menu DOM mount and expected default command entry text.
3. Test `focuses unfocused window before showing title-bar context menu` verifies right-click path updates focused window state (`data-state="focused"`) on the clicked window.

### Validation results

1. Targeted launcher test command passed (includes existing known selector warnings emitted by unrelated plugin-card selectors).

## 2026-02-24 22:40 - OS-01 scoped profile selection (`OS01-07`, `OS01-60`..`OS01-65`)

### Intent

Complete profile-selection scoping for focused chat menu behavior so each conversation window can maintain an independent selected profile while preserving global fallback for non-scoped consumers.

### Commands

```bash
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os
git diff --stat
git diff -- packages/engine/src/chat/state/profileSlice.ts packages/engine/src/chat/state/selectors.ts
git diff -- packages/engine/src/chat/runtime/useCurrentProfile.ts packages/engine/src/chat/runtime/useSetProfile.ts packages/engine/src/chat/runtime/useProfiles.ts packages/engine/src/chat/runtime/useConversation.ts
git diff -- packages/engine/src/chat/components/ChatConversationWindow.tsx apps/inventory/src/launcher/renderInventoryApp.tsx
git diff -- packages/engine/src/chat/state/profileSlice.test.ts packages/engine/src/chat/state/selectors.test.ts apps/os-launcher/src/__tests__/launcherHost.test.tsx

pnpm --filter @hypercard/engine test -- src/chat/state/profileSlice.test.ts src/chat/state/selectors.test.ts src/chat/runtime/useProfiles.test.ts
pnpm --filter @hypercard/engine typecheck
pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx
pnpm --filter @hypercard/os-launcher build
```

### Implementation notes

1. Extended `ChatProfilesState` with `selectedByScope: Record<string, {profile, registry}>`.
2. Updated `chatProfilesSlice.actions.setSelectedProfile` to accept optional `scopeKey`:
1. when present, selection writes only to `selectedByScope[scopeKey]`,
2. when absent, selection continues writing global `selectedProfile`/`selectedRegistry`.
3. Added `clearScopedProfile({ scopeKey })` reducer and kept `clearSelectedProfile()` global reset behavior.
4. Updated selector `selectCurrentProfileSelection(state, scopeKey?)`:
1. returns scoped value when available,
2. falls back to global selection when scoped value is missing.
5. Threaded optional scope support through runtime hooks:
1. `useCurrentProfile(scopeKey?)`,
2. `useSetProfile(basePrefix, { scopeKey? })`,
3. `useProfiles(basePrefix, registry, { enabled, scopeKey })`,
4. `useConversation(convId, basePrefix, scopeKey?)`.
6. Updated `ChatConversationWindow` with `profileScopeKey` prop and passed it through all profile-aware hooks.
7. Wired inventory launcher chat window to use `profileScopeKey={\`conv:${convId}\`}` and updated profile command routing/menu checks to read/write scoped state.
8. Added/updated tests:
1. reducer coverage for scoped selection lifecycle,
2. selector coverage for scoped lookup + fallback,
3. launcher host assertion for scoped profile command payload (`scopeKey: 'conv:conv-42'`).

### Validation results

1. `pnpm --filter @hypercard/engine test -- src/chat/state/profileSlice.test.ts src/chat/state/selectors.test.ts src/chat/runtime/useProfiles.test.ts` passed.
2. `pnpm --filter @hypercard/engine typecheck` passed.
3. `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherHost.test.tsx src/__tests__/launcherContextMenu.test.tsx` passed.
4. `pnpm --filter @hypercard/os-launcher build` passed.

## 2026-02-24 22:50 - OS-01 phase-6 regression/story coverage (`OS01-15`, `OS01-70`..`OS01-75`, `OS01-81`)

### Intent

Complete remaining menu/runtime regression and story coverage so focused runtime menu behavior, context-menu invocation metadata, and non-chat-app stability are test-backed and demonstrated in Storybook.

### Commands

```bash
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os
sed -n '1,340p' packages/engine/src/components/shell/windowing/desktopContributions.test.ts
sed -n '1,360p' packages/engine/src/components/shell/windowing/DesktopMenuBar.tsx
sed -n '1,760p' packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
sed -n '1,360p' apps/os-launcher/src/__tests__/launcherHost.test.tsx
sed -n '1,340p' apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx

pnpm --filter @hypercard/engine test -- src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/DesktopShell.contextMenu.test.tsx
pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherMenuRuntime.test.tsx
pnpm --filter @hypercard/engine typecheck
pnpm --filter @hypercard/os-launcher build
```

### Implementation notes

1. Added legacy compatibility regression to `desktopContributions.test.ts`:
1. asserted legacy `DesktopMenuSection` aliases still merge identically,
2. preserved separator + item ordering.
2. Added new jsdom integration file `DesktopShell.contextMenu.test.tsx`:
1. verifies title-bar context action invocation carries `source`, `menuId`, `windowId`, `widgetId`, and `payload`,
2. verifies focused-window menu recomposition adds/removes dynamic `Chat`/`Profile` sections across focus changes.
3. Added launcher regression file `launcherMenuRuntime.test.tsx`:
1. opens `todo`/`crm`/`book-tracker-debug` workspace windows together,
2. verifies no `Chat`/`Profile` dynamic sections appear while switching focus among non-chat apps,
3. verifies title-bar context menu stays on default non-inventory actions.
4. Added DesktopShell stories:
1. `WithFocusedRuntimeMenus`,
2. `WithTitleBarContextMenuActions`.
5. Added ContextMenu story:
1. `WidgetTargetActions` showing payload-driven widget targeting patterns.

### Failure/debugging notes

1. First attempt for launcher runtime regression opened a real inventory chat window in jsdom.
2. That path left persistent runtime handles (chat runtime/connect flow), causing `vitest` worker hang.
3. Resolution:
1. terminated hung worker process,
2. replaced test with non-chat module regression coverage in launcher test,
3. moved focus-recomposition assertions to engine-level DesktopShell integration test with controlled test windows.

### Validation results

1. `pnpm --filter @hypercard/engine test -- src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/DesktopShell.contextMenu.test.tsx` passed.
2. `pnpm --filter @hypercard/os-launcher test -- src/__tests__/launcherMenuRuntime.test.tsx` passed.
3. `pnpm --filter @hypercard/engine typecheck` passed.
4. `pnpm --filter @hypercard/os-launcher build` passed.

## 2026-02-24 22:52 - OS-01 docs guidance + full validation (`OS01-76`, `OS01-82`)

### Intent

Finish remaining non-manual work by documenting authoring guidance for menu runtime adoption and executing full workspace validation.

### Commands

```bash
cd /home/manuel/workspaces/2026-02-24/add-menus/go-go-os
cat package.json
pnpm test
pnpm build
```

### Implementation notes

1. Added new engine documentation file: `packages/engine/docs/desktop-menu-runtime-authoring.md`.
2. Document includes:
1. static contribution patterns,
2. focused runtime menu registration,
3. title-bar context actions,
4. invocation metadata contract,
5. profile-scope hook usage,
6. test/story checklists.
3. Updated OS-01 tasks and DoD checklist with completed docs/validation items.

### Validation results

1. `pnpm test` passed:
1. engine tests passed,
2. desktop-os tests passed,
3. os-launcher tests passed.
2. `pnpm build` passed:
1. engine, confirm-runtime, desktop-os, inventory, todo, crm, book-tracker-debug, and os-launcher builds passed.
3. Known warnings remained non-blocking:
1. existing selector memoization warnings from `PluginCardSessionHost` tests,
2. Vite bundle-size and browser-externalization warnings.
