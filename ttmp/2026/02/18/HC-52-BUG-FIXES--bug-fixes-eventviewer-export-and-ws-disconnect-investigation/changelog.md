# Changelog

## 2026-02-18

- Initial workspace created


## 2026-02-18

Investigated ws disconnect/idle timeout logs and fixed frontend status desync with stale-socket guards plus connected heartbeat (commit 756200d).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.test.ts — Added reconnect race and heartbeat tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/features/chat/webchatClient.ts — Guarded stale callbacks and heartbeat-based connected status
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/reference/01-bug-report-ws-disconnect-and-idle-timeout-investigation.md — Documented root causes and source map
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/reference/02-diary.md — Backfilled implementation diary


## 2026-02-18

Implemented EventViewer YAML export for visible filtered event logs with tests (commit 7d53843).

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/event-viewer/EventViewerWindow.tsx — Added YAML export action in toolbar
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/event-viewer/exportYaml.test.ts — Added export utility tests
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard-chat/event-viewer/exportYaml.ts — Implemented YAML payload and download helper


## 2026-02-18

Completed ticket documentation, checked all tasks, and uploaded bug report to reMarkable at /ai/2026/02/18/HC-52-BUG-FIXES.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/reference/01-bug-report-ws-disconnect-and-idle-timeout-investigation.md — Finalized bug report and uploaded PDF
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/reference/02-diary.md — Backfilled full diary entries
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/tasks.md — Marked all tasks complete

