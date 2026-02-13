---
Title: Diary
Ticket: HC-019-DSL-CRM-APP
Status: active
Topics:
    - frontend
    - architecture
    - redux
    - storybook
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/app/cardRuntime.ts
      Note: "Shared selectors/actions bridge — the core DSL-to-Redux glue (commit fb58cd5)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/stack.ts
      Note: "Stack assembly entrypoint composing all 13 cards (commit fb58cd5)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/cards/common.ts
      Note: "Shared column/field/filter definitions for contacts, companies, deals, activities (commit fb58cd5)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/stories/CrmApp.stories.tsx
      Note: "14 per-card Storybook stories under CRM/Full App (commit fb58cd5)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/domain/types.ts
      Note: "CRM domain types: Contact, Company, Deal, Activity (commit fb58cd5)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/crm/src/App.tsx
      Note: "App shell with HyperCardShell, debug pane, nav shortcuts (commit fb58cd5)"
    - Path: /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/.storybook/main.ts
      Note: "Wired CRM stories glob into Storybook config (commit fb58cd5)"
ExternalSources: []
Summary: Implementation diary for HC-019 — building a full CRM app using the Card Stacks DSL.
LastUpdated: 2026-02-13T12:08:00-05:00
WhatFor: Track the implementation journey of the CRM app DSL build.
WhenToUse: Reference when reviewing, continuing, or debugging the CRM app build.
---

# Diary

## Goal

Build a complete CRM application using the HyperCard Card Stacks DSL, following the patterns established in the book-tracker-debug app (HC-018), with per-card Storybook stories.

## Step 1: Analysis of HC-018 Book Tracker DSL Patterns

Analyzed the existing book-tracker-debug app to extract the canonical DSL app architecture. The app uses a clean layered pattern: domain types → Redux slices → shared selectors/actions bridge → one-file-per-card DSL definitions → stack assembly → HyperCardShell host. The bridge is the critical layer that maps DSL expressions to Redux behavior.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket HC-019-DSL-CRM-APP and analyze HC-018-DSL-DEBUG-BOOKAPP and its files and the oimplementation of the book app with DSL, and create a CRM app. Keep a detailed diary as you go, create tasks, commit as you go, commit to git."

**Assistant interpretation:** Create a new ticket, study the book tracker DSL app patterns thoroughly, then build a CRM app following the same architecture.

**Inferred user intent:** Validate that the Card Stacks DSL is expressive enough to build a second, more complex domain app (CRM) and produce it with full Storybook coverage.

### What I did
- Read all HC-018 docs (design guide, postmortem, tutorial)
- Read every source file in `apps/book-tracker-debug/` (types, slices, selectors, cardRuntime, cards, stack, App, stories, debug)
- Read engine types (`CardDefinition`, `CardStackDefinition`, helpers, `ui.*`)
- Created ticket HC-019-DSL-CRM-APP with 10 tasks

### Why
- Need to understand the exact DSL contract before replicating it for a richer domain
- The tutorial doc (HC-018 design/03) is the canonical reference for the pattern

### What worked
- The tutorial doc is excellent — it describes the exact layer sequence and file layout
- The engine's `ui.menu()`, `ui.list()`, `ui.detail()`, `ui.form()`, `ui.report()` cover all card types needed
- `Sel()`, `Act()`, `Ev()` expression helpers are sufficient for all binding patterns

### What didn't work
- N/A (analysis phase)

### What I learned
- The shared bridge (`cardRuntime.ts`) is the most complex file — it's where domain logic meets DSL
- `ColumnConfig` supports `format`, `align`, `cellStyle`, `renderCell` for rich table rendering
- `ComputedFieldConfig` allows derived display fields on detail views
- `FilterConfig` supports `select` and `text` types with `_search` magic field for full-text

### What was tricky to build
- N/A (analysis only)

### What warrants a second pair of eyes
- N/A

### What should be done in the future
- N/A

### Code review instructions
- Review HC-018 tutorial: `ttmp/.../design/03-how-to-create-an-app-using-card-stacks-dsl.md`

### Technical details
Key DSL primitives:
- `Sel(name, args?, { from })` — selector expression
- `Act(type, args?, { to })` — action descriptor
- `Ev(path)` — event payload path
- `ui.menu/list/detail/form/report({...})` — widget constructors


