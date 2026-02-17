---
Title: Type Safety Boundary Hardening
Ticket: HC-027-TYPE-SAFETY
Status: complete
Topics:
    - architecture
    - code-quality
    - review
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Shell boundary contains key `any` usage sites
    - Path: packages/engine/src/app/createDSLApp.tsx
      Note: App factory snapshot selector currently typed with `any`
    - Path: packages/engine/src/app/generateCardStories.tsx
      Note: 'Story helper exposes `createStore: () => any` and `snapshotSelector(state: any)`'
    - Path: packages/engine/src/cards/runtime.ts
      Note: RuntimeLookup currently generic-collapses to `any`
    - Path: packages/engine/src/cards/types.ts
      Note: Canonical generic contracts to propagate
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/02-finding-14-type-safety-boundary-analysis.md
      Note: Deep analysis this ticket implements
ExternalSources: []
Summary: Implements type boundary hardening described in finding 14 deep-dive analysis.
LastUpdated: 2026-02-17T07:40:36.143282817-05:00
WhatFor: Strengthen compile-time guarantees at shell/runtime/app helper integration boundaries
WhenToUse: Use while replacing public-boundary `any` usage with typed contracts
---


# Type Safety Boundary Hardening

## Overview

This ticket implements the dedicated finding-14 deep-dive analysis from HC-022.

## Key Links

- Handoff implementation plan: `design-doc/01-implementation-handoff-plan.md`
- Task checklist: `tasks.md`
- Deep analysis source: `../HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/02-finding-14-type-safety-boundary-analysis.md`

## Status

Current status: **active**

## Tasks

See `tasks.md`.

## Changelog

See `changelog.md`.
