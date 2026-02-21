# Changelog

## 2026-02-20

- Initial workspace created


## 2026-02-20

Created HC-52 and documented a phased migration plan to decommission tool_result.customKind remap in favor of first-class hypercard timeline kinds, including compatibility window and removal criteria.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-52-CUSTOMKIND-KIND-CUTOVER--remove-customkind-remap-by-moving-to-first-class-hypercard-timeline-kinds/design-doc/01-customkind-decommission-plan-and-kind-cutover-analysis.md — Primary implementation analysis and plan
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-52-CUSTOMKIND-KIND-CUTOVER--remove-customkind-remap-by-moving-to-first-class-hypercard-timeline-kinds/reference/01-diary.md — Investigation trace
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-52-CUSTOMKIND-KIND-CUTOVER--remove-customkind-remap-by-moving-to-first-class-hypercard-timeline-kinds/tasks.md — Execution checklist C1-C8


## 2026-02-20

Implemented HC-52 hard cutover: backend timeline projector now emits first-class hypercard kinds; frontend removed legacy customKind remap dependency in timeline mapper; artifact extraction now handles first-class timeline kinds; added migration validation playbook.

### Related Files

- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/go-inventory-chat/internal/pinoweb/hypercard_events.go — First-class timeline kind emission
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/chat/sem/timelineMapper.ts — Hard-cutover mapping path
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/packages/engine/src/hypercard/artifacts/artifactRuntime.ts — First-class kind artifact parsing
- /home/manuel/workspaces/2026-02-14/hypercard-add-webchat/2026-02-12--hypercard-react/ttmp/2026/02/20/HC-52-CUSTOMKIND-KIND-CUTOVER--remove-customkind-remap-by-moving-to-first-class-hypercard-timeline-kinds/playbooks/01-kind-cutover-validation-playbook.md — Validation checklist

