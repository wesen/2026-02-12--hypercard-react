# Changelog

## 2026-02-16

- Initial workspace created
- Added `design-doc/01-js-card-middleware-and-frontend-injection-implementation-guide-with-dsl-spec.md` consolidating:
  - middleware prompt/schema update instructions for full JS cards
  - frontend runtime injection plumbing instructions
  - canonical DSL/runtime spec chapter with executable examples
- Rewrote the design doc to a strict hard-cutover plan:
  - no backward compatibility lane
  - explicit removal list for deprecated backend/frontend/test surfaces
  - runtime-card-only envelope and event path
