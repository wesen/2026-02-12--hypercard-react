---
title: Diary
doc_type: reference
status: active
intent: long-term
topics:
  - react
  - storybook
  - theming
  - rtk-toolkit
  - vite
ticket: HC-001-IMPORT-JSX
related_files:
  - path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard-dev-guide.md
    note: "Original dev guide describing the DSL-driven HyperCard architecture"
  - path: /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-001-IMPORT-JSX--hypercard-react-modularization-rtk-storybook-vite-theming/sources/local/hypercard(4).jsx
    note: "Monolithic JSX source – the entire application in one file"
---

# Diary

## Goal

Capture the full journey of analyzing the monolithic HyperCard JSX application and producing a detailed modularization design document covering RTK Toolkit, Storybook, Vite, and a themeable architecture.

## Step 1: Import & Inventory

Imported both source files (`hypercard-dev-guide.md` and `hypercard(4).jsx`) into ticket HC-001-IMPORT-JSX via docmgr. Read both files end-to-end to build a mental model of the application before designing the modularization.

### Prompt Context

**User prompt (verbatim):** "Use docmgr to create a new ticket called HC-001-IMPORT-JSX and use docmgr import file --file XXX --ticket HC-001-IMPORT-JSX to import hypercard-dev-guide.md and 'hypercard(4).jsx' from ~/Downloads. Then read them, and design a detailed guide and design document on how to modularize this application into rtk-toolkit and storybook and vite and themable application (see skill), and store it in the ticket and upload to remarkable. Keep a frequent diary as you go."

**Assistant interpretation:** Create a ticket, import two files, analyze the monolithic HyperCard app, then produce a comprehensive modularization design doc covering RTK, Storybook, Vite, and theming. Upload the final result to reMarkable. Document the journey.

**Inferred user intent:** Get a print-ready, actionable design document that can guide breaking this single-file React app into a professional modular architecture, and have it on the reMarkable for offline reading/annotation.

### What I did
- Created ticket HC-001-IMPORT-JSX with docmgr
- Imported `hypercard-dev-guide.md` and `hypercard(4).jsx` into sources/local
- Read both files completely
- Created diary (this doc) and design doc placeholders

### Why
- Need full understanding of the codebase before designing modularization
- The dev guide describes the DSL architecture and conventions
- The JSX file is the complete implementation (~600 lines of components + ~300 lines of DSL data)

### What worked
- Both files imported cleanly
- The codebase is well-documented and follows clear patterns

### What didn't work
- N/A (import step)

### What I learned

**Current architecture (single file, top-to-bottom):**

1. **STACK constant** (~180 lines): DSL definition with data tables, card definitions, AI intents
2. **Theme constants** (~10 lines): `T` (color tokens), `B` (base style objects), `font` string
3. **Shared components** (~50 lines): `Btn`, `Chip`, `DataTable`, `Toast`, `matchFilter`, `resolveValue`
4. **Card renderers** (~350 lines): `MenuCard`, `ListCard`, `DetailCard`, `FormCard`, `ReportCard`, `ChatCard`
5. **Layout shells** (~100 lines): `NavBar`, `LayoutSplit`, `LayoutDrawer`, `LayoutCardChat`
6. **Main app** (~80 lines): `HyperCardEngine` with `useState` for nav/data/toast, `dispatch` switch, `renderCard`

**Key observations for modularization:**
- All state is in `HyperCardEngine` via `useState` – perfect RTK candidate
- `dispatch` is a manual action switch – maps directly to RTK reducers/thunks
- All styles are inline JS objects – need extraction to CSS variables + data-part
- Card renderers are already component-shaped – easy to extract
- `STACK` constant is the DSL "schema" – should be a separate module/type
- No routing – nav stack is manual state
- No persistence – state resets on reload
- AI intent processing is embedded in `ChatCard` – should be a service/slice

### What was tricky to build
- N/A (analysis step only)

### What warrants a second pair of eyes
- The `ChatCard` processInput function has 6 compute handlers inline. These need careful extraction to maintain behavior.
- `new Function()` usage in DetailCard computed fields is a security concern worth noting.

