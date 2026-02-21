---
Title: Cleanup and consolidation after webchat extraction refactor
Ticket: HC-02-CLEANUP-WEBCHAT-REFACTOR
Status: active
Topics:
    - cleanup
    - architecture
    - frontend
    - chat
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/01-exhaustive-legacy-and-consolidation-assessment-after-hc-01.md
      Note: Exhaustive cleanup assessment report
    - Path: ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/design-doc/03-f8-artifact-runtime-cleanup-analysis-and-wiring-plan.md
      Note: |-
        F8 deep analysis and cleanup/wiring plan
        F8 implementation plan and keep/wire/remove matrix
    - Path: ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/reference/01-diary.md
      Note: Detailed investigation diary
    - Path: ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/various/01-hc01-touched-files-existing.txt
      Note: Full surviving touched-file inventory
    - Path: ttmp/2026/02/20/HC-02-CLEANUP-WEBCHAT-REFACTOR--cleanup-and-consolidation-after-webchat-extraction-refactor/various/02-hc01-touched-files-removed.txt
      Note: Full removed touched-file inventory
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-20T16:24:03.826392976-05:00
WhatFor: Track post-HC-01 cleanup and consolidation work by converting exhaustive leftover assessment findings into an execution backlog.
WhenToUse: Use for planning and implementing the next cleanup tranche after the webchat extraction hard cutover.
---




# Cleanup and consolidation after webchat extraction refactor

## Overview

This ticket captures the exhaustive post-refactor cleanup assessment for `HC-01-EXTRACT-WEBCHAT` and translates findings into concrete cleanup tasks. It focuses on functional leftovers, lifecycle/API consolidation, and removal of dead transitional scaffolding.

Investigation scope is grounded in all HC-01 code commits and all touched files (111 unique paths), with path inventories stored under `various/`.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- cleanup
- architecture
- frontend
- chat

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
