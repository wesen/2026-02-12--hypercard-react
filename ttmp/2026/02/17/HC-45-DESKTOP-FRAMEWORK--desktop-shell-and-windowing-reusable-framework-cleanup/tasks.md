# Tasks

## TODO

- [x] Create HC-45 ticket workspace and scaffold analysis/plan docs
- [x] Complete 5+ page architecture analysis for desktop shell/windowing reusability
- [x] Complete 5+ page implementation plan with phased execution tasks
- [x] Update ticket index/changelog/diary with investigation and authoring log
- [x] Upload bundled HC-45 design docs to reMarkable and verify remote artifact
- [x] Relate key code files to HC-45 docs with docmgr metadata links
- [x] Final review pass for frontmatter quality and stale metadata checks

## Implementation (Hard Cutover)

- [x] T1: Move windowing state APIs from `features/windowing` to `desktop/core/state`, rewrite imports, and remove legacy `features/windowing` source files
- [x] T2: Extract desktop command routing into a dedicated router module and wire `DesktopShell` through it
- [x] T3: Split `DesktopShell` into controller + view composition (`useDesktopShellController` + `DesktopShellView`) with behavior parity
- [x] T4: Update engine exports/tests/docs to new desktop paths, run validation, and record implementation diary/changelog

## Workstream C (Extension Contracts)

- [x] C1: Add `DesktopContribution` contracts and composition utilities (menus/icons/commands/startup windows)
- [x] C2: Add contribution command routing path and integrate into shell controller before built-ins
- [x] C3: Migrate inventory app desktop menus/icons/commands/startup behavior to contributions

## Workstream D (Runtime Adapter Decoupling)

- [x] D1: Add window content adapter contracts and adapter-chain renderer
- [x] D2: Add default app/card/fallback adapters and remove direct card-host rendering from controller
- [x] D3: Allow contribution-provided adapters to extend precedence and validate with tests

## Workstream E (CSS Modularization Hard Cutover)

- [x] E1: Split `theme/base.css` into modular desktop CSS packs (`desktop/tokens.css`, `desktop/shell.css`, `desktop/primitives.css`, `desktop/chat.css`, `desktop/syntax.css`, `desktop/animations.css`)
- [x] E2: Replace app + Storybook imports from legacy `theme/base.css` to modular theme entrypoints
- [x] E3: Remove legacy `theme/base.css` and update theme/index + docs/comments to reflect cutover
- [x] E4: Validate style/build integrity (`npm run typecheck`, `npm run -w packages/engine test`) and record diary/changelog updates

## Postmortem

- [x] P1: Author HC-45 postmortem documenting plan-vs-implementation across Workstreams A-G (including HC-47/HC-48 follow-through), residual risks, and deferred cleanup scope
- [x] P2: Upload HC-45 postmortem document to reMarkable and verify remote artifact
