---
Title: Desktop Migration Implementation Plan
Ticket: HC-030-DESKTOP-CUTOVER
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Legacy shell slated for deletion
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Target shell for all apps/helpers
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createDSLApp.tsx
      Note: Helper migration from HyperCardShell API to DesktopShell API
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/generateCardStories.tsx
      Note: Story helper migration and navigation-cutover impact
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/navigation/navigationSlice.ts
      Note: Legacy navigation slice intended for hard removal
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: Store shape change when navigation slice is removed
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/index.ts
      Note: Public API surface changes for hard cutover
ExternalSources: []
Summary: Hard-cut migration plan to make DesktopShell the only shell, remove legacy single-window shell/navigation APIs, and migrate all apps/story helpers with no backwards-compatibility shims.
LastUpdated: 2026-02-15T12:32:00-05:00
WhatFor: Provide implementation-level sequencing and impact analysis for removing legacy shell/navigation while preserving runtime correctness and app functionality.
WhenToUse: Use during HC-030 implementation and review to track sequence, risk controls, and expected breakages.
---

# Desktop Migration Implementation Plan

## Executive Summary

HC-030 is a hard cutover ticket: DesktopShell/windowing becomes the only supported shell architecture. Legacy single-window shell primitives (`HyperCardShell`, `Layout*`, `TabBar`, `WindowChrome`, `NavBar`) and legacy navigation state (`features/navigation`) are removed, not deprecated.

This migration intentionally breaks compatibility to simplify architecture and reduce duplicate runtime paths. All application entrypoints and helper APIs must be migrated in the same ticket so the repo remains coherent and buildable.

Primary outcomes:
- One shell architecture (DesktopShell + CardSessionHost).
- One runtime-host code path for card execution.
- No legacy navigation slice in engine store.
- Updated helper APIs for app bootstrap and card stories under windowing.

## Problem Statement

The repository currently has two competing shell systems:
- Legacy: `HyperCardShell` + navigation slice + layout modes.
- New: `DesktopShell` + windowing slice + per-session nav.

This duplication increases complexity and causes drift:
- Runtime command/selector wiring duplicated across shell paths.
- Store shape includes legacy navigation even when apps are desktop-windowed.
- App/story helper APIs encode legacy assumptions (`navShortcuts`, `navigate()` setup).
- Public engine API exports both old and new shell stacks, making architecture unclear.

With no backwards-compatibility requirement, keeping both paths is net negative.

## Proposed Solution

Execute a phased hard cutover that keeps the repo running at every phase but removes legacy behavior entirely by the end.

### Target architecture

- App shell: `DesktopShell`
- Card host: `CardSessionHost`
- Card runtime orchestration: shared hook (`useCardRuntimeHost`)
- Navigation: window session navigation in windowing slice only
- Store: `hypercardRuntime`, `windowing`, `notifications`, `debug`, plus domain reducers

### Helper API direction

`createDSLApp` and `createStoryHelpers` are migrated to DesktopShell semantics:
- Replace legacy `navShortcuts` config with `icons` and optional `menus`.
- Remove dependency on `navigate()` and `navigation` selectors.
- Support targeted “open card” story flows using windowing/session actions instead of global navigation stack mutation.

### Deletion scope (hard removal)

