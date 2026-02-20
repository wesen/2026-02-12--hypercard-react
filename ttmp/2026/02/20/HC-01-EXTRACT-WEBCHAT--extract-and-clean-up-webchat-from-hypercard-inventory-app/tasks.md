# Tasks

## Phase 1: Engine Chat Skeleton + SEM Registry + Timeline Slice

- [x] **1.1** Create directory structure for `packages/engine/src/chat/{sem,ws,state,utils,renderers,runtime,components,debug}` and `packages/engine/src/hypercard/{artifacts,timeline,editor,debug}`
- [x] **1.2** Copy + adapt SEM registry from `pinocchio/.../sem/registry.ts` to `packages/engine/src/chat/sem/semRegistry.ts` -- change Handler signature to `(ev, ctx: SemContext)`, update all handler bodies to use `ctx.dispatch` and `ctx.convId`
- [x] **1.3** Copy protobuf generated types from `pinocchio/.../sem/pb/` to `packages/engine/src/chat/sem/pb/` -- include all LLM, Tool, Log, Timeline schemas. Add `@bufbuild/protobuf` to engine's package.json
- [x] **1.4** Copy + adapt timeline mapper from `pinocchio/.../sem/timelineMapper.ts` to `packages/engine/src/chat/sem/timelineMapper.ts` -- update imports to local pb paths
- [x] **1.5** Copy timeline props registry from `pinocchio/.../sem/timelinePropsRegistry.ts` to `packages/engine/src/chat/sem/timelinePropsRegistry.ts`
- [x] **1.6** Create conversation-scoped timeline slice at `packages/engine/src/chat/state/timelineSlice.ts` -- state shape `{ byConvId: Record<string, { byId, order }> }`, adapt all actions from pinocchio's `timelineSlice.ts` to accept `convId` parameter
- [x] **1.7** Copy utility files: `number.ts` and `guards.ts` from pinocchio to `packages/engine/src/chat/utils/`; move `semHelpers.ts` from inventory to `packages/engine/src/chat/sem/semHelpers.ts`
- [x] **1.8** Create `chatSessionSlice` at `packages/engine/src/chat/state/chatSessionSlice.ts` -- per-conversation non-entity state (connectionStatus, isStreaming, suggestions, modelName, turnStats, streamStartTime, streamOutputTokens, lastError)
- [x] **1.9** Create conversation-scoped selectors at `packages/engine/src/chat/state/selectors.ts` for both timeline and session slices
- [x] **1.10** Create barrel export `packages/engine/src/chat/index.ts` and add `export * from './chat'` to `packages/engine/src/index.ts`
- [x] **1.11** Write unit tests for timelineSlice (upsert, version gating, conversation scoping, rekeyEntity) and semRegistry (handler registration, SemContext threading)

## Phase 2: WebSocket Manager + HTTP Client

- [x] **2.1** Copy + adapt wsManager from `pinocchio/.../ws/wsManager.ts` to `packages/engine/src/chat/ws/wsManager.ts` -- thread `convId` into SemContext, replace pinocchio appSlice refs with chatSessionSlice actions, remove `registerThinkingModeModule()` call
- [x] **2.2** Create HTTP helpers at `packages/engine/src/chat/runtime/http.ts` -- `submitPrompt(prompt, convId, basePrefix?)` and `fetchTimelineSnapshot(convId, basePrefix?)` with configurable base prefix
- [x] **2.3** Create conversationManager at `packages/engine/src/chat/runtime/conversationManager.ts` -- wraps wsManager.connect/disconnect + HTTP submit, manages per-conversation lifecycle
- [x] **2.4** Create `useConversation(convId)` React hook at `packages/engine/src/chat/runtime/useConversation.ts` -- calls conversationManager.connect on mount, disconnect on cleanup, returns `{ send, connectionStatus, isStreaming }`
- [x] **2.5** Write integration tests: create store, call wsManager.connect with mock WS, verify timeline entities appear after simulated SEM frames

## Phase 3: Renderer Registry + Builtin Renderers

