---
Title: Desktop Shell and Windowing Reusable Framework Cleanup
Ticket: HC-45-DESKTOP-FRAMEWORK
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - cleanup
    - design-system
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/DesktopShell.tsx
      Note: Current shell orchestration baseline and primary refactor target
    - Path: packages/engine/src/components/shell/windowing/dragOverlayStore.ts
      Note: Existing fast interaction lane architecture to preserve
    - Path: packages/engine/src/desktop/core/state/windowingSlice.ts
      Note: Durable desktop state model after HC-45 hard-cutover move
    - Path: packages/engine/src/components/shell/windowing/desktopContributions.ts
      Note: Workstream C contribution contracts and composer implementation
    - Path: packages/engine/src/components/shell/windowing/windowContentAdapter.ts
      Note: Workstream D adapter-chain contract and renderer
    - Path: apps/inventory/src/App.tsx
      Note: First app migrated to contribution-based desktop configuration
    - Path: packages/engine/src/theme/index.ts
      Note: Modular theme pack entrypoint used by apps and Storybook after hard cutover
    - Path: packages/engine/src/theme/desktop/tokens.css
      Note: Workstream E split token/base pack
    - Path: packages/engine/src/theme/desktop/shell.css
      Note: Workstream E split desktop shell/windowing pack
ExternalSources: []
Summary: Ticket workspace for extracting DesktopShell/windowing into a reusable in-browser desktop framework with macOS-1 style theming support.
LastUpdated: 2026-02-17T16:46:00-05:00
WhatFor: Track analysis, planning, and implementation guidance for reusable desktop framework extraction.
WhenToUse: Use when implementing or reviewing desktop-shell and windowing framework cleanup work.
---

# Desktop Shell and Windowing Reusable Framework Cleanup

## Overview

HC-45 captures the next-stage cleanup from app-specific shell integration toward a reusable desktop framework architecture. The focus is a macOS-1 styled in-browser OS developer platform built from existing HyperCard windowing primitives.

## Key Documents

- `design-doc/01-desktop-shell-and-windowing-reusability-analysis-for-in-browser-os-framework.md`
- `design-doc/02-desktop-shell-and-windowing-reusable-framework-implementation-plan.md`
- `design-doc/03-postmortem-hc-45-desktop-framework-execution-and-current-state.md`
- `reference/01-diary.md`

## Current Status

- Status: `active`
- Analysis: complete
- Implementation planning: complete
- Implementation execution (T1-T4): complete
- Workstream C implementation: complete
- Workstream D implementation: complete
- Workstream E CSS hard cutover: complete
- Workstream F implementation (via HC-47): complete
- Workstream G implementation (via HC-48): complete
- Postmortem analysis: complete
- Upload to reMarkable: complete

## Tasks and Changelog

- See `tasks.md`
- See `changelog.md`
