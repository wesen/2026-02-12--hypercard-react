---
Title: Persistence of Stacks and Cards (Including Runtime JS Injection)
Ticket: HC-035-PERSIST-CARDS-STACKS
Status: active
Topics:
    - architecture
    - frontend
    - backend
    - dsl
    - sqlite
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/16/HC-035-PERSIST-CARDS-STACKS--persistence-of-stacks-and-cards-including-runtime-js-injection/changelog.md
      Note: Updated with new docs and reMarkable publication note
    - Path: ttmp/2026/02/16/HC-035-PERSIST-CARDS-STACKS--persistence-of-stacks-and-cards-including-runtime-js-injection/design-doc/02-persistence-and-management-strategies-for-cards-and-stacks.md
      Note: New implementation strategy design doc added on 2026-02-17
    - Path: ttmp/2026/02/16/HC-035-PERSIST-CARDS-STACKS--persistence-of-stacks-and-cards-including-runtime-js-injection/reference/02-hypercard-card-and-stack-mechanism-textbook.md
      Note: New onboarding textbook added on 2026-02-17
ExternalSources: []
Summary: Ticket index for stack/card persistence architecture work, including runtime JS injection, hydration/loading flow, code/data versioning strategy, and two 6+ page follow-up deliverables.
LastUpdated: 2026-02-17T08:05:00-05:00
WhatFor: Provide a single landing page for the HC-035 analysis deliverables and next implementation phases.
WhenToUse: Use as the starting point for reviewing or executing the HC-035 persistence design.
---


# Persistence of Stacks and Cards (Including Runtime JS Injection)

## Overview

This ticket defines the architecture for durable stack/card persistence across the HyperCard frontend runtime and Go backend, including runtime JS card injection, hydration/loading, and independent versioning of code and data.

## Key Links

- Design doc:
  - `design-doc/01-stacks-and-cards-persistence-architecture-analysis.md`
- Design doc (persistence approaches and implementation plan):
  - `design-doc/02-persistence-and-management-strategies-for-cards-and-stacks.md`
- Reference (runtime mechanism textbook, onboarding):
  - `reference/02-hypercard-card-and-stack-mechanism-textbook.md`
- Diary:
  - `reference/01-diary.md`
- Task list:
  - `tasks.md`
- Changelog:
  - `changelog.md`

## Status

Current status: **active**

## Scope Highlights

- Persist stack code revisions and runtime injection patches.
- Persist session/card runtime state and desktop window/nav state.
- Define hydration lifecycle (cold boot + resume + live attach).
- Define compatibility/migration strategy for card code and card data.

## Structure

- `design-doc/` - architecture and implementation design
- `reference/` - working diary and supporting references
- `scripts/` - optional ticket-local experiments/validation scripts
