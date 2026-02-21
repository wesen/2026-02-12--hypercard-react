---
Title: "Start Here \u2014 Desktop Framework Reading Guide"
Ticket: HC-49-DESKTOP-DOCS
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - design-system
    - cleanup
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: One-page reading order guide for the desktop framework documentation set.
LastUpdated: 2026-02-17T17:30:00.000000000-05:00
WhatFor: Help new developers find the right doc for their current need without reading everything.
WhenToUse: Read this first when you're new to the desktop framework documentation.
---

# Start Here — Desktop Framework Reading Guide

The desktop framework docs are organized as focused, standalone guides. You don't need to read all of them — pick the path that matches what you're trying to do.

## Document Map

```
                    ┌──────────────────┐
                    │   START HERE     │
                    │  (this document) │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌────────────────────┐       ┌────────────────────────┐
   │  Architecture      │       │  Quickstart            │
   │  Overview          │       │  (hands-on)            │
   │  (big picture)     │       │                        │
   └────────┬───────────┘       └────────┬───────────────┘
            │                            │
            │         ┌──────────────────┼──────────────────┐
            │         ▼                  ▼                  ▼
            │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
            │  │ Contribution│  │ Adapter      │  │ Theming &    │
            │  │ API         │  │ Guide        │  │ Parts        │
            │  └──────┬──────┘  └──────────────┘  └──────────────┘
            │         │
            │         ▼
            │  ┌─────────────┐
            └──│ Performance │
               │ Model       │
               └─────────────┘

            ┌──────────────────┐
            │ Common Recipes   │  ← reference any time
            └──────────────────┘
```

## Reading Paths

### 🟢 "I'm new to the project"

1. **[Architecture Overview](./07-desktop-framework-architecture-overview.md)** — Understand the component tree, data flow, boot sequence, and import map. Takes 10 minutes.
2. **[Quickstart](./02-desktop-framework-quickstart.md)** — Get a desktop shell running step by step. Takes 15 minutes.
3. **[Common Recipes](./08-common-recipes.md)** — Browse copy-paste patterns for common tasks.

### 🟡 "I'm building a real app"

Start with the green path above, then continue with:

4. **[Contribution API Reference](./03-desktop-contribution-api-reference.md)** — Add custom menus, icons, commands, and startup windows.
5. **[Window Content Adapter Guide](./04-window-content-adapter-guide.md)** — Render custom window types beyond cards and app windows.

### 🔵 "I'm going deeper"

6. **[Theming and Parts Contract](./05-theming-and-parts-contract.md)** — Customize colors, fonts, and target specific UI elements with CSS.
7. **[Performance Model](./06-performance-model-durable-vs-ephemeral-lanes.md)** — Understand when to use Redux vs. external stores for high-frequency data.

### 📚 "I need the full DSL/card system reference"

The desktop framework docs cover the windowed shell. For the underlying card DSL, widgets, actions, selectors, and runtime:

- **[README.md](../../../README.md)** — Project overview and quick start
- **[JS API User Guide](../../../docs/js-api-user-guide-reference.md)** — Complete API reference for the card DSL and shell runtime

## Quick Reference: All Documents

| # | Document | What It Covers | When to Read |
|---|----------|---------------|--------------|
| 09 | **Start Here** (this doc) | Reading order and document map | First |
| 07 | **[Architecture Overview](./07-desktop-framework-architecture-overview.md)** | Component tree, data flow, boot sequence, import map | When onboarding |
| 02 | **[Quickstart](./02-desktop-framework-quickstart.md)** | Step-by-step desktop shell setup | When building your first app |
| 03 | **[Contribution API](./03-desktop-contribution-api-reference.md)** | Custom menus, icons, commands, startup windows | When customizing the shell |
| 04 | **[Adapter Guide](./04-window-content-adapter-guide.md)** | Custom window content rendering | When adding new window types |
| 05 | **[Theming & Parts](./05-theming-and-parts-contract.md)** | CSS variables, theme layers, data-part selectors | When restyling the shell |
| 06 | **[Performance Model](./06-performance-model-durable-vs-ephemeral-lanes.md)** | Redux vs external stores, diagnostics | When handling high-frequency data |
| 08 | **[Common Recipes](./08-common-recipes.md)** | Copy-paste patterns for common tasks | Anytime |

## Quick Reference: Import Cheat Sheet

```
I need to...                        Import from
─────────────────────────────       ──────────────────────────────
Render the desktop shell            @hypercard/engine/desktop-react
Dispatch window actions             @hypercard/engine/desktop-core
Load base styles                    @hypercard/engine/theme
Define card stacks / use widgets    @hypercard/engine
Use card rendering in adapters      @hypercard/engine/desktop-hypercard-adapter
Apply macOS theme                   @hypercard/engine/desktop-theme-macos1
```
