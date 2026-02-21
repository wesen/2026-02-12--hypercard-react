---
Title: Documentation Improvement Suggestions
Ticket: HC-49-DESKTOP-DOCS
Status: active
Topics:
    - frontend
    - architecture
    - windowing
    - design-system
    - cleanup
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/02-desktop-framework-quickstart.md
      Note: Quickstart doc to be improved
    - Path: ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/03-desktop-contribution-api-reference.md
      Note: Contribution API doc to be improved
    - Path: ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/04-window-content-adapter-guide.md
      Note: Adapter guide to be improved
    - Path: ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/05-theming-and-parts-contract.md
      Note: Theming doc to be improved
    - Path: ttmp/2026/02/17/HC-49-DESKTOP-DOCS--desktop-framework-documentation-consolidation/reference/06-performance-model-durable-vs-ephemeral-lanes.md
      Note: Performance model doc to be improved
    - Path: README.md
      Note: Top-level project README (comprehensive but not cross-linked to desktop docs)
    - Path: docs/js-api-user-guide-reference.md
      Note: JS API guide (covers DSL/shell but predates desktop framework docs)
ExternalSources: []
Summary: Detailed analysis and actionable improvement suggestions for making desktop framework docs developer-friendly with prose, diagrams, onboarding paths, and progressive disclosure.
LastUpdated: 2026-02-17T17:22:21.102502551-05:00
WhatFor: Guide the rewrite of HC-49 desktop docs to be more welcoming and useful for new developers.
WhenToUse: Use when planning or executing the documentation improvement pass.
---

# Documentation Improvement Suggestions

## Executive Summary

The five desktop framework reference docs in HC-49 are **technically accurate and complete**, but they read like API extraction notes rather than developer guides. They're structured as flat lists of interfaces and code blocks with minimal connecting prose, no visual aids, and no progressive disclosure. A new developer who opens these docs would face a wall of TypeScript signatures without understanding *why* things work this way or *where to start*.

This document proposes concrete improvements organized by document, with cross-cutting themes applied throughout.

---

## Cross-Cutting Problems

These issues appear in **every** document and should be addressed globally:

### 1. Missing "Why Should I Care?" Framing

Every doc jumps straight into interfaces/code. None of them answer:
- What problem does this solve?
- When would I reach for this?
- What happens if I don't use it?

**Suggestion:** Add a 2–3 sentence introductory paragraph to each doc that explains the *motivation* from a developer's perspective — not the architecture's perspective.

### 2. No Visual Architecture Aids

The docs contain zero diagrams. The desktop framework has several layered, ordered systems (adapter chains, command routing, contribution composition, the dual-lane state model) that are much easier to understand visually.

**Suggestion:** Add ASCII or Mermaid diagrams for:
- The overall desktop shell component tree
- Command routing flow (contribution → built-in → fallback)
- Adapter chain evaluation
- Durable vs. ephemeral state flow
- Contribution composition/merge pipeline

### 3. No Progressive Disclosure

All docs dump everything at once. A new developer who just wants to render a desktop shell has to parse contribution composition semantics and adapter chains before finding the three-line setup.

**Suggestion:** Structure each doc with:
1. **TL;DR** — one-paragraph summary + minimal example
2. **Getting Started** — the happy path, step by step
3. **How It Works** — architecture explanation with diagrams
4. **API Reference** — the complete interface list
5. **Cookbook** — common patterns and recipes
6. **Gotchas** — things that will bite you

### 4. No Cross-Linking or Reading Order

The five docs are independent islands. There's no suggested reading order and no contextual links like "now that you have a shell running, see the Contribution API to customize menus."

**Suggestion:** Add a reading-order map at the top of the quickstart and cross-reference links between docs at natural handoff points.

### 5. Prose Is Missing Almost Entirely

Code blocks sit next to each other without explanation. For example, the quickstart has five numbered steps but doesn't explain *what each step accomplishes* or *what would break if you skipped it*.

**Suggestion:** Each code block should be preceded by 1–2 sentences explaining what it does and why it matters. After the block, note what you should see or what to check.

---

## Per-Document Suggestions

### A. Desktop Framework Quickstart (`02-desktop-framework-quickstart.md`)

**Current state:** Five code blocks with one-line headings. Technically correct but feels like a recipe without any cooking tips.

**Specific suggestions:**

