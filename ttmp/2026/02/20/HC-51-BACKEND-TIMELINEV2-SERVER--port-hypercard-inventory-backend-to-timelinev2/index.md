---
Title: Port hypercard inventory backend to TimelineV2
Ticket: HC-51-BACKEND-TIMELINEV2-SERVER
Status: active
Topics:
    - backend
    - chat
    - inventory
    - sqlite
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: TimelineV2 migration implementation
    - Path: ttmp/2026/02/20/HC-51-BACKEND-TIMELINEV2-SERVER--port-hypercard-inventory-backend-to-timelinev2/design-doc/01-timelinev2-backend-port-plan.md
      Note: Design rationale and plan
    - Path: ttmp/2026/02/20/HC-51-BACKEND-TIMELINEV2-SERVER--port-hypercard-inventory-backend-to-timelinev2/design-doc/02-postmortem-timelinev2-backend-cutover-incident.md
      Note: Incident postmortem document for this ticket
    - Path: ttmp/2026/02/20/HC-51-BACKEND-TIMELINEV2-SERVER--port-hypercard-inventory-backend-to-timelinev2/reference/01-diary.md
      Note: Detailed step-by-step implementation diary
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:08:01.827931771-05:00
WhatFor: Track and document backend hard-cut migration from TimelineEntityV1 usage to TimelineEntityV2 so hypercard inventory server boots successfully.
WhenToUse: Use for onboarding and continuation of backend TimelineV2 migration and follow-up bootstrap cleanup.
---



# Port hypercard inventory backend to TimelineV2

## Overview

This ticket captures the backend migration needed after pinocchio removed `TimelineEntityV1` wrappers. The immediate startup blocker is fixed (`go-inventory-chat/internal/pinoweb/hypercard_events.go` now emits `TimelineEntityV2`), and validation passes for build/tests/startup smoke.

One follow-up task remains open: centralizing handler/module registration into explicit one-time bootstrap wiring.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- backend
- chat
- inventory
- sqlite

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
