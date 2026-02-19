# Changelog

## 2026-02-19

- Initial workspace created


## 2026-02-19

Created HC-59 and authored a concrete file-level implementation plan to remove suggestions across inventory and engine chat surfaces with no fallback path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/design-doc/01-implementation-plan-remove-suggestions-for-now.md — Primary implementation plan document
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Detailed diary of setup and suggestions-surface discovery


## 2026-02-19

Uploaded HC-59 implementation plan to reMarkable and verified destination folder/artifact in /ai/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/design-doc/01-implementation-plan-remove-suggestions-for-now.md — Uploaded source markdown plan
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Recorded upload commands and verification


## 2026-02-19

Updated HC-59 ticket index metadata and overview for self-contained implementation context.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/index.md — Filled frontmatter summary/usage and overview details


## 2026-02-19

Added suggestions behavior-spec document (feature-level reconstruction reference) and expanded HC-59 into detailed implementation tasks for phased execution.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/design-doc/02-suggestions-feature-behavior-spec-for-future-rebuild.md — Behavior contract for future reintroduction
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Recorded step-by-step context for this request
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/tasks.md — Detailed implementation tasks added


## 2026-02-19

Removed suggestions from inventory runtime state and wiring: deleted suggestion reducers/selectors, removed suggestion SEM handling, and removed InventoryChatWindow suggestion prop/send integration.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/InventoryChatWindow.tsx — Removed suggestions wiring and send-time clearing
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.test.ts — Updated slice tests to match no-suggestions state
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/chatSlice.ts — Removed suggestion state and reducers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/runtime/projectionAdapters.ts — Removed hypercard.suggestions event handling
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/selectors.ts — Removed suggestion selector
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Recorded phase details and test run


## 2026-02-19

Removed suggestion props/rendering from engine runtime and chat widgets, including TimelineChatRuntimeWindow/TimelineChatWindow/ChatWindow and related shell pass-through.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/ChatSidebar.tsx — Removed suggestions pass-through
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatView.tsx — Removed suggestions prop and UI block
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Removed suggestions API and chips rendering
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/StreamingChatView.tsx — Removed suggestions prop and UI block
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/TimelineChatWindow.tsx — Removed suggestions prop forwarding
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/runtime/timelineChatRuntime.tsx — Removed suggestions prop forwarding
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Recorded runtime/widget cleanup step


## 2026-02-19

Cleaned remaining suggestion references in stories/docs/theme/event-viewer and validated with typecheck + focused chat tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/stories/EventViewer.stories.tsx — Replaced suggestion event fixtures
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/docs/js-api-user-guide-reference.md — Removed suggestions API example
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/docs/chat-window-timeline-first-guide.md — Removed suggestions references
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/event-viewer/eventBus.ts — Removed suggestions summary special-case
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/parts.ts — Removed chatSuggestions part token
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/theme/desktop/chat.css — Removed chat-suggestions styling hooks
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Recorded cleanup and validation commands


## 2026-02-19

Per user direction, committed unexpected staged BookTracker deletions as an isolated commit before resuming HC-59.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/BookTracker.plugin.vm.js — Deleted in isolated commit bcd6ce6
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/BookTracker.stories.tsx — Deleted in isolated commit bcd6ce6
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/19/HC-59-REMOVE-SUGGESTIONS-FOR-NOW--remove-suggestions-for-now/reference/01-diary.md — Recorded user-directed isolation step

