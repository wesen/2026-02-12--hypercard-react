# Changelog

## 2026-02-25

- Initial workspace created

## 2026-02-26

- Opened OS-15 as a dedicated bug report for context-action effect cleanup loops causing `Maximum update depth exceeded`.
- Added detailed research design doc:
  - `design-doc/01-max-update-depth-loop-root-cause-and-fix-strategy.md`
  - includes stack-trace mapping, code-line evidence, dependency-cycle analysis, fix options, and recommended architecture change.
- Replaced placeholder task list with granular execution plan (`OS15-00` through `OS15-35`).
- Uploaded ticket bundle to reMarkable as `OS-15 Max Update Depth Bug Research` under `/ai/2026/02/26/OS-15-CONTEXT-ACTION-EFFECT-LOOP`.
- Implemented runtime fix track:
  - split menu runtime provider into registration-only context + open-context-menu context (`desktopMenuRuntime.tsx`).
  - moved desktop context-menu UI state from controller-local `useState` into Redux (`windowing.desktop.contextMenu`) with new selector and reducers.
  - routed close/open flows through Redux actions and sanitized stored menu entries to avoid persisting runtime visibility predicates.
- Added/updated tests:
  - expanded `src/__tests__/windowing.test.ts` to cover context-menu reducers/selectors and transient clearing.
  - validated targeted windowing/context-action tests and package/workspace typecheck.
- Validation commands completed:
  - `npm run build -w packages/engine`
  - `docmgr doctor --ticket OS-15-CONTEXT-ACTION-EFFECT-LOOP --stale-after 30` (all checks passed).
- Added `reference/01-diary.md` with detailed implementation log, failures, fixes, and review instructions.
