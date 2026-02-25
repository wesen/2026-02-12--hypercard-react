---
Title: Diary
Ticket: OS-08-REAL-APP-LAUNCH-CUTOVER
Status: active
Topics:
    - go-go-os
    - frontend
    - launcher
    - desktop
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/launcher/module.tsx
      Note: Inventory launcher module entrypoint
    - Path: apps/inventory/src/launcher/renderInventoryApp.tsx
      Note: Inventory launcher real-window rendering and folder icon behavior
    - Path: apps/todo/src/launcher/module.tsx
      Note: Todo folder-to-workspace launcher flow
    - Path: apps/crm/src/launcher/module.tsx
      Note: CRM folder-to-workspace launcher flow
    - Path: apps/book-tracker-debug/src/launcher/module.tsx
      Note: Book tracker folder-to-workspace launcher flow
    - Path: apps/os-launcher/src/__tests__/launcherHost.test.tsx
      Note: Launcher host regression coverage for module window rendering
    - Path: ttmp/2026/02/24/OS-08-REAL-APP-LAUNCH-CUTOVER--launcher-modules-render-real-apps-and-chat-stacks/tasks.md
      Note: Execution checklist tracked against diary entries
ExternalSources: []
Summary: Ongoing implementation diary for OS-08 launcher real-app cutover and folder-based app opening UX.
LastUpdated: 2026-02-25T20:57:00-05:00
WhatFor: Record implementation slices, regressions, and validation evidence while replacing placeholder launcher modules with real app windows.
WhenToUse: Use while implementing or reviewing launcher module rendering and folder-launch behavior changes.
---

# Diary

## Goal

Track OS-08 implementation and validation steps as launcher modules move from placeholder text to real app windows.

## Step 1: Ticket and execution checklist established

Set up OS-08 as the focused ticket for launcher real-app rendering and added a granular checklist to track inventory-first rollout plus non-inventory app cutover.

### Commit (docs)

- `0b72227` - docs(os-08): add real app launcher cutover ticket and tasks

## Step 2: Real module rendering cutover landed with isolated stores

Replaced placeholder launcher windows with real module renderers and isolated per-module stores to prevent cross-window runtime collisions.

### Commits (code)

- `a5ccd44` - feat(os-08): render real launcher apps with isolated module stores

### Validation

- `npm run test -w apps/os-launcher`
- `npm run build -w apps/os-launcher`
- `cd go-inventory-chat && go test ./...`

## Step 3: Inventory flattening and nested-desktop regression fix

Flattened inventory launcher behavior so windows open at host level instead of nesting a second desktop container inside inventory. This removed coupled movement between outer and inner launchers.

### Commits (code)

- `c835e37` - feat(os-08): flatten inventory into host windows (no nested desktop)

### Validation

- `npm run test -w apps/os-launcher`
- `npm run launcher:smoke`

## Step 4: Folder UX rollout across all launcher apps

Implemented folder-first launch flow:

- top-level desktop icon opens `<App> Folder`
- double-clicking folder icon opens real workspace window

For inventory, launcher actions/icons moved into an inventory folder window and no longer render as top-level desktop icon contributions.

### Commits (code)

- `1ecabe2` - feat(os-08): add folder launch flow for todo crm and book tracker
- `8e6e1e9` - feat(os-08): move inventory launcher actions into folder window

### What failed first

- Inventory initially rendered nested windows and triggered runtime collision errors (`Runtime session already exists: session-1`) on focus/resume paths.

### Fix approach

- split launcher app instances from workspace instances
- launch workspace windows from folder icons with new IDs
- preserve per-instance store ownership in module hosts

### Validation

- `npm run test -w apps/os-launcher`
- `npm run build -w apps/os-launcher`
- `npm run launcher:smoke`

## Step 5: Remove nested desktop shells from todo/crm/book tracker workspaces

Users reported nested-desktop behavior remained for todo/crm/book-tracker after folder rollout. Root cause was those workspace windows still rendering `DesktopShell` inside launcher windows.

I changed workspace launch payloads from `content.kind = app` to `content.kind = card` and introduced per-app window content adapters that render `PluginCardSessionHost` with each app's stack. This keeps one top-level desktop while still bootstrapping per-window card sessions and plugin navigation.

### Commit (code)

- `15427e0` - fix(os-08): open todo crm and book tracker as card sessions

### Validation

- `npm run test -w apps/os-launcher`
- `npm run build -w apps/os-launcher`
- `npm run launcher:smoke`

## Step 6: Remove one-icon folder layer for todo/crm/book tracker

After validating flat rendering, we removed unnecessary folder windows for apps that only had one icon inside. Their top desktop icon now launches directly into each app's Home card session.

Inventory remains folder-based because it has multiple launcher actions/icons.

### Commit (code)

- `f69ef11` - fix(os-08): launch todo crm and book tracker directly to home card

### Validation

- `npm run test -w apps/os-launcher`
- `npm run build -w apps/os-launcher`
- `npm run launcher:smoke`