Engine shell components to delete after migration:
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/shell/LayoutSplit.tsx`
- `packages/engine/src/components/shell/LayoutDrawer.tsx`
- `packages/engine/src/components/shell/LayoutCardChat.tsx`
- `packages/engine/src/components/shell/TabBar.tsx`
- `packages/engine/src/components/shell/WindowChrome.tsx`
- `packages/engine/src/components/shell/NavBar.tsx`

Legacy state to delete after migration:
- `packages/engine/src/features/navigation/navigationSlice.ts`
- `packages/engine/src/features/navigation/selectors.ts`
- `packages/engine/src/__tests__/navigation.test.ts`

Legacy exports and references removed from:
- `packages/engine/src/components/shell/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/app/createAppStore.ts`

## Design Decisions

### 1) No compatibility wrappers

Decision:
Do not keep `HyperCardShell` wrapper forwarding to DesktopShell.

Rationale:
- Wrappers keep old API contracts alive and delay cleanup.
- User explicitly requested no backwards compatibility.
- Hard compiler errors force complete migration and reduce hidden drift.

### 2) Shared runtime-host hook first

Decision:
Extract and use a shared runtime host abstraction before deleting legacy shell.

Rationale:
- Removes highest-risk duplication early.
- Keeps runtime behavior consistent while shell migration continues.
- Lowers regression chance during helper and app cutover.

### 3) Migrate helper APIs in same ticket

Decision:
Do not leave `createDSLApp`/`createStoryHelpers` on legacy shell.

Rationale:
- Helpers are widely used in app stories.
- If helpers remain legacy, old shell cannot be removed cleanly.

### 4) Remove navigation slice after helper migration

Decision:
Delete `features/navigation` only after app/helper cutover.

Rationale:
- Maintains buildability during intermediate commits.
- Makes dependency graph explicit and reversible per commit.

## Impact Analysis

### Applications

Will be modified:
- `apps/todo/src/App.tsx`
- `apps/crm/src/App.tsx`
- `apps/book-tracker-debug/src/App.tsx`
- `apps/inventory/src/stories/Themed.stories.tsx` (legacy shell demo replacement)

Behavior impact:
- Apps lose legacy tab/split/drawer modes.
- DesktopShell icon/menu interaction model becomes canonical.
- Any UI previously tied to `navShortcuts` is replaced by desktop icon/menu config.

### Storybook

Will be modified:
- `apps/*/src/stories/*App.stories.tsx` via helper migration
- Engine/story helpers relying on navigation slice

Behavior impact:
- Card-by-card stories open/focus cards using windowing actions instead of navigation stack operations.

### Store shape

Before:
- `hypercardRuntime`, `navigation`, `windowing`, `notifications`, `debug`, domains

After:
- `hypercardRuntime`, `windowing`, `notifications`, `debug`, domains

Impact:
- Any `state.navigation` snapshot/debug usage must be removed or replaced.

### Public API

Breaking export changes in `@hypercard/engine`:
- Removed: `HyperCardShell`, legacy layout components, navigation actions/selectors/reducer exports.
- Kept: `DesktopShell`, windowing actions/selectors/types.

## Alternatives Considered

### Alternative A: Keep legacy + new shells indefinitely

Rejected:
- Preserves duplicate runtime code paths and long-term complexity.

### Alternative B: Keep thin compatibility wrappers

Rejected:
- Contradicts “no backwards compatibility.”
- Delays true cleanup and causes partial migration ambiguity.

### Alternative C: Remove legacy code first, migrate callers later

Rejected:
- Causes immediate repo breakage and noisy intermediate states.
- Harder to review safely.

## Implementation Plan

### Phase 1: Foundations (done first)

- Extract shared runtime-host logic and wire both legacy and windowed hosts to it.
- Add migration ticket docs and task plan.

### Phase 2: App and helper cutover

- Migrate app entrypoints from `HyperCardShell` to `DesktopShell`.
- Migrate `createDSLApp` and `createStoryHelpers` to DesktopShell API.
- Update story files/config to remove navigation-slice assumptions.

### Phase 3: Legacy code deletion

- Delete legacy shell component files.
- Delete navigation slice/selectors/tests.
- Remove legacy exports from barrels and store wiring.

### Phase 4: Validation and cleanup

- Run `npm test`, `npm run typecheck`, `npm run build`.
- Run `npm run lint` and record known baseline issues if unrelated.
- Update docs/changelog/diary with final migration notes and risks.

## Risks and Mitigations

Risk: Helper migration changes story behavior.
Mitigation: Keep story-specific window-open semantics explicit in helper config and test with all app story suites.

Risk: Hidden use of `state.navigation` in debug/snapshot selectors.
Mitigation: `rg` scan for `state.navigation` before navigation deletion; patch all occurrences in same phase.

Risk: DesktopShell lacks features formerly used by legacy debug layout.
Mitigation: For now, prioritize functional cutover; represent debug via desktop windows/stories instead of split-pane shell modes.

## Open Questions

1. Should DesktopShell gain a first-class “debug companion pane” mode, or should debug always be an independent desktop window/card?
2. Should helper APIs keep optional custom menus or only icons for initial migration simplicity?
3. Do we remove legacy CSS parts immediately or in a follow-up cleanup ticket after cutover validation?

## References

- `ttmp/2026/02/15/HC-029-WINDOWING-SUPPORT--windowing-support-for-multiple-hypercard-cards/design-doc/04-implementation-code-review-hc-029-windowing-support.md`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
- `packages/engine/src/app/createDSLApp.tsx`
- `packages/engine/src/app/generateCardStories.tsx`
- `packages/engine/src/features/navigation/navigationSlice.ts`
