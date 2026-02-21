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

## Session 2 — Phase B: CodeMirror switch + Editor

### B.1 — Package swap

Installed: `codemirror`, `@codemirror/lang-javascript`, `@codemirror/lang-yaml`, `@codemirror/theme-one-dark`, `@codemirror/language`, `@codemirror/state`, `@codemirror/view`. Removed `highlight.js`.

### B.2 — Replace SyntaxHighlight internals

Replaced `hljs.highlight()` with a custom `cmHighlight()` function using `@lezer/highlight`:
- `highlightCode(code, tree, classHighlighter, putText, putBreak)` — lezer's 5-arg API
- Uses `javascriptLanguage.parser` and `yamlLanguage.parser` from CM lang packages
- Generates `<span class="tok-*">` tags instead of `<span class="hljs-*">`
- Updated CSS: 15 light rules + 15 dark rules using `tok-keyword`, `tok-string`, `tok-propertyName`, `tok-punctuation`, etc.

Key discovery: lezer's `highlightCode` takes 5 args (code, tree, highlighter, putText, putBreak) — not the 4-arg form shown in some docs. The `putBreak` callback handles newlines separately.

### B.3 — CodeEditorWindow

Full CodeMirror 6 editor in `CodeEditorWindow.tsx`:
- Extensions: lineNumbers, history, drawSelection, indentOnInput, bracketMatching, foldGutter, highlightActiveLine, javascript(), syntaxHighlighting(classHighlighter), oneDark
- Ctrl+S: dispatches custom DOM event `editor-save` → bridge to React callback via ref
- Save: calls `registerRuntimeCard(cardId, code)` → live injection into all plugin sessions
- Revert: replaces editor doc with `initialCode`
- Status bar: green ✓ on save, red ✗ on error, grey hint when idle
- Header shows cardId, "registered" badge, "● modified" dirty indicator

`editorLaunch.ts` solves the "passing rich data through appKey string" problem:
- `openCodeEditor(dispatch, cardId, code)` stashes code in a `Map` then dispatches `openWindow`
- `getEditorInitialCode(cardId)` reads stashed code (consuming it) or falls back to registry lookup

### B.4 — Edit from RuntimeCardDebugWindow

Added ✏️ Edit button on each registered card entry. Clicking calls `openCodeEditor(dispatch, card.cardId, card.code)`. Button is right-aligned via `marginLeft: auto`.

### B.5 — Edit from card timeline widget

Added `onEditCard` callback prop through `ArtifactPanel` → `InventoryCardPanelWidget` → `InventoryChatWindow`. Only shown on card items with `status === 'success'`. Looks up artifact record for `runtimeCardId` + `runtimeCardCode`, then calls `openCodeEditor`.

### B.6 — Storybook stories

**SyntaxHighlight.stories.tsx** (6 stories):
- JavaScriptLight, JavaScriptDark — full card factory code
- YamlLight, YamlDark — YAML card payload
- TruncatedWithExpand — maxLines=5 with expand toggle
- ShortCodeNoTruncation — short code under maxLines threshold

**CodeEditorWindow.stories.tsx** (4 stories):
- Empty — minimal boilerplate code
- PrefilledCode — full inventory browser card
- AlreadyRegistered — pre-registers card, shows "registered" badge
- WithSaveCallback — logs save to console
