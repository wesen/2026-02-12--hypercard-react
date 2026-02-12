# Building DSL-Driven HyperCard Interfaces

A developer guide for our retro-styled, JSON-defined inventory UI system.

---

## Overview

This system renders a complete application from a single JSON object (the "Stack"). Instead of writing React components for every screen, you define **cards** declaratively and a generic engine renders them. The result looks and feels like a classic HyperCard stack from the late-80s Mac era, but with modern capabilities: live data binding, AI chat, and mutable state.

The architecture has three layers:

1. **The DSL** — a JSON object (`STACK`) that defines all cards, data, AI behavior, and settings
2. **The Engine** — generic renderers for each card type (`MenuCard`, `ListCard`, `DetailCard`, etc.)
3. **The Shell** — layout wrappers that arrange the card renderer and AI panel (split pane, drawer, or full-card)

A new developer should almost never need to touch layers 2 or 3. Adding features means editing the JSON.

---

## The Stack Object

```
STACK
├── name, icon, homeCard          — identity
├── settings                      — global config (thresholds, AI model name)
├── data                          — mutable tables (items, salesLog, etc.)
├── cards                         — card definitions keyed by ID
│   ├── home        (menu)
│   ├── browse      (list)
│   ├── itemDetail  (detail)
│   ├── newItem     (form)
│   ├── assistant   (chat)
│   ├── report      (report)
│   └── ...
└── ai
    ├── intents[]                 — pattern-matched AI responses
    └── fallback                  — default when nothing matches
```

### Settings

```json
{
  "settings": {
    "aiModel": "Local LLM",
    "lowStockThreshold": 3
  }
}
```

Settings are referenced elsewhere in the DSL with the `$settings.` prefix. For example, a data filter can use `"value": "$settings.lowStockThreshold"` and the engine resolves it at runtime.

### Data Tables

```json
{
  "data": {
    "items": [
      { "sku": "A-1002", "qty": 2, "price": 9.99, "cost": 3.25, "name": "Keychain - Brass", "category": "Accessories", "tags": ["gift"] }
    ],
    "salesLog": [
      { "id": "s1", "date": "2026-02-10", "sku": "A-1002", "qty": 2, "total": 19.98 }
    ]
  }
}
```

Data lives in the React state as a deep clone of `STACK.data`. All mutations (sell, receive, create, delete) go through the `dispatch` function, which updates state immutably. Cards reference data by table name via `dataSource`.

---

## Card Types

### Menu Card

A home screen or hub. Shows labels and a grid of navigation buttons.

```json
{
  "type": "menu",
  "title": "Home",
  "icon": "🏠",
  "fields": [
    { "id": "welcome", "type": "label", "value": "Welcome to Shop Inventory" },
    { "id": "sub",     "type": "label", "value": "Subtitle text", "style": "muted" }
  ],
  "buttons": [
    { "label": "📋 Browse Items", "action": { "type": "navigate", "card": "browse" } },
    { "label": "💬 Ask AI",       "action": { "type": "navigate", "card": "assistant" } }
  ]
}
```

Buttons are rendered in a 2-column grid. Each button fires an action through `dispatch`.

### List Card

A data table with optional filters, row actions, toolbar, and footer aggregations.

```json
{
  "type": "list",
  "title": "Browse Inventory",
  "icon": "📋",
  "dataSource": "items",
  "columns": ["sku", "qty", "price", "name", "category"],
  "filters": [
    { "field": "category", "type": "select", "options": ["All", "Accessories", "Kitchen", "Home"] },
    { "field": "_search",  "type": "text",   "placeholder": "Search…" }
  ],
  "dataFilter": { "field": "qty", "op": "<=", "value": "$settings.lowStockThreshold" },
  "rowAction": { "type": "navigate", "card": "itemDetail", "param": "sku" },
  "toolbar": [
    { "label": "➕ New", "action": { "type": "navigate", "card": "newItem" } }
  ],
  "footer": { "type": "sum", "field": "total", "label": "Total Revenue" },
  "emptyMessage": "All stocked up! 🎉"
}
```

Key fields:

- `dataSource` — which table in `data` to read from
- `dataFilter` — a pre-filter applied before user filters (for cards like "Low Stock")
- `columns` — ordered list of field keys to display as columns
- `filters` — interactive filter controls rendered above the table; `_search` is a magic key that fuzzy-matches name and SKU
- `rowAction` — action dispatched when a row is clicked; `param` names the field to pass as `paramValue`
- `footer` — aggregation displayed below the table; currently supports `sum`
- `emptyMessage` — shown when the filtered result set is empty

