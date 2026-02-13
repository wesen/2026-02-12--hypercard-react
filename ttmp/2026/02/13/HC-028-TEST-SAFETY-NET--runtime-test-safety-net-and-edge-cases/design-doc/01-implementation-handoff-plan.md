---
Title: Implementation Handoff Plan
Ticket: HC-028-TEST-SAFETY-NET
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/cards/runtime.ts
      Note: Primary runtime behavior under test
    - Path: packages/engine/src/cards/runtimeStateSlice.ts
      Note: Scoped mutation and runtime state shape behavior under test
    - Path: packages/engine/src/cards/types.ts
      Note: Contract definitions to mirror in tests
    - Path: packages/engine/src/features/navigation/navigationSlice.ts
      Note: Navigation state behavior under test
    - Path: packages/engine/src/components/widgets/ListView.tsx
      Note: Footer aggregation edge behavior under test
    - Path: package.json
      Note: Root script and CI contract updates for tests
    - Path: apps/inventory/package.json
      Note: Existing vitest toolchain reference
    - Path: ttmp/2026/02/13/HC-025-RUNTIME-CONTRACTS--runtime-action-and-navigation-contracts/design-doc/01-implementation-handoff-plan.md
      Note: Runtime behavior changes this test net should guard
ExternalSources: []
Summary: Establishes a high-value runtime regression suite to protect ongoing cleanup and refactor work.
LastUpdated: 2026-02-13T17:02:00-05:00
WhatFor: Guide implementation of initial runtime-focused test coverage
WhenToUse: Use while adding and validating runtime integration/regression tests
---

# Implementation Handoff Plan

## Executive Summary

The repo currently has no formal tests for DSL/runtime semantics. This ticket creates a focused test safety net that covers highest-risk runtime contracts and edge behaviors.

## Problem Statement

Without tests, runtime regressions in action/selector/state flows can ship undetected, especially while multiple cleanup tickets alter core behavior.

High-risk gaps include:

- action resolution/dispatch precedence
- selector resolution order
- scoped state mutation correctness
- navigation home behavior
- footer aggregation edge handling

## Proposed Solution

1. Add a minimal runtime-focused test harness.
2. Implement a first wave of high-value integration and unit tests.
3. Wire tests into scripts and CI so they run continuously.

## Design Decisions

1. Prioritize behavior tests over snapshot-heavy UI tests.
2. Co-locate tests near engine runtime modules where practical.
3. Keep test fixtures small and explicit to reduce maintenance overhead.

## Alternatives Considered

1. Rely on manual Storybook testing.
- Rejected because behavior regressions are easy to miss and expensive to debug.

2. Start with full E2E browser tests.
- Rejected for initial phase due setup cost and slower feedback loops.

3. Delay tests until cleanup is complete.
- Rejected because cleanup without safety net raises risk.

## Implementation Plan

### Phase 1: Test Harness Setup

1. Choose runtime test runner location and scripts.
2. Add base config and first smoke test ensuring runner executes in CI.

### Phase 2: Runtime Behavior Tests

1. Add tests for action execution precedence and built-ins.
2. Add tests for selector resolution order and fallback behavior.
3. Add tests for scoped mutation commands.

### Phase 3: Navigation and Widget Edge Tests

1. Add navigation reducer tests for home card initialization/reset behaviors.
2. Add ListView footer aggregation tests including empty-item edge handling.

### Phase 4: Integration Scenario

1. Add one integration test simulating command arg resolution (`param`, `event`, `sel`) and action execution against a small fixture stack.

### Phase 5: CI and Documentation

1. Add test command(s) to root/package scripts.
2. Integrate test command into CI checks.
3. Document how to add new runtime tests and fixtures.

## Open Questions

1. Should runtime tests run under one package only or per-app adapters as well?
2. Do we want coverage thresholds in phase one or add them later after baseline stabilizes?

## References

- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/cards/runtimeStateSlice.ts`
- `packages/engine/src/cards/types.ts`
- `packages/engine/src/features/navigation/navigationSlice.ts`
- `packages/engine/src/components/widgets/ListView.tsx`
- `package.json`
- `apps/inventory/package.json`
- `ttmp/2026/02/13/HC-025-RUNTIME-CONTRACTS--runtime-action-and-navigation-contracts/design-doc/01-implementation-handoff-plan.md`
