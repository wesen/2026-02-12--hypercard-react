---
Title: Finding 14 Type Safety Boundary Analysis
Ticket: HC-022-CODE-REVIEW
Status: review
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Primary shell boundary where generics collapse to any and dispatch is cast
    - Path: packages/engine/src/app/createDSLApp.tsx
      Note: App factory exposes untyped snapshot selector boundary
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: Story helper exposes untyped createStore and snapshot selector boundaries
    - Path: packages/engine/src/cards/runtime.ts
      Note: Runtime lookup currently uses CardDefinition<any>/CardStackDefinition<any>
    - Path: packages/engine/src/cards/types.ts
      Note: Canonical generic contracts already exist and should be propagated
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Parent review document that this deep-dive expands
ExternalSources: []
Summary: Detailed analysis of type-safety erosion at engine API boundaries, with prioritized remediation and migration plan.
LastUpdated: 2026-02-13T16:25:00-05:00
WhatFor: Deep technical analysis for finding 14 remediation planning
WhenToUse: When implementing stronger type contracts for shell/runtime/app helper boundaries
---

# Finding 14 Type Safety Boundary Analysis

## Executive Summary

The engine has strong generic type definitions in `packages/engine/src/cards/types.ts`, but boundary layers frequently discard those guarantees with `any` and broad casts. This is concentrated in shell integration (`HyperCardShell`), app/story factories (`createDSLApp`, `createStoryHelpers`), and runtime lookup plumbing.

This is not just a style issue. It increases regression risk by hiding API mismatches at compile time and forcing runtime discovery of errors. The recommended path is staged hardening: preserve extension flexibility with `unknown` + constrained generic interfaces, while removing `any` casts at public boundary APIs.

## Problem Statement

The codebase defines generic domain contracts (`CardStackDefinition<TRootState>`, `SharedSelectorRegistry<TRootState>`, `CardContext<TRootState>`), but several exported helpers and shell internals bypass those contracts.

The result is a split system:

- Core types imply compile-time safety.
- Integration surfaces effectively opt out.

That split makes onboarding harder and refactors riskier, especially when adding new reducers/selectors/actions across apps.

## Detailed Boundary Inventory

### A) Shell Props Generic Collapse

Where:
- `packages/engine/src/components/shell/HyperCardShell.tsx:53`
- `packages/engine/src/components/shell/HyperCardShell.tsx:54`
- `packages/engine/src/components/shell/HyperCardShell.tsx:55`
- `packages/engine/src/components/shell/HyperCardShell.tsx:56`

Current pattern:
```ts
export interface HyperCardShellProps<TRootState = unknown> {
  stack: CardStackDefinition<any>;
  sharedSelectors?: SharedSelectorRegistry<any>;
  sharedActions?: SharedActionRegistry<any>;
}
```

Issue:
- `TRootState` exists but is not used in key fields.
- Consumers can wire incompatible selectors/actions without compile-time failures.

Impact:
- Refactors to domain state shape do not surface errors where they should.

### B) Runtime Slice + Dispatch Casts in Shell

Where:
- `packages/engine/src/components/shell/HyperCardShell.tsx:85`
- `packages/engine/src/components/shell/HyperCardShell.tsx:157`
- `packages/engine/src/components/shell/HyperCardShell.tsx:322`

Current pattern:
```ts
const runtimeSlice = useSelector((s: ShellState) => s.hypercardRuntime as any);
const result = dispatch(action as any);
onSelect={(key) => dispatch(setLayout(key as any))}
```

Issue:
- Safety checks around action type and runtime slice structure are disabled.

Impact:
- Incorrect layout keys and malformed actions can pass silently through typecheck.

### C) App Factory Snapshot Selector Boundary

Where:
- `packages/engine/src/app/createDSLApp.tsx:20`

Current pattern:
```ts
snapshotSelector?: (state: any) => Record<string, unknown>;
```

Issue:
- `snapshotSelector` has direct visibility into store state but no state typing.

Impact:
- App authors lose autocomplete/validation for high-frequency debug selectors.

### D) Story Factory Store and Snapshot Boundaries

Where:
- `packages/engine/src/app/generateCardStories.tsx:18`
- `packages/engine/src/app/generateCardStories.tsx:24`

Current pattern:
```ts
createStore: () => any;
snapshotSelector?: (state: any) => Record<string, unknown>;
```

Issue:
- Story wiring cannot ensure the created store matches stack/selectors/actions contracts.

Impact:
- Story regressions can compile while being semantically invalid.

### E) Runtime Lookup Generic Collapse

Where:
- `packages/engine/src/cards/runtime.ts:21`
- `packages/engine/src/cards/runtime.ts:22`
- `packages/engine/src/cards/runtime.ts:23`

