---
Title: Diary
Ticket: HC-023-SETUP-CONTRACTS
Status: done
Topics: [architecture, tooling]
DocType: reference
Intent: long-term
---

# Diary

## Goal
Make root `build`, `typecheck`, and `lint` commands trustworthy and repo-wide. Migrate from ESLint to Biome.

## Step 1: Baseline + Fix (commit 7ff7c15)

Confirmed failures: `npm run build` failed (engine missing build script), `npm run lint` failed (no ESLint config), root `tsconfig.json` missed apps/todo + apps/crm.

### What I did
- Added `build`/`typecheck` scripts to `packages/engine/package.json` (`tsc -b`)
- Updated root `tsconfig.json` references to include all 4 apps
- Updated root `package.json` build script to cover all workspaces
- Installed Biome v2.3, created `biome.json` with lint+format config
- Replaced ESLint lint script with `biome check .`, added `lint:fix`
- Ran `biome check --write --unsafe` to auto-fix formatting + safe transforms
- Fixed `noImplicitAnyLet` in HyperCardShell, `noShadowRestrictedNames` in stories
- Upgraded engine target to ES2022 (biome converted `hasOwnProperty` → `Object.hasOwn`)
- Turned off `noArrayIndexKey` and a11y rules (not applicable to this codebase)

### What was tricky
- Biome's `--unsafe` flag rewrote `Object.prototype.hasOwnProperty.call()` to `Object.hasOwn()` which requires ES2022 lib. Had to bump the engine tsconfig target.
- Biome v2 schema uses `includes` not `include`, and `files` has no `ignore` key — had to check the v2 schema.

### Verification
- `npm run typecheck` ✓
- `npm run build` ✓ (all 5 workspaces)
- `npm run lint` ✓ (1 info only)
- Storybook: 82 stories
