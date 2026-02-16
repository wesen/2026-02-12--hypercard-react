---
Title: Frontend WebChat Cutover and Tool/Artifact Timeline UX
Ticket: HC-038-FRONTEND-WEBCHAT-CUTOVER
Status: complete
Topics:
    - chat
    - frontend
    - architecture
    - timeline
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/chat/InventoryChatAssistantWindow.tsx
      Note: Chat orchestration component.
    - Path: apps/inventory/src/chat/protocol.ts
      Note: Stream/hydration contract integration point.
ExternalSources: []
Summary: Final frontend cutover to SEM-only chat streams with durable hydration, artifact rendering, and action UX stabilization.
LastUpdated: 2026-02-15T22:26:01.83954248-05:00
WhatFor: Landing page for HC-038 implementation scope and status.
WhenToUse: Start here before frontend cutover implementation work.
---


# Frontend WebChat Cutover and Tool/Artifact Timeline UX

## Overview

HC-038 finalizes frontend chat behavior:

1. hydration-first SEM event projection,
2. report/table artifact rendering,
3. stable action flows (`open-card`, `prefill`, `create-card`),
4. end-to-end UX hardening and validation.

## Key Links

1. Design: `design-doc/01-implementation-plan.md`
2. Tasks: `tasks.md`
3. Diary: `reference/01-diary.md`
4. Changelog: `changelog.md`

## Status

Current status: **active** (implementation complete, validation rerun)
