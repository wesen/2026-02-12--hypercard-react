---
Title: "Code Editor and Syntax Highlighting: Analysis and Implementation Plan"
Ticket: HC-040-CODE-EDITOR
DocumentType: design-doc
Topics:
  - frontend
  - code-editor
  - developer-experience
RelatedFiles:
  - "apps/inventory/src/features/chat/RuntimeCardDebugWindow.tsx:Debug window with CodePreview — primary target for JS syntax highlighting"
  - "apps/inventory/src/features/chat/InventoryTimelineWidget.tsx:Timeline widget with YAML rawData display"
  - "apps/inventory/src/features/chat/InventoryArtifactPanelWidgets.tsx:Artifact panel with YAML rawData display"
  - "apps/inventory/src/features/chat/EventViewerWindow.tsx:Event viewer with YAML payload display"
  - "apps/inventory/src/features/chat/utils/yamlFormat.ts:Custom toYaml formatter (dependency-free)"
  - "packages/engine/src/plugin-runtime/runtimeCardRegistry.ts:Runtime card registry — source of card code for editor"
  - "packages/engine/src/components/shell/windowing/PluginCardSessionHost.tsx:Session host — where defineCard/defineCardRender happen"
  - "packages/engine/src/plugin-runtime/runtimeService.ts:RuntimeService.defineCard/defineCardRender/defineCardHandler"
  - "packages/engine/src/theme/base.css:Theme CSS — code block styling would go here"
---

# Code Editor and Syntax Highlighting: Analysis and Implementation Plan

## 1. Current State

### 1.1 Code Display Surfaces

There are **5 surfaces** in the app that render code or structured data as text:

| Surface | File | Language | Current Rendering |
|---------|------|----------|-------------------|
| Runtime Card Debug Window — CodePreview | `RuntimeCardDebugWindow.tsx` | JavaScript | `<pre>` with flat monospace, light grey bg |
| Timeline Widget — rawData | `InventoryTimelineWidget.tsx` | YAML (via `toYaml`) | `<pre>` with `color: #666`, no highlighting |
| Artifact Panel — rawData | `InventoryArtifactPanelWidgets.tsx` | YAML (via `toYaml`) | Same as timeline |
| Event Viewer — payload | `EventViewerWindow.tsx` | YAML (via `toYaml`) | Same pattern |
| Chat messages — tool call collapse | `InventoryTimelineWidget.tsx` | YAML (via `toYaml`) | Collapsed toggle, same rendering |

### 1.2 Dependencies

The project has **zero syntax highlighting or editor dependencies**:
- No CodeMirror, Monaco, PrismJS, Shiki, or highlight.js
- React 19, Vite 6, TypeScript 5.7
- The only code execution engine is QuickJS (via `quickjs-emscripten`)

### 1.3 YAML Formatting

`utils/yamlFormat.ts` is a custom dependency-free YAML formatter (88 lines). It converts JS objects to YAML-like display strings. It's used in 4 surfaces. Output is plain text strings fed to `<pre>` elements.

### 1.4 Runtime Card Code Lifecycle

```
LLM generates card.code (JS) inside <hypercard:card:v2> YAML block
  → Backend extractor parses YAML, extracts card.code string
  → SEM event arrives at frontend
  → extractArtifactUpsertFromSem stores runtimeCardCode on ArtifactRecord
  → registerRuntimeCard(cardId, code) stores in global registry
  → PluginCardSessionHost calls service.defineCard(sessionId, cardId, code)
  → QuickJS evaluates the code string
```

The code string is a JS expression (factory form with `({ ui }) => ({ ... })`).

## 2. Library Evaluation

### 2.1 Syntax Highlighting Only (read-only)

| Library | Bundle Size | Languages | SSR | Notes |
|---------|-------------|-----------|-----|-------|
| **Shiki** | ~2MB (with grammars) | TextMate grammars, excellent | Yes | WASM-based, async, used by Vite/Astro |
| **highlight.js** | ~40KB core + langs | Good coverage | Yes | Regex-based, synchronous, lightweight |
| **Prism** | ~6KB core + langs | Good coverage | Yes | Regex-based, legacy but works |
| **@lezer/highlight + @codemirror/language** | ~20KB | Same as CM | Yes | CodeMirror's parser as standalone highlighter |

**Recommendation for highlighting-only**: `highlight.js` — smallest footprint, synchronous API (no async/WASM), trivial integration (`hljs.highlight(code, {language: 'javascript'}).value` → HTML string), tree-shakeable per-language imports.

### 2.2 Full Editor (future — popup code editor)

| Library | Bundle Size | Features | Notes |
|---------|-------------|----------|-------|
| **CodeMirror 6** | ~150KB | Modular, extensible, accessible | Best modern choice, modular architecture |
| **Monaco** | ~2MB+ | VS Code feature parity | Too heavy for this use case |
| **@uiw/react-codemirror** | CM6 wrapper | React bindings, themes | Convenient but adds layer |

**Recommendation for editor**: CodeMirror 6 directly — modular, only import what you need, great JS/YAML support, accessible, works well in popup windows.

### 2.3 Chosen Approach

**Phase A (this ticket, highlighting only)**: `highlight.js` with JS and YAML grammars.
- Import `highlight.js/lib/core` + `highlight.js/lib/languages/javascript` + `highlight.js/lib/languages/yaml`
- Create a `<SyntaxHighlight>` component that wraps `hljs.highlight()`
- Apply to all 5 code display surfaces

