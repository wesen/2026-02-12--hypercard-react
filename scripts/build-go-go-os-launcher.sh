#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_BIN="${1:-${ROOT_DIR}/build/go-go-os-launcher}"

mkdir -p "$(dirname "${OUT_BIN}")"
(
  cd "${ROOT_DIR}/go-inventory-chat"
  go build -o "${OUT_BIN}" ./cmd/go-go-os-launcher
)

echo "built launcher binary: ${OUT_BIN}"
