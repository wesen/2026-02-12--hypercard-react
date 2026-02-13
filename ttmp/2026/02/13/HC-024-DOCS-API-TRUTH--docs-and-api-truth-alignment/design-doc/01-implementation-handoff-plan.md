---
Title: Implementation Handoff Plan
Ticket: HC-024-DOCS-API-TRUTH
Status: active
Topics:
    - architecture
    - code-quality
    - review
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: README.md
      Note: Root architecture and extension points need accuracy rewrite
    - Path: docs/js-api-user-guide-reference.md
      Note: Main JS API document with legacy/stale references
    - Path: packages/engine/src/index.ts
      Note: Canonical export surface for docs truth checks
    - Path: packages/engine/src/app/index.ts
      Note: Canonical app utility exports for quickstart examples
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Current shell props and integration contract
    - Path: packages/engine/src/cards/types.ts
      Note: Current DSL model contracts
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Parent findings and drift evidence
ExternalSources: []
Summary: Detailed doc rewrite plan to align public documentation with current engine code and exports.
LastUpdated: 2026-02-13T16:46:00-05:00
WhatFor: Enable a new developer to deliver a reliable docs-truth pass without re-discovering architecture drift
WhenToUse: Use when updating README/API docs and validating symbol-level correctness
---

# Implementation Handoff Plan

## Executive Summary

Current docs describe a legacy architecture and stale APIs. This ticket rewrites documentation from source truth so new and existing developers can implement against real engine contracts.

## Problem Statement

Observed drift categories:

1. README architecture tree references directories/concepts not present in current code structure.
2. JS API guide references symbols not exported by current engine barrels.
3. Quickstart examples use old integration patterns and do not match current shell/app helper APIs.

This drift creates onboarding friction and implementation errors.

## Proposed Solution

1. Build a source-of-truth export inventory from current barrel files.
2. Rewrite README and JS API docs from that inventory.
3. Add verification checks to prevent future drift.

## Design Decisions

1. Code is the source of truth; docs follow code, not historical intent.
2. Keep docs explicit about current contracts, then isolate legacy notes into separate sections.
3. Favor examples copied from current app integrations over synthetic examples.

## Alternatives Considered

1. Minimal edits only (patch obvious errors).
- Rejected because drift is broad and structural.

2. Keep legacy content and add warning banners.
- Rejected because mixed guidance still causes incorrect implementations.

3. Generate docs entirely from comments.
- Rejected for now; hybrid authored docs with export validation is faster to deliver.

## Implementation Plan

### Phase 1: Build Truth Inventory

1. Enumerate exports from:
- `packages/engine/src/index.ts`
- `packages/engine/src/app/index.ts`
- `packages/engine/src/cards/index.ts`
2. Enumerate effective shell/app runtime contracts from:
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/cards/types.ts`

### Phase 2: README Rewrite

1. Replace stale architecture tree with current directories.
2. Replace extension points with current contracts:
- stack DSL
- shared selectors/actions
- app/store/story helpers
3. Update quick-start command expectations to match root scripts.

### Phase 3: JS API Guide Rewrite

1. Replace stale symbol imports with real exports.
2. Replace legacy custom-renderer/domainData pathways with current runtime wiring.
3. Add one runnable minimal app example using current APIs.
4. Add explicit "Legacy notes" section for any intentionally retained old concepts.

### Phase 4: Drift Prevention

1. Add a script/check that compares documented symbol mentions to barrel exports.
2. Add docs review checklist to PR process for engine API changes.

### Phase 5: Validation

1. Manual doc walkthrough by a developer not involved in rewrite.
2. Verify examples against current `apps/*` integration patterns.
3. Confirm no references remain to removed symbols.

## Open Questions

1. Should the JS API guide be split into smaller docs (quickstart + reference + migration)?
2. Should we enforce docs checks in CI immediately or after first rewrite lands?

## References

- `README.md`
- `docs/js-api-user-guide-reference.md`
- `packages/engine/src/index.ts`
- `packages/engine/src/app/index.ts`
- `packages/engine/src/components/shell/HyperCardShell.tsx`
- `packages/engine/src/cards/types.ts`
- `ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md`