## Step 2: Build CRM App (Domain + Slices + Bridge + Cards + Stories)

Built the complete CRM app in a single implementation pass. The domain has 4 entity types (Contact, Company, Deal, Activity) with 4 Redux slices, a shared bridge with 20+ selectors and 15+ actions, 13 DSL cards covering all CRUD operations plus a pipeline report, and 14 Storybook stories (one per card + full app default).

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Implement the full CRM app following the book tracker pattern.

**Inferred user intent:** Produce a working, typechecked, Storybook-visible CRM app.

**Commit (code):** fb58cd5 — "feat(crm): add DSL-driven CRM app with 13 cards and per-card Storybook stories"

### What I did
- Created `apps/crm/` directory structure following the canonical layout
- Defined domain types: `Contact` (with status lifecycle), `Company` (with size tiers), `Deal` (with stage pipeline + weighted value), `Activity` (with type categorization)
- Implemented 4 Redux slices with seed data: 7 contacts, 5 companies, 7 deals, 6 activities
- Built shared bridge (`cardRuntime.ts`) with selectors like `contacts.byParam`, `deals.open`, `pipeline.reportSections` and actions for all CRUD operations
- Created 13 card modules: homeCard, contactsCard, contactDetailCard, addContactCard, companiesCard, companyDetailCard, dealsCard, openDealsCard, dealDetailCard, addDealCard, pipelineCard, activityLogCard, addActivityCard
- Defined `common.ts` with column configs, filters, detail fields, computed fields, and form fields for all 4 entity types
- Assembled stack in `stack.ts`
- Added debug pane (same pattern as book tracker)
- Created `CrmApp.stories.tsx` with 14 stories using the `CrmShellAtCard` helper pattern
- Wired CRM stories glob into `apps/inventory/.storybook/main.ts`
- Added `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Fixed RTK type errors with index-signature types by using explicit field-by-field push

### Why
- CRM is a natural second app for the DSL — it has multiple entity types, cross-references between them, a pipeline/funnel, and activity tracking
- Per-card stories validate that every card renders correctly in isolation

### What worked
- The DSL pattern from book tracker transferred perfectly to a multi-entity domain
- All 14 stories registered in Storybook (verified via `index.json`)
- Full typecheck passes (`npx tsc --build` clean)
- Storybook HMR picked up the new stories immediately

### What didn't work
- Initial `createSlice` reducers using `Omit<T, 'id'>` + spread failed typecheck because the `[key: string]: unknown` index signature on domain types made RTK's `WritableNonArrayDraft` type unhappy with the spread pattern
- Fixed by using explicit field-by-field push instead of spread

### What I learned
- RTK's Immer draft types are strict about index signatures — need explicit construction, not spread
- The `pipeline.reportSections` shared selector pattern (aggregation in selectors) works beautifully for dashboards
- A CRM with 4 entities and 13 cards is very manageable with the one-file-per-card pattern

### What was tricky to build
- The type error with `Omit<T, 'id'>` and RTK was the only real obstacle. The symptom was "Type `{ id: string }` is missing the following properties...". The root cause is that TypeScript's `Omit` over an index-signature type produces `{ [key: string]: unknown }` which doesn't satisfy the full concrete type when spread. The fix was to destructure and reconstruct field-by-field.

### What warrants a second pair of eyes
- The `cardRuntime.ts` bridge is 295 lines — should verify the action handlers are all correct, especially the `create` actions that translate form values
- The `pipeline.reportSections` selector does aggregation over deals — verify the math is correct
- The `[key: string]: unknown` index signature on domain types is inherited from the book tracker pattern but causes ergonomic issues with RTK — might be worth removing

### What should be done in the future
- Add company name resolution in contact/deal list views (currently shows companyId, not name)
- Add contact name resolution in deal list views
- Consider removing `[key: string]: unknown` from domain types to improve RTK ergonomics
- Add cross-navigation from contact detail → their deals, and deal detail → contact
- Add individual card-level Storybook stories (not just shell-level) for component testing

### Code review instructions
- Start at `apps/crm/src/domain/stack.ts` — see all 13 cards assembled
- Then `apps/crm/src/app/cardRuntime.ts` — the selector/action bridge
- Then `apps/crm/src/domain/cards/common.ts` — shared field/column definitions
- Verify with: `npx tsc --build`, check Storybook at `http://localhost:6006` → CRM/Full App
- Each card story can be individually verified (Home, Contacts, ContactDetail, etc.)

