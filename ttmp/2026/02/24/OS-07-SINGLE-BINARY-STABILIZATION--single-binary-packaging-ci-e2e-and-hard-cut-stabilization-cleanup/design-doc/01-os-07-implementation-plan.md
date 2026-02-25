---
Title: OS-07 implementation plan
Ticket: OS-07-SINGLE-BINARY-STABILIZATION
Status: active
Topics:
    - go-go-os
    - frontend
    - backend
    - architecture
    - binary
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Implementation plan for final single-binary build/embed workflow, CI and e2e stabilization, and post-hard-cut cleanup.
LastUpdated: 2026-02-24T14:01:32.141098976-05:00
WhatFor: Provide final integration/stabilization sequence to ship launcher as one binary.
WhenToUse: Use when closing out launcher migration and preparing reliable build/test/deploy workflows.
---

# OS-07 implementation plan

## Executive Summary

Stabilize and ship launcher architecture as a single executable containing backend services and embedded frontend assets, with CI and e2e coverage that enforces hard-cut route and boot assumptions.

## Problem Statement

After OS-03..OS-06, architecture may work locally but not yet be operationally reliable. We need consistent build/embed automation, deterministic CI, and cleanup of migration leftovers.

## Scope and Non-Goals

In scope:

- Frontend build + artifact embed into Go binary.
- Launcher binary command wiring.
- CI pipelines for lint/test/build/e2e.
- End-to-end verification and cleanup.

Out of scope:

- New feature development unrelated to launcher migration.

## Proposed Solution

### Build/embed pipeline

- Build launcher frontend artifacts in CI and local build script.
- Copy artifacts to Go embed directory.
- Serve embedded assets from launcher binary with SPA fallback.

### Runtime command

- Add dedicated launcher command entrypoint in Go (`cmd/go-go-os-launcher/main.go` or equivalent).
- Compose backend modules and embedded UI in one process.

### CI and quality gates

- Add/adjust CI jobs:
  - frontend lint/test/build,
  - Go unit/integration tests,
  - e2e launcher smoke.
- Gate merges on hard-cut route expectations and startup behavior.

### Cleanup

- Remove stale scripts/docs/code from migration.
- Update top-level docs and runbooks for launcher-first workflow.

## Design Decisions

1. Single command builds and launches final binary.
2. CI must test both frontend and backend composition.
3. Hard-cut assumptions are encoded as tests, not manual checks.

## Alternatives Considered

1. Keep multi-process production deployment.
Rejected because target architecture explicitly requires single binary.

2. Skip e2e checks in CI.
Rejected because integration risk is highest at launcher composition boundaries.

## Detailed Implementation Plan

### Phase 1: Build and embed wiring

- Add scripts/Make targets for frontend build and asset copy.
- Add Go embed and static asset serving path.

Exit criteria:

- One local command produces runnable binary with UI.

### Phase 2: Command assembly

- Add dedicated launcher main command.
- Ensure backend module host and frontend asset server share one process.

Exit criteria:

- Launcher starts and serves UI + APIs.

### Phase 3: CI pipelines

- Add/adjust workflows for lint/test/build/e2e.
- Ensure cache and workspace setup are deterministic.

Exit criteria:

- CI green from clean checkout.

### Phase 4: E2E and route policy checks

- Add e2e scenario: open launcher, launch app, verify namespaced backend call.
- Add negative route checks for removed aliases.

Exit criteria:

- E2E passes and legacy route checks enforced.

### Phase 5: Cleanup and documentation

- Remove dead migration files.
- Update top-level README and operator runbook.

Exit criteria:

- Repository documents launcher-first architecture only.

## Verification Strategy

- `npm run lint && npm run test && npm run build`
- `go test ./...`
- e2e launcher smoke script in CI

## Open Questions

- Final binary naming and distribution format can be finalized during implementation without changing architecture.

## References

- `../index.md`
- `../../OS-03-DESKTOP-OS-FOUNDATION--desktop-os-package-foundation-contracts-registry-and-single-store-host/design-doc/01-os-03-implementation-plan.md`
- `../../OS-04-LAUNCHER-HOST-FRONTEND--launcher-host-frontend-wiring-with-desktop-shell-and-desktop-os-runtime/design-doc/01-os-04-implementation-plan.md`
- `../../OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER--hard-cut-backend-module-host-with-namespaced-app-routes-only/design-doc/01-os-06-implementation-plan.md`
