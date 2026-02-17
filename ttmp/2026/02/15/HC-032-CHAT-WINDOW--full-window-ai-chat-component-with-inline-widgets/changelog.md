# Changelog

## 2026-02-15

- Initial workspace created


## 2026-02-15

Step 1: Created ChatWindow component, 17 stories, responsive desktop sizing (commit 4b16409)

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Main component
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/theme/base.css — CSS + responsive breakpoints


## 2026-02-15

Step 2: Auto-flow desktop icons in responsive CSS grid (commit 576d0e6)

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopIconLayer.tsx — Grid/absolute dual layout
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/types.ts — x/y now optional


## 2026-02-15

Step 3: ChatWindow reuses ChatView message look, removed ~120 lines dead CSS (commit b556f7e)

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/widgets/ChatWindow.tsx — Now uses shared chat-message/chat-role parts


## 2026-02-15

Step 5 (revised): ChatWindow renders inside a desktop window via renderAppWindow prop (commit d9281f8)

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx — Chat Desktop story using renderAppWindow
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/DesktopShell.tsx — Added renderAppWindow prop


## 2026-02-17

Bulk close through HC-034 per cleanup reset

