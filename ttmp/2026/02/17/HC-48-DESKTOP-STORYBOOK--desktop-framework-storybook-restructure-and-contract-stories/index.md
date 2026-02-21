---
Title: Desktop Framework Storybook Restructure and Contract Stories
Ticket: HC-48-DESKTOP-STORYBOOK
Status: complete
Topics:
    - frontend
    - architecture
    - storybook
    - windowing
    - developer-experience
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: .storybook/preview.ts
      Note: Story sorting updated to Shell/Widgets/PluginRuntime grouping
    - Path: packages/engine/src/components/shell/windowing/DesktopContributions.contract.stories.tsx
      Note: New desktop contribution contract fixture story
    - Path: packages/engine/src/components/shell/windowing/WindowContentAdapters.contract.stories.tsx
      Note: New adapter chain contract fixture story
    - Path: packages/engine/src/components/shell/windowing/useWindowInteractionController.stories.tsx
      Note: 20-window density drag profiling harness
    - Path: scripts/storybook/check-taxonomy.mjs
      Note: Enforces updated framework story taxonomy
ExternalSources: []
Summary: Hard-cutover Storybook taxonomy and contract stories for desktop framework surfaces.
LastUpdated: 2026-02-17T16:58:37.934784871-05:00
WhatFor: ""
WhenToUse: ""
---



# Desktop Framework Storybook Restructure and Contract Stories

## Overview

Workstream G hard cutover ticket for Storybook framework structure. This ticket moved engine stories to stable framework namespaces (`Engine/Shell`, `Engine/Widgets`, `Engine/PluginRuntime`), added taxonomy enforcement, and added contract-focused desktop stories for contribution composition, adapter routing, and drag-density profiling.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- architecture
- storybook
- windowing
- developer-experience

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
