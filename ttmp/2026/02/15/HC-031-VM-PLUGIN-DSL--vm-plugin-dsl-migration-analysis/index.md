---
Title: VM Plugin DSL Migration Analysis
Ticket: HC-031-VM-PLUGIN-DSL
Status: complete
Topics:
    - architecture
    - dsl
    - frontend
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources:
    - local:plugin-hypercard-dsl.md
Summary: Hard-cut migration analysis for replacing HyperCard Act/Ev/Sel DSL with VM plugin DSL runtime model and Storybook integration.
LastUpdated: 2026-02-17T07:40:36.962716716-05:00
WhatFor: Provide architecture-level and implementation-level guidance for HC-031 migration planning and execution.
WhenToUse: Use when designing or reviewing the replacement of current card runtime DSL/execution path.
---



# VM Plugin DSL Migration Analysis

## Overview

HC-031 analyzes a full migration from the current HyperCard descriptor DSL/runtime (`Act/Ev/Sel`) to a plugin-runtime-based VM execution model inspired by the real implementation in `vm-system/frontend`.

The ticket includes:

- A comprehensive design document with no-backwards-compat rip-out strategy.
- Concrete file-level impact and phased implementation plan.
- Dedicated Storybook integration strategy so story execution matches runtime semantics.
- Detailed diary capturing command-level evidence and constraints encountered.

## Key Links

- Design doc: `design-doc/01-vm-plugin-dsl-migration-and-storybook-integration-analysis.md`
- Diary: `reference/01-diary.md`
- Imported source proposal: `sources/local/plugin-hypercard-dsl.md`

## Status

Current status: **active**

## Topics

- architecture
- dsl
- frontend

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
