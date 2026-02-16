---
Title: Add Webchat Integration
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - frontend
    - inventory
    - sqlite
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md
      Note: Validated implementation plan and architecture source of truth
    - Path: ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md
      Note: Detailed planning diary and command/error trace
    - Path: ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md
      Note: Detailed checklist for implementation execution
ExternalSources:
    - local:webchat-hyper-integration.md
Summary: Execution ticket for hard-cutover inventory webchat integration using Glazed command composition, Pinocchio webchat reuse, Geppetto middleware artifact/card generation, and HyperCard app-window frontend integration.
LastUpdated: 2026-02-16T12:40:00-05:00
WhatFor: Coordinate analysis, planning, task execution, and implementation diary for inventory chat integration.
WhenToUse: Start here for ticket context and links to the validated implementation plan.
---


# Add Webchat Integration

## Overview

This ticket plans and tracks a hard-cutover migration from inventory app mock chat behavior to a real backend-driven chat using:

1. Pinocchio webchat transport (`/chat`, `/ws`, `/api/timeline`)
2. Geppetto tools + structured sink extraction
3. HyperCard app-window chat UI with inline widgets and artifact-to-card actions

Implementation is now active. Backend scaffold (`B1`, `B2`) and early frontend cutover (`F2.5`) are complete, including a validated tmux + Playwright round-trip smoke flow.

The next execution focus is SQLite inventory domain + tool wiring before artifact/card lifecycle expansion.

## Key Links

- Imported source document: `sources/local/webchat-hyper-integration.md`
- Validated plan: `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Detailed diary: `reference/01-diary.md`
- Task breakdown: `tasks.md`

## Status

Current status: **active (implementation in progress)**

## Decision Gates

Pending decisions before implementation starts:

1. default model/runtime provider
2. keep/remove plugin `assistant` card after cutover
3. timeline persistence default policy
4. create-card dedupe policy

## Locked Decisions

1. No fallback synthesis for artifact/card success events (model-authored structured blocks only).
2. Progressive lifecycle events are required for widget/card parsing.
3. `widget.start`/`card.start` are emitted only once a non-empty title is parsed.

## Tasks

See `tasks.md` for phase-by-phase checklist.

## Changelog

See `changelog.md` for dated updates.
