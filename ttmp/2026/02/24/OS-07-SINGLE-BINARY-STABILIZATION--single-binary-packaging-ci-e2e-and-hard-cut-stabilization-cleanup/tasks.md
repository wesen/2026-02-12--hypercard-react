# Tasks

## Execution Checklist

- [x] `OS07-01` Add launcher frontend production build command and document inputs/outputs.
- [x] `OS07-02` Add artifact copy step from frontend dist into Go embed target directory.
- [x] `OS07-03` Add Go `//go:embed` wiring and static asset HTTP handler for launcher UI.
- [x] `OS07-04` Add launcher binary entrypoint command composing backend modules + embedded UI.
- [x] `OS07-05` Add local one-command build script/Make target for final launcher binary.
- [x] `OS07-06` Add CI job for frontend lint/test/build for launcher-related packages.
- [x] `OS07-07` Add CI job for Go tests including backend module host integration tests.
- [x] `OS07-08` Add CI e2e smoke job that boots binary and validates launcher shell availability.
- [x] `OS07-09` Add e2e test that opens one app and verifies namespaced backend call path.
- [x] `OS07-10` Add regression checks confirming legacy aliases are not reachable.
- [x] `OS07-11` Add startup verification checks for required backend module readiness.
- [x] `OS07-12` Add performance sanity checks (startup time/logging) for local smoke runs.
- [x] `OS07-13` Remove stale migration scripts and deprecated architecture references.
- [x] `OS07-14` Update root README with launcher-first architecture and quickstart commands.
- [x] `OS07-15` Add operator runbook for build, launch, troubleshooting, and health checks.
- [x] `OS07-16` Run full validation (`npm run lint test build`, `go test ./...`, e2e smoke) and record results.
- [x] `OS07-17` Run `docmgr doctor --ticket OS-07-SINGLE-BINARY-STABILIZATION --stale-after 30`.

## Definition of Done

- [x] One binary serves launcher frontend and backend app modules.
- [x] CI enforces lint/test/build/e2e and hard-cut route policy.
- [x] Repository docs and scripts reflect launcher-first operation only.
