---
Title: WebChat Runtime Foundation and Middleware Chain
Ticket: HC-034-WEBCHAT-RUNTIME-FOUNDATION
Status: complete
Topics:
    - chat
    - backend
    - go
    - architecture
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/app/server.go
      Note: Main backend file being refactored.
    - Path: pinocchio/cmd/web-chat/main.go
      Note: Wiring reference for reuse-first architecture.
ExternalSources: []
Summary: Foundational backend ticket to remove duplicated framework code and wire Pinocchio-style runtime composition and middleware hooks.
LastUpdated: 2026-02-15T22:26:01.831365512-05:00
WhatFor: Landing page for HC-034 implementation scope and status.
WhenToUse: Start here before working on runtime foundation refactor.
---


# WebChat Runtime Foundation and Middleware Chain

## Overview

HC-034 establishes the backend foundation for the inventory chat service:

1. remove duplicated runtime framework files,
2. rewire backend to Pinocchio-style chat/ws/timeline composition,
3. expose middleware extension points for HC-035 and HC-036.

## Key Links

1. Design: `design-doc/01-implementation-plan.md`
2. Tasks: `tasks.md`
3. Diary: `reference/01-diary.md`
4. Changelog: `changelog.md`

## Status

Current status: **active** (implementation complete, validated)