1. **Add a "What You'll Build" section** with an ASCII sketch of the result:
   ```
   ┌─────────────────────────────────────────────┐
   │ File │ Cards │ Window │          (Menu Bar)  │
   ├─────────────────────────────────────────────┤
   │ 📦 Home   💬 Chat                           │
   │ 📋 Items  📊 Reports    (Desktop Icons)     │
   │                                              │
   │   ┌── Home ──────────────┐                   │
   │   │ 🏠 Home Card         │                   │
   │   │                      │                   │
   │   │ [Card content here]  │                   │
   │   │                      │                   │
   │   └──────────────────────┘                   │
   │                                              │
   └──────────────────────────────────────────────┘
   ```

2. **Add prose before each step** explaining what it does:
   - Step 1 (theme import): "The engine ships CSS as modular packs. This single import loads all base tokens, shell chrome, widget styles, and animations. Without it, your desktop will render unstyled HTML."
   - Step 2 (store): "The engine pre-wires Redux slices for windowing, navigation, notifications, and diagnostics. You pass in your domain reducers and get back a configured store."
   - Step 3 (DesktopShell): "This is the main entry point. It renders a menu bar, icon layer, and window layer. It auto-opens a home card window on mount."
   - etc.

3. **Add a "Minimal vs. Full" progression** showing:
   - The absolute minimum (todo app = 3 lines in App.tsx)
   - A typical setup (inventory app = contributions + renderAppWindow)
   - Contrast with pseudocode:
     ```
     Minimal:    <DesktopShell stack={STACK} />
     With chat:  <DesktopShell stack={STACK} contributions={[chatContrib]} renderAppWindow={...} />
     Full:       <DesktopShell stack={STACK} contributions={[...]} renderAppWindow={...} onCommand={...} />
     ```

4. **Add a "What Just Happened?" section** after the quickstart, explaining the automatic behaviors:
   - Home card window was auto-opened
   - Default menus were generated from stack cards
   - Default icons were generated from stack cards
   - Window dragging/resizing works out of the box

5. **Add a "Next Steps" section** with links to other docs:
   - "Want custom menus and icons? → Contribution API Reference"
   - "Need non-card windows (chat, debug)? → Window Content Adapter Guide"
   - "Want to customize the look? → Theming and Parts Contract"

6. **Show the import map** — new developers struggle with subpath imports:
   ```
   @hypercard/engine               → DSL types, widgets, store utilities
   @hypercard/engine/desktop-react → DesktopShell, contributions, adapters
   @hypercard/engine/desktop-core  → Redux actions (openWindow, etc.), state types
   @hypercard/engine/theme         → Base CSS packs
   ```

### B. Desktop Contribution API Reference (`03-desktop-contribution-api-reference.md`)

**Current state:** Complete interface listing with composition rules. The merge behavior section is good but could use a visual aid.

**Specific suggestions:**

1. **Open with a motivation paragraph:**
   "Contributions let you plug custom menus, icons, commands, and startup behavior into the desktop shell *without forking or subclassing DesktopShell*. Think of them as declarative extension bundles — you describe what you want, and the shell composes everything together."

2. **Add a "Contribution Anatomy" diagram:**
   ```
   DesktopContribution
   ├── menus[]        → merged by section id, items appended
   ├── icons[]        → unique by id (collision = throw or warn)
   ├── commands[]     → sorted by priority (desc), then declaration order
   ├── adapters[]     → concatenated in contribution order
   └── startupWindows[] → concatenated in contribution order
   ```

3. **Add a command routing flow diagram:**
   ```
   User clicks menu item / double-clicks icon
           │
           ▼
   ┌─ Contribution Handlers ─┐
   │  (sorted by priority)   │──▶ 'handled' → stop
   │  matches(commandId)?    │
   └─────────┬───────────────┘
             │ 'pass' or no match
             ▼
   ┌─ Built-in Router ───────┐
   │  window.open.home       │──▶ handled → stop
   │  window.close-focused   │
   │  window.tile / cascade  │
   │  window.open.card.*     │
   └─────────┬───────────────┘
             │ not matched
             ▼
   ┌─ onCommand prop ────────┐
   │  (app-level fallback)   │
   └─────────────────────────┘
   ```

