# Changelog

## 2026-02-17

- Initial workspace created
- Added scoped Storybook-cleanup task backlog focused on information architecture, title normalization, and package-aligned story organization.
- Completed detailed Storybook assessment and cleanup plan:
  - `design-doc/01-storybook-cleanup-assessment-and-reorganization-plan.md`
  - includes baseline metrics, taxonomy drift analysis, target IA, hard-cutover strategy, phased plan, pseudocode, and rollout timeline
- Related files linked to design doc via `docmgr doc relate` for source-traceable implementation context.
- Uploaded assessment PDF to reMarkable:
  - remote path: `/ai/2026/02/17/HC-46-STORYBOOK-CLEANUP/HC-46 Storybook Cleanup Assessment and Plan`
- Implemented Storybook cleanup execution:
  - moved Storybook config to root ownership (`.storybook/main.ts`, `.storybook/preview.ts`)
  - reorganized app story files from flat `src/stories` into `src/app/stories` and `src/features/**/stories`
  - normalized all story titles to canonical owner-first taxonomy (`Apps/*`, `Packages/*`)
  - split large story monoliths (`ChatWindow*`, `DesktopPrimitives*`)
  - added taxonomy/placement enforcement script (`scripts/storybook/check-taxonomy.mjs`) and wired it into test scripts
  - added Storybook maintainer policy doc (`docs/frontend/storybook.md`) and updated ownership doc
- Validation:
  - `npm run typecheck`
  - `npm run storybook:check`
  - `npm run -w packages/engine test`
- Commits:
  - `4f8005d` refactor(storybook): cut over to package-aligned IA and story layout
  - `e8e40d1` refactor(stories): split chat and windowing monolithic story files
  - `5fcedf3` chore(storybook): add taxonomy checks and maintainer guardrails

## 2026-02-17

HC-46 implementation complete: Storybook IA cutover, title normalization, file reorganization, monolith splitting, and enforcement guardrails delivered

