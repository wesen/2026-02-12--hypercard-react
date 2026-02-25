---
Title: launcher modules render real apps and chat stacks
Ticket: OS-08-REAL-APP-LAUNCH-CUTOVER
Status: active
Topics:
    - go-go-os
    - frontend
    - launcher
    - desktop
DocType: index
Intent: long-term
Owners: []
RelatedFiles: []
ExternalSources: []
Summary: ""
LastUpdated: 2026-02-24T20:00:39.276209514-05:00
WhatFor: Replace placeholder launcher module UIs with real app windows and restore inventory chat/cards behavior under launcher composition.
WhenToUse: Use when implementing or validating launcher icon -> real app window integration across inventory, todo, crm, and book-tracker modules.
---

# launcher modules render real apps and chat stacks

## Overview

This ticket converts launcher modules from placeholder diagnostic panes to real app windows.

Primary outcomes:

1. inventory launcher window restores real chat/cards/actions behavior
2. todo/crm/book-tracker launcher windows render actual app surfaces
3. tests guard against placeholder reintroduction

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field

## Status

Current status: **active**

## Topics

- go-go-os
- frontend
- launcher
- desktop

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
