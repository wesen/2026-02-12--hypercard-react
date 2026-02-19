---
Title: Remove Suggestions For Now
Ticket: HC-59-REMOVE-SUGGESTIONS-FOR-NOW
Status: active
Topics:
    - architecture
    - chat
    - frontend
    - timeline
    - inventory
    - cleanup
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: Remove suggestions end-to-end as a temporary simplification step ahead of chat runtime refactor implementation.
LastUpdated: 2026-02-19T17:48:28.104039602-05:00
WhatFor: Reduce runtime migration complexity by deleting suggestion UX/state/event paths for now.
WhenToUse: Use while implementing and reviewing HC-59 removal changes and validation results.
---

# Remove Suggestions For Now

## Overview
HC-59 removes suggestions across inventory and engine chat surfaces with no fallback path. This is a deliberate simplification to reduce coupling while HC-58 refactors runtime ownership and timeline-native rendering.

The ticket currently contains a concrete file-level implementation plan and a detailed diary including reMarkable upload verification.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- architecture
- chat
- frontend
- timeline
- inventory
- cleanup

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
