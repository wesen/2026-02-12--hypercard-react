---
Title: Desktop framework documentation consolidation
Ticket: HC-49-DESKTOP-DOCS
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - design-system
    - cleanup
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.ts
      Note: |-
        Contribution contracts documented in API reference
        Source of contribution API contracts and merge semantics
    - Path: packages/engine/src/components/shell/windowing/dragOverlayStore.ts
      Note: |-
        Ephemeral interaction lane documented in performance reference
        Source of ephemeral interaction lane model
    - Path: packages/engine/src/components/shell/windowing/windowContentAdapter.ts
      Note: |-
        Adapter-chain contract documented in adapter guide
        Source of adapter-chain routing contract
    - Path: packages/engine/src/desktop-core.ts
      Note: |-
        Desktop durable state/actions entrypoint documented in quickstart and performance reference
        Primary desktop state/actions entrypoint documented in quickstart and performance model
    - Path: packages/engine/src/desktop-react.ts
      Note: |-
        Desktop shell and extension entrypoint documented in quickstart and contribution references
        Primary desktop shell API entrypoint documented in quickstart and contribution docs
    - Path: packages/engine/src/parts.ts
      Note: |-
        Parts selector contract documented in theming reference
        Source of stable part-name contract
    - Path: packages/engine/src/theme/index.ts
      Note: |-
        Theme pack import contract documented in theming reference
        Source of modular theme import contract
    - Path: ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/analysis/01-documentation-improvement-suggestions.md
      Note: Improvement suggestions analysis document
ExternalSources: []
Summary: Consolidated deferred desktop framework references from HC-45 into focused quickstart/API/adapter/theme/performance docs.
LastUpdated: 2026-02-17T17:13:54.39967421-05:00
WhatFor: ""
WhenToUse: ""
---



# Desktop framework documentation consolidation

## Overview

HC-49 consolidates deferred documentation deliverables from the HC-45 plan into explicit reference docs:

1. Desktop Framework Quickstart.
2. Desktop Contribution API Reference.
3. Window Content Adapter Guide.
4. Theming and Parts Contract.
5. Performance Model (durable vs ephemeral lanes).

The migration guide was intentionally omitted per request.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

Documentation coverage status:

- Quickstart: complete
- Contribution API reference: complete
- Adapter guide: complete
- Theming/parts contract: complete
- Performance model note: complete

## Topics

- frontend
- architecture
- windowing
- design-system
- cleanup

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
