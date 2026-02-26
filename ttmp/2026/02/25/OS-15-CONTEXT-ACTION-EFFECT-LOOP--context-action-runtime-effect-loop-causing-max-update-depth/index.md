---
Title: context action runtime effect loop causing max update depth
Ticket: OS-15-CONTEXT-ACTION-EFFECT-LOOP
Status: active
Topics:
    - architecture
    - debugging
    - desktop
    - frontend
    - menus
    - windowing
    - ux
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx
      Note: Registration hooks depend on runtime context identity and run cleanup/register on change.
    - Path: packages/engine/src/components/shell/windowing/useDesktopShellController.tsx
      Note: register/unregister mutate local context-action state; openContextMenu identity depends on that state.
    - Path: packages/engine/src/components/shell/windowing/DesktopShellView.tsx
      Note: Wires runtime callbacks into provider, currently coupling register APIs and openContextMenu in one context value.
    - Path: packages/engine/src/chat/components/ChatConversationWindow.tsx
      Note: Registers conversation context actions; affected by runtime identity churn.
    - Path: packages/engine/src/chat/renderers/builtin/MessageRenderer.tsx
      Note: Registers per-message context actions; amplifies effect churn under heavy timeline renders.
    - Path: apps/inventory/src/main.tsx
      Note: StrictMode enabled in dev, surfacing effect loop behavior quickly.
ExternalSources: []
Summary: Bug report and research ticket for the context-action registration cleanup loop that triggers Maximum update depth errors.
LastUpdated: 2026-02-26T10:10:00-05:00
WhatFor: Investigate root cause and define a safe, testable fix strategy for runtime context-action registration loops.
WhenToUse: Use when diagnosing or implementing fixes for max-depth issues tied to useRegisterContextActions cleanup/re-register cycles.
---

# context action runtime effect loop causing max update depth

## Overview

This ticket captures a runtime regression where context-action registration effects repeatedly clean up and re-run, causing:

1. `Maximum update depth exceeded` errors,
2. repeated `unregisterContextActions` calls,
3. unstable context-menu runtime behavior in chat/windows.

The ticket scope is bug report + root-cause research + implementation strategy, with explicit follow-up tasks for code changes and regression coverage.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- architecture
- debugging
- desktop
- frontend
- menus
- windowing
- ux

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Design

- [max-update-depth loop root cause and fix strategy](./design-doc/01-max-update-depth-loop-root-cause-and-fix-strategy.md)

## Reference

- [Diary](./reference/01-diary.md)

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
