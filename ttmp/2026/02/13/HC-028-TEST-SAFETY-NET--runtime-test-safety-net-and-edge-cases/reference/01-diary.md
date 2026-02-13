---
Title: Diary
Ticket: HC-028-TEST-SAFETY-NET
Status: done
Topics: [testing, runtime]
DocType: reference
Intent: long-term
---

# Diary

## Goal
Create a focused runtime test safety net to protect ongoing cleanup and refactor work.

## Step 1: Test infrastructure + 48 tests (commit 9466867, ab3a33b)

### What I did
- Installed vitest as dev dependency
- Added `test` + `test:watch` scripts to engine, `test` to root package.json
- Created `vitest.config.ts` to exclude `dist/` (tsc was compiling tests into dist)
- Excluded `src/__tests__` from `tsconfig.json` build output

### Test suites (5 files, 48 tests)

**runtime-actions.test.ts** (15 tests):
- Built-in actions: nav.go, nav.go+param, nav.back, toast.show, state.set, state.setField, state.patch, state.reset
- Local precedence: card > shared, shared fallback, stack-level handler
- Action scope: `to: 'shared'` skips local, `to: 'card'` only card, `to: 'stack'` only stack
- Unhandled: console.warn emitted

**navigation.test.ts** (8 tests):
- Default initialization, initializeNavigation with custom homeCard
- navigate push, navigate with param
- goBack pop, goBack at bottom
- setLayout resets to homeCard, resetNavigation preserves layout

**selector-resolution.test.ts** (6 tests):
- Card-level first, fall-through to stack, fall-through to shared
- `from: 'shared'` direct, `from: 'stack'` explicit scope
- Missing selector returns undefined

**listview-footer.test.ts** (15 tests):
- sum/count/avg/min/max with normal values
- Empty array edge case (all return 0, not Infinity)
- Single value edge case

**integration-card-execution.test.ts** (4 tests):
- Realistic card execution with event-resolved args (nav.go with Ev('id'))
- Shared selector resolution via createSelectorResolver
- Local card action handler with real store dispatch
- Shared action handler execution

### What was tricky
- `tsc -b` was compiling test files into `dist/__tests__/` and vitest found them, doubling the test count to 96. Fixed by excluding `__tests__` from tsconfig and adding `vitest.config.ts` with explicit `include`/`exclude`.
- Integration test for local action: `createCardContext` creates real bound functions (not spies), so couldn't use `toHaveBeenCalledWith`. Verified by checking store state after dispatch instead.

### Verification
- 48 tests, 5 files, all passing in <400ms
- typecheck ✓, lint ✓, build ✓
