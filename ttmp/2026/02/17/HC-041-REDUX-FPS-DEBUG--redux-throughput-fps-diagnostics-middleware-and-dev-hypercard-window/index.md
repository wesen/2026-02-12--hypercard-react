---
Title: Redux Throughput/FPS Diagnostics Middleware and Dev HyperCard Window
Ticket: HC-041-REDUX-FPS-DEBUG
Status: active
Topics:
    - debugging
    - frontend
    - performance
    - redux
    - developer-experience
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/App.tsx
      Note: Dev startup behavior and HyperCard app-window routing
    - Path: 2026-02-12--hypercard-react/apps/inventory/src/app/store.ts
      Note: App-level diagnostics enablement via dev flag
    - Path: 2026-02-12--hypercard-react/packages/engine/src/app/createAppStore.ts
      Note: Store-factory integration point for generic diagnostics middleware
    - Path: ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/design-doc/01-implementation-plan-redux-throughput-fps-diagnostics-middleware-and-dev-window.md
      Note: Primary implementation plan
    - Path: ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/reference/01-developer-handoff-file-map-hypercard-window-integration-and-middleware-wiring.md
      Note: Developer handoff and file map
    - Path: ttmp/2026/02/17/HC-041-REDUX-FPS-DEBUG--redux-throughput-fps-diagnostics-middleware-and-dev-hypercard-window/tasks.md
      Note: Detailed implementation task checklist
ExternalSources: []
Summary: |
    Ticket for implementing generic Redux throughput/FPS diagnostics (dev-only) and surfacing live metrics in a HyperCard app window that auto-opens on inventory startup in dev mode.
LastUpdated: 2026-02-17T09:14:00-05:00
WhatFor: |
    Make performance debugging of high-frequency Redux flows practical and repeatable without ad hoc logging.
WhenToUse: Use for implementation and review of middleware instrumentation and diagnostics-window integration.
---


# Redux Throughput/FPS Diagnostics Middleware and Dev HyperCard Window

## Overview

Implement a generic development diagnostics capability for Redux and UI frame health:

1. Redux throughput and reducer timing collection (engine-level middleware).
2. FPS/long-frame monitor.
3. Live diagnostics panel rendered inside the HyperCard desktop as an app window.
4. Auto-open diagnostics window on startup in inventory when `import.meta.env.DEV` is true.

## Key Links

- Design doc: `design-doc/01-implementation-plan-redux-throughput-fps-diagnostics-middleware-and-dev-window.md`
- Handoff/reference: `reference/01-developer-handoff-file-map-hypercard-window-integration-and-middleware-wiring.md`
- Task checklist: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

## Topics

- debugging
- frontend
- performance
- redux
- developer-experience
