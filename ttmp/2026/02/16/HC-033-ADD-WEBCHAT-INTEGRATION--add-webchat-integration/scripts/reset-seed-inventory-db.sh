#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../../../../" && pwd)"
DB_PATH="${1:-${ROOT_DIR}/go-inventory-chat/data/inventory.db}"

cd "${ROOT_DIR}/go-inventory-chat"
go run ./cmd/hypercard-inventory-seed --db "${DB_PATH}" --reset
