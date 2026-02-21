---
Title: 'UI Cleanup: Frontend Store and Windowing Performance'
Ticket: HC-037-UI-CLEANUP
Status: active
Topics:
    - frontend
    - redux
    - performance
    - ux
    - debugging
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: W-D implementation entrypoint for window render isolation and body memoization
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowLayer.stories.tsx
      Note: Story harness alignment for pre-sorted window input contract
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowLayer.tsx
      Note: W-D change removing duplicate sort in render layer
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowSurface.tsx
      Note: W-D memoized window shell/body split
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: Interaction-start focus behavior adjustment
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/01-redux-event-pipeline-and-window-dragging-performance-analysis.md
      Note: First investigation report (event pipeline + dragging)
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/02-frontend-storybook-state-management-and-css-design-system-cleanup-investigation.md
      Note: Second investigation report (frontend status + Storybook + state + CSS DS)
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/03-chat-window-message-and-timeline-widget-virtualization-performance-investigation.md
      Note: Third investigation report focused on chat message/widget virtualization
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/04-w-c-implementation-guide-ephemeral-overlay-drag-lane.md
      Note: Detailed W-C implementation guide for ephemeral overlay drag lane
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/05-w-e-implementation-guide-redux-interaction-geometry-channel.md
      Note: Detailed W-E implementation guide for Redux interaction geometry channel
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/reference/01-diary.md
      Note: Detailed execution diary across both investigations
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/tasks.md
      Note: Expanded task list with detailed W-C and W-E execution checklists
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-17T07:40:49.801772261-05:00
WhatFor: ""
WhenToUse: ""
---





# UI Cleanup: Frontend Store and Windowing Performance

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- redux
- performance
- ux
- debugging

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
