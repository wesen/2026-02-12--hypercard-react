---
Title: desktop-os package foundation contracts registry and single-store host
Ticket: OS-03-DESKTOP-OS-FOUNDATION
Status: complete
Topics:
    - go-go-os
    - frontend
    - architecture
    - launcher
    - desktop
    - binary
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: package.json
      Note: Workspace build and test wiring includes desktop-os
    - Path: packages/desktop-os
      Note: New foundation package implemented in this ticket
    - Path: packages/desktop-os/src/__tests__/launcherStore.test.ts
      Note: Store and reducer-collision tests
    - Path: packages/desktop-os/src/contracts/appManifest.ts
      Note: App manifest and state key invariants
    - Path: packages/desktop-os/src/registry/createAppRegistry.ts
      Note: Deterministic registry with uniqueness validation
    - Path: packages/desktop-os/src/store/createLauncherStore.ts
      Note: Single-store reducer composition and selector helpers
    - Path: packages/engine
      Note: Runtime dependency consumed by desktop-os
    - Path: ttmp/2026/02/24/OS-03-DESKTOP-OS-FOUNDATION--desktop-os-package-foundation-contracts-registry-and-single-store-host/design-doc/01-os-03-implementation-plan.md
      Note: Implementation reference plan
ExternalSources: []
Summary: Build the new `packages/desktop-os` foundation package with stable frontend contracts, runtime registry, app-key semantics, and a single global store composer.
LastUpdated: 2026-02-24T14:00:26.865426287-05:00
WhatFor: Use this ticket to implement the shared runtime package that all launcher-host UI and app modules depend on.
WhenToUse: Use when implementing or changing app manifests, module registration, launcher runtime composition, or the single-store strategy.
---



# desktop-os package foundation contracts registry and single-store host

## Overview

This ticket delivers the first executable layer of the launcher architecture: a new `packages/desktop-os` package that defines contracts and runtime composition rules for launchable apps.

## Key Links

- Design plan: `design-doc/01-os-03-implementation-plan.md`
- Tasks: `tasks.md`
- Changelog: `changelog.md`

## Status

Current status: **complete**

## Topics

- go-go-os
- frontend
- architecture
- launcher
- desktop
- binary

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
