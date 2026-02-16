---
Title: Structured Artifact Extraction and SEM Event Translation
Ticket: HC-035-ARTIFACT-EXTRACTION-SEM
Status: complete
Topics:
    - chat
    - backend
    - go
    - sem
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Structured extraction primitive reused in this ticket.
    - Path: go-inventory-chat/internal/chat/planner.go
      Note: Artifact source payloads.
ExternalSources: []
Summary: Implements structured artifact extraction and deterministic SEM event translation on the backend stream path.
LastUpdated: 2026-02-15T22:26:01.828576902-05:00
WhatFor: Landing page for HC-035 implementation scope and status.
WhenToUse: Start here before working on extraction/SEM translation.
---


# Structured Artifact Extraction and SEM Event Translation

## Overview

HC-035 adds extraction and translation reliability:

1. extract structured widget/card artifacts from runtime outputs,
2. validate payload shapes,
3. emit replay-safe typed SEM events.

## Key Links

1. Design: `design-doc/01-implementation-plan.md`
2. Tasks: `tasks.md`
3. Diary: `reference/01-diary.md`
4. Changelog: `changelog.md`

## Status

Current status: **active** (implementation complete, validated)
