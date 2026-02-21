---
Title: Chat UI Polish and Developer Experience Improvements
Ticket: HC-034-BETTER-UI
Status: complete
Topics:
    - chat
    - frontend
    - ux
    - debugging
    - storybook
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/App.tsx
      Note: App shell — F3 multi-window
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Primary chat orchestration component — affected by F1
    - Path: apps/inventory/src/features/chat/chatSlice.ts
      Note: Redux state slice — affected by F1
    - Path: packages/engine/src/components/widgets/ChatWindow.tsx
      Note: Reusable chat component — needs headerActions prop for F6
    - Path: packages/engine/src/theme/base.css
      Note: Theme CSS — F5 user-select fix
    - Path: ttmp/2026/02/16/HC-033-ADD-WEBCHAT-INTEGRATION--add-webchat-integration/design-doc/03-hc032-hc033-consolidated-technical-postmortem-and-continuation-guide.md
      Note: Predecessor ticket postmortem — essential reading for context
    - Path: ttmp/2026/02/16/HC-034-BETTER-UI--chat-ui-polish-and-developer-experience-improvements/design-doc/01-feature-analysis-and-implementation-plan.md
      Note: Comprehensive analysis of all 7 features with implementation plans
    - Path: ttmp/2026/02/16/HC-034-BETTER-UI--chat-ui-polish-and-developer-experience-improvements/reference/01-diary.md
      Note: Analysis diary
    - Path: ttmp/2026/02/16/HC-034-BETTER-UI--chat-ui-polish-and-developer-experience-improvements/tasks.md
      Note: Task checklist for all features
ExternalSources: []
Summary: |
    Seven UI and developer experience improvements to the inventory webchat built in HC-032/HC-033: per-round widgets, collapsed tool calls, multi-window conversations, model/token stats, copy-paste support, debug mode, and streaming event viewer.
LastUpdated: 2026-02-17T07:40:37.492695143-05:00
WhatFor: |
    Coordinate and track UI polish and developer tooling improvements for the inventory webchat runtime.
WhenToUse: Entry point for all HC-034 work. Read the analysis document first, then implement features in the recommended dependency order.
---



# HC-034-BETTER-UI — Chat UI Polish and Developer Experience Improvements

## Overview

This ticket covers seven improvement features for the inventory webchat shipped in HC-032/HC-033:

| # | Feature | Complexity | Status |
|---|---------|-----------|--------|
| F1 | Per-round timeline/card-panel widgets | Medium | planned |
| F2 | Collapsed tool-call messages with YAML | Low | planned |
| F3 | Multiple chat windows for different conversations | Medium | planned |
| F4 | Model info + token counts + TPS display | Low-Medium | planned |
| F5 | Copy/paste and text selection in chat | Low | planned |
| F6 | Debug mode toggle for timeline inspection | Medium | planned |
| F7 | Streaming event viewer window | High | planned |

## Recommended implementation order

Based on dependency analysis: **F5 → F2 → F4 → F1 → F6 → F3 → F7**

## Key documents

- **Analysis & implementation plan:** `design-doc/01-feature-analysis-and-implementation-plan.md`
- **Diary:** `reference/01-diary.md`
- **Tasks:** `tasks.md`

## Predecessor tickets

- **HC-032-CHAT-WINDOW:** Full-window chat component and desktop composition
- **HC-033-ADD-WEBCHAT-INTEGRATION:** Backend integration, tools, structured events, timeline, persistence
