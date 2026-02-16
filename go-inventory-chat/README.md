# go-inventory-chat

Minimal Go backend for the inventory chat integration in `apps/inventory`.

## Features

- SQLite-backed inventory and sales data
- Deterministic chat planner with tool-style data queries
- `POST /api/chat/completions` endpoint
- `GET /ws` streaming endpoint (SEM envelope only)
- Per-conversation timeline projection (messages + bounded SEM event buffer)
- `GET /api/timeline` hydration endpoint for reconnect/reload
- Seed command and script for mock data

## Endpoints

- `POST /api/chat/completions`
- `GET /ws?conversation_id=<id>&message_id=<id>`
- `GET /api/timeline?conversation_id=<id>`
- `GET /healthz`

## Run

```bash
cd go-inventory-chat

# seed (reset)
./scripts/seed.sh

# serve
go run ./cmd/inventory-chat serve --db ./data/inventory.db --allow-origin http://localhost:5173
```

## Request example

```json
{
  "conversationId": "default",
  "messages": [
    { "role": "user", "text": "show low stock below 3" }
  ]
}
```
