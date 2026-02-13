---
Title: Implementation Handoff Plan
Ticket: HC-026-APP-CONSOLIDATION
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Shared store factory expected to be canonical
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: Shared story helper expected to be canonical
    - Path: apps/inventory/src/app/store.ts
      Note: Manual store composition currently diverges from helper path
    - Path: apps/todo/src/app/store.ts
      Note: Manual store composition currently diverges from helper path
    - Path: apps/crm/src/app/store.ts
      Note: Existing createAppStore usage can serve as migration reference
    - Path: apps/book-tracker-debug/src/app/store.ts
      Note: Existing createAppStore usage can serve as migration reference
    - Path: apps/todo/src/stories/TodoApp.stories.tsx
      Note: Bespoke story harness to migrate
    - Path: apps/inventory/src/stories/decorators.tsx
      Note: Bespoke decorator to migrate
    - Path: apps/crm/src/stories/CrmApp.stories.tsx
      Note: Existing createStoryHelpers usage reference
    - Path: apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx
      Note: Existing createStoryHelpers usage reference
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/various/review-metrics.txt
      Note: Baseline duplication counts for state binding/edit reset patterns
ExternalSources: []
Summary: Detailed migration plan to unify app/store/story setup and reduce duplicated state-binding boilerplate.
LastUpdated: 2026-02-13T16:54:00-05:00
WhatFor: Enable a new developer to execute consolidation work without re-discovering setup divergence
WhenToUse: Use while migrating app/store/story wiring to shared helpers
---

# Implementation Handoff Plan

## Executive Summary

App/store/story setup currently diverges across apps, causing repeated wiring and inconsistent maintenance paths. This ticket converges on shared engine helpers and extracts repeated card binding patterns.

## Problem Statement

Observed inconsistencies:

- Inventory and Todo define manual Redux reducer composition while CRM and Book Tracker use `createAppStore`.
- Story wiring is mixed: CRM/Book use `createStoryHelpers`, Todo/Inventory keep bespoke decorators/harnesses.
- Repeated `state.setField` and edit-reset action patterns increase update cost.

## Proposed Solution

1. Standardize all apps on `createAppStore` for engine reducers + domain reducers.
2. Standardize story scaffolding on `createStoryHelpers`.
3. Extract repeated binding/action payload patterns into helper builders and adopt them across domains.

## Design Decisions

1. Shared helpers are canonical; custom wiring is allowed only for documented special cases.
2. Migration should preserve runtime behavior and be delivered app by app.
3. Helper extraction should prioritize readability and DSL intent, not abstraction for its own sake.

## Alternatives Considered

1. Leave app-specific wiring as-is.
- Rejected because drift grows with each app.

2. Force one-step migration of all apps.
- Rejected due increased blast radius; staged migration is safer.

3. Keep duplicate action/binding patterns for explicitness.
- Rejected because repeated imperative details obscure card intent.

## Implementation Plan

### Phase 1: Store Convergence

1. Migrate Inventory store wiring to `createAppStore`.
2. Migrate Todo store wiring to `createAppStore`.
3. Ensure resulting typed exports (`RootState`, `AppDispatch`) remain stable for each app.

### Phase 2: Story Convergence

1. Replace Todo bespoke story harness with `createStoryHelpers`.
2. Replace Inventory decorators with `createStoryHelpers`-based setup.
3. Preserve app-specific parameters/nav shortcuts where required.

### Phase 3: Binding Boilerplate Reduction

1. Identify repeat patterns for:
- `state.setField` bindings
- edit reset patch sequences
2. Introduce helper builders in shared app/engine utility location.
3. Migrate at least two apps to validate helper ergonomics.

### Phase 4: Validation and Documentation

1. Validate each migrated app build and key card flows.
2. Run storybook smoke checks for migrated stories.
3. Update app authoring guidance in docs to use consolidated helper paths.

## Open Questions

1. Should binding helper utilities live in `packages/engine/src/cards/helpers.ts` or app-layer utilities?
2. Do we need per-app exceptions for story decorator behavior (e.g., domain preloading), and if so, what is the approved extension hook?

## References

- `packages/engine/src/app/createAppStore.ts`
- `packages/engine/src/app/generateCardStories.tsx`
- `apps/inventory/src/app/store.ts`
- `apps/todo/src/app/store.ts`
- `apps/crm/src/app/store.ts`
- `apps/book-tracker-debug/src/app/store.ts`
- `apps/todo/src/stories/TodoApp.stories.tsx`
- `apps/inventory/src/stories/decorators.tsx`
- `apps/crm/src/stories/CrmApp.stories.tsx`
- `apps/book-tracker-debug/src/stories/BookTrackerDebugApp.stories.tsx`
- `ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/various/review-metrics.txt`