### What should be done in the future
- Step 2: Write the complete modularization design document
- Step 3: Upload to reMarkable

### Code review instructions
- Start with the STACK constant to understand the DSL
- Read HyperCardEngine dispatch to understand all action types
- Cross-reference with the dev guide's "Action System" table

### Technical details (see table below)

---

## Step 2: Design Document Authoring

Wrote the complete modularization guide (~64KB, 11 major sections) covering all five target technologies: Vite scaffold, module extraction, RTK Toolkit state management, CSS-variable theming with data-part selectors, and Storybook integration. The document includes full code examples for every module.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Produce an actionable design document with code samples for each phase of modularization.

**Inferred user intent:** A print-ready reference that can guide the actual implementation without re-analysis.

### What I did
- Analyzed the monolith structure: identified 15 components, 10 action types, 5 state domains
- Designed target file structure (~50 files across 6 directories)
- Wrote full TypeScript type definitions for the DSL schema (Stack, Card types, AI intents, etc.)
- Designed 5 RTK slices: navigation, inventory, sales, notifications, chat
- Extracted the intent engine and 6 compute handlers into standalone modules
- Created a DSL-to-RTK action bridge (`dispatchDSLAction`)
- Defined 35+ `data-part` names in a parts registry
- Mapped all inline styles to 30+ CSS custom properties (tokens)
- Wrote `theme-default.css` reproducing the exact Mac System 7 look
- Wrote `theme-dark.css` as proof-of-concept alternative theme
- Defined story requirements for 14+ components
- Created a 30-item migration checklist organized into 6 phases
- Built appendices: data-part map, data-state values, token quick-reference, RTK slice summary

### Why
- The monolith is well-architected internally (card-type renderers, single dispatch) — the modularization should preserve these patterns while adding professional tooling
- RTK is a natural fit because the existing `dispatch` switch already maps 1:1 to reducers
- The inline style objects already use a consistent token vocabulary (T object) — converting to CSS variables is mechanical
- Storybook enables visual QA without running the full app

### What worked
- The DSL architecture made type extraction straightforward — the JSON schema is already well-defined
- The card type union (menu|list|detail|form|chat|report) maps perfectly to discriminated unions in TypeScript
- The intent engine has a clean extraction boundary (processInput function)

### What didn't work
- N/A (design phase — no code execution)

### What I learned
- The `new Function()` usage in computed fields needs a security note — it's a sandboxing concern
- `ChatCard` is the most complex component (80 lines, embedded AI engine, local state for messages) — it will need the most careful extraction
- The DSL action bridge pattern (`dispatchDSLAction`) is key — it lets JSON-defined actions work with typed RTK reducers without changing the STACK definition
- The 3 layout shells share identical props — a LayoutProps interface should be extracted

### What was tricky to build
- Deciding how to split state: inventory vs sales vs chat vs navigation vs notifications. The original has everything in one useState blob. The split follows domain boundaries but chat needs access to inventory+sales for intent queries, which means cross-slice selectors or thunks.
- CSS token naming: the original uses terse names (T.bg, T.alt, T.bdr) that are efficient but not self-documenting. The token names need to be longer (--hc-color-bg) without being verbose.
- data-part granularity: too few parts = can't theme specific areas, too many = brittle. Settled on 35 parts covering all visual regions without exposing internal layout wrappers.

### What warrants a second pair of eyes
- The `dispatchDSLAction` bridge: it duplicates knowledge of action shapes (once in STACK JSON, once in the switch). Consider generating this from the type system.
- Cross-slice data access: ChatCard's intent engine needs items+salesLog. Currently passed as props; with RTK it needs either a thunk or the component reads from multiple slices.
- The `receiveStock` action does case-insensitive SKU matching — this behavior must be preserved in the RTK reducer.

### What should be done in the future
- Step 3: Upload design doc to reMarkable for offline review
- Validate the design by implementing Phase 1 (Vite scaffold) as a smoke test
- Consider Zod schema validation for STACK at dev-time

### Code review instructions
- Read Sections 6 (RTK) and 7 (Theming) together — they're the core architectural decisions
- Check the Parts Map (Appendix A) against the actual JSX to verify completeness
- The migration checklist (Section 10) is the executable plan