**Phase B (future ticket, editor)**: CodeMirror 6 with `@codemirror/lang-javascript` and `@codemirror/lang-yaml`.
- Create a `<CodeEditorWindow>` that opens as a new HyperCard window
- Wire save → `registerRuntimeCard()` + `service.defineCard()` for hot-reload
- Add error display from QuickJS eval failures

## 3. Integration Points

### 3.1 Highlight Component Design

```tsx
// Shared component for read-only syntax-highlighted code blocks
interface SyntaxHighlightProps {
  code: string;
  language: 'javascript' | 'yaml';
  maxLines?: number;      // truncation with expand toggle
  style?: React.CSSProperties;
}

function SyntaxHighlight({ code, language, maxLines, style }: SyntaxHighlightProps) {
  const html = useMemo(() => hljs.highlight(code, { language }).value, [code, language]);
  // ... truncation logic, expand/collapse, dangerouslySetInnerHTML
}
```

### 3.2 Where Each Surface Needs Changes

**RuntimeCardDebugWindow.tsx** — Replace `CodePreview` with `<SyntaxHighlight language="javascript">`.

**InventoryTimelineWidget.tsx** — Two `<pre>` blocks showing `toYaml(item.rawData)`:
- Line ~109 (metadata rawData) → `<SyntaxHighlight language="yaml">`
- Line ~264 (tool call rawData) → `<SyntaxHighlight language="yaml">`

**InventoryArtifactPanelWidgets.tsx** — One `<pre>` block at ~97 → `<SyntaxHighlight language="yaml">`.

**EventViewerWindow.tsx** — One `<pre>` at ~208 → `<SyntaxHighlight language="yaml">`.

### 3.3 Theming

highlight.js ships many themes. For a light-background app:
- Use `highlight.js/styles/github.css` or a subset
- Or inline the token colors via CSS variables in `base.css`
- Token classes: `.hljs-keyword`, `.hljs-string`, `.hljs-number`, `.hljs-attr`, `.hljs-literal`, `.hljs-comment`

Minimal theme (6 rules):
```css
[data-part="syntax-highlight"] .hljs-keyword { color: #cf222e; }
[data-part="syntax-highlight"] .hljs-string  { color: #0a3069; }
[data-part="syntax-highlight"] .hljs-number  { color: #0550ae; }
[data-part="syntax-highlight"] .hljs-attr    { color: #116329; }
[data-part="syntax-highlight"] .hljs-literal { color: #0550ae; }
[data-part="syntax-highlight"] .hljs-comment { color: #6e7781; font-style: italic; }
```

### 3.4 Future Editor Window (Phase B outline)

```
┌─ Code Editor: lowStockDrilldown ──────────────────────┐
│ ┌─────────────────────────────────────────────────────┐│
│ │ ({ ui }) => ({                                     ││
│ │   render({ globalState }) {                        ││
│ │     const items = ...                              ││
│ │     return ui.panel([                              ││
│ │       ui.text("Low Stock"),                        ││
│ │       ui.table(...)                                ││
│ │     ]);                                            ││
│ │   }                                                ││
│ │ })                                                 ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─ Status ────────────────────────────────────────────┐│
│ │ ✓ Last injected: 6:30 PM · lowStockDrilldown       ││
│ └─────────────────────────────────────────────────────┘│
│ [ 💾 Save & Inject ]  [ ↻ Revert ]  [ ✕ Close ]      │
└───────────────────────────────────────────────────────┘
```

Flow: Edit code → Save → `registerRuntimeCard(cardId, newCode)` → registry change listener in `PluginCardSessionHost` calls `defineCard()` → card re-renders live.

Needs:
- `CodeMirror 6` with `@codemirror/lang-javascript`
- A `<CodeEditorWindow>` React component registered as an app window
- Error boundary for eval failures (surface QuickJS errors)
- Optional: "Revert" to last known-good code

## 4. Risks and Considerations

1. **dangerouslySetInnerHTML**: Required for highlight.js HTML output. Safe because hljs only generates `<span class="hljs-*">` tags from the input code — no user-controlled HTML is passed through.

2. **Performance**: highlight.js is synchronous. For the code sizes we handle (typically < 2KB), this is fine. The YAML rawData blocks are small (< 500 bytes typically). The biggest code blocks are runtime cards at ~1-2KB.

3. **Bundle size impact**: `hljs/core` (~25KB) + JS grammar (~8KB) + YAML grammar (~3KB) ≈ 36KB gzipped. Acceptable.

4. **Theme consistency**: Using a minimal custom theme (6 CSS rules) rather than importing a full highlight.js theme keeps styling consistent with the HyperCard design system and avoids CSS conflicts.

## 5. Implementation Order

### Phase A: Syntax Highlighting (this ticket, implement now)
1. Install highlight.js
2. Create `<SyntaxHighlight>` component
3. Add minimal CSS theme to `base.css`
4. Replace `CodePreview` in `RuntimeCardDebugWindow`
5. Replace `<pre>` blocks in timeline/artifact/event viewer widgets
6. Tests and storybook stories

### Phase B: Code Editor Window (future ticket)
1. Install CodeMirror 6
2. Create `<CodeEditorWindow>` component
3. Wire save → registerRuntimeCard → live injection
4. Error display
5. "Edit" button in RuntimeCardDebugWindow
6. Tests and stories
