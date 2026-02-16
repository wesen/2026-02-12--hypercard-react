# Changelog

## 2026-02-16

- Created ticket `HC-039-WEBCHAT-PROFILE-SINK-CUTOVER` to replace planner/tag compatibility paths with profile + FilteringSink + typed SEM/timeline flow.
- Imported source document from HC-033 into local ticket sources for direct traceability.
- Added implementation plan anchored to source sections:
  - Geppetto middlewares and FilteringSink (sections 3.1 to 3.4),
  - LLM-to-plugin architecture and protocol (sections 4.1 to 4.8),
  - MVP plan and prompt protocol (section 5.11 and Appendix B),
  - SEM mapping and two-phase generation (Appendix E).
- Added prompt pack for:
  - default inventory assistant profile,
  - card-generator profile,
  - two-phase `create-card` follow-up prompt template.
- Added exhaustive phased task list covering profile runtime, structured sink extractors, SEM projection, timeline hydration, frontend cutover, validation gate hardening, and compatibility removals.
- Added validation runbook and diary scaffold.