- [x] **3.1** Copy + adapt renderer registry from `pinocchio/.../webchat/rendererRegistry.ts` to `packages/engine/src/chat/renderers/rendererRegistry.ts` -- define `RenderEntity` type and `ChatWidgetRenderers` type
- [x] **3.2** Create builtin MessageRenderer at `packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx` -- renders `e.props.content` with streaming cursor, role labels, thinking indicator
- [x] **3.3** Create builtin ToolCallRenderer, ToolResultRenderer, StatusRenderer, LogRenderer at `packages/engine/src/chat/renderers/builtin/` -- one file each
- [x] **3.4** Create GenericRenderer (fallback) at `packages/engine/src/chat/renderers/builtin/GenericRenderer.tsx`
- [x] **3.5** Create `registerDefaultTimelineRenderers()` function that registers all builtin renderers
- [x] **3.6** Write Storybook stories for each builtin renderer showing representative entities

## Phase 4: ChatConversationWindow + ChatWindow Renderer-Only Conversion

- [x] **4.1** Convert ChatWindow to renderer-only shell -- remove message-centric props/rendering (`messages`, message block parsing, role labels, streaming/thinking rendering) and require `timelineContent: ReactNode` for timeline body
- [x] **4.2** Create ChatConversationWindow at `packages/engine/src/chat/components/ChatConversationWindow.tsx` -- uses useConversation hook, selects entities + session state, maps entities through rendererRegistry, renders ChatWindow with timelineContent slot
- [x] **4.3** Extract StatsFooter from `InventoryChatWindow.tsx:494-551` into `packages/engine/src/chat/components/StatsFooter.tsx`
- [x] **4.4** Move eventBus from `apps/inventory/.../eventBus.ts` to `packages/engine/src/chat/debug/eventBus.ts` -- wire event emission into conversationManager
- [x] **4.5** Write Storybook story for ChatConversationWindow with mock WebSocket backend

## Phase 5: Hypercard Module -- Artifacts, Timeline Entities, Renderers

- [x] **5.1** Move artifactsSlice from `apps/inventory/.../artifactsSlice.ts` to `packages/engine/src/hypercard/artifacts/artifactsSlice.ts` (verbatim copy)
- [x] **5.2** Move artifactsSelectors from `apps/inventory/.../artifactsSelectors.ts` to `packages/engine/src/hypercard/artifacts/artifactsSelectors.ts`
- [x] **5.3** Move artifactRuntime from `apps/inventory/.../artifactRuntime.ts` to `packages/engine/src/hypercard/artifacts/artifactRuntime.ts` -- update imports
- [x] **5.4** Create hypercard widget SEM handlers at `packages/engine/src/hypercard/timeline/hypercardWidget.ts` -- handle `hypercard.widget.{start,update,v1,error}`, upsert timeline entity kind `hypercard_widget` with ID `widget:${itemId}`, dispatch artifact upsert when applicable
- [x] **5.5** Create hypercard card SEM handlers at `packages/engine/src/hypercard/timeline/hypercardCard.ts` -- handle `hypercard.card.{start,update,v2,error}`, upsert timeline entity kind `hypercard_card` with ID `card:${itemId}`, dispatch artifact upsert + runtime card registration
- [x] **5.6** Add hypercard suggestion handlers for `hypercard.suggestions.{start,update,v1}` -- dispatch to chatSessionSlice.mergeSuggestions/replaceSuggestions
- [x] **5.7** Add customKind remap hook to `timelineMapper.ts` -- when `timeline.upsert` entity has `customKind === 'hypercard.widget.v1'` or `'hypercard.card.v2'`, remap to `hypercard_widget`/`hypercard_card` with stable entity IDs
- [x] **5.8** Create `registerHypercardTimelineModule()` at `packages/engine/src/hypercard/timeline/registerHypercardTimeline.ts` -- registers all hypercard SEM handlers + renderers
- [x] **5.9** Create hypercard_widget and hypercard_card renderers -- show lifecycle status, artifact open/edit buttons
- [x] **5.10** Add hypercardArtifacts reducer to `createAppStore` defaults
- [x] **5.11** Create barrel export `packages/engine/src/hypercard/index.ts`, add to engine's `index.ts`
- [x] **5.12** Write tests for hypercard SEM handlers (given SEM event -> correct entity + artifact upsert) and customKind remap
- [x] **5.13** Hard-cutover to one-time global registration for chat/hypercard modules -- add idempotent bootstrap for `registerDefaultSemHandlers()` + `registerHypercardTimelineModule()`, remove per-connect registration flags/paths in `WsManager` and `ConversationManager`, and ensure tests initialize handlers via bootstrap

