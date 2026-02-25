# Changelog

## 2026-02-25

- Initial workspace created

## 2026-02-25

Added npm debug channel instrumentation for chat lifecycle tracing and documented operational usage in a new playbook.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/package.json — Added `debug` dependency for namespace-based runtime logging.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/debug/debugChannels.ts — Added shared debug logger helper and `window.__HC_DEBUG__` convenience API.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useConversation.ts — Added lifecycle and send-path debug logs with dependency-diff context.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-12-CHAT-DEBUG-LOGGING--chat-lifecycle-debugging-with-npm-debug-channels/playbook/01-debug-logging-playbook-for-react-chat-lifecycle.md — Added investigation playbook for enabling and using debug channels.

## 2026-02-25

Investigated refocus reconnect/spinner regressions using debug traces, patched useConversation dependency normalization and spinner completion semantics, and backfilled detailed diary entries for intern handoff.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx — Stop clearing pending spinner on non-message timeline entities
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/chat/runtime/useConversation.ts — Normalized effect inputs and stabilized dispatch usage to reduce unnecessary reconnect churn
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/ttmp/2026/02/25/OS-12-CHAT-DEBUG-LOGGING--chat-lifecycle-debugging-with-npm-debug-channels/reference/01-diary.md — Detailed step-by-step backfill for recent debugging and fixes

