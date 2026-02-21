# Tasks

## TODO

- [x] Build exhaustive HC-01 touched-file inventory from commit history and split into existing vs removed paths
- [x] Produce detailed cleanup assessment report and investigation diary in HC-02 ticket docs
- [x] F1: Restore artifact open/edit behavior from hypercard timeline renderers by replacing orphan `hypercard:artifact` window events with a wired dispatch path
- [x] F2: Reintroduce an explicit Event Viewer launch path in inventory shell (icon/menu/command for focused chat conversation)
- [x] F3: Align `ChatWindow.onSend` async contract with `useConversation.send` to avoid unhandled promise rejections and make send failures observable at component level
- [x] F4: Decide and implement final suggestions architecture: timeline-entity projection vs formalized session projector action
- [x] F5: Move default timeline renderer registration to explicit bootstrap lifecycle (not `ChatConversationWindow` mount side effect) and support safe late module registration
- [x] F6: Decouple `registerChatModules` defaults so generic chat runtime does not auto-register hypercard module unless requested
- [ ] F7: Remove or finalize compatibility-only error pathways (`lastError`, `setStreamError`, fallback selector semantics) after structured error migration
- [x] F8: Resolve artifact runtime cleanup by either wiring or removing leftover utility pathways (including `buildArtifactOpenWindowPayload` integration checks)
- [x] F8.1: Consolidate artifact projection into a single ingestion helper (`extract` + `upsert` + runtime-card registration) and remove duplicate inline logic in widget/card handlers
- [x] F8.2: Move remapped-timeline artifact fallback wiring from renderer click handlers to ingestion/reconciliation path; keep renderers as pure consumers
- [x] F8.3: Wire runtime-card injection lifecycle to artifact state (`injectionStatus` / `injectionError`) or remove those fields if not maintained
- [x] F8.4: Add integration tests for artifact open/edit contract (click -> normalized window param -> plugin viewer lookup) across direct and projected paths
- [x] F8.5: After HC-52 cutover, remove legacy `tool_result + customKind` branches from artifact runtime and tests
- [x] F9: Remove dead/unused webchat refactor leftovers (`fakeStreamService.ts`, `chatApi.ts`) after confirming zero runtime usage
- [ ] Remove unused singleton export `wsManager` or route runtime to consistently use singleton and document the contract
- [ ] Clarify registry lifecycle API surface: keep and test unregister/clear APIs or remove them from public exports
- [ ] Close remaining HC-01 runtime gate by running and documenting manual end-to-end verification checklist (`7.5`)
- [ ] Add a lightweight synchronization process for copied SEM protobuf TS files under `packages/engine/src/chat/sem/pb`
- [x] Fix desktop icon double-click command routing for non-card icons (new chat, stacks & cards, event viewer) so icon.open.* goes through contribution/default command pipeline
- [x] Restore chat-window header actions (Event Viewer launch + debug mode toggle) in inventory assistant window with per-conversation behavior
- [x] Add chat timeline renderer debug mode toggle in header and extend renderer API with context; implement full-content debug rendering for hypercard widget/card entities
- [x] Fix artifact open/edit for remapped tool_result hypercard widgets/cards: ensure artifact store upsert on customKind remap path and normalize quoted artifact IDs before window param lookup
- [x] F10: Restore chat runtime stats UI by showing model name + live TPS/token counts in footer and conversation total token count in header
