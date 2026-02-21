# Changelog

## 2026-02-15

- Initial workspace created


## 2026-02-15

Completed C1-C3: extracted shared useCardRuntimeHost hook and refactored HyperCardShell/CardSessionHost to consume it, then validated with passing typecheck and tests.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx — Legacy shell now uses shared runtime host
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/useCardRuntimeHost.ts — New shared runtime host abstraction
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/CardSessionHost.tsx — Windowing host now uses shared runtime host
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/reference/01-diary.md — Step 2 implementation and validation details


## 2026-02-15

Completed C4-C8: migrated helper APIs and story scaffolding from HyperCardShell/navigation to DesktopShell semantics, added DesktopShell homeParam bootstrap prop, and kept tests/typecheck green.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createDSLApp.tsx — DesktopShell-based app scaffold
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/generateCardStories.tsx — DesktopShell-based story helper
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Added homeParam bootstrap prop
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/reference/01-diary.md — Step 3 details for helper migration


## 2026-02-15

Completed C9-C12: migrated todo/crm/book-tracker-debug app entrypoints and inventory themed story to DesktopShell; removed remaining app-layer legacy HyperCardShell usage.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/book-tracker-debug/src/App.tsx — DesktopShell app cutover
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/crm/src/App.tsx — DesktopShell app cutover and legacy debug-pane removal
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/inventory/src/stories/Themed.stories.tsx — Legacy themed story migrated off HyperCardShell
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/apps/todo/src/App.tsx — DesktopShell app cutover
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/reference/01-diary.md — Step 4 app-level migration notes


## 2026-02-15

Completed C13-C17: removed legacy shell components and navigation feature stack, deleted legacy navigation tests, updated engine/store/barrel exports, and aligned debug/theme comments with DesktopShell-only architecture.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx — Deleted legacy shell implementation
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/features/navigation/navigationSlice.ts — Deleted legacy navigation reducer/actions
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts — Removed navigation reducer from engine app store
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/index.ts — Removed legacy shell exports
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/index.ts — Removed public navigation exports
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/reference/01-diary.md — Step 5 hard-deletion details (commit `752590a`)


## 2026-02-15

Completed V1-V6 validation and closeout: tests/typecheck/build passed; lint failed due baseline Biome schema mismatch and style/import debt outside this closeout slice; docmgr doctor passed.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/tasks.md — Validation checklist completed
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/15/HC-030-DESKTOP-CUTOVER--desktop-shell-hard-cutover-and-legacy-removal/reference/01-diary.md — Step 6 validation evidence and migration summary

## 2026-02-17

Bulk close through HC-034 per cleanup reset

