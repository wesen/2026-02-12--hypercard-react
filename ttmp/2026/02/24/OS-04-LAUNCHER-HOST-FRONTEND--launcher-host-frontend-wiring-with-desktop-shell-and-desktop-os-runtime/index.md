---
Title: launcher host frontend wiring with desktop-shell and desktop-os runtime
Ticket: OS-04-LAUNCHER-HOST-FRONTEND
Status: active
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
    - Path: apps
      Note: Launcher host app will be added under apps/ during OS-04
    - Path: packages/desktop-os
      Note: Runtime APIs consumed by launcher host
    - Path: packages/engine
      Note: Desktop shell primitives consumed by launcher host
ExternalSources: []
Summary: Build the launcher host frontend app that wires DesktopShell to the desktop-os runtime, registry, and single-store orchestration.
LastUpdated: 2026-02-24T14:00:26.923972659-05:00
WhatFor: Use this ticket to implement the actual launcher UI host that consumes desktop-os APIs and replaces app-by-app boot assumptions.
WhenToUse: Use when wiring launcher shell, icon surfaces, window lifecycle orchestration, and host-level providers.
---



# launcher host frontend wiring with desktop-shell and desktop-os runtime

## Overview

This ticket converts architecture into a running launcher host UI by creating the thin app shell that composes the `desktop-os` package with existing `engine` primitives.

## Key Links

- Design plan: `design-doc/01-os-04-implementation-plan.md`
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
