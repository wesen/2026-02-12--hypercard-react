# Changelog

## 2026-02-17

- Initial workspace created


## 2026-02-17

Completed deep frontend performance analysis (Redux event pipeline + window dragging), documented 6+ page design, maintained detailed diary, and uploaded analysis to reMarkable.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/01-redux-event-pipeline-and-window-dragging-performance-analysis.md — Final analysis deliverable
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/reference/01-diary.md — Detailed execution diary


## 2026-02-17

Completed second frontend cleanup investigation (codebase status + Storybook + state management + CSS design-system analysis), produced 8+ page report, and updated diary.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/02-frontend-storybook-state-management-and-css-design-system-cleanup-investigation.md — Second investigation report
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/reference/01-diary.md — Detailed execution diary update


## 2026-02-17

Completed third focused investigation on chat-window performance via message/timeline widget windowing (virtualization), produced detailed design doc, and updated diary.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/03-chat-window-message-and-timeline-widget-virtualization-performance-investigation.md — Chat virtualization investigation report
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/reference/01-diary.md — Diary update for third investigation


## 2026-02-17

Implemented W-D window render isolation and memoization pass: removed duplicate sort in WindowLayer (expects pre-sorted windows), switched DesktopShell to O(1) window/body lookup by id with cached body nodes, memoized WindowSurface with isolated WindowBody, and tightened focus dispatch behavior to avoid redundant focus actions during drag/resize start.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Added id-indexed lookups
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowLayer.stories.tsx — Story harness now pre-sorts windows before rendering layer
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowLayer.tsx — Removed internal sorting and documented pre-sorted input contract
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/WindowSurface.tsx — Memoized surface component and isolated memoized WindowBody
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/useWindowInteractionController.ts — Focus dispatch now happens only after confirming interaction target
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/tasks.md — Tracked and checked W-D implementation task


## 2026-02-17

Added detailed W-C and W-E implementation tracks to HC-037: expanded tasks with stepwise execution checklists, authored dedicated implementation guides for ephemeral overlay drag lane (W-C) and Redux interaction geometry channel (W-E), including architecture, lifecycle rules, pseudocode, rollout, and verification criteria.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/04-w-c-implementation-guide-ephemeral-overlay-drag-lane.md — New W-C implementation guide
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/design-doc/05-w-e-implementation-guide-redux-interaction-geometry-channel.md — New W-E implementation guide
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/17/HC-037-UI-CLEANUP--ui-cleanup-frontend-store-and-windowing-performance/tasks.md — Detailed W-C and W-E task breakdown added

