---
Title: Diary
Ticket: HC-039-WEBCHAT-PROFILE-SINK-CUTOVER
Status: active
Topics:
    - chat
    - backend
    - frontend
    - architecture
    - go
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/app/server.go
      Note: Main backend cutover target.
    - Path: go-inventory-chat/internal/app/planner_middleware.go
      Note: Compatibility path targeted for removal.
    - Path: apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Frontend tag parser removal target.
ExternalSources:
    - local:Source - webchat-hyper-integration.md.md
Summary: Running diary for HC-039 implementation and validation steps.
LastUpdated: 2026-02-16T03:44:00-05:00
WhatFor: Capture decisions, command trails, failures, and fixes during cutover.
WhenToUse: Read before continuing implementation or reviewing this ticket.
---

# Diary

## Step 1: Ticket Created and Source Anchored

Context:

1. User requested a dedicated ticket for replacing planner/tag shortcuts with Pinocchio profile + structured sink architecture.
2. Must explicitly use prompt protocol guidance from imported source document.

Actions:

1. Created ticket workspace `HC-039-WEBCHAT-PROFILE-SINK-CUTOVER`.
2. Imported source document from HC-033 into this ticket's local sources.
3. Added implementation design document, prompt pack, validation runbook, and exhaustive task list skeleton.

Initial findings captured for implementation:

1. Current backend does not use `structuredsink.FilteringSink`.
2. Current frontend still includes regex parsing for `<hypercard:...>` tags.
3. Current planner path is deterministic and should not remain the primary artifact production channel.

Next action:

1. Start implementation phase 1: profile resolver + runtime composer alignment with `pinocchio/cmd/web-chat` pattern.
