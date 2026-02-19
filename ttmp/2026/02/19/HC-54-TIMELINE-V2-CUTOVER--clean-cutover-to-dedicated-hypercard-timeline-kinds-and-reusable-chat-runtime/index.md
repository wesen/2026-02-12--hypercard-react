---
Title: Clean cutover to dedicated Hypercard timeline kinds and reusable chat runtime
Ticket: HC-54-TIMELINE-V2-CUTOVER
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
    - protobuf
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md
      Note: Source implementation playbook that HC-54 executes as a clean cutover
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md
      Note: Backend/frontend module registration tutorial used as implementation template
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md
      Note: Websocket + timeline hydration/render tutorial used as transport/runtime template
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go
      Note: Backend Hypercard projection bridge to cut over from tool_result/customKind to dedicated V2 kinds
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Inventory integration file to slim down to host-specific callbacks only
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/sem/registry.ts
      Note: Frontend projection layer to cut over to dedicated kind mapping
ExternalSources: []
Summary: Clean hard-cut execution ticket for dedicated Hypercard TimelineEntityV2 kinds, protobuf payload extraction, reusable chat runtime extraction, and full legacy path removal.
LastUpdated: 2026-02-19T20:28:00-05:00
WhatFor: Track and execute the 1-9 implementation sequence to complete a no-compatibility HC-53 follow-through cutover.
WhenToUse: Use when implementing and reviewing the production cutover from legacy tool_result/customKind widget-card routing to dedicated TimelineEntityV2 kinds.
---

# Clean cutover to dedicated Hypercard timeline kinds and reusable chat runtime

## Overview

HC-54 executes the production cutover plan in strict sequence with no backward compatibility path retained. The target architecture is dedicated Hypercard timeline kinds on TimelineEntityV2, protobuf extraction for custom event payloads, registry-driven frontend rendering, reusable chat runtime extraction, and removal of all legacy `tool_result/customKind` widget-card behavior.

## Key Links

- Detailed implementation plan:
  - `design/01-clean-cutover-implementation-plan-timelineentityv2.md`
- HC-53 authoritative playbook:
  - `../../HC-53-RESTORE-CHAT-WIDGETS--restore-rich-chat-timeline-widgets-tool-call-cards-in-shared-runtime/design-doc/03-webchat-timeline-widget-entity-end-to-end-implementation-playbook.md`
- Pinocchio tutorial (module/event/projection/renderer pattern):
  - `../../../../../../../pinocchio/pkg/doc/tutorials/04-intern-app-owned-middleware-events-timeline-widgets.md`
- Pinocchio tutorial (standalone web UI, ws + timeline hydration/replay):
  - `../../../../../../../pinocchio/pkg/doc/tutorials/05-building-standalone-webchat-ui.md`
- Execution diary:
  - `reference/01-diary.md`

## Status

Current status: **active**

## Topics

- architecture
- chat
- frontend
- timeline
- webchat
- protobuf

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
