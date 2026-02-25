---
Title: hard-cut backend module host with namespaced app routes only
Ticket: OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER
Status: complete
Topics:
    - go-go-os
    - backend
    - architecture
    - launcher
    - binary
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: go-inventory-chat
      Note: Backend host and route composition code
    - Path: ttmp/2026/02/24/OS-06-BACKEND-MODULE-HOST-HARD-CUTOVER--hard-cut-backend-module-host-with-namespaced-app-routes-only/design-doc/01-os-06-implementation-plan.md
      Note: Backend migration plan
ExternalSources: []
Summary: Implement backend module composition and namespaced app routes (`/api/apps/<app-id>/*`) with a hard cutover away from legacy aliases.
LastUpdated: 2026-02-24T19:28:25.741692104-05:00
WhatFor: Use this ticket to build backend-side app module hosting so launcher apps can ship optional backend capabilities.
WhenToUse: Use when implementing backend registry/lifecycle, app route mounts, or OS manifest endpoint behavior.
---



# hard-cut backend module host with namespaced app routes only

## Overview

This ticket introduces backend module composition for launcher apps and enforces namespaced app routes with no compatibility aliases.

## Key Links

- Design plan: `design-doc/01-os-06-implementation-plan.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

## Topics

- go-go-os
- backend
- architecture
- launcher
- binary

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
