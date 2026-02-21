# Changelog

## 2026-02-20

- Initial workspace created


## 2026-02-20

Completed exhaustive post-HC-01 cleanup assessment: enumerated touched-file inventory from HC-01 commits (111 paths), identified legacy leftovers/consolidation targets, and produced prioritized cleanup backlog.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/01-exhaustive-legacy-and-consolidation-assessment-after-hc-01.md — Primary assessment report
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Detailed investigation diary
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — Derived cleanup backlog tasks


## 2026-02-20

Executed F4: moved suggestions to timeline artifacts, added starter-suggestion consume-on-first-send lifecycle, updated selectors/tests, and checked task #6 (commits ab5b5b7, 634fd16).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — F4 starter suggestion lifecycle + send wrapper
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/timelineSlice.ts — F4 reducers for suggestion entity upsert and consumption
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts — F4 SEM suggestion projection to timeline artifacts
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/02-f4-suggestions-as-timeline-entities-and-starter-consumption.md — F4 design rationale and implementation plan


## 2026-02-20

Follow-up fix after F4: prevent starter suggestions from reappearing after chat starts by upserting and consuming starter suggestions atomically at first send (commit 43f31aa).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Fix starter suggestion lifecycle race on first send
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 8 diary entry for post-F4 suggestion persistence fix


## 2026-02-20

Fixed desktop icon double-click regression for non-card icons (new chat, stacks & cards, event viewer) by routing icon.open.* through the shell command pipeline; added and closed task #16 (commit 6c33288).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Route non-card icon opens through contribution/default command handlers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 9 diary details for icon routing fix
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — Added and checked icon double-click fix task


## 2026-02-20

Restored chat assistant header controls (Events + Debug) in inventory chat window and closed task #17; clarified F2 was desktop-level only (commit 56360b4).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Add InventoryChatAssistantWindow wrapper with header action buttons
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 10 documenting chat header action restoration
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — Added and checked task #17


## 2026-02-20

Added renderer debug mode toggle in chat header and renderer context API; widget/card renderers now expose full entity content in debug mode. Closed task #18 (commit 33748ac).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Header debug toggle now switches chat render mode
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Inject render context into renderer invocations
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/types.ts — RenderContext/RenderMode API extension
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardCard.tsx — Card debug preformatted full props
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardWidget.tsx — Widget debug preformatted full props
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 11 details
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — Task #18 closed


## 2026-02-20

Executed F5/F6: moved renderer registration to explicit bootstrap lifecycle with registry subscriptions for late module updates; decoupled hypercard module from default chat runtime and made inventory opt-in explicit (commit 8b8d2b8).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — F6 inventory app explicitly registers hypercard timeline module
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — F5 renderers resolved via subscribed registry state
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/renderers/rendererRegistry.ts — F5 live registry updates for late renderer registration
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/conversationManager.ts — F6 bootstrap ensure moved to connect
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/registerChatModules.ts — F6 default modules no longer include hypercard
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 12 detailed implementation diary
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — F5/F6 marked done


## 2026-02-20

Analyzed remapped tool_result widget artifact-open failure and added task #19 to fix artifact-store projection plus artifactId normalization on open path.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js — Artifact lookup by nav param surfaces not-found when store key missing or quoted
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.ts — Confirmed tool_result projection path currently lacks artifact-store upsert
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts — Confirmed remap creates widget/card timeline entities from customKind
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactRuntime.ts — Open payload path requires robust artifactId normalization
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Step 13 investigation details
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — Task #19 added


## 2026-02-20

Implemented Task #19: artifact open/edit now works for remapped timeline tool_result entities by adding TimelineV2 props extraction, quoted artifact-id normalization, and open-time artifact backfill from timeline entity props; added regression tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.test.ts — Regression tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts — Remap artifact id normalization
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactRuntime.test.ts — Regression tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactRuntime.ts — Core fix for artifact extraction and id normalization
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardCard.tsx — Renderer-side artifact backfill before open
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/hypercardWidget.tsx — Renderer-side artifact backfill before open


## 2026-02-20

Completed deep F8 analysis: documented artifact-runtime topology, keep/wire/remove matrix, and phased cleanup plan; added explicit F8.1-F8.5 tasks for projection consolidation, ingestion wiring, injection-status lifecycle, integration tests, and post-HC-52 cleanup.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/03-f8-artifact-runtime-cleanup-analysis-and-wiring-plan.md — F8 deep analysis and implementation plan
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md — Diary step for F8 analysis
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/tasks.md — F8 sub-task backlog expansion


## 2026-02-20

Implemented F8 cleanup tranche: added ingestion-time artifact projection middleware, removed renderer click-time artifact backfill, wired runtime-card injection outcome statuses, and added focused middleware/runtime regression tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — F8 middleware registration
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx — F8 injection status wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactProjectionMiddleware.ts — F8 core ingestion projector
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactsSlice.ts — F8 artifact state lifecycle
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeCardRegistry.ts — F8 injection report helper


## 2026-02-21

Implemented F10: restored runtime chat stats by wiring SEM LLM metadata into `chatSession` (model name, stream token count, final turn stats + TPS), added cumulative conversation token accounting, and surfaced total conversation tokens in chat header.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.ts — Metadata parsing + stream/session stats updates + usage accumulation
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/chatSessionSlice.ts — Conversation usage counters and reducer action
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/selectors.ts — Conversation total token selector
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Header token total wiring
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Header token total display
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Force stream status reset on socket close/error/disconnect
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.test.ts — Metadata behavior regression coverage
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/chatSessionSlice.test.ts — Usage accumulation tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/selectors.test.ts — Token total selector tests

## 2026-02-21

Fixed two post-review pending-response UX defects: blocked sends during pre-first-frame pending phase, and cleared pending spinner when websocket closes before first inbound entity.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Pending state now gates send/input/button behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Pending spinner cleared on `connectionStatus === closed`
