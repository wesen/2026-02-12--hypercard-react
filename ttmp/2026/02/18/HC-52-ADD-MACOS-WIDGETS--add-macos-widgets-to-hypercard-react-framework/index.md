---
Title: Add macOS Widgets to HyperCard React Framework
Ticket: HC-52-ADD-MACOS-WIDGETS
Status: active
Topics:
    - frontend
    - widgets
    - macos
    - react
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/widgets/AlertDialog.tsx
      Note: New alert dialog widget
    - Path: packages/engine/src/components/widgets/Checkbox.tsx
      Note: New checkbox widget
    - Path: packages/engine/src/components/widgets/HaloTarget.tsx
      Note: New Smalltalk-style halo widget
    - Path: packages/engine/src/components/widgets/MacOS1Showcase.stories.tsx
      Note: Composite showcase story for all new widgets
    - Path: packages/engine/src/components/widgets/ProgressBar.tsx
      Note: New progress bar widget
    - Path: packages/engine/src/components/widgets/RadioButton.tsx
      Note: New radio button widget
    - Path: packages/engine/src/components/widgets/index.ts
      Note: Existing widget barrel export - will be extended with new widgets
    - Path: packages/engine/src/parts.ts
      Note: Part name registry - needs 28 new entries
    - Path: packages/engine/src/theme/desktop/primitives.css
      Note: Widget CSS rules - needs rules for 12 new widgets
    - Path: packages/engine/src/theme/desktop/tokens.css
      Note: CSS token system - needs new widget tokens and pattern tokens
    - Path: ttmp/2026/02/18/HC-52-ADD-MACOS-WIDGETS--add-macos-widgets-to-hypercard-react-framework/sources/local/macos1-widgets.jsx
      Note: Imported source file with 20 macOS System 1 widgets
ExternalSources:
    - local:macos1-widgets.jsx
Summary: ""
LastUpdated: 2026-02-18T07:34:46.000558993-05:00
WhatFor: ""
WhenToUse: ""
---




# Add macOS Widgets to HyperCard React Framework

## Overview

<!-- Provide a brief overview of the ticket, its goals, and current status -->

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- widgets
- macos
- react

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
