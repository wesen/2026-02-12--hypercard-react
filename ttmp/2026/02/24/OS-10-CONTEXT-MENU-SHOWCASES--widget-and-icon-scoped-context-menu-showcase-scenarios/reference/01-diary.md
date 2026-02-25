---
Title: Diary
Ticket: OS-10-CONTEXT-MENU-SHOWCASES
Status: active
Topics:
    - frontend
    - desktop
    - menus
    - ux
    - plugins
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/types.ts
      Note: Added target descriptor contracts and invocation target metadata.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
      Note: Added target-keyed context action registry and precedence resolver.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts
      Note: Added phase-1 tests for keying, precedence, and merge policy.
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Added target-scoped hook APIs for context action registration.
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Wired target-based context action resolution into shell context-menu flow.
ExternalSources: []
Summary: Diary for OS-10 implementation work.
LastUpdated: 2026-02-25T16:10:00-05:00
WhatFor: Capture implementation progress and rationale as OS-10 moves from planning into execution.
WhenToUse: Use when continuing OS-10 or reviewing completed showcase phases.
---

# Diary

## Goal

Start OS-10 execution by completing Phase 1 (context target foundation) on top of the OS-01 menu runtime baseline.

## Step 1: Phase 1 Foundation Implemented

Implemented target-scoped context menu contracts and runtime plumbing so context actions can be registered and resolved by normalized target keys, not just by window id.

### Prompt Context

**User prompt (verbatim):** "it works, check off tasks, close ticket, start on OS-10"

**Assistant interpretation:** Close OS-01 after manual verification and begin concrete OS-10 implementation work immediately.

**Inferred user intent:** Finish the prior ticket cleanly, then resume forward progress on menu feature development rather than more bugfix loops.

### What I did

- Added `ContextTargetKind` and `DesktopContextTargetRef` contracts in shell types.
- Added `contextTarget` metadata field to `DesktopCommandInvocation`.
- Added target registry helper module:
  - `normalizeContextTargetRef`
  - `buildContextTargetKey`
  - `resolveContextActionPrecedenceKeys`
  - `resolveContextActions`
- Added tests for registry keying/precedence/merge policy.
- Extended desktop menu runtime APIs with generic target-scoped registration:
  - `registerContextActions` / `unregisterContextActions`
  - hooks: `useRegisterContextActions`, `useRegisterIconContextActions`, `useRegisterWidgetContextActions`, `useRegisterConversationContextActions`, `useRegisterMessageContextActions`
- Updated shell controller to:
  - store context registrations by target key
  - resolve dynamic context actions via precedence (`exact -> qualified kind -> kind -> window`)
  - include `contextTarget` in routed context-menu command invocations
- Exported new APIs through `windowing/index.ts` and `desktop/react/index.ts`.

### Why

- OS-10 scenarios require target-specific menus (icons/messages/conversations), which window-only registration cannot express.
- This foundation unlocks scenarios 1/2/3/4/10 without breaking existing OS-01 window-level APIs.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts` passed.

### What didn't work

- Direct invocation of `DesktopShell.contextMenu.test.tsx` via current package test script fails because test include pattern is `src/**/*.test.ts` (does not include `.test.tsx`).

### What warrants a second pair of eyes

- Confirm precedence contract matches intended OS-10 semantics before scenario-specific hooks start registering non-window targets in app code.
- Confirm `contextTarget` metadata shape is sufficient for downstream command handlers and telemetry.

### Next

- Start Phase 2 (`OS10-20`..`OS10-23`): icon right-click handling and icon target actions in `DesktopIconLayer` + shell controller wiring.

## Step 2: Phase 2 Scenario 1 (Icon Quick Actions)

Implemented icon right-click quick actions end-to-end and validated routing through launcher integration tests.

### Prompt Context

**User prompt (verbatim):** "continue"

**Assistant interpretation:** Keep executing the next OS-10 phase immediately after Phase 1 foundation.

**Inferred user intent:** Maintain momentum on menu feature development and move from contracts into user-visible showcase behavior.

### What I did

- Added right-click callback support to desktop icons in:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx`
- Added icon quick-action context menu composition in controller (`Open`, `Open New`, `Pin`, `Inspect`) and attached icon context target metadata:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
- Added icon command routing behavior:
  - `icon.open.<id>` opens stack card windows when `<id>` is a card id
  - `icon.open-new.<id>` opens stack card windows or falls back to contribution handling as `icon.open.<id>`
- Wired icon context callback into shell view:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx`
- Added launcher integration test:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/apps/os-launcher/src/__tests__/launcherContextMenu.test.tsx`
  - verifies icon context menu opens with quick actions and `Open` command routes to create a window.
- Added Storybook showcase:
  - `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShell.stories.tsx`
  - story: `WithIconQuickActionsContextMenu`

### Why

- OS-10 Scenario 1 is the first user-facing target-scoped showcase and validates that Phase 1 foundation is usable in real interaction paths.

### What worked

- `npm run typecheck -w packages/engine` passed.
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts src/components/shell/windowing/desktopCommandRouter.test.ts` passed.
- `npm run test -w apps/os-launcher -- src/__tests__/launcherContextMenu.test.tsx` passed (with known pre-existing selector warnings in stderr).

### What didn't work

- Running `DesktopShell.contextMenu.test.tsx` directly through the engine package script still reports “No test files found” because the engine vitest include pattern currently only matches `src/**/*.test.ts`.

### What warrants a second pair of eyes

- Confirm default icon quick-action command IDs are final (`icon.open-*`, `icon.pin.*`, `icon.inspect.*`) before Scenario 2/3 reuse.
- Confirm launcher-module `icon.open.<id>` mapping semantics align with “Open New” fallback behavior.

### Next

- Start Phase 3 (`OS10-30`..`OS10-33`): folder/icon hybrid launcher target behavior and context actions.
