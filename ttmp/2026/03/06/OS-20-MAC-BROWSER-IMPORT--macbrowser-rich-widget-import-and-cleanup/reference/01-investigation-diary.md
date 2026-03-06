---
Title: MacBrowser investigation diary
Ticket: OS-20-MAC-BROWSER-IMPORT
Status: complete
Topics:
  - frontend
  - widgets
  - storybook
  - state-management
DocType: reference
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-03-06T14:40:00-05:00
WhatFor: ""
WhenToUse: ""
---

# Investigation Diary

## 2026-03-06

- Created the ticket workspace and captured the initial import plan.
- Rebuilt `imports/mac-browser.jsx` into `packages/rich-widgets/src/mac-browser/` as a real rich widget with shared toolbar/status primitives instead of the fake browser window shell.
- Extracted `sampleData.ts` and `markdown.ts` so built-in pages and browser-specific markdown/link parsing are isolated from the UI shell.
- Added `macBrowserState.ts` and `macBrowserState.test.ts` for seedable address, history, editor, and custom-page state.
- Added `MacBrowser.stories.tsx` with Redux-seeded welcome, missing-page, editing, and custom-page scenarios.
- Wired the widget into `packages/rich-widgets/src/launcher/modules.tsx`, `packages/rich-widgets/src/index.ts`, `packages/rich-widgets/src/parts.ts`, and `packages/rich-widgets/src/theme/index.ts`.
- Validation passed with `npm run test -w packages/rich-widgets`, `npm run storybook:check`, and live Storybook verification on port `6006` for `richwidgets-macbrowser--custom-page`.
