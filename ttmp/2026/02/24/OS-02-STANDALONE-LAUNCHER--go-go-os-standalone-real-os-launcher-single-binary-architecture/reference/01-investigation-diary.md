---
Title: Investigation diary
Ticket: OS-02-STANDALONE-LAUNCHER
Status: active
Topics:
    - go-go-os
    - frontend
    - backend
    - architecture
    - launcher
    - desktop
    - binary
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: docs/frontend/storybook-and-app-boot-model.md
      Note: Documented existing app boot model used as baseline during investigation
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/main_integration_test.go
      Note: Route/runtime integration expectations used to assess backend composition constraints
    - Path: go-inventory-chat/cmd/hypercard-inventory-server/static/index.html
      Note: Evidence that current embedded static payload is placeholder only
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.test.ts
      Note: Contract tests used to validate contribution behavior assumptions
    - Path: ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--go-go-os-standalone-real-os-launcher-single-binary-architecture/design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md
      Note: Primary analysis document produced from this diary evidence trail
ExternalSources: []
Summary: Chronological command-level investigation log used to produce the OS-02 standalone launcher architecture design document.
LastUpdated: 2026-02-24T10:44:18.37146388-05:00
WhatFor: Preserve exact investigation workflow, command outputs, errors, and reasoning so implementation can continue without re-discovery.
WhenToUse: Use when validating OS-02 conclusions, reproducing evidence, or onboarding engineers to launcher architecture decisions.
---


# Investigation diary

## Goal

Produce a detailed research and design investigation for a standalone go-go-os launcher with:

1. single binary runtime,
2. launchable icons for each current app,
3. composable frontend and backend model,
4. optional backend component per app.

## Context

Work performed in:

- `/home/manuel/workspaces/2026-02-24/add-menus/go-go-os`
- ticket: `OS-02-STANDALONE-LAUNCHER`

Method followed: `ticket-research-docmgr-remarkable` skill workflow.

## Chronological log

### Phase 1: Ticket initialization

Commands:

```bash
docmgr status --summary-only
docmgr ticket create-ticket --ticket OS-02-STANDALONE-LAUNCHER --title "go-go-os standalone real OS launcher single-binary architecture" --topics go-go-os,frontend,backend,architecture,launcher,desktop,binary
docmgr doc add --ticket OS-02-STANDALONE-LAUNCHER --doc-type design-doc --title "Standalone go-go-os launcher architecture and composable app runtime"
docmgr doc add --ticket OS-02-STANDALONE-LAUNCHER --doc-type reference --title "Investigation diary"
```

Findings:

1. `docmgr` root is `go-go-os/ttmp`.
2. Ticket path created under `2026/02/24/OS-02-STANDALONE-LAUNCHER--...`.
3. Design doc + diary files created successfully.

Interpretation:

- Workspace scaffolding was ready for evidence-first investigation and documentation.

### Phase 2: Frontend architecture mapping

Commands (representative):

```bash
find go-go-os/apps -maxdepth 4 -type f | sort
nl -ba go-go-os/apps/inventory/src/App.tsx | sed -n '1,960p'
for f in go-go-os/apps/*/src/App.tsx go-go-os/apps/*/src/app/store.ts go-go-os/apps/*/src/domain/stack.ts; do nl -ba "$f"; done
for f in go-go-os/packages/engine/src/components/shell/windowing/*.ts*; do nl -ba "$f"; done
nl -ba go-go-os/packages/engine/src/app/createAppStore.ts
```

Key findings:

1. Each app is booted separately via its own Vite entrypoint and local `App.tsx`.
2. `todo`, `crm`, and `book-tracker-debug` are minimal standalone wrappers around `DesktopShell`.
3. Inventory is the only app currently exercising advanced desktop contributions + app-window rendering.
4. `DesktopContribution` + `renderAppWindow` + `content.kind='app'` already provide launcher-like extension seams.
5. Store creation is static (`createAppStore`), which is a constraint for runtime app-module onboarding.

Interpretation:

- Frontend shell is structurally close to launcher requirements, but missing module registry/orchestration layer.

### Phase 3: Backend architecture mapping

Commands (representative):

```bash
find go-go-os/go-inventory-chat -maxdepth 4 -type f | sort
nl -ba go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/main.go | sed -n '1,313p'
nl -ba go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/tools_inventory.go
nl -ba go-go-os/go-inventory-chat/internal/pinoweb/runtime_composer.go
nl -ba go-go-os/go-inventory-chat/internal/pinoweb/request_resolver.go
nl -ba go-go-os/go-inventory-chat/internal/pinoweb/hypercard_events.go | sed -n '292,430p'
find go-go-os -name '*.go' | sort
```

Key findings:

1. Only one Go backend exists in go-go-os: `go-inventory-chat`.
2. Runtime composition is inventory-specific (runtime key/tool wiring/policy middleware names).
3. Request resolver rejects runtime overrides and expects inventory runtime flow.
4. Route mounting is static and inventory-centric.
5. No generic backend module registry is present.

