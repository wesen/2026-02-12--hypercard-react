---
Title: Diary
Ticket: HC-026-APP-CONSOLIDATION
Status: done
Topics: [architecture, consolidation]
DocType: reference
Intent: long-term
---

# Diary

## Goal
Converge all 4 apps onto `createAppStore` + `createStoryHelpers`.

## Step 1: Store + story migration (commit 0da0dee)

### What I did
- **Inventory store**: Replaced manual `configureStore` with `createAppStore({ inventory, sales, chat })`. Exported `createInventoryStore` factory.
- **Todo store**: Replaced manual `configureStore` with `createAppStore({ tasks })`. Exported `createTodoStore`.
- **Inventory stories**: Rewrote `CardPages.stories.tsx` to use `createStoryHelpers`. Rewrote `FullApp.stories.tsx` to use `createInventoryStore`. Rewrote `Themed.stories.tsx` to use `createInventoryStore` directly.
- **Todo stories**: Rewrote `TodoApp.stories.tsx` to use `createStoryHelpers`.
- **decorators.tsx**: Emptied (kept as placeholder, no longer used).

### What was tricky
- `FullApp.stories.tsx` imported from `decorators.tsx` which I'd already emptied. Found during typecheck and fixed immediately.
- `Themed.stories.tsx` used `storeDecorator()` (function call, not reference) — had to create an inline decorator instead.

### Result
All 4 apps now use identical patterns:
- Store: `createAppStore({ domainReducers })`
- Stories: `createStoryHelpers({ stack, selectors, actions, createStore, ... })`

### Verification
- typecheck ✓, lint ✓, 83 Storybook stories ✓
