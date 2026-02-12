---
Title: LLM Minimal JavaScript Authoring for Interactive Cards
Ticket: HC-009-LLM-CARD-AUTHORING-API
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-009-LLM-CARD-AUTHORING-API--llm-minimal-javascript-authoring-for-interactive-cards/design/02-implementation-plan-dsl-and-js-api-no-llm-scope.md
      Note: Canonical implementation plan used for the non-LLM execution run
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-009-LLM-CARD-AUTHORING-API--llm-minimal-javascript-authoring-for-interactive-cards/reference/01-diary.md
      Note: Execution diary with per-task implementation details and validation evidence
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts
      Note: Engine action registry API introduced in this ticket
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/selectorRegistry.ts
      Note: Engine selector registry API introduced in this ticket
    - Path: ttmp/2026/02/12/HC-009-LLM-CARD-AUTHORING-API--llm-minimal-javascript-authoring-for-interactive-cards/design/01-research-and-design-minimal-js-api-for-llm-generated-interactive-cards.md
      Note: Prior deep research document retained for follow-up LLM-scope work
ExternalSources: []
Summary: "Ticket index for HC-009, including scope pivot from LLM flow design to delivered DSL/JS API implementation work."
LastUpdated: 2026-02-12T14:50:03-05:00
WhatFor: "Track HC-009 outcomes, artifacts, and implementation status after focusing on registry-based runtime APIs."
WhenToUse: "Use as the entry point to review plan, tasks, diary, and change history for HC-009."
---


# LLM Minimal JavaScript Authoring for Interactive Cards

## Overview

HC-009 started as LLM-card-authoring research and was explicitly re-scoped to implement and validate DSL/JS API improvements first.

Current implementation status:

- Engine now exposes action and selector registry helpers.
- Todo and Inventory apps are both migrated to registry-based action and domain-data wiring.
- Ticket task checklist is complete and validated with typecheck plus frontmatter checks.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- react
- rtk-toolkit
- vite

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
