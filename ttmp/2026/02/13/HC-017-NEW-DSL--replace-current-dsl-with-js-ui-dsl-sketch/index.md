---
Title: Replace Current DSL with JS UI DSL Sketch
Ticket: HC-017-NEW-DSL
Status: complete
Topics:
    - frontend
    - architecture
    - redux
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/01-current-dsl-deep-dive-and-migration-guide-to-new-screen-dsl.md
      Note: Primary migration analysis and implementation guide.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md
      Note: New state-management architecture deep dive requested by follow-up prompt.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/design/03-carddefinition-dsl-implementation-guide-and-developer-reference.md
      Note: Textbook-style implementation and authoring reference for the new CardDefinition DSL runtime.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/reference/01-diary.md
      Note: Step-by-step diary with commands
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/03-current-dsl-gap-audit.out.txt
      Note: Captured migration surface evidence from repository scan.
    - Path: ttmp/2026/02/13/HC-017-NEW-DSL--replace-current-dsl-with-js-ui-dsl-sketch/scripts/04-carddefinition-state-scope-simulation.out.txt
      Note: Evidence for scoped state precedence and action routing.
ExternalSources:
    - local:js-ui-dsl.md
Summary: ""
LastUpdated: 2026-02-17T07:40:34.45610731-05:00
WhatFor: ""
WhenToUse: ""
---





# Replace Current DSL with JS UI DSL Sketch

## Overview

This ticket documents a no-backwards-compat migration path from the current card-type DSL to a screen-AST runtime DSL (imported from `sources/local/js-ui-dsl.md`). It includes a deep analysis of existing architecture, a full replacement design guide, and runnable experiments validating selector resolution and runtime update semantics.

## Key Links

- `design/01-current-dsl-deep-dive-and-migration-guide-to-new-screen-dsl.md` - main migration guide
- `design/02-carddefinition-scoped-state-architecture-card-background-stack-global.md` - scoped state architecture update (`CardDefinition`, local + shared state/actions)
- `design/03-carddefinition-dsl-implementation-guide-and-developer-reference.md` - in-depth implementation and developer reference guide
- `reference/01-diary.md` - detailed execution diary
- `sources/local/js-ui-dsl.md` - imported source specification
- `scripts/01-resolve-redux-selectors.mjs` - selector + expression resolution prototype
- `scripts/02-runtime-update-semantics.mjs` - runtime update and preview-mode prototype
- `scripts/03-current-dsl-gap-audit.sh` - migration-surface audit script
- `scripts/04-carddefinition-state-scope-simulation.mjs` - scope precedence + scoped action routing simulation

## Status

Current status: **active**

## Topics

- frontend
- architecture
- redux

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
