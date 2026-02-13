---
Title: Diary
Ticket: HC-025-RUNTIME-CONTRACTS
Status: done
Topics: [architecture, runtime]
DocType: reference
Intent: long-term
---

# Diary

## Goal
Fix runtime action scope contract, navigation homeCard, unhandled action visibility, and ListView footer edge case.

## Step 1: Implementation (commit f99669c)

### What I did
- **Action scope**: Rewrote `executeActionDescriptor` to honor `descriptor.to`. When `to: 'shared'`, only checks shared handlers. When `to: 'card'`/`'stack'`/etc, only checks that scope's registry. `'auto'` (default) preserves existing cascade behavior.
- **Unhandled actions**: Added `console.warn` with action type, cardId, scope, stackId when no handler found.
- **Navigation homeCard**: Added `initializeNavigation({ homeCard })` and `resetNavigation()` actions. `setLayout` now resets to `state.homeCard` instead of hard-coded `'home'`. HyperCardShell dispatches `initializeNavigation` on mount.
- **ListView footer**: Guarded `Math.min(...[])` and `Math.max(...[])` with `vals.length` check, returning 0 for empty arrays.

### Design decision: Implement scope, not deprecate
Decided to implement full `ActionDescriptor.to` semantics rather than remove the field. The implementation is straightforward (switch on scope) and apps already use `to: 'shared'` in some actions.

### What was tricky
- Extracted the common handler execution logic (sync/async + debug events) into a `runHandler` closure to avoid duplicating the promise/finalize pattern across scope branches.

### Verification
- typecheck ✓, lint ✓, 82 Storybook stories ✓
- Later validated by 48 tests in HC-028 (action scope, navigation, footer tests)
