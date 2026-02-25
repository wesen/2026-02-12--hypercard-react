# Changelog

## 2026-02-24

- Initial workspace created
- Added detailed implementation plan for showcase scenarios `1`, `2`, `3`, `4`, and `10`
- Added execution task checklist with phased plan and DoD
- Documented scenario `11` plugin-injected context actions feasibility and additional platform requirements

## 2026-02-25

Started OS-10 implementation by completing Phase 1 context-target foundation: target contracts, target-keyed context action registry, precedence resolution, target-scoped hooks, and command invocation target metadata plumbing.

### Related Files

- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/types.ts — Added `ContextTargetKind`, `DesktopContextTargetRef`, and `contextTarget` invocation metadata.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionRegistry.ts — New target-key registry and precedence resolver (`exact -> qualified kind -> kind -> window`).
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/contextActionRegistry.test.ts — Unit tests for keying, precedence ordering, and merge conflict policy.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/desktopMenuRuntime.tsx — Added generic target-scoped context registration APIs and helper hooks.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/useDesktopShellController.tsx — Switched context action storage to target registry and included context target metadata in routed command invocations.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/DesktopShellView.tsx — Passed generic target runtime callbacks through provider wiring.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/components/shell/windowing/index.ts — Exported new context target types/hooks/registry helpers.
- /home/manuel/workspaces/2026-02-24/add-menus/go-go-os/packages/engine/src/desktop/react/index.ts — Exported new target-scoped APIs from desktop-react surface.

Validation:

- `npm run typecheck -w packages/engine`
- `npm run test -w packages/engine -- src/components/shell/windowing/contextActionRegistry.test.ts src/components/shell/windowing/desktopContributions.test.ts`
