---
Title: Pinocchio Profile Runtime and Structured Sink Cutover
Ticket: HC-039-WEBCHAT-PROFILE-SINK-CUTOVER
Status: active
Topics:
    - chat
    - backend
    - frontend
    - architecture
    - go
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/app/server.go
      Note: Replace custom resolver/composer with profile-aware runtime composition and sink wrapper wiring.
    - Path: go-inventory-chat/internal/chat/planner.go
      Note: Current deterministic planner path to retire from primary runtime flow.
    - Path: go-inventory-chat/internal/app/planner_middleware.go
      Note: Current local tag parser/validator to remove once sink extraction + SEM mapping lands.
    - Path: apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Remove text tag parsing path; consume typed timeline entities.
ExternalSources:
    - local:Source - webchat-hyper-integration.md.md
Summary: Replace ad-hoc planner/tag extraction flow with Pinocchio profile-driven runtime composition and Geppetto FilteringSink-based structured artifact extraction, then project typed artifact entities through SEM/timeline into frontend card creation UX.
LastUpdated: 2026-02-16T03:44:00-05:00
WhatFor: Track the gap-closure work needed to align inventory chat with the source architecture and prompt protocol.
WhenToUse: Start here before implementing profile middleware/sink cutover and removing planner/tag compatibility code.
---

# Pinocchio Profile Runtime and Structured Sink Cutover

## Overview

HC-039 closes the architecture gap identified after HC-033..HC-038:

1. current runtime is Pinocchio transport but still uses local planner fallback + local tag parsing,
2. structured artifact extraction is not implemented as a Geppetto FilteringSink in the event path,
3. frontend still parses `<hypercard:...>` text blocks instead of relying only on typed timeline entities.

This ticket replaces those shortcuts with the design described in `Source - webchat-hyper-integration.md.md` sections 3.3, 4.3, 4.5, 5.11, and Appendix B.

## Key Links

1. Design plan: `design-doc/01-implementation-plan.md`
2. Prompt pack: `reference/02-prompt-pack.md`
3. Execution runbook: `playbooks/01-validation-runbook.md`
4. Tasks: `tasks.md`
5. Diary: `reference/01-diary.md`
6. Changelog: `changelog.md`

## Status

Current status: **active** (planning complete; implementation pending)