Current pattern:
```ts
interface RuntimeLookup {
  cardDef: CardDefinition<any>;
  stackDef: CardStackDefinition<any>;
}
```

Issue:
- Core runtime execution utilities stop carrying `TRootState`.

Impact:
- Resolver/action path loses a static guarantee that selectors/actions align with store shape.

## Why This Matters (Runtime and Team Risk)

1. Refactor risk: changing root state/reducer keys will not reliably fail fast at compile time.
2. Onboarding cost: new developers see generic types but encounter `any` in the most important wiring points.
3. API contract ambiguity: exported helpers imply safety but do not enforce it.
4. Test burden inflation: more issues shift from compile-time to runtime/manual testing.

## Proposed Solution

### Design Principle

Type strictness should be strongest at exported API boundaries and integration seams. Internal implementation may still use localized casts if unavoidable, but those casts should be contained and justified.

### Target State

- `HyperCardShellProps<TRootState>` uses `TRootState` in `stack`, `sharedSelectors`, `sharedActions`.
- `createDSLApp` and story helpers carry typed `RootState` generics through `snapshotSelector` and `createStore`.
- Runtime lookup helpers are generic on `TRootState`, not `any`.
- `any` is replaced by either:
  - explicit generic constraints, or
  - `unknown` plus narrow structural checks.

## Design Decisions

1. Prefer `unknown` over `any` when true shape is unknown.
2. Keep backward compatibility by default generic parameters (`<TRootState = unknown>`), but enforce typed pathways when callers provide concrete store types.
3. Use narrow adapter types for redux integration (`AppDispatch`, runtime slice shape) rather than broad casting.
4. Defer full typed action unions; start with boundary hardening first.

## Implementation Plan

### Phase 1: Public API Type Surface Hardening

1. Update `HyperCardShellProps` generics:
   - `stack: CardStackDefinition<TRootState>`
   - `sharedSelectors?: SharedSelectorRegistry<TRootState>`
   - `sharedActions?: SharedActionRegistry<TRootState>`
2. Update `DSLAppConfig` and `CardStoriesConfig` boundaries:
   - `snapshotSelector?: (state: TRootState) => Record<string, unknown>`
   - `createStore: () => StoreLike<TRootState>` (define minimal interface)
3. Add compatibility overloads if needed for existing app call sites.

### Phase 2: Runtime Generic Propagation

1. Make `RuntimeLookup` generic (`RuntimeLookup<TRootState>`).
2. Thread `TRootState` through:
   - `createSelectorResolver`
   - `createCardContext` call sites in shell
   - runtime execute helpers where lookup/context are composed.
3. Replace broad casts to registries with typed local adapters.

### Phase 3: Cast Reduction and Guard Rails

1. Replace `dispatch(action as any)` with typed dispatch adapter.
2. Remove `key as any` in `setLayout` call by introducing narrow mapping guard.
3. Replace `runtimeSlice as any` with `HypercardRuntimeStateSlice` boundary type.
4. Add compile-only contract tests (`tsd` style or strict `tsc` fixture checks).

### Phase 4: Rollout and Migration

1. Update app call sites in:
   - `apps/inventory/src/App.tsx`
   - `apps/todo/src/App.tsx`
   - `apps/crm/src/App.tsx`
   - `apps/book-tracker-debug/src/App.tsx`
2. Update story call sites using `createStoryHelpers`.
3. Run full workspace typecheck and Storybook smoke pass.

## Acceptance Criteria

1. `rg -n "\bany\b" packages/engine/src/components/shell/HyperCardShell.tsx packages/engine/src/app/createDSLApp.tsx packages/engine/src/app/generateCardStories.tsx packages/engine/src/cards/runtime.ts` returns no API-boundary `any` usages except justified/internal comments.
2. All apps typecheck under root `npm run typecheck` once root references are fixed.
3. Story helpers expose typed `snapshotSelector` and typed store factory.
4. Existing app behavior remains unchanged at runtime.

## Alternatives Considered

1. Keep current `any` boundaries and rely on tests.
   - Rejected: shifts too much safety burden to runtime testing.
2. Full typed Redux action unions across the codebase immediately.
   - Rejected: high implementation cost and likely slows delivery.
3. Runtime schema validation only (zod/io-ts) without TS hardening.
   - Rejected: useful complement, but does not replace compile-time ergonomics.

## Open Questions

1. Should debug/snapshot selectors expose full root state or a constrained readonly projection?
2. Do we want a strict mode flag for shell/helper APIs (`strictTypes: true`) during migration?
3. Should runtime debug payload sanitization receive typed event payload contracts in the same effort or later?

## References

- `design-doc/01-in-depth-setup-and-dsl-js-api-review.md`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/app/createDSLApp.tsx`
- `packages/engine/src/app/generateCardStories.tsx`
- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/cards/types.ts`
