---
Title: LLM Prompting Spec and JS Sandbox for Card Generation
Ticket: HC-015-PROMPTING-DOC
Status: complete
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: docs/js-api-user-guide-reference.md
      Note: Document under analysis
    - Path: packages/engine/src/app/dispatchDSLAction.ts
      Note: Runtime action dispatch behavior referenced by both analyses
    - Path: packages/engine/src/dsl/types.ts
      Note: Source of truth for current DSL model and constraints
    - Path: ttmp/2026/02/12/HC-015-PROMPTING-DOC--llm-prompting-spec-and-js-sandbox-for-card-generation/analysis/01-analysis-js-api-user-guide-reference-as-self-contained-document.md
      Note: Analysis of JS API user guide reference completeness and accuracy
    - Path: ttmp/2026/02/12/HC-015-PROMPTING-DOC--llm-prompting-spec-and-js-sandbox-for-card-generation/design/01-analysis-and-implementation-plan-js-card-sandbox-app-for-manual-llm-validation.md
      Note: Detailed architecture and execution plan for manual code validation sandbox
    - Path: ttmp/2026/02/12/HC-015-PROMPTING-DOC--llm-prompting-spec-and-js-sandbox-for-card-generation/design/02-foolproof-llm-prompting-specification-for-hypercard-dsl-js.md
      Note: Primary prompting specification for foolproof LLM DSL/JS generation
ExternalSources: []
Summary: Ticket index for HC-015 covering a foolproof LLM prompting protocol and a practical JS card sandbox plan for manual generated-code validation.
LastUpdated: 2026-02-17T07:40:34.176277626-05:00
WhatFor: Capture and operationalize robust LLM generation prompts plus sandbox-driven validation workflow for HyperCard DSL/JS.
WhenToUse: Use as the entry point when preparing prompt templates, reviewing generation safety constraints, or planning sandbox implementation.
---



# LLM Prompting Spec and JS Sandbox for Card Generation

## Overview

HC-015 delivers two design pillars for reliable LLM-assisted card development:

1. A detailed, machine-contract-based prompting specification to reduce hallucinations and invalid patches when generating DSL/JS card code.
2. An implementation-grade analysis for a manual sandbox app where generated snippets can be pasted, edited, validated, and previewed before repository changes.

Current status:

- Prompting spec completed.
- Sandbox analysis and phased implementation plan completed.

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
