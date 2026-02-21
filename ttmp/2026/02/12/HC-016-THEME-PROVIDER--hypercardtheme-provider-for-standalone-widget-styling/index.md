---
Title: HyperCardTheme Provider for Standalone Widget Styling
Ticket: HC-016-THEME-PROVIDER
Status: complete
Topics:
    - react
    - vite
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/.storybook/preview.ts
      Note: Global HyperCardTheme decorator
    - Path: packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Now wraps in HyperCardTheme
    - Path: packages/engine/src/components/shell/WindowChrome.tsx
      Note: Removed data-widget
    - Path: packages/engine/src/index.ts
      Note: Barrel export for HyperCardTheme
    - Path: packages/engine/src/theme/HyperCardTheme.tsx
      Note: New ThemeProvider component
    - Path: packages/engine/src/theme/index.ts
      Note: Updated exports
    - Path: uses data-part
      Note: window-frame
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-17T07:40:34.292864112-05:00
WhatFor: ""
WhenToUse: ""
---



# HyperCardTheme Provider for Standalone Widget Styling

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- react
- vite

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
