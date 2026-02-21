---
Title: Code Editor and Syntax Highlighting for Runtime Cards
Ticket: HC-040-CODE-EDITOR
Status: active
Topics:
    - frontend
    - code-editor
    - developer-experience
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/inventory/src/features/chat/EventViewerWindow.tsx
      Note: YAML payload display in event viewer
    - Path: apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx
      Note: YAML rawData display in artifact panel
    - Path: apps/inventory/src/features/chat/InventoryTimelineWidget.tsx
      Note: YAML rawData display in timeline
    - Path: apps/inventory/src/features/chat/RuntimeCardDebugWindow.tsx
      Note: Primary target for JS syntax highlighting (CodePreview)
    - Path: apps/inventory/src/features/chat/utils/yamlFormat.ts
      Note: Custom toYaml formatter
    - Path: packages/engine/src/theme/base.css
      Note: Theme CSS for syntax highlight token colors
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-17T07:51:42.911522064-05:00
WhatFor: ""
WhenToUse: ""
---


# Code Editor and Syntax Highlighting for Runtime Cards

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- code-editor
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
