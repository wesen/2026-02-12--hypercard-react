---
Title: Webchat Integration for Inventory
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - go
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Frontend hydration and chat window orchestration over backend timeline/stream.
    - Path: apps/inventory/src/chat/protocol.ts
      Note: SEM-only stream parser and timeline hydration client contract.
    - Path: apps/inventory/vite.config.ts
      Note: Worker format build fix for production bundle.
    - Path: go-inventory-chat/internal/app/server.go
      Note: SEM-only websocket stream
    - Path: ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/scripts/smoke-sem-timeline.sh
      Note: SEM stream and timeline CLI smoke experiment.
    - Path: ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/tasks.md
      Note: Detailed interleaved phase 2-6 execution checklist and completion gate.
ExternalSources:
    - local:webchat-hyper-integration.md
Summary: Implement inventory webchat integration in hypercard-react using a new Go+SQLite backend, SEM-only streaming, timeline hydration, inline widgets, and runtime card injection.
LastUpdated: 2026-02-16T10:23:00-05:00
WhatFor: Ticket landing page for HC-033 implementation and documentation.
WhenToUse: Start here to navigate design docs, task state, diary, and changelog.
---




# Webchat Integration for Inventory

## Overview

Deliver a working inventory chat in `2026-02-12--hypercard-react` with:

1. a new Go backend service in this worktree,
2. SQLite-backed tool queries over mock data,
3. an app-owned `ChatWindow` integrated into the desktop shell,
4. inline widgets and card proposal actions,
5. runtime plugin card injection for accepted proposals.

## Key Links

1. Design: `design-doc/01-validated-architecture-and-implementation-plan.md`
2. Diary: `reference/01-diary.md`
3. Execution Notes: `reference/02-execution-notes-and-experiments.md`
4. Tasks: `tasks.md`
5. Changelog: `changelog.md`

## Status

Current status: **active** (Phase 2-6 implementation and validation complete; docs refreshed and uploaded)

## Topics

- chat
- backend
- sqlite
- go

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
