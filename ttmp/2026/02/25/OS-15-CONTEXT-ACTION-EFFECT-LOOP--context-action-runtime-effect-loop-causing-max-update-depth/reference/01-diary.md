---
Title: Diary
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
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/__tests__/windowing.test.ts
      Note: Added reducer and selector coverage for context-menu Redux state
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Split registration/open runtime contexts to prevent effect churn coupling
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Moved context-menu UI state to Redux-backed selector/actions and sanitized stored items
    - Path: packages/engine/src/desktop/core/state/selectors.ts
      Note: Added desktop context-menu selector
    - Path: packages/engine/src/desktop/core/state/types.ts
      Note: Added desktop context-menu state contract
    - Path: packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Added context-menu state reducers and transient clear behavior
ExternalSources: []
Summary: Implementation diary for OS-15 runtime context split and Redux context-menu state migration.
LastUpdated: 2026-02-26T21:45:00-05:00
WhatFor: Record exact implementation steps, failures, and validation evidence for the max-update-depth stabilization work.
WhenToUse: Use when reviewing what changed for OS-15 or continuing remaining tasks like dedicated loop regression testing.
---


# Diary

## Goal

Capture a step-by-step record of the OS-15 implementation that split runtime registration context from open-context-menu APIs and moved context-menu UI state into Redux.

## Step 1: Runtime Context Split + Redux Context-Menu State Migration

This step implemented the current request to continue OS-15 with a clean architecture stance: split runtime contexts to break effect-loop coupling and migrate context-menu UI state from controller-local React state to Redux. The intent was to make state transitions inspectable and reduce churn paths that were causing cleanup/re-register cascades.

The work also formalized task tracking in OS-15 by adding explicit subtasks for Redux context-menu migration and sanitization, then validating with typecheck and targeted test runs.

### Prompt Context

**User prompt (verbatim):** "ok, let's just do context-menu UI state to redux, split runtime-context split. Add tasks to the ticket, work task by task, continue"

**Assistant interpretation:** Implement the runtime-context split and Redux context-menu migration directly in code, update ticket tasks, and proceed with validation and documentation.

**Inferred user intent:** Stabilize window/context-menu state management and reduce recurring effect-loop regressions by enforcing cleaner state ownership boundaries.

**Commit (code):** N/A (not committed yet)

### What I did
- Updated task plan in `tasks.md` with explicit subtasks:
  - `OS15-21A` move context-menu UI state to Redux
  - `OS15-21B` add selectors/actions + route close paths through reducers
  - `OS15-21C` sanitize persisted context-menu items
- Split runtime contexts in `desktopMenuRuntime.tsx`:
  - created registration runtime context (`register/unregister` APIs only)
  - created separate open-menu context (`openContextMenu` only)
  - registration hooks now consume registration context only
- Added Redux context-menu state to windowing slice:
  - types in `desktop/core/state/types.ts` (`DesktopContextMenuState`, target/item types)
  - actions in `windowingSlice.ts`: `setDesktopContextMenu`, `closeDesktopContextMenu`
  - selector in `selectors.ts`: `selectDesktopContextMenu`
  - export surface update in `desktop/core/state/index.ts`
- Migrated controller logic in `useDesktopShellController.tsx`:
  - removed local `useState` for `contextMenu`
  - read context menu via `useSelector(selectDesktopContextMenu)`
  - route open/close/select/action/background/menu-change paths through Redux actions
  - added `sanitizeContextMenuItems()` + separator type guard to strip non-store runtime visibility fields before dispatch
- Expanded reducer/selector coverage in `src/__tests__/windowing.test.ts`:
  - initial state assertion for `desktop.contextMenu`
  - `setDesktopContextMenu` / `closeDesktopContextMenu` tests
  - `clearDesktopTransient` now verifies context menu is also cleared
  - selector test for `selectDesktopContextMenu`

### Why
- Registration hooks should not re-run because open-context callback identity changed.
- Context-menu UI state is desktop-global UI state and fits Redux better than controller-local state.
- Sanitizing action entries before storing avoids persisting runtime-only visibility predicates and keeps Redux state cleaner.

### What worked
- `npm run typecheck -w packages/engine` passed after migration.
- `npm run typecheck` (workspace) passed.
- Targeted tests passed:
  - `npx vitest run src/__tests__/windowing.test.ts` (50 tests)
  - `npx vitest run src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts` (21 tests)
- OS-15 tasks were updated and checked for completed implementation/validation items (`OS15-20`, `OS15-21`, `OS15-21A`, `OS15-21B`, `OS15-21C`, `OS15-23`, `OS15-31`).

### What didn't work
- First `packages/engine` typecheck run failed with union narrowing errors in `sanitizeContextMenuItems`:
  - `TS2339: Property 'id' does not exist on type 'DesktopActionEntry'` (and similar for `label`, `commandId`, `shortcut`, `disabled`, `checked`, `payload`)
  - cause: separator/action union not narrowed in ternary branch
  - fix: add explicit `isContextMenuSeparator` type guard and branch with `if`
- First targeted test command failed:
  - `No test files found, exiting with code 1`
  - cause: passed repo-root paths to `vitest` while the package include pattern is `src/**/*.test.ts`
  - fix: run `vitest` from `packages/engine` with `src/...` paths

### What I learned
- Decoupling provider contexts is enough to isolate registration effects from unrelated callback identity churn without changing call-site APIs.
- Moving UI state to Redux is safe here if runtime-only action metadata is normalized/sanitized at the reducer boundary.

### What was tricky to build
- The key edge was item union typing while sanitizing context-menu entries. The symptoms were TS2339 errors for action-only fields on a union that includes separators. The resolution required an explicit type guard to stabilize narrowing and keep strict typing.

### What warrants a second pair of eyes
- Confirm that Redux DevTools / perf tooling now shows context-menu actions in the expected sequence during real interaction flows.
- Confirm no remaining effect-loop path from runtime registration hooks in StrictMode with heavily re-rendering chat timelines.

### What should be done in the future
- Add and land `OS15-30`: dedicated regression test that reproduces and guards against cleanup/register effect loop reintroduction.

### Code review instructions
- Start in:
  - `packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx`
  - `packages/engine/src/components/shell/windowing/useDesktopShellController.tsx`
  - `packages/engine/src/desktop/core/state/windowingSlice.ts`
  - `packages/engine/src/desktop/core/state/types.ts`
  - `packages/engine/src/desktop/core/state/selectors.ts`
  - `packages/engine/src/__tests__/windowing.test.ts`
- Validate with:
  - `npm run typecheck -w packages/engine`
  - `npm run typecheck`
  - `cd packages/engine && npx vitest run src/__tests__/windowing.test.ts`
  - `cd packages/engine && npx vitest run src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/contextActionVisibility.test.ts src/components/shell/windowing/desktopContributions.test.ts`

### Technical details
- Runtime split mechanics:
  - registration provider value is now independent from `openContextMenu` callback identity
  - `useOpenDesktopContextMenu` reads from dedicated context
- Redux context-menu flow:
  - `openContextMenu()` computes items -> sanitizes -> `dispatch(setDesktopContextMenu(...))`
  - close paths call `dispatch(closeDesktopContextMenu())`
  - `clearDesktopTransient` now also clears context-menu state

## Related

- `../design-doc/01-max-update-depth-loop-root-cause-and-fix-strategy.md`
- `../tasks.md`
- `../changelog.md`