## Phase 6: Debug + Editor Windows

- [x] **6.1** Move EventViewerWindow from inventory to `packages/engine/src/chat/debug/EventViewerWindow.tsx` -- update imports to engine-local paths
- [x] **6.2** Move SyntaxHighlight from inventory to `packages/engine/src/chat/debug/SyntaxHighlight.tsx` -- ensure CodeMirror lang deps are in engine's package.json
- [x] **6.3** Move yamlFormat from inventory to `packages/engine/src/chat/debug/yamlFormat.ts`
- [x] **6.4** Move CodeEditorWindow from inventory to `packages/engine/src/hypercard/editor/CodeEditorWindow.tsx` -- update imports
- [x] **6.5** Move editorLaunch from inventory to `packages/engine/src/hypercard/editor/editorLaunch.ts`
- [x] **6.6** Move RuntimeCardDebugWindow from inventory to `packages/engine/src/hypercard/debug/RuntimeCardDebugWindow.tsx` -- remove direct STACK import, accept `stacks?: CardStackDefinition[]` prop

## Phase 7: Inventory App Thin Shell

- [x] **7.1** Update `apps/inventory/src/app/store.ts` -- remove chatReducer and artifactsReducer imports from features/chat, use engine-provided reducers instead
- [x] **7.2** Update `apps/inventory/src/App.tsx` window routing -- replace all inventory chat component references with engine imports (ChatConversationWindow, EventViewerWindow, RuntimeCardDebugWindow, CodeEditorWindow)
- [x] **7.3** Delete `apps/inventory/src/features/chat/` directory entirely (22 source files + tests + stories)
- [x] **7.4** Verify no remaining references to deleted files -- search for imports from `../features/chat/` or symbols defined there
- [ ] **7.5** Verify: `tsc --noEmit` passes, app boots, chat connects, messages stream, artifacts open, event viewer works

## Phase 8: Tests + Stories Migration

- [x] **8.1** Delete obsolete tests: `chatSlice.test.ts`, `InventoryChatWindow.timeline.test.ts`
- [x] **8.2** Migrate passing tests to engine: `eventBus.test.ts`, `artifactsSlice.test.ts`, `artifactRuntime.test.ts`, `yamlFormat.test.ts`
- [x] **8.3** Write new tests: `timelineSlice.test.ts` (conversation-scoped upsert, version gating), `semRegistry.test.ts` (handler registration, context threading), `timelineMapper.test.ts` (proto mapping, customKind remap), `chatSessionSlice.test.ts`, `hypercardWidget.test.ts`, `hypercardCard.test.ts`
- [x] **8.4** Move/recreate Storybook stories from inventory to engine alongside their components
- [ ] **8.5** Verify full test suite passes and stories render correctly
- [x] **8.6** Cleanup legacy story adapter usage -- remove or rewrite stories that still depend on `ChatWindowMessage`/`renderLegacyTimelineContent` (`ChatWindow*.stories`, `ChatWindowDesktop.stories`) so story coverage is entity-native (`ChatConversationWindow` + renderer stories)

## Phase 9: Runtime Error Model + Registration Bootstrap Formalization

- [ ] **9.1** Implement structured conversation-scoped runtime error state per `design-doc/03-structured-runtime-error-state-for-chat.md` -- add typed `ChatErrorRecord`, reducer actions/selectors, and migrate ws/http/runtime callsites away from string-only error channeling
- [ ] **9.2** Move SEM/renderer registration into a formal module-bootstrap layer (beyond `registerChatModules`) -- define bootstrap module contract and route `registerDefaultSemHandlers()` / `registerHypercardTimelineModule()` through explicit bootstrap orchestration instead of ad-hoc runtime module init
- [ ] **9.3** Re-evaluate unifying `ChatWindow` and `ChatConversationWindow` after Phase 7 legacy cleanup (`apps/inventory/src/features/chat/` deletion and `renderLegacyTimelineContent` retirement); decide whether to keep shell/container split or collapse into one component
