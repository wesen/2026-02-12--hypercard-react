---
Title: Diary
Ticket: HC-021-CHAT-SIDEBAR-STREAMING
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - storybook
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/chat/chatSlice.ts
      Note: "Streaming-aware conversation model (commit 54c748d)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/chat/useChatStream.ts
      Note: "React hook for streaming lifecycle (commit 54c748d)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/chat/mocks/fakeStreamService.ts
      Note: "setTimeout-based token streaming simulator (commit 54c748d)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/widgets/StreamingChatView.tsx
      Note: "Chat widget with cursor animation and thinking state (commit 54c748d)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/ChatSidebar.tsx
      Note: "Collapsible sidebar panel for chat (commit 54c748d)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/chat/crmChatResponses.ts
      Note: "CRM-specific fake responses with 15+ matchers (commit 1631d6d)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/App.tsx
      Note: "CRM app with chat sidebar + debug pane (commit 1631d6d)"
ExternalSources: []
Summary: Implementation diary for HC-021 — streaming chat sidebar system.
LastUpdated: 2026-02-13T15:00:00-05:00
WhatFor: Track the chat sidebar implementation journey.
WhenToUse: Reference when reviewing, extending, or connecting to a real LLM backend.
---

# Diary

## Goal

Build a streaming chat sidebar with fake API infrastructure, deployable alongside any DSL card in Storybook and dev mode.

## Step 1: Analysis and Design

Analyzed the existing chat infrastructure across the codebase. Found a complete but synchronous system: ChatView widget, chatSlice, ui.chat() DSL node, LayoutSplit/Drawer for panels, and a keyword-matching "AI" in the inventory app. Designed a streaming architecture with REST initiation + WebSocket delivery, wrote the full design doc.

### Prompt Context

**User prompt (verbatim):** "Now let's create a new ticket, and analyze how to port the chat sidebar / chat window into react, and implement a fake msw + fake websocket streaming API (for now). Analyze the situation and make a design/implementation plan and store it in the ticket and upload to remarkable."

**Assistant interpretation:** Analyze existing chat code, design a streaming chat sidebar system, and create a full implementation plan.

**Inferred user intent:** Lay the groundwork for a real LLM-powered chat that can be developed against fake APIs first.

**Commit (code):** e87a918 — "docs(HC-021): ticket, design/implementation plan, tasks"

### What I did
- Read all chat-related files (ChatView, chatSlice, LayoutSplit, HyperCardShell AI panel, inventory chat.send)
- Identified 6 gaps: no streaming, no API layer, no sidebar mode, no loading state, no context, no mocks
- Designed REST + WebSocket protocol with exact JSON schemas
- Planned 8 tasks with dependency graph
- Uploaded design doc to reMarkable

### What I learned
- The existing ChatView is well-designed and backward-compatible — just add streaming on top
- HyperCardShell already has `renderAIPanel` prop infrastructure — sidebar is a natural extension
- MSW v2 WebSocket support exists but is complex; a simpler setTimeout-based fake stream gives the same result for development

## Step 2: Engine Implementation (Tasks 1-6)

Built the entire streaming chat system in the engine package: chat slice with conversation model, API client types, fake stream service, StreamingChatView with cursor animation, ChatSidebar component, useChatStream hook, and 9 Storybook stories.

### Prompt Context

**User prompt (verbatim):** "build storybook stories as you go"

**Assistant interpretation:** Implement all engine utilities and create Storybook stories for each new component.

**Commit (code):** 54c748d — "feat(engine): streaming chat system"

### What I did
- Extended ChatMessage with `id`, `status` ('complete'|'streaming'|'error'), `system` role
- Built `chatSlice.ts`: multi-conversation model with `startStreaming`, `appendStreamToken`, `finishStreaming`, `streamError` reducers
- Built `chatApi.ts`: types for REST/WS protocol (ready for real backend swap)
- Built `fakeStreamService.ts`: tokenizer + setTimeout-based streaming with configurable delays
- Built `fakeResponses.ts`: keyword matcher + text tokenizer for realistic streaming
- Built `useChatStream.ts`: hook managing send→stream→finish lifecycle with cancel support
- Built `StreamingChatView.tsx`: CSS blink cursor, thinking indicator, cancel button, scroll-to-bottom
- Built `ChatSidebar.tsx`: collapsible panel wrapper
- Created 7 StreamingChatView stories (interactive, idle, thinking, mid-stream, complete, error, long-conversation)
- Created 2 ChatSidebar stories (interactive demo, static with-conversation)

### Why
- setTimeout-based fake stream is simpler than MSW WebSocket and works identically in all contexts
- The API client types are still designed for real WebSocket — swapping is a single-function change

### What worked
- All 9 stories render correctly in Storybook
- The cursor animation and thinking state look natural
- ChatMessage type changes are backward-compatible (all new fields optional)

### What didn't work
- N/A — clean implementation pass

### What was tricky to build
- The `useChatStream` hook's cancel logic: when the user cancels mid-stream, we need to (1) stop the timeout chain, (2) find the streaming message by ID, and (3) mark it complete with whatever partial text exists. Using a ref for the cancel function avoids stale closure issues.

### What warrants a second pair of eyes
- The `chatSlice` conversation model uses a `Record<string, Conversation>` which is mutable in Immer — verify that concurrent conversations don't interfere
- The `fakeStream` timeout cleanup — verify no leaks when component unmounts during streaming

## Step 3: CRM Integration (Task 7)

Wired the streaming chat sidebar into the CRM app with 15+ domain-specific response matchers that reference actual seed data.

### Prompt Context

**User prompt (verbatim):** (same as Step 2)

**Commit (code):** 1631d6d — "feat(crm): wire streaming chat sidebar with domain-aware CRM responses"

### What I did
- Created `crmChatResponses.ts` with matchers for: contacts count, VIPs, Alice, open deals, won/lost, biggest deal, companies, Acme, activities, pipeline/summary, help, greetings, fallback
- Each response includes relevant action chips (nav.go to specific cards + params)
- Updated CRM App.tsx: chat sidebar renders alongside the debug pane in the side panel
- Added streamingChatReducer to CRM store
- Updated stories snapshot selector

### What worked
- Chat sidebar renders alongside cards in the CRM shell
- Streaming tokens appear character-by-character with cursor animation
- Action chips navigate to the correct CRM cards
- All 14 CRM stories + 9 chat stories verified in Storybook

### What was tricky to build
- Fitting the chat sidebar + debug pane together in the side panel required a flex container as the `renderDebugPane` return value, with the chat taking its natural width and the debug pane filling remaining space.

### What should be done in the future
- Connect to a real LLM backend (swap `fakeStream` for `startCompletion` + `connectStream`)
- Add conversation persistence across card navigation
- Add tool-calling support (the StreamToken type already has `tool_call` reserved)
- Add MSW handlers for testing real HTTP/WS flows
- Consider making chat sidebar a first-class layoutMode in HyperCardShell
