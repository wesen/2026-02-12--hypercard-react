---
Title: 'Little bugs follow-up: widget error timeline handling'
Ticket: HC-56-LITTLE-BUGS
Status: complete
Topics:
    - chat
    - frontend
    - debugging
    - ux
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Fixes little bug where `hypercard.widget.error` did not materialize a persisted widget error entity in timeline UI.
LastUpdated: 2026-02-22T17:00:12.434605083-05:00
WhatFor: Track and fix small correctness bugs after HC-01/HC-55 closure.
WhenToUse: Use as the entry point for little bug follow-ups, starting with hypercard widget error projection.
---


# Little bugs follow-up: widget error timeline handling

## Overview

This ticket captures small post-closure bug fixes, starting with a concrete gap where `hypercard.widget.error` SEM events are emitted but do not materialize into persisted widget error entities in timeline UI.

Primary scope for this ticket:

1. Analyze and fix `hypercard.widget.error` projection/remap behavior.
2. Add targeted regression tests on Go projector and TS timeline remapper paths.
3. Keep diary/changelog trail for intern-ready continuation.

## Key Links

- Analysis:
  - `analysis/01-hypercard-widget-error-timeline-handling-gap.md`
  - `analysis/02-widget-open-edit-behavior-and-hydration-artifact-projection-gap.md`
- Tasks:
  - `tasks.md`
- Diary:
  - `reference/01-diary.md`

## Status

Current status: **complete**

## Topics

- chat
- frontend
- debugging
- ux

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
