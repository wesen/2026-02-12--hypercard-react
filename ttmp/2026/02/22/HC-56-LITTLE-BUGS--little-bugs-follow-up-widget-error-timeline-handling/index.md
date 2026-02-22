---
Title: 'Little bugs follow-up: widget error timeline handling'
Ticket: HC-56-LITTLE-BUGS
Status: active
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
Summary: ""
LastUpdated: 2026-02-22T16:56:50.215085139-05:00
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
- Tasks:
  - `tasks.md`
- Diary:
  - `reference/01-diary.md`

## Status

Current status: **active**

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
