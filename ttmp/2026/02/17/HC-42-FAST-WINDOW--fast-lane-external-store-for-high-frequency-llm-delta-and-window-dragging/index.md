---
Title: Fast Lane External Store for High-Frequency LLM Delta and Window Dragging
Ticket: HC-42-FAST-WINDOW
Status: active
Topics:
    - frontend
    - performance
    - redux
    - debugging
    - ux
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Chat event ingestion entrypoint for llm delta fast-lane integration
    - Path: 2026-02-12--hypercard-react/packages/engine/src/__tests__/windowing.test.ts
      Note: W-C windowing reducer/selector behavior coverage
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: |-
        Window composition layer where transient drag drafts are projected
        Primary runtime integration target for W-C drag overlay
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/dragOverlayStore.ts
      Note: Implemented selected W-C option 2 drag overlay store
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts
      Note: |-
        Drag/resize interaction entrypoint currently dispatching high-frequency Redux updates
        Primary runtime integration target for W-C interaction lifecycle
    - Path: 2026-02-12--hypercard-react/packages/engine/src/features/windowing/windowingSlice.ts
      Note: |-
        Durable window state reducer kept canonical after fast-lane changes
        W-E interaction scaffolding removed; W-C is the active runtime model
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/design-doc/01-implementation-blueprint-external-fast-store-for-llm-delta-and-window-dragging.md
      Note: Primary implementation blueprint for onboarding and execution
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/reference/01-diary.md
      Note: Running implementation diary with milestone log
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/17/HC-42-FAST-WINDOW--fast-lane-external-store-for-high-frequency-llm-delta-and-window-dragging/tasks.md
      Note: Expanded W-C/W-E execution tracks with option selection
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-17T08:43:01.093705269-05:00
WhatFor: ""
WhenToUse: ""
---





# Fast Lane External Store for High-Frequency LLM Delta and Window Dragging

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- performance
- redux
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
