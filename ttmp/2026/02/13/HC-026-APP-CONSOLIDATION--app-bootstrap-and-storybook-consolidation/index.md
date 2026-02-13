---
Title: App Bootstrap and Storybook Consolidation
Ticket: HC-026-APP-CONSOLIDATION
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/app/createAppStore.ts
      Note: Canonical engine store helper
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: Canonical story helper
    - Path: apps/inventory/src/app/store.ts
      Note: Manual store wiring to migrate
    - Path: apps/todo/src/app/store.ts
      Note: Manual store wiring to migrate
    - Path: apps/inventory/src/stories/decorators.tsx
      Note: Bespoke story store decorator path
    - Path: apps/todo/src/stories/TodoApp.stories.tsx
      Note: Bespoke story harness path
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/various/review-metrics.txt
      Note: Duplication indicators for state-binding boilerplate
ExternalSources: []
Summary: Consolidates app/store/story wiring on engine helpers and reduces repeated card state-binding boilerplate.
LastUpdated: 2026-02-13T16:52:00-05:00
WhatFor: Reduce setup divergence and maintenance overhead across apps
WhenToUse: Use during migration of manual app/story wiring to shared helper paths
---

# App Bootstrap and Storybook Consolidation

## Overview

This ticket addresses HC-022 findings 10, 11, and 12.

Scope:

- converge app store wiring on `createAppStore`
- converge story wiring on `createStoryHelpers`
- reduce repeated `state.setField` and edit-reset boilerplate via helper factories

## Key Links

- Handoff implementation plan: `design-doc/01-implementation-handoff-plan.md`
- Task checklist: `tasks.md`
- Parent review source: `../HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md`

## Status

Current status: **active**

## Tasks

See `tasks.md`.

## Changelog

See `changelog.md`.