### Technical details

Cards implemented:
| Card | Type | DSL Widget |
|------|------|-----------|
| home | menu | `ui.menu` |
| contacts | list | `ui.list` |
| contactDetail | detail | `ui.detail` |
| addContact | form | `ui.form` |
| companies | list | `ui.list` |
| companyDetail | detail | `ui.detail` |
| deals | list | `ui.list` |
| openDeals | list | `ui.list` (filtered) |
| dealDetail | detail | `ui.detail` |
| addDeal | form | `ui.form` |
| pipeline | report | `ui.report` |
| activityLog | list | `ui.list` |
| addActivity | form | `ui.form` |

Shared selectors (key examples):
```
contacts.all, contacts.byParam, contacts.leads, contacts.customers
companies.all, companies.byParam, companies.nameMap
deals.all, deals.open, deals.byParam, deals.byContact
activities.recent, activities.byContact, activities.byDeal
pipeline.reportSections
```

Shared actions (key examples):
```
contacts.save/create/delete/setStatus/reset
companies.save/create/delete/reset
deals.save/create/delete/setStage/reset
activities.create/reset
crm.resetAll
```


## Step 3: Engineering Postmortem and User Guide Gap Analysis

Wrote a detailed postmortem analyzing what the HC-018 user guide covers well and what it's missing, based on real experience building the CRM app. Identified 12 specific gaps, categorized by severity, and produced a prioritized improvement plan.

### Prompt Context

**User prompt (verbatim):** "Create a postmortem, especially detailing what was missing from the user guide. Store the postmortem in the ticket and upload to remarkable."

**Assistant interpretation:** Write a postmortem document focused on user guide gaps, store it in the HC-019 ticket, and upload to reMarkable.

**Inferred user intent:** Improve the DSL documentation by capturing what a real build exposed as missing.

**Commit (code):** 9cb6f01 — "docs(HC-019): engineering postmortem with user guide gap analysis"

### What I did
- Wrote 363-line postmortem document (`design/01-engineering-postmortem-crm-app-build-and-user-guide-gap-analysis.md`)
- Cataloged 12 gaps: 1 blocker (RTK types), 7 significant (multi-entity, configs, templates, stories, actions, cross-entity, storybook wiring), 4 minor
- Included quantitative coverage assessment (guide step × gap matrix)
- Produced prioritized 3-tier improvement plan
- Uploaded to reMarkable at `/ai/2026/02/13/HC-019-DSL-CRM-APP/`
- Updated changelog and committed

### Why
- The user guide is the primary onboarding artifact — gaps reduce its value
- A structured gap analysis makes improvements actionable rather than anecdotal

### What worked
- Having just built the CRM gave immediate recall of every friction point
- The severity categorization (🔴/🟡/🟢) makes prioritization obvious
- reMarkable upload succeeded on first try

### What didn't work
- N/A

### What I learned
- The guide covers architecture and mental model excellently but under-serves API reference and multi-entity patterns
- 4 out of 12 gaps required reading engine source — that's the clearest signal of documentation debt

### What was tricky to build
- Distinguishing between "gap in the guide" vs. "reasonable thing to look up in source" required judgment. The threshold used was: if a developer following the guide step-by-step would be blocked or confused, it's a gap.

### What warrants a second pair of eyes
- The severity assessments are subjective — the guide author may disagree on what's 🟡 vs. 🟢

### What should be done in the future
- Implement the Priority 1 guide improvements (widget config reference, RTK pitfall, scaffold templates)
- Consider automated guide validation: a script that builds a minimal app following only guide instructions

### Code review instructions
- Read the postmortem: `ttmp/.../design/01-engineering-postmortem-crm-app-build-and-user-guide-gap-analysis.md`
- Focus on §3 (the 12 gaps) and §5 (prioritized improvements)
- Verify on reMarkable: `/ai/2026/02/13/HC-019-DSL-CRM-APP/`
