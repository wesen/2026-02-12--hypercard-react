---
Title: Diary
Ticket: HC-027-TYPE-SAFETY
Status: done
Topics: [architecture, type-safety]
DocType: reference
Intent: long-term
---

# Diary

## Goal
Reduce `any` at engine API boundaries while preserving runtime flexibility.

## Step 1: Boundary analysis + hardening (commit ee8fe6c)

### What I did
- **HyperCardShellProps**: Attempted to use `TRootState` generics for stack/selectors/actions. Hit contravariance wall — `CardSelectorFn<T>` consumes `T`, making `SharedSelectorRegistry<Specific>` incompatible with `SharedSelectorRegistry<unknown>`. Reverted and documented the design decision: shell is a pass-through layer and genuinely needs `any` for registry generics.
- **RuntimeLookup**: Made generic on `TRootState` (from `CardDefinition<any>` to `CardDefinition<TRootState>`).
- **snapshotSelector**: Changed from `(state: any)` to `(state: unknown)` in `createDSLApp` and `createStoryHelpers`.
- **runtimeSlice cast**: Narrowed from `as any` to `as HypercardRuntimeStateSlice['hypercardRuntime'] | undefined`.
- **setLayout cast**: Narrowed from `key as any` to `key as LayoutMode`.
- **dispatch cast**: Kept `as any` with justification comment (Redux dispatch expects `AnyAction`).

### Key design decision
Shell props **must** use `any` for `CardStackDefinition<any>` / `SharedSelectorRegistry<any>` because:
1. Selector/action functions are contravariant in `TRootState` (they consume the state)
2. `Registry<Specific>` is not assignable to `Registry<unknown>`
3. The shell doesn't inspect or type-check state flow — it wires things through
4. Type safety is enforced at the card/app definition level, where the concrete state type is known

### Remaining `any` count: 6 (all justified and commented)

### Verification
- typecheck ✓, lint ✓