4. **Add a "Building Your First Contribution" walkthrough** with progressive steps:
   - Step 1: Add a single menu item
   - Step 2: Wire a command handler for it
   - Step 3: Add a desktop icon that triggers the same command
   - Step 4: Add a startup window

5. **Add a "Common Patterns" section:**
   - "Open a new window from a menu item" (most common)
   - "Open a singleton window (dedupe)" 
   - "Add a dev-only debug menu"
   - "Override a built-in command"

6. **Explain `matches` + `run` semantics** with prose:
   "The `matches` function is called for every command. If it returns true, `run` is called. If `run` returns `'handled'`, routing stops. If it returns `'pass'`, the next handler gets a chance. This two-phase design lets you inspect commands without committing to handle them."

### C. Window Content Adapter Guide (`04-window-content-adapter-guide.md`)

**Current state:** Correctly documents the adapter chain but doesn't motivate *why* you'd need it.

**Specific suggestions:**

1. **Open with a "Why Adapters?" explanation:**
   "When the shell needs to render a window body, it doesn't know what's inside — it could be a HyperCard card, a React component, or something custom. Adapters are the routing layer that matches window content types to React renderers. Think of them as a middleware chain: each adapter gets a chance to claim the window, and the first one that can render it wins."

2. **Add a chain evaluation diagram:**
   ```
   Window { content: { kind: 'dialog', dialogKey: 'settings' } }
           │
           ▼
   ┌─ Contribution Adapters ──┐
   │  dialogAdapter           │──▶ canRender? YES → render() → ✓ done
   └──────────────────────────┘

   Window { content: { kind: 'app', appKey: 'chat:1' } }
           │
           ▼
   ┌─ Contribution Adapters ──┐
   │  dialogAdapter           │──▶ canRender? NO → skip
   └──────────┬───────────────┘
              ▼
   ┌─ App Adapter (default) ──┐
   │  kind === 'app'?         │──▶ YES → renderAppWindow(appKey) → ✓ done
   └──────────────────────────┘
   ```

3. **Add a "When Do You Need a Custom Adapter?" decision tree:**
   - Rendering card windows? → Built-in handles it, you don't need one.
   - Rendering app windows via `renderAppWindow`? → Built-in handles it.
   - Need a new content kind (dialog, preview, embed)? → Write an adapter.
   - Need to override how cards render? → Write an adapter with higher priority.

4. **Show the null-passthrough pattern** with explanation:
   "Returning null from `render()` means 'I thought I could handle this, but I can't — try the next adapter.' This is useful for feature-flagged or conditional rendering."

5. **Show a complete "custom dialog adapter" end-to-end** — from adapter definition through contribution wiring to opening a dialog window with `dispatch(openWindow(...))`.

### D. Theming and Parts Contract (`05-theming-and-parts-contract.md`)

**Current state:** Lists CSS packs and part names. Missing any visual demonstration of what theming *looks like* or how the scope root works.

**Specific suggestions:**

1. **Open with a motivation paragraph:**
   "The desktop shell uses CSS custom properties (variables) for all visual decisions — colors, fonts, spacing, shadows, radii. This means you can retheme the entire shell by overriding a handful of variables, without touching component code. The `data-part` attributes give you stable CSS hooks for targeting specific shell elements."

2. **Add a "Theme Layers" diagram:**
   ```
   ┌──────────────────────────────────────┐
   │  Your overrides (themeVars prop)     │  ← highest priority
   ├──────────────────────────────────────┤
   │  Theme layer (desktop-theme-macos1)  │  ← optional
   ├──────────────────────────────────────┤
   │  Base tokens (tokens.css)            │  ← always loaded
   └──────────────────────────────────────┘
   ```

3. **Add a "What Gets Loaded" breakdown** with descriptions:
   ```
   @hypercard/engine/theme
   ├── tokens.css      → color, font, spacing, shadow variables
   ├── shell.css       → menu bar, icon layer, window chrome
   ├── primitives.css  → buttons, chips, toasts, tables
   ├── chat.css        → chat timeline, composer, messages
   ├── syntax.css      → code highlighting
   └── animations.css  → transitions, cursor blink
   ```

4. **Add a "Quick Retheme" recipe** showing the 5 most impactful variables to override with before/after descriptions.

