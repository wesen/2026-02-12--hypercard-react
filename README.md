# go-go-os

`go-go-os` is the platform repository for shared desktop frontend packages plus the backend module host library.

It no longer owns:
- the inventory frontend app (`go-go-app-inventory/apps/inventory`)
- the launcher frontend bundle (`wesen-os/apps/os-launcher`)

## What Lives Here

- Frontend platform packages:
  - `packages/engine`
  - `packages/desktop-os`
  - `packages/confirm-runtime`
- Example/demo apps that exercise platform APIs:
  - `apps/todo`
  - `apps/crm`
  - `apps/book-tracker-debug`
- Backend module host package:
  - `go-go-os/pkg/backendhost`

## Repository Layout

```text
go-go-os/
  apps/
    todo/
    crm/
    book-tracker-debug/
  packages/
    engine/
    desktop-os/
    confirm-runtime/
  go-go-os/
    pkg/backendhost/
```

## Frontend Quick Start

```bash
npm install
npm run build
npm run test
npm run storybook
```

## Backend Host Package

The Go module for backend host contracts is nested in `go-go-os/go-go-os`.

```bash
cd go-go-os
go test ./...
```

## Ownership Boundary

Use this repo when you are:
- building shared desktop platform primitives
- extending app-host contracts (`backendhost`)
- updating shared Storybook/catalog tooling

Use other repos when you are:
- editing inventory app UX or reducers -> `go-go-app-inventory`
- editing launcher composition UI/bundling/smoke flow -> `wesen-os`
