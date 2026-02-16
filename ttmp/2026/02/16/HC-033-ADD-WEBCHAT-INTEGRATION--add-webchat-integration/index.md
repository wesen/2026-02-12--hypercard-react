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
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md
      Note: Validated implementation plan and architecture source of truth
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/reference/01-diary.md
      Note: Detailed planning diary and command/error trace
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/tasks.md
      Note: Detailed checklist for implementation execution
ExternalSources:
    - local:webchat-hyper-integration.md
Summary: Planning ticket for hard-cutover inventory webchat integration with Pinocchio + Geppetto backend and HyperCard app-window chat frontend.
LastUpdated: 2026-02-16T12:09:00-05:00
WhatFor: Coordinate analysis, planning, task execution, and implementation diary for inventory chat integration.
WhenToUse: Start here for ticket context and links to the validated implementation plan.
---


# Add Webchat Integration

## Overview

This ticket plans and tracks a hard-cutover migration from inventory app mock chat behavior to a real backend-driven chat using:

1. Pinocchio webchat transport (`/chat`, `/ws`, `/api/timeline`)
2. Geppetto tools + structured sink extraction
3. HyperCard app-window chat UI with inline widgets and artifact-to-card actions

No implementation has started yet in this ticket after the explicit planning-only directive.

## Key Links

- Imported source document: `sources/local/webchat-hyper-integration.md`
- Validated plan: `design-doc/01-validated-analysis-and-hard-cutover-implementation-plan.md`
- Detailed diary: `reference/01-diary.md`
- Task breakdown: `tasks.md`

## Status

Current status: **active (planning-only)**

## Decision Gates

Pending decisions before implementation starts:

1. default model/runtime provider
2. keep/remove plugin `assistant` card after cutover
3. timeline persistence default policy
4. create-card dedupe policy

## Tasks

See `tasks.md` for phase-by-phase checklist.

## Changelog

See `changelog.md` for dated updates.
