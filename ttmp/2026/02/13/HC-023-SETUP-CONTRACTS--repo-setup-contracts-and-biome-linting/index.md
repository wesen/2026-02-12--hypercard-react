---
Title: Repo Setup Contracts and Biome Linting
Ticket: HC-023-SETUP-CONTRACTS
Status: complete
Topics:
    - architecture
    - code-quality
    - review
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: package.json
      Note: Root script contract currently fails for build/lint
    - Path: tsconfig.json
      Note: Root typecheck references currently exclude apps/todo and apps/crm
    - Path: packages/engine/package.json
      Note: Missing build script currently breaks root build orchestration
    - Path: ttmp/2026/02/13/HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md
      Note: Parent finding source (findings 3/4/5)
ExternalSources: []
Summary: Hardens root build/typecheck/lint contracts and migrates linting to Biome.
LastUpdated: 2026-02-17T07:40:35.559940115-05:00
WhatFor: Establish reliable repo-wide quality gates for CI and local development
WhenToUse: Use when implementing or validating root tooling contract fixes
---


# Repo Setup Contracts and Biome Linting

## Overview

This ticket implements setup-contract fixes from HC-022 findings 3, 4, and 5.

Scope:

- make root `build` reliable
- make root `typecheck` cover all apps
- replace current lint gap with Biome-based linting/formatting contract

## Key Links

- Handoff implementation plan: `design-doc/01-implementation-handoff-plan.md`
- Task checklist: `tasks.md`
- Parent review: `../HC-022-CODE-REVIEW--setup-and-dsl-js-api-architecture-review/design-doc/01-in-depth-setup-and-dsl-js-api-review.md`

## Status

Current status: **active**

## Tasks

See `tasks.md`.

## Changelog

See `changelog.md`.
