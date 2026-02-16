#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../../../../" && pwd)"
BACKEND_DIR="${ROOT_DIR}/go-inventory-chat"
API_URL="${API_URL:-http://127.0.0.1:18081}"
PROMPT="${1:-show low stock below 3}"

if ! curl -fsS "${API_URL}/healthz" >/dev/null; then
  echo "Backend is not running at ${API_URL}."
  echo "Run: cd ${BACKEND_DIR} && GOWORK=off go run ./cmd/inventory-chat serve --db ./data/inventory.db --addr :18081 --allow-origin '*'"
  exit 1
fi

REQUEST=$(cat <<JSON
{"conversationId":"conv-smoke","messages":[{"role":"user","text":"${PROMPT}"}]}
JSON
)

RESP=$(curl -sS -X POST "${API_URL}/api/chat/completions" -H 'Content-Type: application/json' -d "${REQUEST}")
echo "Completion response: ${RESP}"

URL=$(node -e "const r=JSON.parse(process.argv[1]); process.stdout.write(r.streamUrl);" "${RESP}")

echo "--- Stream frames ---"
node -e "const url=process.argv[1]; const ws=new WebSocket(url); ws.onmessage=(e)=>console.log(String(e.data)); ws.onerror=(e)=>{console.error('ws error',e); process.exit(1)}; ws.onclose=()=>process.exit(0);" "${URL}"
