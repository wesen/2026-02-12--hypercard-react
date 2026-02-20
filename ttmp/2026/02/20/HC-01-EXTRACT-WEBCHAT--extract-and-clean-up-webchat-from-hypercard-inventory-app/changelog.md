# Changelog

## 2026-02-20

- Initial workspace created


## 2026-02-20

Explored all three codebases (inventory chat, engine, pinocchio web-chat). Created detailed implementation plan (design-doc/01) with 8 phases, 6 architectural decisions, and 45 tasks. Created exploration diary (reference/01).

Updated Phase 4 plan and tasks to remove legacy `messages` functionality from `ChatWindow` and preserve message UX in `MessageRenderer`/timeline renderers.

## 2026-02-20

Phase 1 complete: implemented engine chat skeleton, SemContext-based SEM registry, protobuf SEM types, conversation-scoped timeline/session slices, selectors, and unit tests (commit a813f39).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.test.ts — Added sem registry tests for handler registration and context threading
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.ts — Adapted registry handlers to SemContext with convId-scoped dispatch
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/chatSessionSlice.ts — Added per-conversation chat session state/actions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.test.ts — Added timeline reducer tests for scoping/version/rekey
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — Added conversation-scoped timeline state and version-gated upsert


## 2026-02-20

Phase 2 complete: added wsManager with hydration buffering/replay, HTTP helpers, conversationManager, useConversation hook, and WS integration tests (commit a788974).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/conversationManager.ts — Added per-conversation lifecycle manager around WS and HTTP
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/http.ts — Added submitPrompt and fetchTimelineSnapshot helpers with basePrefix
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/useConversation.ts — Added React hook for conversation connect/disconnect/send state
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.test.ts — Added WS integration tests for frame dispatch and hydration buffering
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Adapted pinocchio WS manager to SemContext and chatSessionSlice


## 2026-02-20

Phase 3 complete: added renderer registry, builtin timeline renderers (message/tool/status/log/generic), default renderer registration, and Storybook coverage (commit 27758b7).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/builtin/GenericRenderer.tsx — Added builtin fallback renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/builtin/LogRenderer.tsx — Added builtin log renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx — Preserved message UX behavior in renderer form
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/builtin/StatusRenderer.tsx — Added builtin status renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/builtin/ToolCallRenderer.tsx — Added builtin tool-call renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/builtin/ToolResultRenderer.tsx — Added builtin tool-result renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/rendererRegistry.ts — Added renderer registry + default registration function
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatTimelineRenderers.stories.tsx — Added Storybook stories for each builtin renderer

