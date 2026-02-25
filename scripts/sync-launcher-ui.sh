#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="${ROOT_DIR}/apps/os-launcher/dist"
DST_DIR="${ROOT_DIR}/go-inventory-chat/internal/launcherui/dist"
EMBED_SENTINEL="${DST_DIR}/.embedkeep"

if [[ ! -d "${SRC_DIR}" ]]; then
  echo "launcher dist not found: ${SRC_DIR}" >&2
  echo "run: npm run launcher:frontend:build" >&2
  exit 1
fi

rm -rf "${DST_DIR}"
mkdir -p "${DST_DIR}"
cp -R "${SRC_DIR}/." "${DST_DIR}/"
printf 'placeholder file for go:embed all:dist on clean checkouts\n' >"${EMBED_SENTINEL}"

echo "synced launcher assets"
echo "  from: ${SRC_DIR}"
echo "    to: ${DST_DIR}"