### Technical details

**Component inventory (6 card types + 4 shared + 3 layouts + 1 app):**

| Component | Lines | State | Props | Theming |
|-----------|-------|-------|-------|---------|
| MenuCard | ~15 | none | card, dispatch | inline |
| ListCard | ~40 | filters, sortCol, sortDir | card, data, dispatch | inline |
| DetailCard | ~45 | edits | card, data, dispatch, paramValue | inline |
| FormCard | ~30 | values, result | card, data, dispatch | inline |
| ReportCard | ~30 | none | card, data | inline |
| ChatCard | ~80 | msgs, input | card, data, dispatch | inline |
| DataTable | ~25 | none | items, columns, compact, onRowClick | inline |
| Btn | ~5 | none | children, active, variant, style | inline |
| Chip | ~2 | none | children | inline |
| Toast | ~5 | none (effect) | message, onDone | inline |
| NavBar | ~10 | none | dispatch, navLen, currentCard | inline |
| LayoutSplit | ~15 | none | cardId, cardDef, data, dispatch, renderCard, navLen | inline |
| LayoutDrawer | ~15 | open | same as LayoutSplit | inline |
| LayoutCardChat | ~8 | none | same as LayoutSplit | inline |
| HyperCardEngine | ~80 | layout, navStack, data, toast | none (root) | inline |

**Action types (10):** navigate, back, toast, updateQty, saveItem, deleteItem, createItem, receiveStock, priceCheck (inline), aiSend (inline)

---

## Step 3: Upload to reMarkable

Uploaded the complete document bundle (design guide + diary + dev guide) to the reMarkable device as a single PDF with table of contents, plus the JSX source as a syntax-highlighted PDF.

### Prompt Context

**User prompt (verbatim):** (see Step 1)

**Assistant interpretation:** Upload the final artifacts to reMarkable for offline reading.

**Inferred user intent:** Have a portable, annotatable copy of the design document for review away from the computer.

### What I did
- Dry-ran `remarquee upload bundle` to verify paths and output
- Uploaded 3 markdown files as a single bundled PDF with ToC to `/ai/2026/02/12/HC-001-IMPORT-JSX/`
- Uploaded the JSX source file as a syntax-highlighted PDF to the same directory

### Why
- User explicitly requested reMarkable upload
- Bundling 3 files into one PDF with ToC makes offline reading coherent
- Syntax-highlighted source PDF enables code annotation on the device

### What worked
- `remarquee upload bundle` created a clean PDF with all 3 documents and ToC
- `remarquee upload src` rendered the JSX with syntax highlighting
- Both uploaded successfully to `/ai/2026/02/12/HC-001-IMPORT-JSX/`

### What didn't work
- `remarquee upload src --name` flag is only valid with `--bundle` — minor CLI quirk, used default naming instead

### What I learned
- The `remarquee upload bundle` command is the right tool for multi-document PDFs
- ToC depth 2 gives good navigability for a document this size

### What was tricky to build
- N/A (upload step)

### What warrants a second pair of eyes
- N/A

### What should be done in the future
- Begin implementation starting with Phase 1 (Vite scaffold)
- Re-upload updated versions as the design evolves

### Technical details

**Uploaded to reMarkable:**
- `/ai/2026/02/12/HC-001-IMPORT-JSX/HC-001 HyperCard Modularization Guide.pdf` — bundled design doc + diary + dev guide with ToC
- `/ai/2026/02/12/HC-001-IMPORT-JSX/hypercard(4).pdf` — syntax-highlighted JSX source

---

## Step 4: Layer Separation – Engine vs. Inventory App

Produced a second design document (design/02-…) that audits every domain-specific contamination point in the original design and redraws the module boundary as two layers: `@hypercard/engine` (generic CRUD widgets + card system + DSL + shell + theming) and `apps/inventory` (the domain-specific application).

Initially designed as three layers (crud-widgets / engine / app) but merged widgets and engine after review — the two-package split added a `--cw-` → `--hc-` token mapping layer and import indirection for no real reuse benefit.

### Prompt Context

