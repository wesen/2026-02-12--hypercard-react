---
Title: "Analysis: JS API User Guide Reference as Self-Contained Document"
Ticket: HC-015-PROMPTING-DOC
Status: active
Topics:
    - react
    - rtk-toolkit
    - vite
DocType: analysis
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/docs/js-api-user-guide-reference.md
      Note: The document under analysis
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/dsl/types.ts
      Note: Ground truth for DSL types (verified against doc claims)
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/types.ts
      Note: Ground truth for widget-level types (ColumnConfig, FieldConfig, etc.)
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/HyperCardShell.tsx
      Note: Ground truth for shell props and merging behavior
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/components/shell/CardRenderer.tsx
      Note: Ground truth for renderer contract
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/domain/stack.ts
      Note: Real-world stack example verified against doc examples
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/domain/stack.ts
      Note: Second real-world stack example
ExternalSources: []
Summary: "Deep analysis of docs/js-api-user-guide-reference.md as a self-contained user guide + reference, with accuracy verification against source, gap identification, and improvement recommendations."
LastUpdated: 2026-02-12T17:26:00-05:00
WhatFor: "Identify what's good, what's wrong, and what's missing in the JS API reference so it can be improved into a truly self-contained document."
WhenToUse: "Use when revising the JS API user guide reference, or when planning prompt specification updates that depend on it."
---

# Analysis: JS API User Guide Reference as Self-Contained Document

## 1. Methodology

1. Read `docs/js-api-user-guide-reference.md` end-to-end.
2. Verified every factual claim against the actual engine source files (types, components, slices, registries, dispatch logic).
3. Attempted to write a complete test stack (a "Book Tracker" app) using **only** the reference doc as my guide—no peeking at source. Tracked where I got stuck or had to guess.
4. Compared examples in the doc against real app code in `apps/inventory` and `apps/todo`.

## 2. Overall Assessment

**The document is good.** It covers the full API surface, organizes material in a logical progression (architecture → quickstart → DSL authoring → shell → widgets → patterns → troubleshooting), and includes real-world code examples. For an engineer already familiar with the codebase, it would serve as a solid refresher and reference.

**As a self-contained guide for someone starting from zero (or for an LLM working without source access), it has meaningful gaps.** The sections below detail what's accurate, what's inaccurate, and what's missing.

## 3. Accuracy Verification (Source-Checked)

### 3.1 Correct Claims ✅

| Section | Claim | Verified Against |
|---------|-------|-----------------|
| §2 Architecture | Engine has no built-in renderers | `CardRenderer.tsx` — confirmed fallback-only |
| §2 Architecture | Built-in actions: navigate, back, toast only | `dispatchDSLAction.ts` — confirmed |
| §5.1 Stack | `Stack` interface shape | `dsl/types.ts` — matches exactly |
| §5.2 DSL Actions | NavigateAction has `card`, optional `paramValue`, optional `param` | `dsl/types.ts` — confirmed |
| §5.3 Card Types | Exactly 6: menu, list, detail, form, chat, report | `dsl/types.ts` CardType union — confirmed |
| §5.4 DSLField | field types: label, readonly, text, number, select, tags | `dsl/types.ts` DSLFieldType — confirmed |
| §5.5 ListCardDef | All listed properties match | `dsl/types.ts` — confirmed |
| §6 resolver.ts | resolveValue, matchFilter, interpolateTemplate signatures | `dsl/resolver.ts` — confirmed |
| §7 HyperCardShellProps | All props listed match actual code | `HyperCardShell.tsx` — confirmed |
| §8 CardRendererContext | data, settings, dispatch, paramValue | `CardRenderer.tsx` — confirmed |
| §9 Dispatch pipeline | navigate→navigate(), back→goBack(), toast→showToast(), default→domainHandler | `dispatchDSLAction.ts` — confirmed exactly |
| §10 ActionRegistry | ActionRegistryEntry shape: actionCreator, mapPayload, toast, effect | `actionRegistry.ts` — confirmed |
| §12 Navigation slice | initialState starts with `[{ card: 'home' }]` | `navigationSlice.ts` — confirmed |
| §12 Navigation slice | `setLayout` resets nav stack to home | `navigationSlice.ts` — confirmed |
| §14 Widgets | All 12 widgets listed match actual exports | `components/widgets/index.ts` — confirmed |
| §15 PARTS | All part tokens listed exist | `parts.ts` — confirmed |