5. **Reorganize parts into a visual map** showing which parts correspond to which visible elements:
   ```
   ┌─ windowing-desktop-shell ─────────────────────────┐
   │ ┌─ windowing-menu-bar ──────────────────────────┐ │
   │ │  windowing-menu-button   windowing-menu-panel  │ │
   │ └───────────────────────────────────────────────┘ │
   │ ┌─ windowing-icon-layer ────────────────────────┐ │
   │ │  windowing-icon  windowing-icon-glyph          │ │
   │ │                  windowing-icon-label           │ │
   │ └───────────────────────────────────────────────┘ │
   │ ┌─ windowing-window-layer ──────────────────────┐ │
   │ │  ┌─ windowing-window ────────────────────┐    │ │
   │ │  │ windowing-window-title-bar             │    │ │
   │ │  │  windowing-close-button                │    │ │
   │ │  │  windowing-window-title                │    │ │
   │ │  │ windowing-window-body                  │    │ │
   │ │  │ windowing-resize-handle                │    │ │
   │ │  └────────────────────────────────────────┘    │ │
   │ └───────────────────────────────────────────────┘ │
   └───────────────────────────────────────────────────┘
   ```

6. **Add CSS selector cookbook:**
   - "Style all title bars" → `[data-part='windowing-window-title-bar'] { ... }`
   - "Style focused window only" → `[data-part='windowing-window'][data-focused] { ... }`
   - "Override button color globally" → `[data-widget='hypercard'] [data-part='btn'] { ... }`

### E. Performance Model (`06-performance-model-durable-vs-ephemeral-lanes.md`)

**Current state:** Good conceptual content but reads like internal architecture notes. The Mermaid diagram is good but lonely.

**Specific suggestions:**

1. **Open with a developer-facing problem statement:**
   "If you dispatch a Redux action on every pointer-move event during a window drag, you'll flood the store with ~60 actions/second per active interaction — causing unnecessary re-renders across the entire app. The desktop framework solves this by splitting state into two lanes: durable (Redux) for long-lived state, and ephemeral (external stores) for high-frequency transient data."

2. **Add a "Before/After" comparison** showing the problem:
   ```
   ❌ Naive approach:
   pointermove → dispatch(moveWindow) → Redux update → all selectors re-evaluate → re-render

   ✅ Dual-lane approach:
   pointermove → dragOverlayStore.update() → only dragged window re-renders
   pointerup   → dispatch(moveWindow)      → Redux commits final position
   ```

3. **Add a "The Decision Flowchart":**
   ```
   New piece of state?
   │
   ├── Needed after page refresh / time travel? ──▶ Redux (durable)
   ├── Updated more than ~10x/second?           ──▶ External store (ephemeral)
   ├── Only needed by one component for rendering? ──▶ External store (ephemeral)
   └── Part of business logic correctness?       ──▶ Redux (durable)
   ```

4. **Expand the interaction flow** to show the full lifecycle with annotations:
   ```
   pointerdown on title bar
   │
   ├─ useWindowInteractionController registers
   │  global pointermove + pointerup listeners
   │
   │  ┌─ EPHEMERAL LANE (every pointermove) ─────┐
   │  │  dragOverlayStore.update(windowId, bounds)│
   │  │  → useSyncExternalStore → re-render draft │
   │  └──────────────────────────────────────────┘
   │
   pointerup
   │
   ├─ DURABLE LANE (once) ───────────────────────┐
   │  dispatch(moveWindow({ id, x, y }))         │
   │  dragOverlayStore.clear(windowId)            │
   └──────────────────────────────────────────────┘
   ```

5. **Add a "Writing Your Own Ephemeral Store" recipe** — the `useSyncExternalStore` pattern is powerful but unfamiliar to many React developers. Show a minimal template:
   ```ts
   // 1. Create the store
   const myStore = createMyStore();
   
   // 2. Hook for React
   function useMyStoreSnapshot() {
     return useSyncExternalStore(
       myStore.subscribe,
       myStore.getSnapshot,
       myStore.getSnapshot  // SSR fallback (same for client-only)
     );
   }
   
   // 3. Update from event handlers (NOT from React render)
   onPointerMove = (e) => myStore.update(e.clientX, e.clientY);
   ```

6. **Add a "Diagnostics" subsection** that explains how to verify your feature isn't causing Redux pressure — using the existing diagnostics middleware.

---

## New Document Suggestions

### F. Add a "Desktop Framework Architecture Overview" Document

