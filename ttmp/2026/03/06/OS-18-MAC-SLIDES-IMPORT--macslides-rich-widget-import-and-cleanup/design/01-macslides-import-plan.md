---
Title: MacSlides import plan
Ticket: OS-18-MAC-SLIDES-IMPORT
Status: active
Topics:
    - frontend
    - widgets
    - storybook
    - state-management
    - cleanup
DocType: design-doc
Intent: implementation-plan
Owners: []
RelatedFiles:
    - imports/mac-slides.jsx
    - packages/rich-widgets/src/parts.ts
    - packages/rich-widgets/src/theme/index.ts
    - packages/rich-widgets/src/launcher/modules.tsx
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T09:00:00-05:00
WhatFor: ""
WhenToUse: ""
---

# MacSlides import plan

`imports/mac-slides.jsx` is a raw sketch, not a directly shippable rich widget. It currently mixes three concerns in one file:

- a fake desktop app shell;
- the actual presentation editor UI;
- ad hoc markdown parsing/rendering and fullscreen slideshow behavior.

The cleanup/import plan is to rebuild the useful content as a proper rich widget and discard the fake shell.

## Implementation phases

### Phase 1 — Audit and scaffold

- inventory the widget regions, states, and fake shell elements;
- create the target source folder under `packages/rich-widgets/src/mac-slides/`;
- extract typed helpers for:
  - slide splitting,
  - slide alignment directives,
  - markdown rendering,
  - sample decks.

### Phase 2 — CSS and parts integration

- add `RICH_PARTS` entries for the real widget regions;
- create `packages/rich-widgets/src/theme/mac-slides.css`;
- move stable styling out of the inline style object and injected `<style>` blocks;
- drop remote font imports and browser-global scrollbar hacks.

### Phase 3 — Widget rebuild

- rebuild the editor/preview/deck layout with rich-widget primitives;
- remove fake menu bar, title bar, close box, and fake status bar;
- keep actual features:
  - slide list,
  - markdown editor,
  - preview,
  - slideshow/present mode,
  - alignment toggle,
  - command palette / action surface.

### Phase 4 — Storybook

- add a standard story matrix:
  - default deck,
  - empty deck,
  - dense deck,
  - alignment-focused deck,
  - presentation-open or editor-focused seeded state.

### Phase 5 — State decision and launcher wiring

- introduce a Redux slice for deck/session state and keep DOM-only concerns local;
- export from `packages/rich-widgets/src/index.ts`;
- add launcher registration in `packages/rich-widgets/src/launcher/modules.tsx` if the widget is ready for desktop launch.

## State direction

Final direction:

- store these widget-session fields in Redux:
  - markdown deck content,
  - current slide index,
  - command palette visibility,
  - presentation visibility;
- keep DOM-only concerns local:
  - textarea ref/cursor handling,
  - presentation overlay key handlers,
  - transient browser focus behavior;
- retain prop-based seeding as the standalone fallback path, but use the Redux slice for launcher-backed and Storybook-seeded scenarios.

## First task

Task 1 is the audit + scaffold task. It establishes the target files and the cleaned helper layer before the full JSX/CSS rebuild.
