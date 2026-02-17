---
Title: "HC-040 Implementation Diary"
Ticket: HC-040-CODE-EDITOR
DocumentType: reference
---

# HC-040 Implementation Diary

## Session 1 — 2026-02-16

### Analysis phase

- Surveyed all 5 code/data rendering surfaces in the app
- Evaluated highlight.js vs Shiki vs Prism vs CodeMirror standalone highlighter
- Chose highlight.js for Phase A (syntax highlighting): ~36KB gzipped, synchronous, trivial API
- Chose CodeMirror 6 for future Phase B (editor): modular, excellent JS/YAML support
- Created detailed design doc with integration points, theming strategy, and editor mockup
- Created ticket with docmgr, related 6 key files

### Implementation

**A.1 — highlight.js installed** in `apps/inventory`. Tree-shakeable: importing `highlight.js/lib/core` + individual language modules for JS and YAML.

**A.2 — SyntaxHighlight component** (`apps/inventory/src/features/chat/utils/SyntaxHighlight.tsx`):
- `hljs.highlight(code, { language })` → HTML string via `dangerouslySetInnerHTML`
- `maxLines` prop with expand/collapse toggle
- `variant: 'light' | 'dark'` — light uses `#f6f8fa` bg, dark uses `#0d0d1a` bg
- Wrapped in `[data-part="syntax-highlight"][data-variant="..."]` for CSS scoping

**A.3 — Theme CSS** added to `packages/engine/src/theme/base.css`:
- 14 light-mode token rules (GitHub Light style): keyword red, string blue, number blue, attr green, built_in/title purple, etc.
- 14 dark-mode token rules (GitHub Dark style): keyword coral, string light blue, attr green, etc.
- All scoped under `[data-part="syntax-highlight"]` to avoid conflicts

**A.4 — RuntimeCardDebugWindow**: `CodePreview` now delegates to `SyntaxHighlight language="javascript"` with `maxLines={8}`. Removed the old inline `<pre>` rendering.

**A.5 — All YAML surfaces updated**:
- `InventoryTimelineWidget.tsx` — both metadata rawData (line ~109) and tool call rawData (line ~264) → `<SyntaxHighlight language="yaml">`
- `InventoryArtifactPanelWidgets.tsx` — rawData → `<SyntaxHighlight language="yaml">`
- `EventViewerWindow.tsx` — payload → `<SyntaxHighlight language="yaml" variant="dark">` (preserves existing dark theme)

**A.6 — Verification**: TypeScript clean, 153/153 tests pass
