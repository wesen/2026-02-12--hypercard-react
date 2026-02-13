---
Title: Implementation Handoff Plan
Ticket: HC-023-SETUP-CONTRACTS
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: package.json
      Note: Root scripts for dev/build/storybook/lint/typecheck
    - Path: tsconfig.json
      Note: Root project references currently missing two apps
    - Path: packages/engine/package.json
      Note: Missing build script causes root build failure
    - Path: apps/inventory/package.json
      Note: App script baseline for build/dev
    - Path: apps/todo/package.json
      Note: App script baseline for build/dev
    - Path: apps/crm/package.json
      Note: App script baseline for build/dev
    - Path: apps/book-tracker-debug/package.json
      Note: App script baseline for build/dev
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Source findings and command evidence
ExternalSources: []
Summary: Concrete implementation plan to harden root build/typecheck/lint contracts and migrate linting to Biome.
LastUpdated: 2026-02-13T16:42:00-05:00
WhatFor: Onboard a new developer to execute setup contract fixes safely
WhenToUse: Use during implementation and review of root tooling changes
---

# Implementation Handoff Plan

## Executive Summary

Root quality gates are not trustworthy in the current state. `build` fails due missing engine build script, `lint` is not operational, and root typecheck coverage is incomplete. This ticket establishes a deterministic tooling contract with Biome linting.

## Problem Statement

Current breakpoints:

- `package.json` root `build` invokes `npm run build -w packages/engine`, but `packages/engine/package.json` has no `build` script.
- `package.json` root `lint` points to ESLint without a configured ESLint setup.
- `tsconfig.json` root references omit `apps/todo` and `apps/crm`.

These issues allow false confidence in CI/local checks and make onboarding noisy.

## Proposed Solution

1. Restore build contract by adding an engine build script and fixing root build orchestration.
2. Expand root typecheck references to include all app workspaces.
3. Migrate linting to Biome and make Biome the single repo lint gate.
4. Update docs/CI so all contributors run the same command matrix.

## Design Decisions

1. Biome is the primary lint/format tool for this repo.
2. Root scripts are the contract; app-local commands remain convenience entry points.
3. Build and typecheck coverage should be explicit and complete, not inferred.
4. CI must execute exactly the same root commands documented for local development.

## Alternatives Considered

1. Keep ESLint and add config now.
- Rejected because the requested direction is Biome and a single migration avoids dual-tool overhead.

2. Remove root scripts and require per-app commands only.
- Rejected because it weakens CI and onboarding ergonomics.

3. Typecheck only touched packages/apps.
- Rejected because this ticket is contract hardening; full coverage is required.

## Implementation Plan

### Phase 1: Baseline and Safety

1. Re-run baseline commands and capture failures in ticket artifacts.
2. Confirm exact script surfaces:
- `package.json#scripts.build`
- `package.json#scripts.lint`
- `tsconfig.json#references`

### Phase 2: Build and Typecheck Contract Repair

1. Add `build` script in `packages/engine/package.json`.
2. Update root `package.json` `build` script to include intended workspaces.
3. Update root `tsconfig.json` references to include:
- `apps/todo`
- `apps/crm`

### Phase 3: Biome Migration

1. Install Biome dev dependency.
2. Create `biome.json` with lint/format settings for TS/TSX.
3. Replace root lint script with:
- `lint`: `biome check .`
- `lint:fix`: `biome check --write .`
4. Add ignore settings for build output and lock/generated artifacts as needed.

### Phase 4: CI and Docs Alignment

1. Update CI workflow commands to use new root scripts.
2. Update `README.md` quick start/tooling sections.
3. Add short migration note for previous ESLint users.

### Phase 5: Validation

Run and record:

```bash
npm run typecheck
npm run build
npm run lint
```

Expected:

- all commands succeed at root
- no app is omitted from typecheck coverage
- lint output is from Biome

## Open Questions

1. Should formatting be enforced in CI immediately (`biome format --write` disallowed) or lint-only first?
2. Should Biome be applied to markdown/json now or TS/TSX only in phase one?

## References

- `package.json`
- `tsconfig.json`
- `packages/engine/package.json`
- `apps/inventory/package.json`
- `apps/todo/package.json`
- `apps/crm/package.json`
- `apps/book-tracker-debug/package.json`
- `ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md`
