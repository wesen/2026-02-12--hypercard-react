#!/usr/bin/env bash

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

if ! command -v websocat >/dev/null 2>&1; then
  echo "websocat is required" >&2
  exit 1
fi

BASE_URL="${BASE_URL:-http://127.0.0.1:18081}"
CONVERSATION_ID="${1:-hc033-sem-smoke}"
PROMPT="${PROMPT:-Show low stock below 2}"

stream_file="$(mktemp)"
trap 'rm -f "$stream_file"' EXIT

request_payload="$(jq -nc \
  --arg conversation_id "$CONVERSATION_ID" \
  --arg prompt "$PROMPT" \
  '{conversationId: $conversation_id, messages: [{role: "user", text: $prompt}]}' \
)"

completion_response="$(
  curl -sS \
    -X POST \
    "$BASE_URL/api/chat/completions" \
    -H "content-type: application/json" \
    --data "$request_payload"
)"

echo "completion_response=$completion_response"

stream_url="$(printf "%s" "$completion_response" | jq -r '.streamUrl')"
if [[ -z "$stream_url" || "$stream_url" == "null" ]]; then
  echo "streamUrl missing in completion response" >&2
  exit 1
fi

echo "stream_url=$stream_url"

websocat "$stream_url" >"$stream_file" 2>/dev/null || true

echo "sem_event_counts:"
jq -R 'fromjson? | select(.sem == true) | .event.type' "$stream_file" | sort | uniq -c

timeline_response="$(
  curl -sS "$BASE_URL/api/timeline?conversation_id=$CONVERSATION_ID"
)"

echo "timeline_summary:"
printf "%s" "$timeline_response" | jq '{messages: (.messages | length), events: (.events | length), lastSeq}'
