# Changelog

## 2026-02-13

### Design
- Created HC-021 ticket and design document with streaming architecture
- Defined REST + WebSocket protocol specification
- Planned 8 implementation tasks with dependency graph

### Engine (commit 54c748d)
- Extended `ChatMessage` type with `id`, `status`, `system` role
- Created `chat/chatSlice.ts` — multi-conversation streaming state machine
- Created `chat/chatApi.ts` — REST + WebSocket client types
- Created `chat/mocks/fakeStreamService.ts` — setTimeout-based token streaming
- Created `chat/mocks/fakeResponses.ts` — keyword matcher + tokenizer
- Created `chat/useChatStream.ts` — React hook for streaming lifecycle
- Created `StreamingChatView.tsx` — cursor animation, thinking state, cancel
- Created `ChatSidebar.tsx` — collapsible sidebar panel
- Added CSS keyframe animations (`hc-blink`, `hc-pulse`)
- 9 Storybook stories (7 StreamingChatView + 2 ChatSidebar)

### CRM App (commit 1631d6d)
- Created `crmChatResponses.ts` — 15+ domain-aware fake responses
- Wired chat sidebar into CRM App with debug pane
- Added `streamingChatReducer` to CRM store
- Updated stories snapshot selector

### Verification
- Full typecheck clean
- 82 total Storybook stories (9 chat + 14 CRM + 59 existing)