Filter operators: `<=`, `>=`, `==`, `!=`, `<`, `>`, `contains`, `iequals`.

### Detail Card

A single-record view for editing, with computed fields and action buttons.

```json
{
  "type": "detail",
  "title": "Item: {{name}}",
  "icon": "📦",
  "dataSource": "items",
  "keyField": "sku",
  "fields": [
    { "id": "sku",      "label": "SKU",      "type": "readonly" },
    { "id": "name",     "label": "Name",     "type": "text" },
    { "id": "category", "label": "Category", "type": "select", "options": ["Accessories", "Kitchen"] },
    { "id": "price",    "label": "Price ($)", "type": "number", "step": 0.01 },
    { "id": "qty",      "label": "Quantity",  "type": "number", "highlight": "lowStock" },
    { "id": "tags",     "label": "Tags",      "type": "tags" }
  ],
  "computed": [
    { "id": "margin", "label": "Margin", "expr": "((price - cost) / price * 100).toFixed(1) + '%'" }
  ],
  "buttons": [
    { "label": "🛒 Sell 1",       "action": { "type": "updateQty", "delta": -1 }, "style": "primary" },
    { "label": "📦 Receive +5",   "action": { "type": "updateQty", "delta": 5 } },
    { "label": "✏️ Save Changes", "action": { "type": "saveItem" }, "style": "primary" },
    { "label": "🗑 Delete",       "action": { "type": "deleteItem" }, "style": "danger" }
  ]
}
```

Key fields:

- `keyField` — the field used to look up the record; matched against `paramValue` from navigation
- `title` — supports `{{fieldName}}` interpolation from the current record
- `fields[].type` — `readonly`, `text`, `number`, `select`, `tags`
- `fields[].highlight` — `"lowStock"` triggers warning color when value is at or below threshold
- `computed` — expressions evaluated with `price`, `cost`, `qty` in scope via `new Function()`
- `buttons[].action` — dispatched with `sku` and `edits` auto-injected by the renderer
- `buttons[].style` — `"primary"` (inverted black) or `"danger"` (red border)

### Form Card

A blank form for creating or updating records.

```json
{
  "type": "form",
  "title": "New Item",
  "icon": "➕",
  "fields": [
    { "id": "sku",  "label": "SKU",  "type": "text",   "placeholder": "e.g. E-5001", "required": true },
    { "id": "name", "label": "Name", "type": "text",   "placeholder": "Item name",   "required": true },
    { "id": "qty",  "label": "Qty",  "type": "number", "default": 0 }
  ],
  "submitAction": { "type": "createItem" },
  "submitLabel": "💾 Create Item"
}
```

On submit, the engine dispatches `submitAction` with `values` attached (a dict of `id → value`). Required fields block submission if empty. After success, the form resets.

Special case: if `submitAction.type` is `"priceCheck"`, the form does an inline lookup and shows the result without dispatching.

### Report Card

A computed read-only summary with named compute functions.

```json
{
  "type": "report",
  "title": "Inventory Report",
  "icon": "📊",
  "sections": [
    { "label": "Total SKUs",      "compute": "totalSkus" },
    { "label": "Retail Value",     "compute": "retailValue" },
    { "label": "Out of Stock",    "compute": "outOfStockCount" },
    { "label": "Best Margin",     "compute": "bestMargin" }
  ]
}
```

Each section's `compute` key maps to a function inside the `ReportCard` renderer. To add a new stat, add the key to the `computeMap` object in the renderer and reference it here.

### Chat Card

AI conversation with suggestion chips, inline data tables, and action buttons.

```json
{
  "type": "chat",
  "title": "AI Assistant",
  "icon": "💬",
  "welcome": "Hello! What do you need?",
  "suggestions": ["What's low stock?", "Best selling item?", "Show accessories"]
}
```

Suggestions render as clickable chips on the first message. The chat engine processes input against `STACK.ai.intents` (see AI section below). Results can include inline data tables that are themselves clickable to navigate to detail cards.

---

## AI Intent System

The AI is not a language model — it is a pattern-matched intent router. Each intent has keyword triggers, a response template, an optional data query, and action chips.

### Intent Structure

```json
{
  "patterns": ["low stock", "reorder", "running low"],
  "response": "Items at or below qty ≤ {{threshold}}:",
  "query": {
    "source": "items",
    "filter": { "field": "qty", "op": "<=", "value": "$settings.lowStockThreshold" }
  },
  "actions": [
    { "label": "📋 Open Low Stock", "action": { "type": "navigate", "card": "lowStock" } }
  ]
}
```

