---
Title: Runtime Action and Navigation Contracts
Ticket: HC-025-RUNTIME-CONTRACTS
Status: complete
Topics:
    - architecture
    - code-quality
    - review
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/cards/types.ts
      Note: ActionDescriptor and ActionScope contract definitions
    - Path: packages/engine/src/cards/helpers.ts
      Note: '`Act(..., { to })` helper exposes action scope API'
    - Path: packages/engine/src/cards/runtime.ts
      Note: Action execution order and unhandled action behavior
    - Path: packages/engine/src/features/navigation/navigationSlice.ts
      Note: Hard-coded `home` initialization/reset behavior
    - Path: packages/engine/src/components/widgets/ListView.tsx
      Note: Empty min/max aggregation edge case
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Parent findings (6/7/8/15)
ExternalSources: []
Summary: Completes runtime action/navigation contracts and fixes action/aggregation edge behavior.
LastUpdated: 2026-02-17T07:40:35.851732196-05:00
WhatFor: Make runtime semantics explicit and reliable for DSL actions and navigation behavior
WhenToUse: Use while implementing runtime contract fixes and behavior validation
---


# Runtime Action and Navigation Contracts

## Overview

This ticket covers runtime correctness gaps from HC-022 findings 6, 7, 8, and 15.

Scope:

- enforce or remove `ActionDescriptor.to` semantics
- improve unhandled action observability
- respect stack `homeCard` in navigation initialization/reset paths
- fix `ListView` footer min/max behavior on empty datasets

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
