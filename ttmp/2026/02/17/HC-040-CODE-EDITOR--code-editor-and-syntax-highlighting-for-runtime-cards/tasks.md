---
Title: Tasks
Ticket: HC-040-CODE-EDITOR
---

# Tasks

## Phase A: Syntax Highlighting

### A.1 Install highlight.js
- [x] A.1a `npm install highlight.js` in apps/inventory
- [x] A.1b Verify tree-shakeable import: `highlight.js/lib/core` + per-language

### A.2 Create SyntaxHighlight component
- [x] A.2a Create `apps/inventory/src/features/chat/utils/SyntaxHighlight.tsx`
- [x] A.2b Support `language: 'javascript' | 'yaml'`, `code: string`, `maxLines?: number`
- [x] A.2c Expand/collapse toggle when truncated
- [x] A.2d Use `dangerouslySetInnerHTML` with hljs output
- [x] A.2e Support `variant: 'light' | 'dark'` for different backgrounds

### A.3 Add syntax highlight theme CSS
- [x] A.3a Add minimal light token color rules to `packages/engine/src/theme/base.css`
- [x] A.3b Add dark variant token colors (GitHub Dark style)
- [x] A.3c Scope under `[data-part="syntax-highlight"]` to avoid conflicts

### A.4 Wire into RuntimeCardDebugWindow
- [x] A.4a Replace `CodePreview` component with `SyntaxHighlight language="javascript"`

### A.5 Wire into timeline/artifact/event viewer (YAML)
- [x] A.5a InventoryTimelineWidget.tsx — metadata rawData `<pre>` → SyntaxHighlight
- [x] A.5b InventoryTimelineWidget.tsx — tool call rawData `<pre>` → SyntaxHighlight
- [x] A.5c InventoryArtifactPanelWidgets.tsx — rawData `<pre>` → SyntaxHighlight
- [x] A.5d EventViewerWindow.tsx — payload `<pre>` → SyntaxHighlight (dark variant)

### A.6 Verify
- [x] A.6a TypeScript clean
- [x] A.6b All tests pass (153/153)
- [ ] A.6c Visual check in browser

## Phase B: Code Editor Window (future — NOT implementing now)
- [ ] B.1 Install CodeMirror 6
- [ ] B.2 Create CodeEditorWindow component
- [ ] B.3 Wire save → registerRuntimeCard → live injection
- [ ] B.4 Error display from QuickJS eval failures
- [ ] B.5 "Edit" button in RuntimeCardDebugWindow
