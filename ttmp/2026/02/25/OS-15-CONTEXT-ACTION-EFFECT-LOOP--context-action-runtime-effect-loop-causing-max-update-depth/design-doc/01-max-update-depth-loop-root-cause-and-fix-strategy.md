---
Title: max-update-depth loop root cause and fix strategy
Ticket: OS-15-CONTEXT-ACTION-EFFECT-LOOP
Status: active
Topics:
    - architecture
    - debugging
    - desktop
    - frontend
    - menus
    - windowing
    - ux
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
    - Path: packages/engine/src/components/shell/windowing/DesktopShellView.tsx
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
    - Path: packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx
ExternalSources: []
Summary: Detailed investigation of context-action runtime effect cleanup loop and recommended stabilization path.
LastUpdated: 2026-02-26T10:10:00-05:00
WhatFor: Explain the max-depth loop with concrete dependency flow and define the safest near-term fix strategy.
WhenToUse: Use when implementing or reviewing fixes for context-action effect cleanup loops in windowing runtime.
---

# max-update-depth loop root cause and fix strategy

## Executive Summary

The `Maximum update depth exceeded` issue is caused by a circular dependency between:

1. registration effects in `desktopMenuRuntime` (`useRegisterContextActions`),
2. local controller state mutations (`setContextActionsByTargetKey`),
3. runtime context object identity churn (provider value includes `openContextMenu`),
4. cleanup re-entry (`unregisterContextActions`) on each runtime identity change.

The cleanest fix is to **decouple registration APIs from menu-opening callback identity** by splitting runtime context into:

1. stable registration context (register/unregister APIs),
2. separate context-menu opener context (`openContextMenu`).

This breaks the effect dependency cycle while preserving caller-facing APIs.

## Problem Statement

Observed error:

- `Maximum update depth exceeded. This can happen when a component calls setState inside useEffect...`
- Stack includes:
  - `unregisterContextActions useDesktopShellController.tsx:654`
  - `useRegisterContextActions desktopMenuRuntime.tsx:127`

Code-path evidence:

1. `useRegisterContextActions` effect cleanup calls `runtime.unregisterContextActions(normalizedTarget)`  
   (`desktopMenuRuntime.tsx:121-129`)
2. `unregisterContextActions` performs `setContextActionsByTargetKey(...)`  
   (`useDesktopShellController.tsx:651-662`)
3. `openContextMenu` depends on `resolveContextMenuItemsForTarget`, which depends on `contextActionsByTargetKey`  
   (`useDesktopShellController.tsx:878-913`, `1014-1053`)
4. Provider runtime value includes `openContextMenu` in memo deps, so runtime object identity changes  
   (`desktopMenuRuntime.tsx:33-52`)
5. Effect sees new `runtime` dependency and runs cleanup/register again; cleanup mutates state again; cycle repeats.

StrictMode in inventory app (`apps/inventory/src/main.tsx:11-15`) increases frequency/visibility in dev.

## Proposed Solution

### Primary fix (recommended)

Split `DesktopWindowMenuRuntimeContext` into two independent contexts:

1. `DesktopWindowActionRegistryRuntimeContext`:
   - `registerWindowMenuSections`
   - `unregisterWindowMenuSections`
   - `registerContextActions`
   - `unregisterContextActions`
   - `registerWindowContextActions`
   - `unregisterWindowContextActions`
2. `DesktopWindowMenuOpenRuntimeContext`:
   - `openContextMenu`

Then:

1. registration hooks (`useRegisterWindowMenuSections`, `useRegisterWindowContextActions`, `useRegisterContextActions`, etc.) consume only the registry context,
2. `useOpenDesktopContextMenu` consumes only the open-context.

Result: registration effect deps no longer include a runtime object that churns from context-action state changes.

### Secondary hardening (optional)

Add defensive idempotence to `useRegisterContextActions`:

1. keep previous `(targetKey, actionsRef)` in refs,
2. skip redundant register/unregister calls when unchanged.

This is guardrail, not primary fix.

## Design Decisions

1. **Fix dependency topology, not symptoms**
Reason: problem is architectural coupling between two concerns (registry mutation vs menu opening).

2. **Preserve existing hook signatures**
Reason: avoid app/module churn and keep migration low risk.

3. **Prefer context split over broad memo hacks**
Reason: explicit separation is easier to reason about than trying to freeze changing callbacks.

## Alternatives Considered

1. **Force `openContextMenu` stable via refs-only callback**
Rejected as primary approach: possible, but hides coupling and increases subtle stale-data risk if ref wiring is incorrect.

2. **Remove `runtime` from effect dependency arrays**
Rejected: violates hook dependency correctness and can create stale closures.

3. **Move registry to Redux immediately**
Rejected for this bug: larger refactor; loop can be solved without full state architecture change.

4. **Throttle/debounce unregister calls**
Rejected: masks the loop instead of fixing dependency cycle.

## Implementation Plan

### Phase 1: Runtime context decoupling

1. Introduce separate contexts in `desktopMenuRuntime.tsx` for registry APIs vs open API.
2. Update provider to publish two memoized values:
   - registry runtime (stable callbacks only),
   - open runtime (`openContextMenu` only).
3. Update hooks:
   - registration hooks use registry context,
   - `useOpenDesktopContextMenu` uses open context.

### Phase 2: Regression coverage

1. Add a regression test in windowing tests that previously triggered re-registration churn.
2. Assert no repeated cleanup/register loop under StrictMode-style remount behavior.

### Phase 3: Validation

1. Run targeted engine tests (context registry + desktop context menu).
2. Run launcher integration tests for icon/window/message/conversation context menus.
3. Manual validation in inventory chat window with debug logs enabled.

### Phase 4: Closeout

1. Update ticket changelog/diary with before/after logs.
2. Mark tasks and close ticket when regression no longer reproduces.

## Open Questions

1. Do we also want to add effect-level idempotence guards in this ticket, or keep scope to topology fix only?
2. Should we add a temporary debug counter metric for register/unregister churn in development?

## References

- Ticket index: `../index.md`
- Tasks: `../tasks.md`
- Key source files listed in frontmatter `RelatedFiles`.
