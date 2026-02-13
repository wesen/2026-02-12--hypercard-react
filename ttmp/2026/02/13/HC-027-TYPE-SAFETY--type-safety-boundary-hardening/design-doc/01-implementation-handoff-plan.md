---
Title: Implementation Handoff Plan
Ticket: HC-027-TYPE-SAFETY
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Key boundary where generics collapse and casts occur
    - Path: packages/engine/src/app/createDSLApp.tsx
      Note: Config API currently exposes `snapshotSelector(state: any)`
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: Story helper currently exposes `createStore: () => any`
    - Path: packages/engine/src/cards/runtime.ts
      Note: Runtime lookup currently typed with `CardDefinition<any>` and `CardStackDefinition<any>`
    - Path: packages/engine/src/cards/types.ts
      Note: Generic contracts to propagate through integration layers
    - Path: packages/engine/src/cards/runtimeStateSlice.ts
      Note: Runtime slice type for replacing shell runtime-slice casts
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/02-finding-14-type-safety-boundary-analysis.md
      Note: Primary deep analysis and acceptance criteria basis
ExternalSources: []
Summary: Step-by-step plan for reducing `any` at engine API boundaries while preserving runtime flexibility.
LastUpdated: 2026-02-13T16:58:00-05:00
WhatFor: Enable implementation of finding-14 type-safety remediation with clear sequencing
WhenToUse: Use while hardening boundary typing and validating migration impact
---

# Implementation Handoff Plan

## Executive Summary

Type contracts exist in core DSL/runtime definitions but are weakened at public integration boundaries. This ticket restores compile-time guarantees by propagating generics and replacing broad `any` usage with typed or guarded boundaries.

## Problem Statement

Critical boundary issues include:

- `HyperCardShellProps` defines `TRootState` but uses `any` for stack/shared registries.
- App and story helper APIs expose `snapshotSelector(state: any)` and `createStore: () => any`.
- Runtime lookup internals use `CardDefinition<any>` / `CardStackDefinition<any>`.
- Shell internal casts reduce type feedback where integration mistakes are likely.

## Proposed Solution

1. Enforce generic root-state propagation through shell/app/story/runtime boundaries.
2. Replace boundary `any` with either explicit generics or `unknown` + local guards.
3. Add compile-time contract checks so regressions are caught by typecheck.

## Design Decisions

1. Strong typing at public boundaries is mandatory; implementation internals may keep minimal justified casts.
2. Default generics remain for compatibility (`<TRootState = unknown>`), but generic parameters must be respected.
3. Migration should be staged to keep app call sites compiling as work progresses.

## Alternatives Considered

1. Leave boundary `any` and rely on runtime tests.
- Rejected because compile-time guarantees are the objective.

2. Full typed action union refactor now.
- Rejected as too broad for this scope.

3. Runtime schema validation only.
- Rejected as insufficient without TS boundary improvements.

## Implementation Plan

### Phase 1: API Surface Hardening

1. Update `HyperCardShellProps<TRootState>` to use `TRootState` in all relevant props.
2. Update `DSLAppConfig<TRootState>` snapshot selector signature.
3. Update `CardStoriesConfig<TRootState>` store/snapshot selector signatures.

### Phase 2: Runtime Generic Propagation

1. Make `RuntimeLookup` generic.
2. Thread generic state types through runtime helper signatures where lookup/context are passed.
3. Replace registry casts with typed adapters where possible.

### Phase 3: Cast Reduction

1. Replace shell runtime slice cast with runtime slice interface type.
2. Replace `dispatch(action as any)` with typed dispatch boundary.
3. Replace layout-key cast path with narrow key guard/mapping.

### Phase 4: Consumer Migration

1. Update affected app and story call sites to satisfy stricter signatures.
2. Confirm no runtime behavior change in card flows.

### Phase 5: Validation

1. Add/maintain compile-time contract checks.
2. Run root typecheck and app/story validation matrix.
3. Re-run `rg` scans for boundary `any` usage and document any intentional residue.

## Open Questions

1. Should typed helper APIs expose readonly state for selectors by default?
2. Should we keep temporary compatibility overloads or require immediate app updates?

## References

- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/app/createDSLApp.tsx`
- `packages/engine/src/app/generateCardStories.tsx`
- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/cards/types.ts`
- `packages/engine/src/cards/runtimeStateSlice.ts`
- `ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/02-finding-14-type-safety-boundary-analysis.md`
