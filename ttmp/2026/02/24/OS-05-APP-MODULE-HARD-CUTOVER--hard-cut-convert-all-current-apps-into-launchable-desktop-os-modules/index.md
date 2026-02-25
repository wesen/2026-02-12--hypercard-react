---
Title: hard-cut convert all current apps into launchable desktop-os modules
Ticket: OS-05-APP-MODULE-HARD-CUTOVER
Status: complete
Topics:
    - go-go-os
    - frontend
    - architecture
    - launcher
    - desktop
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/book-tracker-debug/src
      Note: Book tracker module conversion target
    - Path: apps/crm/src
      Note: CRM module conversion target
    - Path: apps/inventory/src
      Note: Inventory module conversion target
    - Path: apps/todo/src
      Note: Todo module conversion target
ExternalSources: []
Summary: Hard-cut migration of existing frontend apps into `LaunchableAppModule` implementations consumed by the new launcher host.
LastUpdated: 2026-02-24T15:08:49.206856388-05:00
WhatFor: Use this ticket to move app-specific boot logic into desktop-os module contracts and remove legacy standalone boot paths.
WhenToUse: Use when implementing or modifying per-app module adapters and launch metadata.
---



# hard-cut convert all current apps into launchable desktop-os modules

## Overview

This ticket performs the app-side migration: every current app becomes a `desktop-os` launchable module, and old standalone boot paths are removed.

## Key Links

- Design plan: `design-doc/01-os-05-implementation-plan.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **active**

## Topics

- go-go-os
- frontend
- architecture
- launcher
- desktop

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
