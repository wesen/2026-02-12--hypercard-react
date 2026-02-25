---
Title: widget and icon scoped context menu showcase scenarios
Ticket: OS-10-CONTEXT-MENU-SHOWCASES
Status: active
Topics:
    - frontend
    - desktop
    - menus
    - ux
    - plugins
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/types.ts
      Note: Context target contracts and invocation metadata extensions.
    - Path: packages/engine/src/components/shell/windowing/contextActionRegistry.ts
      Note: Target-key registry and precedence resolver for context actions.
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Target-scoped context action registration hooks and runtime API.
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: Context target resolution and invocation plumbing in shell controller.
ExternalSources: []
Summary: Implementation planning ticket for target-scoped context menu showcase scenarios (icons, folders, chat message/conversation, role-aware menus) plus plugin-extension feasibility notes.
LastUpdated: 2026-02-25T16:08:00-05:00
WhatFor: Track planning and execution for high-impact context menu showcases in desktop-os/engine.
WhenToUse: Use when implementing or reviewing OS-level context menu UX scenarios and extension hooks.
---

# widget and icon scoped context menu showcase scenarios

## Overview

This ticket plans and tracks implementation of target-scoped context menu showcases:

1. Icon quick actions
2. Folder/icon hybrid launcher
3. Chat message context menu
4. Conversation-level menu
5. Role/profile-aware menus

It also documents scenario 11 (plugin-injected context actions) and required platform prerequisites.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- frontend
- desktop
- menus
- ux
- plugins

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Design

- [context menu showcase implementation plan](./design-doc/01-context-menu-showcase-implementation-plan.md)

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
