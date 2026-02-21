# Changelog

## 2026-02-12

- Initial workspace created


## 2026-02-12

Completed deep analysis of minimal-JS LLM card authoring and proposed custom CardKit API with architecture, schema, compiler, and implementation roadmap.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/ttmp/2026/02/12/HC-009-LLM-CARD-AUTHORING-API--llm-minimal-javascript-authoring-for-interactive-cards/design/01-research-and-design-minimal-js-api-for-llm-generated-interactive-cards.md — 7+ page design and implementation research deliverable


## 2026-02-12

Executed HC-009 DSL/JS API implementation plan end-to-end: added engine action/selector registries, migrated Todo and Inventory to registry wiring, hardened registry typing inference, and validated with typecheck/frontmatter checks. Commits: ce23232, 830c9ad, 775257f, 6ee7523, 3ac552d.

### Related Files

- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/inventory/src/app/domainActionHandler.ts — Inventory migration to registry-driven actions
- /home/manuel/code/wesen/2026-02-12--hypercard-react/apps/todo/src/app/domainActionHandler.ts — Todo migration to registry-driven actions
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/actionRegistry.ts — Registry action wiring and payload mapping abstraction
- /home/manuel/code/wesen/2026-02-12--hypercard-react/packages/engine/src/api/selectorRegistry.ts — Domain-data selector registry abstraction


## 2026-02-17

Bulk close through HC-034 per cleanup reset

