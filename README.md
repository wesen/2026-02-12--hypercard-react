# HyperCard React — Modular CRUD/Card Engine

A DSL-driven card-based application framework built with React 19, RTK Toolkit, Storybook 10, Vite, and a tokenized CSS theming system.

## Architecture

```
packages/engine/   — @hypercard/engine (generic, zero domain knowledge)
  src/
    components/widgets/  — 12 generic CRUD widgets (DataTable, ListView, FormView, etc.)
    components/shell/    — Window chrome, layouts, card renderer, HyperCardShell
    dsl/                 — DSL type system (Stack, CardDefinition, DSLAction)
    features/            — RTK slices (navigation, notifications)
    theme/               — CSS custom properties (base.css, classic.css, modern.css)
    types.ts             — Widget prop types (ColumnConfig, FieldConfig, etc.)
    parts.ts             — data-part registry

apps/inventory/    — Domain-specific inventory management app
  src/
    domain/              — Types, STACK DSL, formatters, column configs
    features/            — RTK slices (inventory, sales, chat)
    overrides/           — Card type renderers (wire widgets to domain data)
    app/                 — Store, action handler, App component
```

## Quick Start

```bash
npm install
npm run dev          # Vite dev server (apps/inventory)
npm run storybook    # Storybook (all widgets)
npm run build        # Production build
```

## Extension Points

- **`customRenderers`** — Supply card-type renderers to override how cards display
- **`DomainActionHandler`** — Handle domain-specific DSL actions (e.g., `updateQty`, `createItem`)
- **`Stack<TData, TSettings>`** — Define your own data schema and card definitions
- **CSS Custom Properties** — Override any `--hc-*` token under `[data-widget="hypercard"]`

## Theming

```css
/* Your custom theme */
[data-widget="hypercard"].theme-ocean {
  --hc-color-bg: #0a1628;
  --hc-color-fg: #e0e8f0;
  --hc-color-accent: #00bcd4;
  --hc-btn-primary-bg: #00bcd4;
}
```

## Widgets

| Widget | Purpose |
|--------|---------|
| `Btn` | Action button with variants |
| `Chip` | Clickable tag/suggestion |
| `Toast` | Auto-dismiss notification |
| `FieldRow` | Label + input pair |
| `FilterBar` | Filter controls row |
| `DataTable` | Generic data grid |
| `MenuGrid` | Card-style menu |
| `ListView` | Filterable table with footer |
| `DetailView` | Record detail with computed fields |
| `FormView` | Input form with submit |
| `ReportView` | Key-value report sections |
| `ChatView` | Chat timeline with suggestions |

## License

MIT