None of the five docs gives the big picture. A new developer needs a map before diving into any specific area.

**Proposed content:**

1. **Component tree diagram:**
   ```
   <Provider store={store}>
     <App>
       <DesktopShell stack={STACK} contributions={[...]} renderAppWindow={...}>
         ├── DesktopShellView
         │   ├── DesktopMenuBar        ← menus (from contributions or defaults)
         │   ├── DesktopIconLayer      ← icons (from contributions or defaults)
         │   ├── WindowLayer           ← windows (from Redux state)
         │   │   ├── WindowSurface     ← draggable/resizable window chrome
         │   │   │   ├── WindowTitleBar
         │   │   │   ├── WindowBody    ← content rendered by adapter chain
         │   │   │   └── WindowResizeHandle
         │   │   └── ...more windows
         │   └── Toast                 ← notifications
         └── (useDesktopShellController manages all interactions)
   ```

2. **Data flow diagram** showing Redux → selectors → components → dispatch → reducers cycle with ephemeral lane branching off.

3. **Import map** — which subpath gives you what.

4. **"How the shell boots" sequence:**
   - Store is created with `createAppStore`
   - `DesktopShell` renders → `useDesktopShellController` runs
   - Controller composes contributions
   - Home card window is auto-opened
   - Startup windows are opened
   - Default menus/icons are generated (if no contributions provide them)

### G. Add a "Common Recipes" Cookbook Document

Consolidate practical patterns that span multiple docs:

1. "Add a chat sidebar to your desktop app" (end-to-end)
2. "Add a dev-only debug panel" (conditional contribution)
3. "Open a singleton window from anywhere" (dedupe pattern)
4. "Navigate between cards inside a window" (session nav)
5. "Create a custom theme" (5-variable quick retheme)
6. "Write a Storybook story for your desktop app" (createStoryHelpers)

### H. Add a "Reading Order" Guide

A one-page "Start Here" document:

```
New to the project?
  1. README.md                        → Project overview and DSL concepts
  2. Desktop Framework Quickstart     → Get a shell running in 5 minutes
  3. Architecture Overview (new)      → Understand the component tree and data flow

Building a real app?
  4. Contribution API Reference       → Customize menus, icons, commands
  5. Window Content Adapter Guide     → Render custom window types
  6. Common Recipes (new)             → Copy-paste patterns

Going deeper?
  7. Theming and Parts Contract       → Restyle the shell
  8. Performance Model                → High-frequency interaction patterns
  9. JS API User Guide Reference      → Complete DSL and card runtime API
```

---

## Priority Ranking

| Priority | Suggestion | Effort | Impact |
|----------|-----------|--------|--------|
| 🔴 P0 | Add prose/context to all 5 existing docs | Medium | High — makes docs actually readable |
| 🔴 P0 | Add diagrams (component tree, command routing, adapter chain) | Medium | High — visual understanding |
| 🟡 P1 | Restructure docs with progressive disclosure (TL;DR → Getting Started → Deep Dive) | Medium | High — onboarding speed |
| 🟡 P1 | Add "Architecture Overview" document | Medium | High — gives the big picture |
| 🟡 P1 | Add reading order / "Start Here" guide | Low | Medium — reduces confusion |
| 🟢 P2 | Add cross-links between docs | Low | Medium — navigation |
| 🟢 P2 | Add "Common Recipes" cookbook | Medium | Medium — practical value |
| 🟢 P2 | Add import map to quickstart | Low | Medium — reduces import confusion |
| 🔵 P3 | Add gotchas/troubleshooting sections | Low | Low-Medium — prevents common mistakes |
| 🔵 P3 | Align README and docs/ with ticket docs | Medium | Low — consistency |

---

## Tone and Style Guidelines for the Rewrite

- **Write for a developer who just joined the project.** They know React and Redux but have never seen this codebase.
- **Lead with "what" and "why" before "how".** Don't show an interface without first explaining the problem it solves.
- **Use "you" language.** "When you add a contribution..." not "Contributions are added by..."
- **Every code block gets context.** At minimum, one sentence before and one sentence after.
- **Diagrams are first-class.** If something has order, hierarchy, or flow, draw it.
- **Keep the existing technical accuracy.** The interface signatures and behavior descriptions are correct — wrap them in better framing, don't replace them.
