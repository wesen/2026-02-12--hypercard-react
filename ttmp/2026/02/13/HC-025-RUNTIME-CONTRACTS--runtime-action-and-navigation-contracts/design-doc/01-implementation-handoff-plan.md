---
Title: Implementation Handoff Plan
Ticket: HC-025-RUNTIME-CONTRACTS
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/cards/types.ts
      Note: Declares ActionDescriptor and ActionScope contracts
    - Path: packages/engine/src/cards/helpers.ts
      Note: `Act` helper exposes `to` option
    - Path: packages/engine/src/cards/runtime.ts
      Note: Current execution flow ignores `descriptor.to` and silently finalizes unhandled actions
    - Path: packages/engine/src/features/navigation/navigationSlice.ts
      Note: Hard-coded `home` stack entry initialization and setLayout reset
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Stack/homeCard runtime context needed for nav reset behavior
    - Path: packages/engine/src/components/widgets/ListView.tsx
      Note: Empty min/max aggregation bug
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Source findings and rationale
ExternalSources: []
Summary: Detailed implementation plan for runtime action-scope correctness, navigation homeCard behavior, unhandled-action surfacing, and list footer edge-case fixes.
LastUpdated: 2026-02-13T16:50:00-05:00
WhatFor: Provide a handoff-ready implementation sequence for runtime semantic fixes
WhenToUse: Use while implementing and validating runtime contract behavior
---

# Implementation Handoff Plan

## Executive Summary

Runtime semantics have contract mismatches: `ActionDescriptor.to` is exposed but not honored, unhandled actions are mostly silent, and navigation reset ignores `homeCard`. This ticket closes those gaps and fixes a related `ListView` empty-aggregation edge case.

## Problem Statement

Current behavior includes:

- Action scope contract drift: `types.ts` + helper APIs expose `to`, runtime does not execute by scope target.
- Unhandled action visibility gap: runtime finalizes `unhandled` but does not emit default warning behavior.
- Navigation correctness gap: reducer initializes/resets to `{ card: 'home' }` regardless of configured stack `homeCard`.
- Widget edge bug: `Math.min(...[])` and `Math.max(...[])` can surface infinities.

## Proposed Solution

1. Define and implement a single explicit action resolution policy for `descriptor.to`.
2. Surface unhandled actions through warning/debug signals by default in development.
3. Make navigation reset and initialization stack-aware by passing `homeCard` into reducer flow.
4. Harden `ListView` footer aggregation for empty values.

## Design Decisions

1. Action scope is a contract, not advisory metadata.
2. Reducers remain generic; runtime context (stack home card) is passed via action payload, not hard-coded globally.
3. Unhandled actions should be observable by default, but configurable to reduce noise.
4. Empty aggregations return deterministic finite values.

## Alternatives Considered

1. Remove `to` from API surface.
- Viable fallback if implementation complexity is too high, but this requires API migration and doc updates.

2. Keep unhandled behavior debug-only.
- Rejected because silent no-op failures are expensive to diagnose.

3. Keep `home` as hard-coded convention.
- Rejected because stack metadata already defines `homeCard` and should be authoritative.

## Implementation Plan

### Phase 1: Action Scope Contract Decision

1. Decide final behavior:
- implement `to` semantics, or
- deprecate/remove `to` from contracts (`types.ts`, helpers, docs)
2. Document decision in this ticket and HC-022 references.

### Phase 2: Runtime Action Execution Update

1. Modify action execution path in `packages/engine/src/cards/runtime.ts` to honor `descriptor.to`.
2. Ensure precedence behavior is explicit for `auto` (current local then shared style, unless changed).
3. Ensure async local/shared handlers keep consistent debug/error events.

### Phase 3: Unhandled Action Observability

1. Add default warning path for unhandled actions (dev-focused).
2. Include structured context:
- action type
- stack/card/cardType identifiers
- resolved args snapshot if safe

### Phase 4: Navigation homeCard Correctness

1. Update navigation slice contract so resets can target explicit home card.
2. Wire shell/runtime path to dispatch reset with stack `homeCard`.
3. Validate stacks whose home id is not `home`.

### Phase 5: ListView Edge Hardening

1. Update `min`/`max` branches in `ListView.tsx` to guard empty arrays.
2. Validate footer format output for empty and non-empty states.

### Phase 6: Tests and Validation

1. Add tests for action scope and unhandled action behavior.
2. Add navigation reducer tests for homeCard reset behavior.
3. Add widget tests for footer min/max edge case.
4. Run typecheck and any applicable app/story checks.

## Open Questions

1. Should unhandled action behavior dispatch toast notifications in dev, or warning-only?
2. For `to: 'shared'`, should fallback to local ever occur when shared handler is missing?
3. Should navigation reset action also clear param explicitly in all cases?

## References

- `packages/engine/src/cards/types.ts`
- `packages/engine/src/cards/helpers.ts`
- `packages/engine/src/cards/runtime.ts`
- `packages/engine/src/features/navigation/navigationSlice.ts`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/components/widgets/ListView.tsx`
- `ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md`
