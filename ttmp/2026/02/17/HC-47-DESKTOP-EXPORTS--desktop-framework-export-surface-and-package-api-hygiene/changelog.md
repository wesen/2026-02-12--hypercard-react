# Changelog

## 2026-02-17

- Initial workspace created
- Implemented Workstream F hard cutover in commit `dd87bee`: added desktop subpath entrypoints, package export map, removed root desktop/windowing exports, and migrated app/story imports.
- Validation: `npm run typecheck` and `npm run test -w packages/engine` passed after cutover.