### 3.2 Inaccuracies / Misleading Claims ⚠️

| Section | Issue | Reality |
|---------|-------|---------|
| §5.1 Stack note 3 | Says `homeCard` is "semantic metadata" and nav reducer initializes to `{ card: 'home' }` — suggests keeping card id as `home`. | **Correct about the reducer**, but misleading: it implies `homeCard` is unused. In practice, `homeCard` is metadata that could be used by future features. The doc should explicitly say "the nav reducer hard-codes `'home'` as the initial card id — `homeCard` in Stack is NOT used at runtime currently." |
| §5.5 ListCardDef | Says footer "only supports `sum` at definition level" | **Partially misleading.** The DSL `ListCardDef.footer` type is `{ type: 'sum'; field; label }` — so at the DSL level, only `sum` is valid. But `ListView` widget's `FooterConfig` supports all 5 aggregation types (`sum|count|avg|min|max`). The doc should clarify this DSL-vs-widget distinction clearly. |
| §4.1 Quickstart | Shows `data: { items: [{ id: '1', name: 'First' }] }` as Stack data. | Works, but the type `StackData` is `{ [tableName]: Record<string, unknown>[] }`. This is fine — but there's no mention that `data` keys become the table names that `dataSource` references. This is a critical conceptual link that's mentioned obliquely in §5.5 but never spelled out directly. |
| §10.2 Todo example | Shows `toast: 'Task deleted'` as a string | **Correct**, but the doc doesn't clearly explain the return semantics: `DomainActionHandler` must return `boolean` (true = handled). The `createDomainActionHandler` does this internally, but the doc never explains what happens if you return `false` — answer: console warning "Unhandled DSL action type". |
| §24.8 ListView | Lists `footer?: FooterConfig` | Correct, but doc §5.5 says DSL footer only supports `sum`. This inconsistency between DSL-level and widget-level will confuse readers. |

### 3.3 Not Wrong, But Fragile / Underspecified

| Section | Issue |
|---------|-------|
| §4.2 Renderers | Says "If a card type is missing, shell fallback renders a warning card" — true, but doesn't explain the fallback renders **both** the icon+title and the warning text. Minor, but useful for debugging. |
| §7.1 What Shell Does | Says "merges stack.data and domainData" — doesn't explain merge semantics (shallow object spread: `{ ...stack.data, ...domainData }`). This means domainData keys **override** stack.data keys of the same name. This is critical behavior that's never stated. |
| §17 Cookbook patterns | All patterns are described in prose only — no actual code. For a reference doc, this is the weakest section. Compare to §31 which has actual code. §17 should either have code or be removed in favor of §31. |

## 4. Gaps Identified (What's Missing)

### 4.1 Critical Gaps (Would Block a New User or LLM)

**Gap 1: No explanation of the data→dataSource pipeline.**
The doc never explicitly says: "The `dataSource` field on a list/detail card is a key into the merged `data` object (stack.data + domainData). If `dataSource: 'tasks'`, the renderer reads `ctx.data['tasks']`." This is the single most important concept for understanding how cards display data, and it's only implied.

**Gap 2: No explanation of `rowAction.param` → `paramValue` flow.**
This is the mechanism that makes list→detail navigation work. The doc mentions it in §18 Pitfall 3 and §17.2 but never explains the full flow:
1. List card DSL defines `rowAction: { type: 'navigate', card: 'taskDetail', param: 'id' }`
2. List renderer reads `param` to know which field of the clicked row to use as the navigation parameter
3. Renderer dispatches `{ type: 'navigate', card: 'taskDetail', paramValue: row['id'] }`
4. Navigation slice pushes `{ card: 'taskDetail', param: 'id-value' }`
5. Detail renderer reads `ctx.paramValue` and uses `keyField` to find the matching record

This is the most complex data flow in the system and it's never documented end-to-end.

**Gap 3: No explanation of how detail card `buttons` get enriched.**
The doc (§5.6) says detail renderers "enrich button actions with record id/sku + edits" but never shows the mechanism. In reality, the renderer does: `{ ...b.action, sku: record.sku, edits }` — spreading additional context into the DSL action before dispatching. This is required for domain handlers to know which record to act on. Without this, a new user would dispatch `{ type: 'saveItem' }` with no record context.

