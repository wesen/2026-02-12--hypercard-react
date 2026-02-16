---
Title: Full Card DSL Generation and Injection Validation Gate
Ticket: HC-037-CARD-DSL-GENERATION-GATE
Status: complete
Topics:
    - chat
    - frontend
    - backend
    - dsl
    - reports
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat/internal/chat/planner.go
      Note: Report/table and card proposal generation source.
    - Path: apps/inventory/src/chat/cardInjector.ts
      Note: Validation gate and apply flow target.
ExternalSources: []
Summary: Implements reports/tables artifact generation and full card DSL generation with validation before runtime injection.
LastUpdated: 2026-02-15T22:26:01.833062949-05:00
WhatFor: Landing page for HC-037 implementation scope and status.
WhenToUse: Start here before working on DSL generation and validation gate.
---


# Full Card DSL Generation and Injection Validation Gate

## Overview

HC-037 covers:

1. deterministic report/table artifact generation,
2. full card DSL proposal generation,
3. validation gate enforcement before `create-card` injection.

## Key Links

1. Design: `design-doc/01-implementation-plan.md`
2. Tasks: `tasks.md`
3. Diary: `reference/01-diary.md`
4. Changelog: `changelog.md`

## Status

Current status: **active** (implementation complete, validated)