- `patterns` — if any pattern is found (substring match) in the user's input, this intent fires; first match wins, so order matters
- `response` — template string; `{{threshold}}` and `{{matchCap}}` are interpolated
- `query.source` — data table to query
- `query.filter` — same filter syntax as `dataFilter` on list cards
- `query.limit` — cap the number of results
- `query.aggregate` — special aggregation; currently `"topBySku"` for sales ranking
- `actions` — chips rendered below the response; `"aiSend"` action type re-sends text to the chat engine

### Computed Intents

For complex logic that can't be expressed as a filter, use `compute` instead of `query`:

```json
{
  "patterns": ["total value", "inventory value"],
  "compute": "inventoryValue",
  "actions": [
    { "label": "📊 Full report", "action": { "type": "navigate", "card": "report" } }
  ]
}
```

Compute handlers are defined inside the `ChatCard`'s `processInput` function. Current handlers: `inventoryValue`, `marginReport`, `bestSellers`, `createCard`, `catalogCount`, `priceExtreme`.

### Fallback

When no intent matches:

```json
{
  "fallback": {
    "response": "I'm not sure about that. Here are some things I can help with:",
    "actions": [
      { "label": "⚠️ Low stock", "action": { "type": "aiSend", "text": "low stock" } }
    ]
  }
}
```

The `aiSend` action type feeds text back into the chat engine, so clicking a fallback chip triggers a real intent.

---

## Action System

All interactivity flows through a single `dispatch(action)` function. Actions are plain objects with a `type` field.

| Action Type | Payload | Effect |
|---|---|---|
| `navigate` | `card`, `paramValue` | Push a new card onto the nav stack |
| `back` | — | Pop the nav stack |
| `toast` | `message` | Show a temporary notification |
| `updateQty` | `sku`, `delta` | Adjust an item's quantity (clamped to 0) |
| `saveItem` | `sku`, `edits` | Merge edited fields into the item record |
| `deleteItem` | `sku` | Remove item and navigate back |
| `createItem` | `values` | Append a new item to the items table |
| `receiveStock` | `values.sku`, `values.qty` | Add quantity to an existing item |
| `priceCheck` | `values.sku` | Inline lookup (handled in FormCard, not dispatch) |
| `aiSend` | `text` | Feed text into the AI chat (handled in ChatCard) |

Navigation uses a simple stack. `paramValue` passes context to detail cards (e.g., which SKU to display).

---

## Layout System

Three layout shells wrap the card renderer and AI panel. The user switches between them via tabs. All three share the same nav stack and data state.

**Split Pane** — card on the left, persistent AI chat panel on the right (270px fixed). Best for power users who want AI always visible.

**Bottom Drawer** — card fills the main area, AI lives in a collapsible drawer at the bottom (200px max). The drawer toggles open/closed on header click. Best for keeping the HyperCard feel primary.

**Card as Chat** — no separate AI panel. The AI assistant is just another card you navigate to. Purest HyperCard experience; you "go to" the assistant card like any other.

Each layout receives: `cardId`, `cardDef`, `data`, `dispatch`, `renderCard` (a function that maps card type to renderer), and `navLen` (for showing/hiding the back button).

---

## Visual Design System

### The HyperCard Aesthetic

The entire UI targets a **Mac System 7 / HyperCard** look: monospaced fonts, hard pixel borders, no border-radius, 1px box shadows, black-and-white with functional color accents.

### Typography

```js
fontFamily: '"Geneva", "Chicago", "Monaco", monospace'
```

Geneva and Chicago are the classic Mac system fonts. On modern systems they fall back to Monaco or the platform monospace. All text uses this single stack. Size hierarchy:

- Card titles: 14px bold
- Body / table cells: 11–12px
- Labels and metadata: 10px, muted color
- The title bar: 13px bold, centered

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `bg` | `#fff` | Card backgrounds, buttons |
| `alt` | `#f5f4ed` | Footer bars, alternating regions |
| `ai` | `#f0efe8` | AI panel background (warm off-white) |
| `bdr` | `#000` | All borders, shadows |
| `mut` | `#777` | Muted labels, metadata |
| `err` | `#a00` | Out-of-stock qty, danger buttons |
| `wrn` | `#960` | Low-stock qty warning |
| `ok` | `#060` | AI message labels, success accents |
| `lnk` | `#006` | User message labels |

Color is used sparingly and only for functional meaning. There are no decorative gradients, rounded corners, or colored backgrounds.

### Borders and Shadows

