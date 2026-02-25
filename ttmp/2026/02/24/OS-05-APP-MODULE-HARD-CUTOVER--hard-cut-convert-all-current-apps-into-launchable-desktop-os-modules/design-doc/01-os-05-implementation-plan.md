---
Title: OS-05 implementation plan
Ticket: OS-05-APP-MODULE-HARD-CUTOVER
Status: active
Topics:
    - go-go-os
    - frontend
    - architecture
    - launcher
    - desktop
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Detailed migration plan for converting all current apps into LaunchableAppModule implementations with a hard cutover.
LastUpdated: 2026-02-24T14:01:31.388736687-05:00
WhatFor: Give concrete per-app migration steps from standalone app boot to desktop-os module composition.
WhenToUse: Use when implementing app module adapters and deleting legacy frontend boot paths.
---

# OS-05 implementation plan

## Executive Summary

Convert all existing frontend apps (`inventory`, `todo`, `crm`, `book-tracker-debug`) into `LaunchableAppModule` implementations and remove standalone boot code so the launcher host is the only entrypoint.

## Problem Statement

Current apps still carry standalone boot assumptions. Without module conversion, launcher composition cannot be complete and runtime behavior will fragment.

## Scope and Non-Goals

In scope:

- Per-app module adapters with manifest, launch behavior, renderer, and optional reducer/selectors.
- Consolidated module list export consumed by OS-04 launcher host.
- Remove obsolete app-local boot flows that conflict with hard cutover.

Out of scope:

- Backend route migration and backend module host (OS-06).
- Binary packaging and end-to-end CI hardening (OS-07).

## Proposed Solution

### Module contract usage

For each app, create `src/launcher/module.ts` implementing:

- `manifest`
- `buildLaunchWindow`
- `renderWindow`
- optional `reducer` + `stateKey`
- optional contribution providers

### App migration approach

1. Extract app-root UI into reusable component if currently tied to standalone `main.tsx`.
2. Implement module wrapper around that component.
3. Move app-specific state slice registration into module metadata.
4. Remove standalone launcher fragments replaced by host-driven orchestration.

### Consolidation

- Create a canonical module index exported for host consumption.
- Enforce deterministic ordering by manifest metadata.

## Design Decisions

1. Hard cutover only; no dual boot between standalone and launcher.
2. Module files live with app code for ownership clarity.
3. Manifest IDs become stable runtime identifiers and cannot be renamed casually.

## Alternatives Considered

1. Keep old app entrypoints behind runtime flags.
Rejected because it prolongs migration complexity and doubles test matrix.

2. Centralize all module files in one package.
Rejected because it disconnects module wiring from app ownership.

## Detailed Implementation Plan

### Phase 1: App inventory and prep

- Audit each app entrypoint and identify reusable root component.
- Create a migration table: old boot files, new module files, removable files.

| App ID | Current standalone boot entrypoint | New launcher module file | Status |
| --- | --- | --- | --- |
| `inventory` | `apps/inventory/src/main.tsx` + `apps/inventory/src/App.tsx` | `apps/inventory/src/launcher/module.tsx` | Converted |
| `todo` | `apps/todo/src/main.tsx` + `apps/todo/src/App.tsx` | `apps/todo/src/launcher/module.tsx` | Converted |
| `crm` | `apps/crm/src/main.tsx` + `apps/crm/src/App.tsx` | `apps/crm/src/launcher/module.tsx` | Converted |
| `book-tracker-debug` | `apps/book-tracker-debug/src/main.tsx` + `apps/book-tracker-debug/src/App.tsx` | `apps/book-tracker-debug/src/launcher/module.tsx` | Converted |

Exit criteria:

- All four apps have explicit conversion targets.

### Phase 2: Per-app module conversion

- Implement `inventory` module.
- Implement `todo` module.
- Implement `crm` module.
- Implement `book-tracker-debug` module.

Exit criteria:

- All modules compile and expose manifest + renderer.

### Phase 3: Module aggregation and host integration

- Build shared module list export used by OS-04 host.
- Validate module registration with `createAppRegistry`.

Exit criteria:

- Host can load all modules and show icons.

### Phase 4: Hard cut cleanup

- Delete superseded standalone app boot wiring.
- Remove stale exports/imports and dead code.

Exit criteria:

- No duplicated app boot path remains.

### Phase 5: Tests

- Add per-app module smoke tests.
- Add integration test for opening each app from launcher.

Exit criteria:

- Tests prove module lifecycle works for all apps.

## Verification Strategy

- `npm run lint`
- `npm run test`
- App-focused smoke command(s) for launcher host

## Open Questions

- If any app requires deferred/lazy loading for performance, it can be introduced after baseline hard cut completion.

## References

- `../index.md`
- `../../OS-03-DESKTOP-OS-FOUNDATION--desktop-os-package-foundation-contracts-registry-and-single-store-host/design-doc/01-os-03-implementation-plan.md`
- `../../OS-04-LAUNCHER-HOST-FRONTEND--launcher-host-frontend-wiring-with-desktop-shell-and-desktop-os-runtime/design-doc/01-os-04-implementation-plan.md`
