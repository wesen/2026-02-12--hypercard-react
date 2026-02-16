---
Title: Durable Timeline Store and Conversation Replay
Ticket: HC-036-TIMELINE-DURABLE-PERSISTENCE
Status: complete
Topics:
    - chat
    - backend
    - sqlite
    - timeline
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/store/sqlite.go
      Note: Timeline schema and storage APIs will be added here.
    - Path: go-inventory-chat/internal/app/server.go
      Note: Hydration endpoint integration point.
ExternalSources: []
Summary: Adds durable SQLite-backed timeline persistence, replay, and hydration/reconnect semantics.
LastUpdated: 2026-02-15T22:26:01.827520767-05:00
WhatFor: Landing page for HC-036 implementation scope and status.
WhenToUse: Start here before implementing durable timeline work.
---


# Durable Timeline Store and Conversation Replay

## Overview

HC-036 makes chat timeline state durable:

1. persist conversation messages/events in SQLite,
2. support deterministic hydration and incremental replay,
3. keep frontend reconstruction stable across restarts.

## Key Links

1. Design: `design-doc/01-implementation-plan.md`
2. Tasks: `tasks.md`
3. Diary: `reference/01-diary.md`
4. Changelog: `changelog.md`

## Status

Current status: **active** (implementation complete, validated)
