---
Title: OS-03 implementation plan
Ticket: OS-03-DESKTOP-OS-FOUNDATION
Status: active
Topics:
    - go-go-os
    - frontend
    - architecture
    - launcher
    - desktop
    - binary
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Detailed implementation plan for building `packages/desktop-os` contracts, registry, launcher composition helpers, and the single global store host.
LastUpdated: 2026-02-24T14:01:30.802704584-05:00
WhatFor: Give developers a complete implementation sequence for the desktop-os foundation without requiring prior OS-02 context.
WhenToUse: Use when implementing this ticket or onboarding a new contributor to the launcher runtime foundation.
---

# OS-03 implementation plan

## Executive Summary

Create `packages/desktop-os` as the new frontend runtime foundation for the launcher architecture. The package owns module contracts, app registry validation, app-key semantics, launcher icon/contribution composition, and single-store creation. No compatibility wrapper will be added; this is a hard-cut architecture move.

## Problem Statement

Current go-go-os app boot is app-local and not designed for a launcher that composes many apps. We need one package that can:

1. define how apps declare themselves,
2. register many app modules safely,
3. compose launcher behavior deterministically,
4. build one global Redux store with app slices.

Without this package, OS-04/05 cannot proceed with predictable APIs.

## Scope and Non-Goals

In scope:

- New `packages/desktop-os` workspace package.
- Type contracts for launchable app modules and host context.
- Registry creation with uniqueness/fail-fast validation.
- Helpers for app key parsing/formatting and icon/contribution composition.
- Single store builder (global only).
- Unit tests and package-level docs.

Out of scope:

- App-specific module migrations (OS-05).
- Full launcher host wiring in an app shell (OS-04).
- Backend composition and route mount (OS-06).

## Proposed Solution

### Package layout

`packages/desktop-os/src`:

- `contracts/appManifest.ts`
- `contracts/launchableAppModule.ts`
- `contracts/launcherHostContext.ts`
- `contracts/launcherRenderContext.ts`
- `registry/createAppRegistry.ts`
- `runtime/appKey.ts`
- `runtime/buildLauncherIcons.ts`
- `runtime/buildLauncherContributions.ts`
- `runtime/renderAppWindow.ts`
- `store/createLauncherStore.ts`
- `index.ts`

### Core contracts

- `AppManifest`: app ID, label, icon metadata, ordering metadata, and `stateKey` ownership.
- `LaunchableAppModule`: manifest + optional reducer + selectors + `buildLaunchWindow` + `renderWindow` + contributions provider.
- `LauncherHostContext`: host services such as `openWindow`, route resolver helpers, and environment hooks.
- `LauncherRenderContext`: context passed during rendering for instance-specific operations.

### Registry and runtime behaviors

- Registry construction validates:
  - unique `manifest.id`,
  - unique `stateKey` (if reducer provided),
  - deterministic ordering for icons/contributions.
- `appKey` format: `${appId}:${instanceId}` with parser and formatter.
- Window renderer dispatches to owning module and returns hard failure for unknown module IDs.

### Single store strategy

`createLauncherStore` composes engine reducers with app module reducers into one reducer map. Duplicate keys fail startup. This enforces the locked decision: one global store for OS runtime.

## Design Decisions

1. `desktop-os -> engine` only; no reverse imports.
2. Hard cutover: no compatibility adapters for legacy app boot code.
3. Startup should fail fast on manifest/reducer collisions.
4. Determinism over dynamic implicit ordering.

## Alternatives Considered

1. Keep contracts inside `packages/engine`.
Rejected because it would couple desktop orchestration and generic windowing primitives.

2. Per-app independent stores.
Rejected because cross-app orchestration, window interactions, and global selectors become fragile.

## Detailed Implementation Plan

### Phase 1: Package bootstrap

- Add `packages/desktop-os/package.json`, `tsconfig.json`, and minimal build/test scripts.
- Export only placeholder symbols from `src/index.ts`.
- Add `README.md` with dependency direction and ownership boundaries.

Exit criteria:

- `npm run -w packages/desktop-os build` succeeds.

### Phase 2: Contracts

- Implement contract files under `src/contracts/*`.
- Add type-level comments for required/optional module capabilities.
- Add manifest validation helpers (`assertValidAppId`, `assertUniqueStateKeys`, etc.).

Exit criteria:

- Unit tests cover invalid IDs, duplicate IDs, and duplicate state keys.

### Phase 3: Registry + runtime composition

- Implement `createAppRegistry` that accepts module list and validates/deduplicates.
- Implement icon/contribution composition helpers using deterministic sorting rules.
- Implement app-key formatter/parser and window render resolver.

Exit criteria:

- Registry tests verify deterministic order and collision failures.

### Phase 4: Store composer

- Implement `createLauncherStore`.
- Merge base engine reducers + module reducers.
- Throw clear error on duplicate reducer keys.
- Expose typed selector helper for module state access by `stateKey`.

Exit criteria:

- Store tests verify global store creation and duplicate-key fail-fast.

### Phase 5: Documentation + integration handoff

- Update package README with usage snippets.
- Add example module fixture for downstream tickets.
- Document stable API surface to unblock OS-04/05.

Exit criteria:

- API signatures frozen and referenced by OS-04/05 tickets.

## Verification Strategy

Run locally:

- `npm run -w packages/desktop-os lint`
- `npm run -w packages/desktop-os test`
- `npm run -w packages/desktop-os build`

Repository smoke:

- `npm run lint`
- `npm run test`

## Handoff Notes

A developer picking up this ticket should start with Phase 1 and complete phases in order. Do not start OS-04 integration until Phase 4 APIs and tests are stable.

## Open Questions

- Exact optionality rules for module-provided reducers/selectors will be finalized during implementation, but fail-fast behavior remains mandatory.

## References

- `../index.md`
- `../../OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md`
