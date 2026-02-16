#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_PATH="${1:-${ROOT_DIR}/data/inventory.db}"

cd "${ROOT_DIR}"
go run ./cmd/inventory-chat seed --db "${DB_PATH}" --force

echo "Seeded SQLite database at ${DB_PATH}"
