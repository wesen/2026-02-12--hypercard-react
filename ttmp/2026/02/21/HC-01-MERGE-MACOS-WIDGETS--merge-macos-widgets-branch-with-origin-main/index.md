---
Title: Merge macOS widgets branch with origin/main
Ticket: HC-01-MERGE-MACOS-WIDGETS
Status: active
Topics:
    - frontend
    - debugging
    - cleanup
    - architecture
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/design-doc/01-merge-conflict-investigation.md
      Note: Primary conflict analysis and merge plan
    - Path: ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/reference/01-diary.md
      Note: Detailed step-by-step investigation log
    - Path: ttmp/2026/02/21/HC-01-MERGE-MACOS-WIDGETS--merge-macos-widgets-branch-with-origin-main/scripts/capture_merge_state.sh
      Note: Reusable conflict snapshot tool for this ticket
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-21T13:22:48.266975887-05:00
WhatFor: ""
WhenToUse: ""
---


# Merge macOS widgets branch with origin/main

## Overview

Investigation ticket for merging `task/add-more-macos-widgets` into current `origin/main`.

Current findings:
- Divergence since merge base `b1e64e25`: branch `+10` commits, `origin/main +75` commits.
- Unmerged paths currently present: 44 (`UD 15`, `AU 7`, `UA 7`, `DD 7`, `UU 7`, `DU 1`).
- Conflict volume is mostly chat/hypercard extraction overlap, not the new widget component additions.

See the design doc for conflict taxonomy and a phased resolution sequence.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field
- **Design Doc**: `design-doc/01-merge-conflict-investigation.md`
- **Diary**: `reference/01-diary.md`
- **Snapshot Script**: `scripts/capture_merge_state.sh`
- **Evidence Artifacts**: `various/`

## Status

Current status: **active**

## Topics

- frontend
- debugging
- cleanup
- architecture

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
