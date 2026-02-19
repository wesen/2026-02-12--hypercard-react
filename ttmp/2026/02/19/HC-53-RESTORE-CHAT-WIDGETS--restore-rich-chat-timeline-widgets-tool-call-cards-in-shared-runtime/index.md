---
Title: Restore rich chat timeline widgets/tool-call cards in shared runtime
Ticket: HC-53-RESTORE-CHAT-WIDGETS
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - webchat
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Main chat UI integration point
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/timelineEntityRenderer.ts
      Note: Per-round rich timeline/widget/card projection synthesis
    - Path: /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/artifacts/timelineProjection.ts
      Note: Shared TimelineEntity formatting parity helper
ExternalSources: []
Summary: HC-53 restores rich inline chat timeline widgets/tool-card rendering under timeline-first SEM projection architecture.
LastUpdated: 2026-02-19T13:30:00-05:00
WhatFor: Ticket hub for regression analysis, implementation diary, and delivery artifacts
WhenToUse: Use when reviewing HC-53 implementation, validating behavior, or extending timeline projection UX
---

# Restore rich chat timeline widgets/tool-call cards in shared runtime

## Overview

HC-53 restores the rich chat timeline experience that regressed during extraction from app-specific reducers into the shared timeline-first SEM architecture. The ticket includes:

1. Commit-level root-cause archaeology from `5daf495` to `HEAD`.
2. Restoration implementation that keeps timeline-first semantics.
3. Regression tests and validation outputs.
4. Detailed implementation diary + publication artifact workflow.

## Key Links

- Design analysis: `design-doc/01-regression-analysis-and-restoration-plan-rich-timeline-projections.md`
- Design analysis (reusable runtime + pinocchio/protobuf exploration): `design-doc/02-generic-chatwindow-and-hypercard-renderer-pack-architecture.md`
- Diary: `reference/01-diary.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active** (extended docs iteration prepared; docs-only commit + upload pending)

## Topics

- architecture
- chat
- frontend
- timeline
- webchat

## Structure

- `design-doc/` - long-form analysis and architecture decisions
- `reference/` - implementation diary and supporting context
- `tasks.md` - progress checklist
- `changelog.md` - timestamped decision/change history
