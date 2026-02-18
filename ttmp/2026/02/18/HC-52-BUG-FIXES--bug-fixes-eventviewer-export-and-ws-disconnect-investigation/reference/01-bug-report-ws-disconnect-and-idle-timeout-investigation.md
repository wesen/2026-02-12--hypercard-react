---
Title: 'Bug Report: WS disconnect and idle timeout investigation'
Ticket: HC-52-BUG-FIXES
Status: active
Topics:
    - frontend
    - webchat
    - bugs
    - debugging
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ../../../../../../../pinocchio/pkg/webchat/connection_pool.go
      Note: Idle timer scheduling and ws pool lifecycle
    - Path: ../../../../../../../pinocchio/pkg/webchat/conversation.go
      Note: Idle timeout callback and stream stop wiring
    - Path: ../../../../../../../pinocchio/pkg/webchat/stream_hub.go
      Note: Backend ws attach/read loop disconnect logging
    - Path: apps/inventory/src/features/chat/InventoryChatWindow.tsx
      Note: Dispatch wiring for connection status and envelope projection
    - Path: apps/inventory/src/features/chat/webchatClient.ts
      Note: Frontend websocket status lifecycle and stale callback mitigation
ExternalSources: []
Summary: Investigation of chat WS disconnect logs, idle-timeout stream stops, and frontend status desync when chat still receives events.
LastUpdated: 2026-02-18T16:46:16-05:00
WhatFor: Root-cause report and mitigation notes for websocket lifecycle symptoms in inventory chat
WhenToUse: Use when chat status seems wrong, ws reconnect loops appear, or idle timeout logs need explanation
---


# Bug Report: WS disconnect and idle timeout investigation

## Goal

Document where the reported websocket and idle-timeout logs originate, identify likely causes, and record the concrete frontend mitigation that prevents "closed" status from being shown while events still flow.

## Context

Reported symptoms on **February 18, 2026**:

1. Reconnect/disconnect loop around chat window open.
2. Backend logs with `websocket: close 1006` / `1005` from ws read loop.
3. Backend logs for `idle timeout reached, stopping stream`.
4. UI symptom: chat window shows `closed`, but messages/events continue to arrive.

This report covers:
- frontend client lifecycle in `apps/inventory/src/features/chat/webchatClient.ts`
- inventory chat window wiring in `apps/inventory/src/features/chat/InventoryChatWindow.tsx`
- backend websocket/read-loop and stream lifecycle in `pinocchio/pkg/webchat/*`

## Incident Snapshot

Observed backend logs (abridged):

- `ws sending hello`
- `ws read loop end error="websocket: close 1006 (abnormal closure): unexpected EOF"`
- `ws disconnected`
- new ws attach shortly after
- `idle timeout reached, stopping stream ... idle_timeout=60000`
- `stream coordinator: stopped`

## Findings

### Finding A: The ws disconnect logs are emitted by normal read-loop shutdown paths

Source mapping:

- `ws sending hello`: `pinocchio/pkg/webchat/stream_hub.go:113`
- `ws read loop end`: `pinocchio/pkg/webchat/stream_hub.go:124`
- `ws disconnected`: `pinocchio/pkg/webchat/stream_hub.go:120`

`stream_hub.go` starts a goroutine reading `conn.ReadMessage()`. Any read error ends the loop and logs disconnect. So the logs do not by themselves prove a backend crash; they indicate the socket ended from the server’s read loop perspective.

### Finding B: Idle timeout logs are expected lifecycle behavior from ConnectionPool

Source mapping:

- idle timeout callback + log: `pinocchio/pkg/webchat/conversation.go:367` and `pinocchio/pkg/webchat/conversation.go:370`
- stream stop in callback: `pinocchio/pkg/webchat/conversation.go:371`
- stream started/stopped logs: `pinocchio/pkg/webchat/stream_coordinator.go:142` and `pinocchio/pkg/webchat/stream_coordinator.go:185`
- idle timer scheduling when pool becomes empty: `pinocchio/pkg/webchat/connection_pool.go:225`

