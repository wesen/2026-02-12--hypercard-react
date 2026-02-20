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


## 2026-02-20

Phase 4 complete: converted ChatWindow to renderer-only timeline shell, added ChatConversationWindow/StatsFooter, moved eventBus to engine, wired runtime event emission, and added ChatConversationWindow Storybook mock backend story (commit 6e07ad1).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/ChatConversationWindow.tsx — Added entity-driven conversation window using renderer registry
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/components/StatsFooter.tsx — Extracted stats footer from inventory chat window
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/debug/eventBus.ts — Moved conversation event bus into engine chat debug module
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/conversationManager.ts — Wired event bus emission for SEM envelopes
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Added envelope callback hook to WS manager
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatConversationWindow.stories.tsx — Added Storybook story with mocked WS/fetch backend
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Removed message-centric rendering from ChatWindow and introduced timelineContent shell API


## 2026-02-20

Phase 5: added one-time global chat/hypercard module bootstrap and hard-cut over from per-connect registration; added regression tests to ensure default registration no longer wipes extension handlers.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/conversationManager.ts — Removed per-connect registration and switched to global bootstrap
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/registerChatModules.ts — Introduced idempotent one-time registration for default SEM + hypercard module
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.test.ts — Added regression test that defaults do not clear extension handlers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/semRegistry.ts — Made default registration additive to avoid wiping extension handlers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/ws/wsManager.ts — Removed per-connect base registration flag/path


## 2026-02-20

Phase 5 complete (commit fd931ff): extracted hypercard artifacts/timeline module into engine, added customKind remap tests, and hard-cut over to one-time global chat/hypercard registration.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — Added hypercardArtifacts reducer default
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/runtime/registerChatModules.ts — Idempotent one-time global registration bootstrap
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.test.ts — Added remap tests for hypercard customKind
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts — Central hypercard module registration


## 2026-02-20

Added a dedicated reference document explaining Step 4 Phase 1 timeline reducer behavior: conversation scoping, pinocchio-preserving version gating semantics, invariants, and practical examples.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/reference/02-conversation-scoped-timeline-reducer-semantics-and-version-gating.md — Primary explanatory reference for reducer/version semantics


## 2026-02-20

Added analysis document proposing suggestion handling via timeline entities/SEM projection (instead of chatSession special-casing), with migration options, ordering/version strategy, and implementation plan.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/02-analysis-project-suggestions-as-timeline-entities.md — Primary analysis for de-specializing suggestions into timeline entities


## 2026-02-20

Expanded suggestions analysis doc with a second detailed option: keep suggestions outside timeline via a formal SEM projector action using metadata options (mode/source/seq) and reducer-side stale gating.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/02-analysis-project-suggestions-as-timeline-entities.md — Added Option 2 projector-meta design and implementation track


## 2026-02-20

Added design doc for structured runtime error state (typed conversation-scoped error records) and appended Phase 9 tasks for this feature plus later module-bootstrap registration formalization.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/design-doc/03-structured-runtime-error-state-for-chat.md — New design proposal for replacing string-only error channeling
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md — Added end-of-plan tasks 9.1 and 9.2


## 2026-02-20

Added Phase 9 follow-up task to re-evaluate ChatWindow vs ChatConversationWindow unification after Phase 7 legacy cleanup.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md — Added task 9.3 for post-cleanup unification decision


## 2026-02-20

Added explicit Phase 8 story-cleanup task to remove legacy adapter-based story usage (ChatWindowMessage/renderLegacyTimelineContent) and make coverage entity-native.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-01-EXTRACT-WEBCHAT--extract-and-clean-up-webchat-from-hypercard-inventory-app/tasks.md — Added task 8.6 for legacy story cleanup

## 2026-02-20

Phase 6.1-6.3 complete (commit e8fbc61): migrated EventViewerWindow, SyntaxHighlight, and yamlFormat into engine chat debug module and exported them through chat barrel.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/package.json — Added CodeMirror/Lezer highlighting deps for debug syntax renderer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/debug/EventViewerWindow.tsx — Moved debug event viewer to engine with engine-local imports
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/debug/SyntaxHighlight.tsx — Moved syntax highlighting utility to engine debug module
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/debug/yamlFormat.ts — Moved YAML formatter utility to engine debug module
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/index.ts — Exported debug viewer/highlighter/formatter from chat barrel



## 2026-02-20

Phase 6.4-6.6 complete (commit d0e758d): migrated CodeEditorWindow, editorLaunch, and RuntimeCardDebugWindow into engine hypercard modules, removed direct STACK coupling via `stacks` prop, and exported debug/editor modules from hypercard barrel.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/debug/RuntimeCardDebugWindow.tsx — Moved runtime card debug window to engine and switched to `stacks?: CardStackDefinition[]` prop
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/editor/CodeEditorWindow.tsx — Moved CodeMirror runtime card editor into engine
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/editor/editorLaunch.ts — Moved editor launch helper and rewired to engine desktop/runtime modules
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/index.ts — Exported migrated debug/editor modules
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/package.json — Added explicit CodeMirror editor dependencies for engine-owned editor window
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/package-lock.json — Lockfile updates for added editor dependencies


## 2026-02-20

Phase 7.1-7.4 complete + 8.1 complete (commit df8ef49): hard-cut inventory app to engine chat modules, deleted `apps/inventory/src/features/chat/` entirely, and removed obsolete legacy chat tests/stories with the directory.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/app/store.ts — Switched from inventory-local chat/artifact reducers to engine `timeline` and `chatSession` reducers
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/App.tsx — Replaced inventory-local chat window components with engine exports (`ChatConversationWindow`, `EventViewerWindow`, `RuntimeCardDebugWindow`, `CodeEditorWindow`)
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/ — Deleted legacy chat subsystem (components, slices, runtime client, tests, stories, utils)

### Validation Notes

- `npm run -w apps/inventory build` passed
- `npm run storybook:check` passed (42 story files)
- Workspace-wide `npm run typecheck` still fails due unrelated existing CRM type issues; Phase `7.5` remains open for manual runtime behavior verification


## 2026-02-20

Phase 8 progress: completed `8.2`, `8.3`, `8.4`, and `8.6` via engine test migration, missing chatSession reducer coverage, new engine debug/editor stories, and removal of legacy adapter-based ChatWindow stories.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/debug/eventBus.test.ts — Migrated event bus behavior tests from inventory to engine
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/debug/yamlFormat.test.ts — Migrated YAML formatter tests from inventory to engine
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactsSlice.test.ts — Migrated artifact reducer tests to engine
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactRuntime.test.ts — Migrated artifact extraction/open-window tests to engine
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/state/chatSessionSlice.test.ts — Added missing chat session slice coverage for conversation-scoped behavior
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/EventViewerWindow.stories.tsx — Added engine story for migrated event viewer window
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/CodeEditorWindow.stories.tsx — Added engine story for migrated code editor window
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/RuntimeCardDebugWindow.stories.tsx — Added engine story for migrated runtime card debug window
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.stories.tsx — Deleted legacy message-adapter story surface
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.widgets.stories.tsx — Deleted legacy message-adapter story surface
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.interaction.stories.tsx — Deleted legacy message-adapter story surface
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx — Deleted legacy desktop story using message adapter

### Validation Notes

- `npm run -w packages/engine typecheck` passed
- `npm test` passed (191 tests)
- `npm run storybook:check` passed
- `npm run build-storybook` failed due unrelated pre-existing CRM import/export mismatch (`apps/crm/src/app/store.ts` expecting non-exported `streamingChatReducer`), so `8.5` remains open
