---
Title: OS-04 implementation plan
Ticket: OS-04-LAUNCHER-HOST-FRONTEND
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
Summary: Detailed implementation plan for the launcher host frontend app that wires DesktopShell, desktop-os registry/runtime, and single-store boot.
LastUpdated: 2026-02-24T14:01:31.132600449-05:00
WhatFor: Give implementation-level instructions for assembling launcher UI behavior on top of desktop-os.
WhenToUse: Use when building or changing launcher host boot flow, shell composition, or window/icon rendering.
---

# OS-04 implementation plan

## Executive Summary

Create a dedicated launcher host frontend app that boots one global store, loads launchable app modules through `desktop-os`, renders icon surfaces, and opens windows through `engine` DesktopShell.

## Problem Statement

Even with `desktop-os` contracts available, we still need a concrete host entrypoint that:

1. boots runtime state once,
2. renders launcher icons from registered modules,
3. routes launch actions into window creation,
4. renders app windows through module renderers.

## Scope and Non-Goals

In scope:

- Create/convert launcher host app (expected at `apps/os-launcher`).
- Wire providers, theme, and store boot.
- Compose module registry and icon model.
- Connect launch actions to window creation.
- Add host-level smoke and integration tests.

Out of scope:

- Converting each app to modules (OS-05).
- Backend namespaced route migration (OS-06).
- Binary packaging and CI hardening (OS-07).

## Proposed Solution

### App host composition

- Bootstrap with `main.tsx` and one root `App.tsx`.
- Build store using `createLauncherStore` from `desktop-os`.
- Build module registry from imported app modules.
- Derive icon model via `buildLauncherIcons`.
- Use `DesktopShell` from `engine` as rendering container.

### Host responsibilities

- Provide `LauncherHostContext` implementation (`openWindow`, route resolvers).
- Map desktop interactions to module launch actions.
- Render windows by delegating to `renderAppWindow`.
- Keep host thin; app behavior belongs to module implementations.

### Data flow

1. modules registered,
2. registry validated,
3. icons derived,
4. user clicks icon,
5. host opens window with app key,
6. `renderAppWindow` renders module view.

## Design Decisions

1. Host app is orchestration-only and does not contain app business logic.
2. One global store mounted once at app bootstrap.
3. Icon generation is manifest-driven, not hardcoded per app.
4. All window rendering routes through `desktop-os` resolver.

## Alternatives Considered

1. Keep existing per-app boot and add launcher overlay.
Rejected because it retains duplicated boot paths and blocks hard cutover.

2. Put host orchestration into `engine`.
Rejected because this couples app model and windowing primitives.

## Detailed Implementation Plan

### Phase 1: Host scaffold

- Create `apps/os-launcher` structure and workspace scripts.
- Add Vite config and TS config aligned with existing apps.
- Add root provider setup in `main.tsx`.

Exit criteria:

- Launcher app starts with placeholder shell.

### Phase 2: Runtime wiring

- Import `desktop-os` APIs.
- Build module list and registry.
- Construct store via `createLauncherStore`.
- Build icon model for desktop surfaces.

Exit criteria:

- Runtime boots with no app windows open and icon grid visible.

### Phase 3: Launch and render flow

- Implement icon click -> window open callback.
- Persist app key metadata in window payload.
- Use `renderAppWindow` for content rendering.

Exit criteria:

- Clicking each icon opens a module window stub.

### Phase 4: Host-level testing

- Add tests for icon rendering and launch callbacks.
- Add smoke test for registry boot failure on collision.
- Add viewport sanity check for desktop + mobile breakpoints.

Exit criteria:

- Tests pass locally and in CI.

### Phase 5: Docs and handoff

- Document host startup path and extension points.
- Record integration touchpoints for OS-05 module migrations.

Exit criteria:

- OS-05 can plug converted modules into host without host refactor.

## Verification Strategy

- `npm run -w apps/os-launcher lint`
- `npm run -w apps/os-launcher test`
- `npm run -w apps/os-launcher build`

## Open Questions

- Final icon grouping UX can evolve later; this ticket only needs deterministic manifest-driven grouping.

## References

- `../index.md`
- `../../OS-03-DESKTOP-OS-FOUNDATION--desktop-os-package-foundation-contracts-registry-and-single-store-host/design-doc/01-os-03-implementation-plan.md`
