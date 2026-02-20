# Tasks

## TODO

- [x] Build exhaustive HC-01 touched-file inventory from commit history and split into existing vs removed paths
- [x] Produce detailed cleanup assessment report and investigation diary in HC-02 ticket docs
- [ ] Restore artifact open/edit behavior from hypercard timeline renderers by replacing orphan `hypercard:artifact` window events with a wired action path (or add a documented listener contract)
- [ ] Reintroduce an explicit Event Viewer launch path in inventory shell (command/menu/header action) or remove dead `event-viewer:*` branch
- [ ] Align `ChatWindow.onSend` async contract with `useConversation.send` to avoid unhandled promise rejections and make send failures observable at component level
- [ ] Decide and implement final suggestions architecture: timeline-entity projection vs formalized session projector action
- [ ] Move default timeline renderer registration to explicit bootstrap lifecycle (not `ChatConversationWindow` mount side effect) and support safe late module registration
- [ ] Decouple `registerChatModules` defaults so generic chat runtime does not auto-register hypercard module unless requested
- [ ] Remove or finalize compatibility-only error pathways (`lastError`, `setStreamError`, fallback selector semantics) after structured error migration
- [ ] Remove dead/unused webchat refactor leftovers (`buildArtifactOpenWindowPayload` integration gap, `fakeStreamService.ts`, `chatApi.ts` if still unused)
- [ ] Remove unused singleton export `wsManager` or route runtime to consistently use singleton and document the contract
- [ ] Clarify registry lifecycle API surface: keep and test unregister/clear APIs or remove them from public exports
- [ ] Close remaining HC-01 runtime gate by running and documenting manual end-to-end verification checklist (`7.5`)
- [ ] Add a lightweight synchronization process for copied SEM protobuf TS files under `packages/engine/src/chat/sem/pb`