**Gap 4: No explanation of `DSLField.id` semantics.**
The `id` field on a `DSLField` is critical: it's the key used to read/write values from the data record. For detail cards, `field.id` must match a key in the data record. For form cards, `field.id` becomes the key in the `values` object passed to the submit action. This mapping is never stated.

**Gap 5: Missing `MenuCardDef` full definition.**
Section 5.3 lists card types but doesn't give the `MenuCardDef` interface. It's in §4.1 implicitly (shows buttons), and §5.4 mentions `DSLButton`, but the full shape (`fields?`, `buttons?`) is only visible in the quickstart example. Compare: every other card type gets its own subsection (§5.5–5.9) but menu doesn't.

**Gap 6: No explanation of `DSLFilter` semantics.**
Section 5.5 mentions `filters` on list cards but never explains what they do or how they map to the widget layer. In reality:
- `{ field: 'category', type: 'select', options: [...] }` → renders a dropdown, filters rows where `row[field] === selectedValue`
- `{ field: '_search', type: 'text' }` → renders a text input, filters using `searchFields` (which is a renderer-side concept, not DSL)
The magic `_search` field name is never documented.

**Gap 7: `computed` field `expr` is a DSL-level string, not a runtime function.**
The doc shows `expr: "'$' + (price * qty).toFixed(2)"` but never explains:
- Who evaluates it? (The renderer, not the engine.)
- The inventory app's `DetailCardOverride` doesn't use `expr` at all — it uses domain-specific `ComputedFieldConfig` with real `compute` functions.
- So `expr` is a DSL hint that the renderer is expected to interpret. This is a major source of confusion.

**Gap 8: No documentation of DSL-to-widget type translation.**
The DSL layer uses `DSLField`, `DSLComputedField`, `DSLButton`, `DSLFilter`. The widget layer uses `FieldConfig`, `ComputedFieldConfig`, `ActionConfig`, `FilterConfig`. These are related but different types. Renderers must translate between them (e.g., `DSLField.default` → `FieldConfig.defaultValue`, `DSLComputedField.expr` string → `ComputedFieldConfig.compute` function, `DSLButton.style` → `ActionConfig.variant`, `columns: string[]` → `ColumnConfig[]`). This translation layer is the entire job of a renderer, and it's never documented.

**Gap 9: No complete "build a new app from scratch" walkthrough.**
§4 has a minimal skeleton but stops short. §25 has a file layout. Neither walks through the full process: create store, create stack, create renderers, wire action registry, wire selector registry, mount shell. A reader following the doc would have to piece together 6+ sections to build one working app.

### 4.2 Minor Gaps (Nice to Have)

**Gap 10:** `DSLField.value` is documented in the type but its purpose is never explained. It's used in menu card label fields (e.g., `{ id: 'welcome', type: 'label', value: 'Welcome to Shop Inventory' }`).

**Gap 11:** The doc never mentions that `CardRendererContext.paramValue` comes from `NavEntry.param` in the navigation slice, which is set by the `navigate` action's `paramValue` field. The naming inconsistency (`param` vs `paramValue`) is confusing and not addressed.

**Gap 12:** `DSLField.highlight` is mentioned in §5.4 but never explained. In the inventory app, it's used as a hint to the renderer (`highlight: 'lowStock'`), which then applies conditional styling. This is entirely app-defined behavior.

**Gap 13:** `ListCardDef.sortable` is present in the type but never mentioned in the doc.

**Gap 14:** The `IntentQuery` interface has `aggregate?` and `limit?` fields, but these are never explained. The doc just says "query/compute metadata" in §5.9.

**Gap 15:** The `TabDef` type exported from shell is never mentioned.

**Gap 16:** `DSLButton.action` is typed as `DSLAction`, but the rendered `ActionConfig.action` is typed as `unknown`. This type gap between DSL layer and widget layer is never discussed.

## 5. Test: Writing a Card from the Doc Alone

I attempted to write a "Book Tracker" app stack using only the reference doc. Here's what happened:

### 5.1 What Worked

- Stack shape: easy to get right from §5.1
- Card definitions for menu, list, form: clear enough from §4.1 + §5.5 + §5.7
- Action registry wiring: clear from §10
- Selector registry: clear from §11

### 5.2 Where I Got Stuck

