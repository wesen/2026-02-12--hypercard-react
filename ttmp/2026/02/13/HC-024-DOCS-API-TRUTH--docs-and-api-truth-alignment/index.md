---
Title: Docs and API Truth Alignment
Ticket: HC-024-DOCS-API-TRUTH
Status: complete
Topics:
    - architecture
    - code-quality
    - review
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: README.md
      Note: Architecture and extension-point descriptions are stale
    - Path: docs/js-api-user-guide-reference.md
      Note: Primary API drift source document
    - Path: packages/engine/src/index.ts
      Note: Actual public exports for @hypercard/engine
    - Path: packages/engine/src/app/index.ts
      Note: Actual app-utility exports
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Source findings (1 and 2)
ExternalSources: []
Summary: Aligns README and JS API reference with currently implemented exports, contracts, and architecture.
LastUpdated: 2026-02-17T07:40:35.675463265-05:00
WhatFor: Remove onboarding and implementation confusion caused by stale docs
WhenToUse: Use while rewriting docs from code truth
---


# Docs and API Truth Alignment

## Overview

This ticket addresses HC-022 findings 1 and 2 by rewriting repo and API docs to reflect the actual engine architecture and exports.

## Key Links

- Handoff implementation plan: `design-doc/01-implementation-handoff-plan.md`
- Task checklist: `tasks.md`
- Parent review source: `../HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md`

## Status

Current status: **active**

## Tasks

See `tasks.md`.

## Changelog

See `changelog.md`.
