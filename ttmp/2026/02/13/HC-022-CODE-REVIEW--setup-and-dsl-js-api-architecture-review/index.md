---
Title: Setup and DSL JS API Architecture Review
Ticket: HC-022-CODE-REVIEW
Status: complete
Topics:
    - architecture
    - code-quality
    - review
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Primary findings and cleanup plan (updated per follow-up direction)
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/02-finding-14-type-safety-boundary-analysis.md
      Note: Dedicated deep analysis for finding 14
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/reference/01-diary.md
      Note: Detailed process diary including this follow-up packaging step
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/various/review-metrics.txt
      Note: Supporting metrics snapshot
ExternalSources: []
Summary: Exhaustive review of HyperCard setup + DSL JS API architecture, with updated finding scope and grouped implementation handoff tickets.
LastUpdated: 2026-02-17T07:40:35.412135136-05:00
WhatFor: Track architecture/setup review outputs and downstream cleanup handoff tickets
WhenToUse: Entry point for HC-022 findings, deep dives, and implementation handoff routing
---


# Setup and DSL JS API Architecture Review

## Overview

This ticket contains the deep audit of repository setup, DSL JS API, runtime architecture, app integration patterns, and documentation accuracy.

It has now been updated to:

- use Biome as the linting target direction
- remove findings 9 and 13 from the main finding list
- split finding 14 into a dedicated deep-dive analysis document
- create grouped cleanup tickets with handoff-ready implementation plans

## Key Links

- Main audit report: `design-doc/01-in-depth-setup-and-dsl-js-api-review.md`
- Finding 14 deep dive: `design-doc/02-finding-14-type-safety-boundary-analysis.md`
- Diary: `reference/01-diary.md`
- Metrics snapshot: `various/review-metrics.txt`
- Repro script: `scripts/collect-review-metrics.sh`

## Cleanup Ticket Set

- `HC-023-SETUP-CONTRACTS`: repo build/typecheck/lint contract hardening + Biome migration
- `HC-024-DOCS-API-TRUTH`: README + JS API docs alignment with current exports/contracts
- `HC-025-RUNTIME-CONTRACTS`: action scope semantics, unhandled action surfacing, navigation `homeCard` correctness
- `HC-026-APP-CONSOLIDATION`: app/store/story helper convergence and duplication reduction
- `HC-027-TYPE-SAFETY`: typed boundary hardening (driven by finding 14 deep dive)
- `HC-028-TEST-SAFETY-NET`: runtime integration tests and ListView empty-aggregation edge-case protection

## Status

Current status: **review**

## Tasks

See `tasks.md`.

## Changelog

See `changelog.md`.
