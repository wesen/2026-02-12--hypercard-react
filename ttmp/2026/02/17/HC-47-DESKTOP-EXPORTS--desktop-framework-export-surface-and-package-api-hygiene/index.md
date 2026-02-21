---
Title: Desktop Framework Export Surface and Package API Hygiene
Ticket: HC-47-DESKTOP-EXPORTS
Status: complete
Topics:
    - frontend
    - architecture
    - cleanup
    - windowing
    - developer-experience
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: .storybook/preview.ts
      Note: Storybook now imports theme through package subpath
    - Path: apps/inventory/src/App.tsx
      Note: Primary app cutover from root barrel desktop imports
    - Path: packages/engine/package.json
      Note: Defines explicit subpath exports for desktop framework entrypoints
    - Path: packages/engine/src/desktop-core.ts
      Note: Desktop durable state and actions entrypoint
    - Path: packages/engine/src/desktop-react.ts
      Note: Desktop React entrypoint for shell and interaction APIs
    - Path: packages/engine/src/index.ts
      Note: Root barrel now excludes desktop/windowing exports after hard cutover
ExternalSources: []
Summary: Hard-cutover desktop API exports to explicit package subpaths and removed root-barrel desktop/windowing exports.
LastUpdated: 2026-02-17T16:58:37.484525176-05:00
WhatFor: ""
WhenToUse: ""
---



# Desktop Framework Export Surface and Package API Hygiene

## Overview

Workstream F hard cutover ticket for desktop framework export hygiene. This ticket introduced explicit package subpath entrypoints for desktop APIs, migrated app consumers to those subpaths, and removed desktop/windowing exports from the root `@hypercard/engine` barrel.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- architecture
- cleanup
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
