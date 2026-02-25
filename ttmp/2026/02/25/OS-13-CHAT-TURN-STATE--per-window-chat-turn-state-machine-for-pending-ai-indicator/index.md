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
      Note: Integration point that dispatches per-window pending-turn actions.
    - Path: packages/engine/src/chat/state/chatWindowSlice.ts
      Note: Window-local Redux slice keyed by `windowId`.
    - Path: packages/engine/src/chat/state/selectors.ts
      Note: Selector that computes pending spinner visibility from window + timeline state.
    - Path: packages/engine/src/chat/state/chatWindowSlice.test.ts
      Note: Unit tests for per-window slice transitions and cleanup behavior.
    - Path: packages/engine/src/chat/state/selectors.test.ts
      Note: Unit tests for pending indicator gating (user append and AI signal).
    - Path: docs/frontend/window-local-redux-state-playbook.md
      Note: Reusable playbook for window-local Redux state wiring.
    - Path: ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/design/01-implementation-plan-per-window-turn-state-machine.md
      Note: Short implementation plan and desired behavior contract.
    - Path: ttmp/2026/02/25/OS-13-CHAT-TURN-STATE--per-window-chat-turn-state-machine-for-pending-ai-indicator/reference/01-diary.md
      Note: Detailed implementation diary with command results and findings.
ExternalSources: []
Summary: Replace chat pending spinner heuristics with a per-window Redux state flow keyed by `windowId`.
LastUpdated: 2026-02-25T14:28:00-05:00
WhatFor: Deliver deterministic pending indicator behavior and remove legacy local-effect state reconciliation.
WhenToUse: Use when implementing or reviewing chat turn lifecycle UX behavior.
---


# Per-window chat turn state machine for pending AI indicator

## Overview

This ticket implements a clean, per-window Redux flow for pending AI indicator behavior. The implementation goal is:

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
