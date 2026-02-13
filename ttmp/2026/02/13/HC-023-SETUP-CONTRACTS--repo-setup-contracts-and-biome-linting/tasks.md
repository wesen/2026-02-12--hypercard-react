# Tasks

## TODO

- [ ] Confirm baseline failures still reproduce:
- [x] `npm run build` fails because `@hypercard/engine` has no `build` script
  - [ ] `npm run lint` fails due missing lint config/tooling
  - [ ] `npm run typecheck` passes while omitting `apps/todo` and `apps/crm`
- [ ] Add `build` script in `packages/engine/package.json` (prefer `tsc -b`)
- [ ] Redesign root `build` script in `package.json` to cover all workspaces or an explicit app matrix
- [ ] Add `apps/todo` and `apps/crm` to root `tsconfig.json` references
- [ ] Install and configure Biome at repo root (`biome.json`)
- [ ] Replace root lint script with Biome check command
- [ ] Add root lint-fix script using Biome write mode
- [ ] Define Biome include/ignore paths so generated/build outputs are excluded
- [ ] Verify Biome handles TS/TSX for:
  - [ ] `packages/engine/src/**`
  - [ ] `apps/**/src/**`
  - [ ] Storybook config files as intended
- [ ] Run and record post-change validation:
  - [ ] `npm run typecheck`
  - [ ] `npm run build`
  - [ ] `npm run lint`
- [ ] Add/update CI job commands to use root `typecheck` + `build` + Biome lint
- [ ] Document the new setup contract in root `README.md` quick-start/tooling sections
- [ ] Add short migration notes for developers who used ESLint CLI locally
- [ ] Update ticket changelog with final command outputs and outcomes