The configured timeout is set from router/main defaults (`idle-timeout-seconds`, default `60`), then used as `time.Duration(cm.idleTimeoutSec) * time.Second`. This explains logs with `idle_timeout=60000` (milliseconds).

### Finding C: Frontend status could be stale relative to active traffic

Frontend had a status race pattern:

- status came from ws lifecycle callbacks (`onopen`, `onclose`, `onerror`) in `apps/inventory/src/features/chat/webchatClient.ts`
- if callback ordering raced during reconnect/teardown, status in Redux could show `closed` while active frames still arrived

Mitigation implemented:

- stale-socket callback guards (`if (this.ws !== ws) return`) on all websocket handlers
- deduplicated status emitter
- low-frequency "connected heartbeat" based on inbound `onmessage` traffic (max once/sec) to self-correct stale status without high-frequency Redux churn

Implemented in commit:

- `756200d` (`fix(chat): prevent stale ws status and reassert connected on traffic`)

Key code references:

- `apps/inventory/src/features/chat/webchatClient.ts:214`
- `apps/inventory/src/features/chat/webchatClient.ts:240`
- `apps/inventory/src/features/chat/webchatClient.ts:299`
- `apps/inventory/src/features/chat/webchatClient.ts:310`

Test coverage added:

- stale callback suppression and connected-heartbeat behavior in `apps/inventory/src/features/chat/webchatClient.test.ts:123`

## Contributing Factors

1. `React.StrictMode` in dev (`apps/inventory/src/main.tsx:11`) can induce extra mount/unmount cycles, which can look like transient connect/disconnect churn during development.
2. Connection status is conversation-scoped metadata; multiple lifecycle signals close together can temporarily look inconsistent to users without source-aware status arbitration.

## What Was Fixed in HC-52

### 1) Event Viewer export (task item)

Implemented `YAML` export for currently visible, filtered event entries:

- UI button: `packages/engine/src/hypercard-chat/event-viewer/EventViewerWindow.tsx:160`
- export builder/download utility: `packages/engine/src/hypercard-chat/event-viewer/exportYaml.ts:21`
- tests: `packages/engine/src/hypercard-chat/event-viewer/exportYaml.test.ts`

Commit:

- `7d53843` (`feat(event-viewer): add yaml export for visible event log`)

### 2) Status race mitigation for chat websocket

Commit:

- `756200d` (`fix(chat): prevent stale ws status and reassert connected on traffic`)

## Validation

Commands run:

```bash
cd /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react
npx vitest run apps/inventory/src/features/chat/webchatClient.test.ts
npm run typecheck
```

Result:

- targeted chat client tests pass
- full TypeScript build/typecheck passes

## Remaining Risks / Follow-up

1. If two distinct client instances intentionally share one conversation ID, status can still flicker between sources; source-tagged status updates in slice state would fully eliminate that class.
2. Dev-only StrictMode churn can still produce noisy backend connect/disconnect logs; this is expected but can be confusing during debugging.
3. Idle-timeout stop/start is expected; if perceived as problematic, tune `idle-timeout-seconds` rather than treating as bug.

## Quick Reference

### Where each log comes from

- `ws sending hello`: `pinocchio/pkg/webchat/stream_hub.go:113`
- `ws read loop end`: `pinocchio/pkg/webchat/stream_hub.go:124`
- `ws disconnected`: `pinocchio/pkg/webchat/stream_hub.go:120`
- `idle timeout reached, stopping stream`: `pinocchio/pkg/webchat/conversation.go:370`
- `stream coordinator: started/stopped`: `pinocchio/pkg/webchat/stream_coordinator.go:142`, `pinocchio/pkg/webchat/stream_coordinator.go:185`

### Frontend status hot path

- ws client status handlers: `apps/inventory/src/features/chat/webchatClient.ts`
- dispatch into Redux: `apps/inventory/src/features/chat/InventoryChatWindow.tsx:149`

## Related

- `ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/reference/02-diary.md`
- `ttmp/2026/02/18/HC-52-BUG-FIXES--bug-fixes-eventviewer-export-and-ws-disconnect-investigation/tasks.md`
