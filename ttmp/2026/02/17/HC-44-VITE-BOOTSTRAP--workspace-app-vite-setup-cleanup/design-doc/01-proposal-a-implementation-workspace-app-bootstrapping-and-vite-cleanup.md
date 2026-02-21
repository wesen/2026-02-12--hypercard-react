---
Title: 'Proposal A Implementation: Workspace/App Bootstrapping and Vite Cleanup'
Ticket: HC-44-VITE-BOOTSTRAP
Status: active
Topics:
    - frontend
    - architecture
    - vite
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/book-tracker-debug/vite.config.ts
      Note: Book tracker app now uses shared helper defaults
    - Path: apps/crm/vite.config.ts
      Note: CRM app now uses shared helper defaults
    - Path: apps/inventory/vite.config.ts
      Note: Inventory app now opts into shared helper with chat proxy
    - Path: apps/todo/vite.config.ts
      Note: Todo app now uses shared helper defaults
    - Path: tooling/vite/createHypercardViteConfig.ts
      Note: Shared Vite defaults and optional inventory proxy implementation
ExternalSources: []
Summary: Implementation and validation record for consolidating duplicated app-level Vite setup into a shared helper with optional inventory proxy support.
LastUpdated: 2026-02-17T14:23:00-05:00
WhatFor: Capture final design decisions and completed implementation details for Proposal A.
WhenToUse: Use when reviewing or extending shared Vite setup in the HyperCard workspace.
---


# Proposal A Implementation: Workspace/App Bootstrapping and Vite Cleanup

## Executive Summary

Proposal A has been implemented by introducing a shared Vite helper and migrating all app configs to it. This removes duplicated config boilerplate while preserving inventory-specific chat proxy behavior.

## Problem Statement

Before this ticket, all apps duplicated Vite setup for:

- React plugin wiring
- `@hypercard/engine` alias resolution

Duplicated files:

- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`

## Implemented Solution

### New shared helper

File added:

- `tooling/vite/createHypercardViteConfig.ts`

The helper now centralizes:

- `@vitejs/plugin-react`
- `@hypercard/engine` alias resolution to `../../packages/engine/src`
- optional inventory chat proxy wiring

Helper options:

```ts
export interface HypercardViteConfigOptions {
  inventoryChatProxy?: boolean;
  inventoryChatBackendEnvVar?: string;
  inventoryChatBackendDefault?: string;
}
```

### App config refactor

All app configs were simplified to helper calls:

- `apps/inventory/vite.config.ts`
- uses `createHypercardViteConfig({ inventoryChatProxy: true })`

- `apps/todo/vite.config.ts`
- uses `createHypercardViteConfig()`

- `apps/crm/vite.config.ts`
- uses `createHypercardViteConfig()`

- `apps/book-tracker-debug/vite.config.ts`
- uses `createHypercardViteConfig()`

Inventory proxy semantics are preserved:

- env var: `INVENTORY_CHAT_BACKEND`
- fallback target: `http://127.0.0.1:8091`
- proxied routes: `/chat`, `/ws`, `/api`

## Design Decisions

1. Keep helper in repo tooling (`tooling/vite`).
- This is workspace build infrastructure, not engine runtime code.

2. Keep per-app `vite.config.ts` entrypoints.
- Preserves app-local discoverability and future app-specific overrides.

3. Implement inventory proxy as explicit option.
- Avoids special-case copy/paste in config files.

## Validation

### Passing checks

- `npm run typecheck` passed.

- All app dev servers successfully started with the refactored configs (smoke check via `timeout`):
- inventory (`:4173`)
- todo (`:4174`)
- crm (`:4175`)
- book-tracker-debug (`:4176`)

### Known unrelated build failure

Targeted app production builds still fail due a pre-existing worker bundling issue in engine runtime worker path, unrelated to this refactor:

- error location: `packages/engine/src/plugin-runtime/worker/sandboxClient.ts`
- error: `Invalid value "iife" for option "worker.format" ...`

This failure reproduced consistently across all four apps and is outside Proposal A scope.

## Alternatives Considered

1. Keep duplicated configs.
- Rejected: no reduction in maintenance overhead.

2. One root Vite config for all apps.
- Rejected: weaker app-level clarity and harder per-app customization.

3. Put helper in `packages/engine`.
- Rejected: engine package should not own workspace tooling concerns.

## Implementation Plan

Completed in this ticket:

1. Add helper.
2. Migrate app configs.
3. Validate via typecheck and dev startup smoke checks.
4. Document and close ticket.

## Open Questions

None for Proposal A implementation.

## References

- `tooling/vite/createHypercardViteConfig.ts`
- `apps/inventory/vite.config.ts`
- `apps/todo/vite.config.ts`
- `apps/crm/vite.config.ts`
- `apps/book-tracker-debug/vite.config.ts`
