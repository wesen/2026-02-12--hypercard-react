# Storybook Ownership and App Boot Model

## Purpose

Clarify ownership boundaries for Storybook and runtime app bootstrapping in this monorepo so cleanup and refactor work can be done without cross-package confusion.

## Repository Model

The frontend is structured as:

- shared engine package: `packages/engine`
- app packages: `apps/inventory`, `apps/todo`, `apps/crm`, `apps/book-tracker-debug`

The engine contains shared UI/runtime/store primitives. Apps compose domain reducers, stack definitions, and app-specific windows/features.

## Storybook Ownership

## Runtime location

Storybook is launched from inventory package scripts:

- root script: `npm run storybook`
- delegated script: `npm run -w apps/inventory storybook -- --config-dir .storybook`

Config source:

- `apps/inventory/.storybook/main.ts`
- `apps/inventory/.storybook/preview.ts`

## Scope

Despite location under `apps/inventory`, Storybook is **workspace-global**.

The configured story globs include:

- inventory stories
- todo stories
- book-tracker-debug stories
- crm stories
- engine stories

Because of this, Storybook should be treated as a shared frontend platform artifact, not an inventory-only tool.

## Alias ownership

`@hypercard/engine` aliasing for Storybook is configured in:

- `apps/inventory/.storybook/main.ts`

Application dev/build aliasing is configured by Vite helper:

- `tooling/vite/createHypercardViteConfig.ts`

Do not duplicate alias logic in ad-hoc places; use the shared helper where possible.

## App Boot Model

Each app follows the same boot contract:

1. `main.tsx` imports CSS and mounts React root.
2. Wrap app with Redux `Provider` using app store.
3. App root renders desktop shell and app-specific windows/cards.

Representative files:

- `apps/inventory/src/main.tsx`
- `apps/inventory/src/app/store.ts`
- `apps/inventory/src/App.tsx`

Shared store composition:

- engine factory: `packages/engine/src/app/createAppStore.ts`
- app reducers passed in by each app store module

## Boundary Rules

To keep cleanup work low-risk and understandable:

1. Engine package owns shared primitives and generic infrastructure.
2. App packages own domain reducers, stack data, and app window behavior.
3. Storybook config is globally scoped, even while physically hosted in inventory.
4. Changes to shared boot/store contracts should be done in engine first, then app adapters.
5. App-specific experiments should not leak into engine exports without explicit API intent.

## Operational Guidance

When adding stories:

1. Put reusable stories in `packages/engine/src`.
2. Put app-specific behavior stories in the corresponding app.
3. Prefer `createStoryHelpers` for card-page app stories.

When changing app boot behavior:

1. Keep `main.tsx` minimal (mount + provider + app).
2. Keep `store.ts` responsible for reducer composition.
3. Keep `App.tsx` focused on shell wiring and app window registration.

## Future Improvement (Tracked)

A future cleanup may move Storybook config to repo root (`/.storybook`) for clearer ownership. Until then, treat `apps/inventory/.storybook` as the canonical shared Storybook entrypoint.

## Verification Snapshot (2026-02-17)

This document was re-verified during HC-43 Phase 1 hard-cutover replay against current sources:

- Storybook config:
  - `apps/inventory/.storybook/main.ts`
  - `apps/inventory/.storybook/preview.ts`
- Root Storybook script:
  - `package.json` (`storybook` delegates to `apps/inventory`)
- App boot entrypoints:
  - `apps/inventory/src/main.tsx`
  - `apps/todo/src/main.tsx`
  - `apps/crm/src/main.tsx`
  - `apps/book-tracker-debug/src/main.tsx`
- Vite app bootstrap helper:
  - `tooling/vite/createHypercardViteConfig.ts`