Interpretation:

- Backend needs a host/module abstraction before multi-app single-binary composition is possible.

### Phase 4: Build and packaging path mapping

Commands (representative):

```bash
nl -ba go-go-os/package.json
nl -ba go-go-os/tooling/vite/createHypercardViteConfig.ts
for f in go-go-os/apps/*/vite.config.ts; do nl -ba "$f"; done
nl -ba go-go-os/go-inventory-chat/cmd/hypercard-inventory-server/static/index.html
```

Key findings:

1. Root dev script targets inventory app only.
2. Inventory app has explicit backend proxy wiring through Vite helper.
3. Go server embeds `static/`, but static payload is placeholder HTML, not full launcher frontend.

Interpretation:

- Single-binary packaging pattern exists in principle (`embed.FS`) but not with real multi-app frontend assets.

### Phase 5: Writing and synthesis

Actions:

1. Updated `index.md` with ticket overview and links.
2. Wrote comprehensive design doc with:
   - current-state evidence,
   - gap analysis,
   - proposed frontend/backend module contracts,
   - pseudocode,
   - phased rollout,
   - testing and risk strategy.
3. Updated tasks and changelog.

## Tricky points and failed attempts

1. Initial backend discovery command targeted non-existent path:

```bash
find go-go-os/cmd -maxdepth 4 -type f
# -> find: ‘go-go-os/cmd’: No such file or directory
```

Resolution:

- Located actual backend under `go-go-os/go-inventory-chat/cmd`.

2. One frontend file lookup used wrong path:

```bash
nl -ba go-go-os/packages/engine/src/components/widgets/ChatConversationWindow.tsx
# -> No such file or directory
```

Resolution:

- Correct file is `go-go-os/packages/engine/src/chat/components/ChatConversationWindow.tsx`.

3. One slice filename lookup used stale name:

```bash
nl -ba go-go-os/packages/engine/src/chat/state/chatProfilesSlice.ts
# -> No such file or directory
```

Resolution:

- Correct file is `go-go-os/packages/engine/src/chat/state/profileSlice.ts`.

## Decision rationale summary

1. Reuse existing DesktopShell contribution architecture rather than replacing shell internals.
2. Introduce explicit app module contracts for both frontend and backend to avoid monolithic host logic.
3. Use compile-time module composition first (deterministic release and simpler CI), with runtime discovery as future extension.

## Validation and delivery log

Completed steps:

1. Updated relationships:

```bash
docmgr doc relate --doc ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--.../design-doc/01-standalone-go-go-os-launcher-architecture-and-composable-app-runtime.md --file-note ...
docmgr doc relate --doc ttmp/2026/02/24/OS-02-STANDALONE-LAUNCHER--.../reference/01-investigation-diary.md --file-note ...
```

2. Updated changelog with file-noted summary:

```bash
docmgr changelog update --ticket OS-02-STANDALONE-LAUNCHER --title "Completed standalone launcher architecture investigation" --entry "..." --file-note ...
```

3. Ran doctor and resolved vocabulary warning:

```bash
docmgr doctor --ticket OS-02-STANDALONE-LAUNCHER --stale-after 30
docmgr vocab add --category topics --slug binary --description "Single-binary packaging and deployment concerns"
docmgr vocab add --category topics --slug desktop --description "Desktop shell/windowing and OS-like UX architecture"
docmgr vocab add --category topics --slug go-go-os --description "go-go-os project architecture and implementation details"
docmgr vocab add --category topics --slug launcher --description "Application launcher/runtime composition model"
docmgr doctor --ticket OS-02-STANDALONE-LAUNCHER --stale-after 30
```

Result:

- `docmgr doctor`: `✅ All checks passed`.

4. reMarkable delivery:

```bash
remarquee status
remarquee cloud account --non-interactive
remarquee upload bundle --dry-run <ticket docs...> --name "OS-02 Standalone Launcher Investigation" --remote-dir "/ai/2026/02/24/OS-02-STANDALONE-LAUNCHER" --toc-depth 2
remarquee upload bundle <ticket docs...> --name "OS-02 Standalone Launcher Investigation" --remote-dir "/ai/2026/02/24/OS-02-STANDALONE-LAUNCHER" --toc-depth 2
remarquee cloud ls /ai/2026/02/24/OS-02-STANDALONE-LAUNCHER --long --non-interactive
```

Result:

- Upload succeeded: `OS-02 Standalone Launcher Investigation.pdf`.
- Remote listing confirms file exists under `/ai/2026/02/24/OS-02-STANDALONE-LAUNCHER`.

## Post-delivery plan refinement (user-directed)

Follow-up decision captured after initial delivery:

1. Adopt `packages/desktop-os` for OS-level concerns (app registry, launcher orchestration, host policies).
2. Keep `packages/engine` unchanged for now (no immediate split).
3. Enforce dependency direction: `packages/desktop-os` can depend on `packages/engine`; `packages/engine` must not depend on `packages/desktop-os`.
