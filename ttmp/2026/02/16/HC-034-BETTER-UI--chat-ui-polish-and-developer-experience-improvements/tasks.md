---
Title: Tasks
Ticket: HC-034-BETTER-UI
---

# Tasks

## F1: Per-round timeline/card-panel widgets
- [x] F1.1 Add `currentRoundId` to ChatState
- [x] F1.2 Parameterize widget message IDs by round
- [x] F1.3 Route upsert actions through current round
- [x] F1.4 Handle hydration with "Previous Session" widget
- [x] F1.5 Update reducer tests for per-round behavior
- [x] F1.6 Add storybook stories (6 stories)

## F2: Collapsed tool-call messages with YAML
- [x] F2.1 Create `yamlFormat.ts` shared utility
- [x] F2.2 Add `rawData` field to `TimelineWidgetItem`
- [x] F2.3 Store structured data in tool event mapping
- [x] F2.4 Add collapse/expand toggle in InventoryTimelineWidget
- [x] F2.5 Render expanded detail as YAML
- [x] F2.6 Add storybook stories (5 stories)

## F3: Multiple chat windows (keyed Redux store)
- [x] F3.1 Restructure chatSlice to `conversations: Record<string, ConversationState>`
- [x] F3.2 Add `conversationId` to all action payloads
- [x] F3.3 Update all selectors to take `(state, convId)`
- [x] F3.4 Convert InventoryChatWindow to accept `conversationId` prop
- [x] F3.5 Wire convId-parameterized selectors and dispatches in InventoryChatWindow
- [x] F3.6 Add "New Chat" icon and menu entries in App.tsx
- [x] F3.7 Wire openNewChatWindow with per-conversation dedupeKey
- [x] F3.8 Remove global localStorage conversation persistence
- [x] F3.9 Add optional removeConversation cleanup on window close
- [x] F3.10 Update existing reducer tests for keyed state shape
- [x] F3.11 Add conversation isolation test

## F4: Model info + token counts + TPS
- [x] F4.1 Add `modelName` and `turnStats` to chat state
- [x] F4.2 Parse `metadata` from SEM envelopes
- [x] F4.3 Compute TPS from duration + output tokens
- [x] F4.4 Render stats in ChatWindow footer
- [x] F4.5 Add storybook stories (4 stories)

## F5: Copy/paste and text selection
- [x] F5.1 Add `user-select: text` override on chat-timeline
- [x] F5.2 Verify in existing stories

## F6: Debug mode toggle
- [x] F6.1 Add `headerActions` prop to ChatWindow
- [x] F6.2 Add debug toggle state in InventoryChatWindow
- [ ] F6.3 Pass debug flag to timeline/panel widgets
- [ ] F6.4 Render expanded metadata in debug mode
- [ ] F6.5 Show message IDs and status badges in debug mode
- [ ] F6.6 Add storybook stories (4 stories)

## F7: Streaming event viewer window
- [x] F7.1 Create conversation event bus utility
- [x] F7.2 Create EventViewerWindow component
- [x] F7.3 Implement filter toggle bar
- [x] F7.4 Implement expand/collapse per entry
- [x] F7.5 Add pause/resume and clear controls
- [x] F7.6 Add auto-scroll toggle
- [x] F7.7 Wire event viewer launch from chat window
- [x] F7.8 Register event viewer appKey in App.tsx
- [x] F7.9 Add CSS styling for event viewer (inline styles)
- [x] F7.10 Add storybook stories (4 stories) + 4 eventBus tests