**User prompt (verbatim):** "Separate the "inventory / AI" part from the hypercard part, and also make the widgets reusable so that they can be used for generic CRUD "forms + tables" kind of software. You might have already done that, tell me what you'd change."

**Assistant interpretation:** Audit the original design for domain contamination and redesign the module boundaries so the engine is generic and reusable.

**Inferred user intent:** Make the component library useful beyond this single inventory app — enable building any CRUD app on the same card engine.

### What I did
- Traced every inventory-specific reference in the monolith (37 contamination points across 7 components)
- Categorized contamination: DataTable (4 points), ListCard (2), DetailCard (2), FormCard (1), ReportCard (1), ChatCard (2), HyperCardEngine (1)
- Redesigned DataTable with generic `ColumnConfig<T>` (format, cellState, renderCell, width)
- Redesigned FormView without priceCheck (generic onSubmit + submitResult)
- Redesigned DetailView with function-based computed fields (replacing new Function())
- Redesigned ReportView to accept pre-computed {label, value}[] instead of a computeMap
- Redesigned ChatView with external onSend callback (no inline intent engine)
- Defined generic `Stack<TData, TSettings>` DSL type (no Item/SaleEntry)
- Created `DomainActionHandler` extension point for the action bridge
- Created `customRenderers` extension point for CardRenderer
- Moved all inventory types/slices/formatters/handlers to apps/inventory/
- Initially three packages, then merged to two after deciding the widget↔engine boundary was artificial

### Why
- The original design's `DataTable` hardcodes `sku`/`qty`/`price` column widths and inventory-specific coloring
- The `dispatchDSLAction` bridge handles `updateQty`, `saveItem`, etc. — all inventory verbs
- `ChatCard` embeds the entire AI intent engine with 6 compute handlers
- None of these are reusable for a different domain (CRM, recipe manager, project tracker)

### What worked
- The contamination audit was mechanical — grep for STACK references, domain field names, and specific action types
- The `ColumnConfig<T>` with `format`/`cellState`/`renderCell` cleanly replaces every hardcoded DataTable behavior
- The `domainHandler` extension pattern lets the engine dispatch generic actions (navigate/back/toast) while delegating unknown types to the app
- Merging widgets + engine into one package eliminated the `--cw-` → `--hc-` token mapping complexity

### What didn't work
- The initial three-layer design (crud-widgets / engine / app) was over-engineered — nobody needs to use the widgets without the card engine

### What I learned
- The `_search` filter in ListCard hardcodes searching `name` and `sku` — needs a generic `searchFields: string[]`
- The `highlight: "lowStock"` in DetailCard fields is a pattern that should be `fieldHighlight: (id, value, record) => CSSProperties`
- ReportCard's `computeMap` is the cleanest extraction: just compute values in the app and pass `{ label, value }[]`
- ChatView becomes the simplest component after extraction — it's just a message list with a send callback

### What was tricky to build
- Deciding on two layers vs. three: the widgets-only package had appeal (generic DataTable for any React app) but the token-mapping overhead and the reality that nobody would use these widgets without the card engine tipped the balance toward merging
- The `CardRenderer` extensibility: `customRenderers` lets the app override any card type, but the engine still needs to provide sensible defaults. The engine's built-in card wrappers use the generic widget props (ColumnConfig, FieldConfig, etc.) — the app overrides supply domain-specific configs

### What warrants a second pair of eyes
- The `DomainActionHandler` returns `boolean` to indicate handled/unhandled — this works but loses type safety on the action payload. Consider discriminated union types instead.
- The engine's built-in card wrappers for `list` and `detail` types need to translate DSL card definitions (which use field names like `dataSource`) into generic widget props (which use `items`, `columns`, etc.). This translation layer needs careful testing.

### What should be done in the future
- Upload updated documents to reMarkable
- Build the proof-of-generality: a minimal `apps/todo/` with 3 cards using the engine

### Code review instructions
- Read Section 3 (Contamination Audit) to see every line that crosses the boundary
- Read Sections 4.3–4.8 (generic widget APIs) for the key interface changes
- Compare the revised file structure (Section 8) with the original design doc's Section 3.1