Every interactive surface has the same treatment:

```
border: 2px solid #000
border-radius: 0
box-shadow: 1px 1px 0 #000    (buttons)
box-shadow: 2px 2px 0 #000    (the main window)
```

This creates the pixel-art depth effect of classic Mac OS. Interior dividers use `1px solid #ccc`.

### Buttons

Three visual variants, all sharing the same base:

```
Base:    white bg, 2px black border, 1px shadow, 11px mono text
Primary: black bg, white text (inverted)
Danger:  white bg, red border and text
Active:  same as primary (used for nav bar current-card indicator)
```

Action chips (in AI responses) are always inverted: black bg, white text, no border, 10px, tight padding.

### Table Rows

Alternating `#fff` / `#eee` backgrounds. Quantity cells are color-coded: bold red at 0, bold amber at or below threshold, normal black otherwise. Currency values are right-formatted with `$`. Rows are clickable when a `rowAction` is defined (cursor changes to pointer).

### The Window Chrome

The outermost container mimics a System 7 window: a title bar with a close box (empty square, top-left), centered bold title, and a 2px border with 2px drop shadow. Below that, layout tabs styled as classic folder tabs with the active tab's bottom border removed to merge with the content area.

---

## Adding New Features

### Adding a new card

1. Add an entry to `STACK.cards` with a unique key
2. Pick the appropriate `type` and fill in the schema for that type
3. Add a button somewhere that navigates to it (home menu, toolbar, etc.)

Example — a "Promotions" list card:

```json
"promotions": {
  "type": "list",
  "title": "Active Promotions",
  "icon": "🏷",
  "dataSource": "promotions",
  "columns": ["id", "name", "discount", "expires"],
  "emptyMessage": "No active promotions"
}
```

Then add a `promotions` array to `STACK.data` and a nav button.

### Adding a new AI intent

Add to `STACK.ai.intents`:

```json
{
  "patterns": ["promotion", "discount", "sale price"],
  "response": "Current promotions:",
  "query": { "source": "promotions" },
  "actions": [
    { "label": "🏷 View all", "action": { "type": "navigate", "card": "promotions" } }
  ]
}
```

For complex logic, use `compute` and add a handler in `ChatCard.processInput`.

### Adding a new action type

1. Add a `case` to the `dispatch` switch in `HyperCardEngine`
2. Reference it from card button actions or AI intent actions

### Adding a new data table

1. Add the array to `STACK.data`
2. Reference it as `dataSource` in list cards or `query.source` in AI intents

### Adding a new computed report stat

1. Add a function to the `computeMap` inside `ReportCard`
2. Reference its key in a report card section's `compute` field

---

## File Structure

Everything lives in a single `.jsx` file, organized top-to-bottom:

```
1.  STACK definition (the DSL — this is what you edit)
2.  Theme constants and base styles
3.  Shared components (Btn, Chip, DataTable, Toast)
4.  Card renderers (MenuCard, ListCard, DetailCard, FormCard, ReportCard, ChatCard)
5.  Layout shells (NavBar, LayoutSplit, LayoutDrawer, LayoutCardChat)
6.  Main app (HyperCardEngine — state, dispatch, routing)
```

For a production system, consider splitting these into separate modules. But for prototyping speed, the single-file approach means the DSL and engine are always visible together.

---

## Conventions and Pitfalls

**All styling is inline.** There are no CSS files or class names. This is intentional for portability and to keep the retro aesthetic contained. The trade-off is verbosity; extract repeated style objects into constants (the `B` and `T` objects).

**No external dependencies.** The entire system uses only React and standard browser APIs. No UI libraries, no state management, no CSS frameworks.

**Data is local and ephemeral.** State resets on reload. For persistence, serialize `data` to localStorage or connect to an API. The `dispatch` function is the single point where all mutations happen, making it straightforward to add persistence.

**The AI is keyword-matching, not generative.** It is fast and predictable. If you need real LLM integration, replace `processInput` with an API call and keep the same response shape (`{ text, results, actions, isCardCreated }`).

**Navigation is a stack, not a router.** There are no URLs. The back button pops the stack. Deep linking would require serializing the nav stack to a query parameter or hash.

**`$` prefixes in filter values are resolved at runtime.** `$settings.X` reads from stack settings. `$input` is the raw chat input. `$match` is the matched pattern keyword. These are the only three interpolation scopes.

**Emoji as icons.** The system uses emoji throughout instead of an icon library. This keeps the dependency count at zero and fits the retro-playful tone. If you need custom icons, replace the emoji strings with SVG components.
