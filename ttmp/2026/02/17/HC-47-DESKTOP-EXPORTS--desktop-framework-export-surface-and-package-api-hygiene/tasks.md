# Tasks

## TODO

- [x] F1: Create explicit desktop subpath entrypoints (`desktop-core`, `desktop-react`, `desktop-hypercard-adapter`, `desktop-theme-macos1`) and wire package exports/docs comments
- [x] F2: Hard-cutover app and story imports to subpath entrypoints for desktop/windowing APIs (remove root-barrel desktop imports at call sites)
- [x] F3: Remove legacy desktop/windowing exports from `@hypercard/engine` root barrel and keep non-desktop exports intact
- [x] F4: Validate workspace typecheck/tests and update HC-47 changelog + diary with implementation notes and commit references
