---
Title: Execution Notes and Experiments
Ticket: HC-033-ADD-WEBCHAT-INTEGRATION
Status: active
Topics:
    - chat
    - backend
    - sqlite
    - go
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/domain/pluginBundle.vm.js
      Note: Existing VM assistant behavior used as baseline.
    - Path: 2026-02-12--hypercard-react/go-inventory-chat/scripts/seed.sh
      Note: Backend seed automation command used in experiments
    - Path: 2026-02-12--hypercard-react/package.json
      Note: Root scripts for backend serve/seed added for workflow
    - Path: 2026-02-12--hypercard-react/packages/engine/src/components/shell/windowing/ChatWindowDesktop.stories.tsx
      Note: Existing card injection and chat-window desktop integration reference.
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/scripts/smoke-chat-backend.sh
      Note: Ticket-local smoke experiment script
    - Path: 2026-02-12--hypercard-react/ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/scripts/smoke-sem-timeline.sh
      Note: SEM-only stream + timeline hydration smoke script
    - Path: 2026-02-12--hypercard-react/apps/inventory/vite.config.ts
      Note: Worker format fix used to unblock inventory production build.
    - Path: geppetto/pkg/events/structuredsink/filtering_sink.go
      Note: Tag extraction mechanics reference.
    - Path: pinocchio/pkg/webchat/router.go
      Note: Route ownership and app-owned /chat,/ws reference behavior.
ExternalSources: []
Summary: Command log, technical checkpoints, and lightweight experiments for HC-033.
LastUpdated: 2026-02-16T10:15:00-05:00
WhatFor: Fast operational reference while implementing and validating the integration.
WhenToUse: Use during development for command recall, experiment outcomes, and troubleshooting context.
---


# Execution Notes and Experiments

## Goal

Keep an exact, compact record of commands, findings, and small experiments used to implement HC-033.

## Context

This ticket spans frontend runtime integration and a new backend service. Most regressions happen at interfaces (windowing integration, SEM stream parsing, and sqlite query contracts), so this file captures those checkpoints.

## Quick Reference

### Ticket bootstrap commands

```bash
docmgr ticket create-ticket --ticket HC-033-ADD-WEBCHAT-INTEGRATION --title "Webchat Integration for Inventory" --topics chat,backend,sqlite,go
docmgr import file --file /tmp/webchat-hyper-integration.md --ticket HC-033-ADD-WEBCHAT-INTEGRATION
docmgr doc add --ticket HC-033-ADD-WEBCHAT-INTEGRATION --doc-type design-doc --title "Validated Architecture and Implementation Plan"
docmgr doc add --ticket HC-033-ADD-WEBCHAT-INTEGRATION --doc-type reference --title "Diary"
docmgr doc add --ticket HC-033-ADD-WEBCHAT-INTEGRATION --doc-type reference --title "Execution Notes and Experiments"
```

### Useful repo reality checks used during analysis

```bash
rg --files 2026-02-12--hypercard-react | rg '\.go$|go\.mod$|go\.sum$'
rg -n "chat|quickjs|plugin|renderAppWindow|defineCard|sqlite" 2026-02-12--hypercard-react/apps 2026-02-12--hypercard-react/packages
sed -n '1,220p' 2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/runtimeService.ts
sed -n '1,220p' 2026-02-12--hypercard-react/packages/engine/src/plugin-runtime/stack-bootstrap.vm.js
```

### Known command incompatibility (docmgr)

```bash
# Fails on current version:
docmgr ticket tickets --ticket HC-033-ADD-WEBCHAT-INTEGRATION --plain

# Works:
docmgr list tickets --with-glaze-output --output csv --with-headers=false --fields ticket,path
```

### Backend implementation commands

```bash
mkdir -p go-inventory-chat/{cmd/inventory-chat,internal/{app,chat,store},data,scripts}
cd go-inventory-chat
go mod tidy
gofmt -w ./cmd ./internal
GOWORK=off go test ./...
GOWORK=off go run ./cmd/inventory-chat seed --db ./data/inventory.db --force
```

### Backend smoke commands

```bash
# Terminal 1
cd go-inventory-chat
GOWORK=off go run ./cmd/inventory-chat serve --db ./data/inventory.db --addr :18081 --allow-origin '*'

# Terminal 2
curl -sS -X POST http://127.0.0.1:18081/api/chat/completions \\
  -H 'Content-Type: application/json' \\
  -d '{"conversationId":"conv-smoke","messages":[{"role":"user","text":"show low stock below 3"}]}'
```

### Frontend verification commands

```bash
cd 2026-02-12--hypercard-react
npm exec -w apps/inventory tsc -b
npm run -w apps/inventory build
```

Observed:
1. TypeScript build succeeds.
2. Production build now succeeds after setting `worker.format = 'es'` in `apps/inventory/vite.config.ts`.
3. Build still emits non-blocking chunk-size warnings from QuickJS assets.

### SEM-only stream + timeline smoke

```bash
cd 2026-02-12--hypercard-react/ttmp/2026/02/15/HC-033-ADD-WEBCHAT-INTEGRATION--webchat-integration-for-inventory/scripts
./smoke-sem-timeline.sh hc033-sem-only-fresh
```

Expected:
1. Completion response returns WS URL without legacy compatibility query toggles.
2. Stream output contains SEM event classes (`chat.message.token`, `chat.message.artifact`, `chat.message.done`).
3. Timeline summary reports non-zero `messages`, `events`, and `lastSeq`.

### Real tmux end-to-end smoke (backend + Vite + browser)

```bash
tmux new-session -d -s hc033-backend
tmux send-keys -t hc033-backend 'cd /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat && GOWORK=off go run ./cmd/inventory-chat serve --db ./data/inventory.db --addr :18081 --allow-origin http://127.0.0.1:15173' C-m

tmux new-session -d -s hc033-frontend
tmux send-keys -t hc033-frontend 'cd /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react && VITE_INVENTORY_CHAT_BASE_URL=http://127.0.0.1:18081 npm run -w apps/inventory dev -- --host 127.0.0.1 --port 15173' C-m

curl -sS http://127.0.0.1:18081/healthz
```

Validated in browser:
1. Inventory chat window auto-opened.
2. Clicking suggestion `Show low stock below 3` streamed response correctly.
3. Inline `report-view` + `data-table` widgets rendered.
4. Clicking `Create Saved Card` injected `saved_low_stock_3` and opened a new card window with expected table content.

## Usage Examples

1. To quickly re-check why app-window chat was chosen:
   - open `packages/engine/src/components/shell/windowing/DesktopShell.tsx`
   - search for `renderAppWindow` and `content.kind === 'app'`.
2. To verify dynamic card injection primitives:
   - open `packages/engine/src/plugin-runtime/runtimeService.ts`
   - inspect `defineCard`, `defineCardRender`, `defineCardHandler`.
3. To verify structured extraction tag semantics:
   - open `geppetto/pkg/events/structuredsink/filtering_sink.go`
   - inspect `Extractor`, `ExtractorSession`, and malformed policy handling.
4. To replay backend smoke test quickly:
   - run `scripts/smoke-chat-backend.sh` from this ticket's `scripts/` directory.

## Related

1. `design-doc/01-validated-architecture-and-implementation-plan.md`
2. `reference/01-diary.md`
3. `tasks.md`