1. **List→Detail navigation:** I defined `rowAction: { type: 'navigate', card: 'bookDetail', param: 'id' }` — correct. But I couldn't figure out from the doc alone that the renderer must extract `param` and build `paramValue` manually. The doc says renderers "map `rowAction.param` into `paramValue`" (§17.2) but doesn't show how. Only §31.2's detail card example + the actual override code clarify this.

2. **Detail card action enrichment:** I wrote button actions like `{ type: 'saveBook' }` — but wouldn't know to spread `{ ...action, id: record.id, edits }` into the dispatch without reading §31.2's renderer enrichment pattern or the source.

3. **Computed fields:** I wrote `computed: [{ id: 'status', label: 'Reading Status', expr: "..." }]` following the DSL type — but the doc never tells me whether the engine evaluates `expr` strings or if I need to build a `compute` function in my renderer. Reading the inventory app source reveals the latter.

4. **Search in list cards:** I wanted a search filter. I wrote `{ field: '_search', type: 'text' }` by copying from the inventory example in the doc — but the doc never explains the `_search` convention or that `searchFields` must be configured in the renderer.

5. **Form submission:** I got `submitAction: { type: 'addBook' }` right, and knew the renderer dispatches `{ ...submitAction, values }`. But the doc doesn't tell me that form renderers initialize field defaults from `DSLField.default` — I'd have to guess or read the source.

### 5.3 Test Stack (What I Produced)

```ts
const STACK: Stack = {
  name: 'Book Tracker',
  icon: '📚',
  homeCard: 'home',
  settings: {},
  data: {
    books: [
      { id: 'b1', title: 'Dune', author: 'Herbert', status: 'read', rating: 5 },
      { id: 'b2', title: '1984', author: 'Orwell', status: 'reading', rating: 4 },
    ],
  },
  cards: {
    home: {
      type: 'menu',
      title: 'Home',
      icon: '🏠',
      fields: [
        { id: 'welcome', type: 'label', value: 'Book Tracker' },
      ],
      buttons: [
        { label: '📋 All Books', action: { type: 'navigate', card: 'browse' } },
        { label: '➕ Add Book', action: { type: 'navigate', card: 'addBook' } },
      ],
    },
    browse: {
      type: 'list',
      title: 'All Books',
      icon: '📋',
      dataSource: 'books',
      columns: ['title', 'author', 'status', 'rating'],
      rowAction: { type: 'navigate', card: 'bookDetail', param: 'id' },
    },
    bookDetail: {
      type: 'detail',
      title: 'Book: {{title}}',
      icon: '📖',
      dataSource: 'books',
      keyField: 'id',
      fields: [
        { id: 'id', label: 'ID', type: 'readonly' },
        { id: 'title', label: 'Title', type: 'text' },
        { id: 'author', label: 'Author', type: 'text' },
        { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
        { id: 'rating', label: 'Rating', type: 'number', step: 1 },
      ],
      buttons: [
        { label: '✏️ Save', action: { type: 'saveBook' }, style: 'primary' },
        { label: '🗑 Delete', action: { type: 'deleteBook' }, style: 'danger' },
      ],
    },
    addBook: {
      type: 'form',
      title: 'Add Book',
      icon: '➕',
      fields: [
        { id: 'title', label: 'Title', type: 'text', required: true },
        { id: 'author', label: 'Author', type: 'text', required: true },
        { id: 'status', label: 'Status', type: 'select', options: ['to-read', 'reading', 'read'] },
        { id: 'rating', label: 'Rating', type: 'number', step: 1, default: 0 },
      ],
      submitAction: { type: 'addBook' },
      submitLabel: '📚 Add Book',
    },
  },
};
```

**Verdict:** The DSL part is achievable from the doc. The renderer wiring, action enrichment, and data pipeline require reading source code or guessing.

### 5.4 Storybook Validation (Actually Executed)

After the initial prose-only analysis, I wrote actual Storybook stories for 4 Book Tracker cards (Home menu, Browse list, Book detail, Add book form) using engine widget components directly. Results:

- **All 4 stories pass typecheck (`tsc --noEmit`) and render in Storybook (HTTP 200).**
- Stories are at `packages/engine/src/components/widgets/BookTracker.stories.tsx`.

Key observations during real implementation:

1. **DSL types ≠ widget types.** The DSL defines `DSLField` (with `default`, `highlight`, `value`), but widgets use `FieldConfig` (with `defaultValue`, no `highlight`, no `value`). The doc never documents this translation layer. I had to use `defaultValue` (widget type) instead of `default` (DSL type) in the form story.

