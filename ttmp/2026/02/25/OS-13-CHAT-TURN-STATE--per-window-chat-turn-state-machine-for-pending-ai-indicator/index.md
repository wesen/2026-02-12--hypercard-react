---
Title: Per-window chat turn state machine for pending AI indicator
Ticket: OS-13-CHAT-TURN-STATE
Status: active
Topics:
    - chat
    - frontend
    - ux
    - debugging
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Integration point that maps machine phase to `showPendingResponseSpinner`.
    - Path: packages/engine/src/chat/runtime/pendingAiTurnMachine.test.ts
      Note: Unit tests covering user-append gate and AI-signal transitions.
    - Path: packages/engine/src/chat/runtime/pendingAiTurnMachine.ts
      Note: Pure per-window turn lifecycle state machine.
    - Path: ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/design/01-implementation-plan-per-window-turn-state-machine.md
      Note: Short implementation plan and desired behavior contract.
    - Path: ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/reference/01-diary.md
      Note: Detailed implementation diary with command results and findings.
ExternalSources: []
Summary: Replace chat pending spinner heuristics with a per-window turn lifecycle state machine.
LastUpdated: 2026-02-25T14:06:00-05:00
WhatFor: Deliver deterministic pending indicator behavior without timestamp/order hacks.
WhenToUse: Use when implementing or reviewing chat turn lifecycle UX behavior.
---


# Per-window chat turn state machine for pending AI indicator

## Overview

This ticket implements a clean, per-window turn state machine for pending AI indicator behavior. The implementation goal is:

1. Show `AI: ...` only after the submitted user message appears in timeline.
2. Remove `AI: ...` when the first AI-side timeline signal appears.
3. Avoid reconnect/timestamp/order flicker behaviors from previous heuristic logic.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- chat
- frontend
- ux
- debugging

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
