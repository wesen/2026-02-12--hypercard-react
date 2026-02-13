#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../../.." && pwd)"
cd "$ROOT"

echo "# HyperCard Review Metrics"
echo "generated_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo
echo "## Build/Setup Checks"
echo "typecheck_command=npm run typecheck"
echo "build_command=npm run build"
echo "lint_command=npm run lint"

echo
echo "## Duplication Signals"
printf "state.setField_bindings=%s\n" "$(rg -n "Act\('state\.setField'" apps packages | wc -l | tr -d ' ')"
printf "patchScopedState_edits_resets=%s\n" "$(rg -n "patchScopedState\('card', \{ edits: \{\} \}\)" apps packages | wc -l | tr -d ' ')"
printf "json_stringify_clone_sites=%s\n" "$(rg -n "JSON\.parse\(JSON\.stringify\(" apps packages | wc -l | tr -d ' ')"
printf "as_any_casts=%s\n" "$(rg -n "\bas any\b" apps packages | wc -l | tr -d ' ')"
printf "manual_configure_store_sites=%s\n" "$(rg -n "configureStore\(" apps | wc -l | tr -d ' ')"
printf "create_app_store_sites=%s\n" "$(rg -n "createAppStore\(" apps | wc -l | tr -d ' ')"

echo
echo "## Identical File Hash Clusters"
echo "[vite.config.ts]"
md5sum apps/*/vite.config.ts

echo
echo "[main.tsx]"
md5sum apps/*/src/main.tsx

echo
echo "[app/store.ts]"
md5sum apps/*/src/app/store.ts

echo
echo "## API Drift Signals"
printf "missing_dispatchDSLAction_symbol_in_code=%s\n" "$(rg -n "dispatchDSLAction" packages/engine/src apps >/dev/null; echo $?)"
printf "missing_defineActionRegistry_symbol_in_code=%s\n" "$(rg -n "defineActionRegistry" packages/engine/src apps >/dev/null; echo $?)"
printf "missing_selectDomainData_symbol_in_code=%s\n" "$(rg -n "selectDomainData" packages/engine/src apps >/dev/null; echo $?)"
printf "action_descriptor_to_usage_sites=%s\n" "$(rg -n "\.to\b" packages/engine/src/cards/runtime.ts | wc -l | tr -d ' ')"

echo
echo "## Test Surface"
printf "test_file_count=%s\n" "$(rg --files | rg "(test|spec)\.(ts|tsx|js|jsx)$" | wc -l | tr -d ' ')"
