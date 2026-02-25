---
Title: Launcher operations runbook
Ticket: OS-07-SINGLE-BINARY-STABILIZATION
Status: active
Topics:
    - go-go-os
    - launcher
    - operations
DocType: playbook
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/scripts/build-go-go-os-launcher.sh
      Note: One-command binary build script
    - Path: /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/scripts/smoke-go-go-os-launcher.sh
      Note: Automated startup/route policy smoke checks
    - Path: /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/go-inventory-chat/cmd/go-go-os-launcher/main.go
      Note: Launcher binary command entrypoint and route wiring
ExternalSources: []
Summary: Operator runbook for building, launching, validating, and troubleshooting the single-binary launcher.
LastUpdated: 2026-02-25T00:00:00Z
WhatFor: Provide deterministic launcher build/start/health procedures for local and CI execution.
WhenToUse: Use when validating launcher releases or debugging startup/route-policy regressions.
---

# Launcher operations runbook

## Build

From repository root:

```bash
npm run launcher:binary:build
```

Output binary:

- `./build/go-go-os-launcher`

This command performs:

1. frontend production build (`apps/os-launcher/dist`)
2. frontend artifact sync into Go embed directory (`go-inventory-chat/internal/launcherui/dist`)
3. Go build of `cmd/go-go-os-launcher`

## Launch

```bash
./build/go-go-os-launcher go-go-os-launcher \
  --addr :8091 \
  --inventory-db ./go-inventory-chat/data/inventory.db \
  --timeline-db ./go-inventory-chat/data/webchat-timeline.db \
  --turns-db ./go-inventory-chat/data/webchat-turns.db
```

## Health and policy checks

### Automated smoke (recommended)

```bash
npm run launcher:smoke
```

Smoke checks verify:

- launcher shell is reachable at `/`
- `/api/os/apps` lists a healthy `inventory` module
- namespaced backend route responds (`/api/apps/inventory/api/chat/profiles`)
- legacy aliases are blocked (`/chat`, `/ws`, `/api/timeline`)
- startup fails when required modules are missing (`--required-apps inventory,missing`)
- startup time stays within threshold (`MAX_STARTUP_MS`, default `20000`)

### Manual checks

```bash
curl -sSf http://127.0.0.1:8091/api/os/apps
curl -sSf http://127.0.0.1:8091/api/apps/inventory/api/chat/profiles
curl -i http://127.0.0.1:8091/chat
```

Expected:

- first two commands return `200`
- legacy alias check returns `404`

## Troubleshooting

### Binary does not start

1. Check command output for missing required module errors.
2. Ensure startup flags use namespaced architecture (no legacy alias assumptions).
3. Re-run build pipeline:

```bash
npm run launcher:binary:build
```

### Root UI returns placeholder message

- Embedded assets were not synced from latest frontend build.
- Re-run:

```bash
npm run launcher:binary:build
```

### Legacy alias unexpectedly reachable

- Run smoke script to reproduce and inspect log tail:

```bash
bash ./scripts/smoke-go-go-os-launcher.sh --skip-build
```

- Confirm `registerLegacyAliasNotFoundHandlers` is mounted before root UI handler in `cmd/go-go-os-launcher/main.go`.
