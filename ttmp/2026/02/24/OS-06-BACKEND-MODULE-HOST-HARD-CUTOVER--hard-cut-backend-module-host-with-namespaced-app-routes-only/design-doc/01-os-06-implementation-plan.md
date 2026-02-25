---
Title: OS-06 implementation plan
Ticket: OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER
Status: active
Topics:
    - go-go-os
    - backend
    - architecture
    - launcher
    - binary
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Detailed plan to implement backend app module contracts, module lifecycle registry, namespaced routes, and hard-cut alias removal.
LastUpdated: 2026-02-24T14:01:31.657710411-05:00
WhatFor: Provide implementation-level backend migration steps for launcher-compatible app modules.
WhenToUse: Use when implementing backend module APIs and route mounting for launcher apps.
---

# OS-06 implementation plan

## Executive Summary

Build a backend module host that composes optional app backend modules into one server process. All app APIs mount under `/api/apps/<app-id>/*` and legacy aliases are removed.

## Problem Statement

Frontend launcher modules can include backend functionality, but the current server setup is not a generalized module host and still includes legacy app-specific aliases.

## Scope and Non-Goals

In scope:

- Define backend module contracts (`AppBackendManifest`, `AppBackendModule`).
- Build backend module registry and startup lifecycle.
- Mount namespaced app routes only.
- Add `/api/os/apps` capability manifest endpoint.
- Remove compatibility aliases.

Out of scope:

- Full binary packaging and release workflow (OS-07).
- Frontend UI migration details (OS-04/05).

## Proposed Solution

### Backend contract

Each backend app module declares:

- `AppID`
- required/optional startup hooks
- route registration callback mounted into provided router group
- health/readiness contract

### Host composition

- Load configured backend modules at startup.
- Validate unique app IDs.
- Mount each module under `/api/apps/<app-id>`.
- Expose `/api/os/apps` endpoint listing module capabilities.
- Fail startup if required module init fails.

### Hard-cut route policy

- Remove old aliases such as `/chat`, `/ws`, `/api/timeline` once their namespaced replacements exist.
- Keep routing table explicit and auditable.

## Design Decisions

1. One host process, many backend modules.
2. Namespaced app routes are mandatory.
3. Required-module failures are fatal at startup.
4. No alias compatibility layer.

## Alternatives Considered

1. Keep mixed routing (aliases + namespaced).
Rejected because it prolongs ambiguity and doubles maintenance.

2. Separate process per app backend.
Rejected for initial architecture due to operational and deployment complexity.

## Detailed Implementation Plan

### Phase 1: Contract + host scaffold

- Define Go interfaces and manifest model.
- Create module registry with uniqueness checks.

Exit criteria:

- Unit tests verify duplicate app ID rejection.

### Phase 2: Route mount and manifest endpoint

- Implement namespaced mount logic.
- Implement `/api/os/apps` endpoint exposing module metadata.

Exit criteria:

- Server exposes namespaced routes and manifest endpoint.

### Phase 3: First module migration

- Convert inventory backend handlers into backend module implementation.
- Mount under `/api/apps/inventory/*`.

Exit criteria:

- Inventory integration works through namespaced routes.

### Phase 4: Hard cut cleanup

- Remove legacy aliases.
- Add startup checks ensuring no forbidden alias patterns remain.

Exit criteria:

- No legacy alias paths exposed.

### Phase 5: Tests and ops docs

- Add integration tests for route mounting and health behavior.
- Document module registration and startup failure behavior.

Exit criteria:

- CI validates route policy and startup lifecycle.

## Verification Strategy

- `go test ./...`
- module-host integration tests
- route table assertions in tests

## Open Questions

- Required vs optional module policy defaults may be refined, but this ticket should keep required modules fail-fast.

## References

- `../index.md`
- `../../OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md`