2. **`ComputedFieldConfig.compute` is a function, `DSLComputedField.expr` is a string.** Renderers must translate `expr` strings into `compute` functions. The doc mentions this in §5.6 but never shows the translation. In my story I wrote `compute` functions directly.

3. **`ColumnConfig` requires explicit construction.** The DSL `columns: string[]` is just field names. The renderer must build `ColumnConfig[]` with labels, widths, formatters. This translation is completely undocumented.

4. **`_search` filter + `searchFields` wiring works** but only because I saw the inventory list story. The reference doc mentions `_search` nowhere.

5. **Action enrichment in detail card** — I manually spread `{ id: record.id, edits }` into actions. This is the critical pattern the doc describes only in passing.

## 6. Structural / Organizational Issues

### 6.1 Redundancy Between §17 (Cookbook) and §31 (Example Gallery)

§17 describes patterns in prose with no code. §31 provides actual code examples. They cover overlapping territory. Recommendation: merge them into a single "Patterns & Examples" section with code for every pattern.

### 6.2 Sections 27–30 Are Low-Value Padding

§27 (Performance Notes) is 4 generic bullet points. §28 (Backward-Compatible Extension Strategy) is 5 generic bullet points. §29 (Troubleshooting Matrix) duplicates §18 (Common Pitfalls). §30 (Final Notes) is a 3-sentence summary. These could be consolidated into 1 section.

### 6.3 Widget Reference (§24) Duplicates Type Definitions

The detailed widget props in §24 largely repeat what's already in `types.ts`. For a reference doc, this is fine — but the presentation could be more scannable (tables instead of nested prop/behavior lists).

### 6.4 Missing "Concepts" Section

The doc jumps from architecture (§2) to quickstart (§4). A "Core Concepts" section between them would help:
- Stack = app definition (name, data tables, card definitions)
- Card = screen definition (type determines shape)
- Data tables = keyed arrays that cards read from
- DSL actions = declarative events dispatched through a pipeline
- Renderers = app-owned functions that turn card definitions into React

## 7. Priority Recommendations

### P0 — Must Fix for Self-Contained Use

1. **Add "Core Concepts" section** explaining data tables, dataSource, paramValue flow, and action enrichment.
2. **Document the list→detail navigation flow end-to-end** with code showing how `rowAction.param` becomes `paramValue`.
3. **Document detail card action enrichment** as a required pattern (not just a cookbook hint).
4. **Add `MenuCardDef` subsection** alongside the other card type subsections.
5. **Explain `DSLField.id` is the data key** — the fundamental mapping between fields and record properties.
6. **Clarify `computed.expr` is a DSL hint** — renderers must provide their own `compute` functions.
7. **Explain `domainData` merge semantics** — `{ ...stack.data, ...domainData }` means domainData wins on conflict.

### P1 — Should Fix for Quality

8. **Document `_search` filter convention** and `searchFields` renderer config.
9. **Clarify DSL footer (`sum` only) vs. widget footer (all 5 aggregation types).**
10. **Merge §17 and §31** into unified patterns section.
11. **Consolidate §18 and §29** (both are troubleshooting).
12. **Add full walkthrough** building a complete new app (stack → store → renderers → registry → App.tsx → working app).
13. **Document `DSLField.value`** for label/readonly display fields.
14. **Document `ListCardDef.sortable`.**
15. **Document `DSLField.highlight`** as a renderer-interpreted hint.

### P2 — Nice to Have

16. **Explain `NavEntry.param` vs `paramValue` naming** to reduce confusion.
17. **Add `DSLButton.action` vs `ActionConfig.action` type discussion.**
18. **Add `IntentQuery` fields documentation** (aggregate, limit).
19. **Remove or consolidate §27–30** low-value sections.
20. **Add a "Type Cheat Sheet"** — one page showing all DSL types with their fields in a compact table format.

## 8. Summary

The reference doc is approximately **85% accurate and 70% complete** for self-contained use. The DSL authoring sections are strong. The runtime behavior sections (how data flows, how actions get enriched, how renderers wire things) have the most gaps. An LLM using only this doc could produce valid DSL definitions but would likely produce broken renderer code.

Priority fixes (P0 items 1–7) would bring completeness to ~90%+ and make the doc genuinely usable as a standalone specification for both humans and LLMs.
