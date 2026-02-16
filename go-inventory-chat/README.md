# go-inventory-chat

Minimal Go backend for the inventory chat integration in `apps/inventory`.

## Features

- SQLite-backed inventory and sales data
- Pinocchio app-owned web-chat transport (`/chat` + `/ws`)
- Geppetto runtime composition (provider/model/API-key configurable)
- Inventory SQLite tool registration (`inventory_query`)
- Durable Pinocchio timeline store + turn store (SQLite)
- Frontend-hydratable timeline projection via `GET /api/timeline`
- Seed command and script for mock data

## Endpoints

- `POST /chat`
- `GET /ws?conv_id=<id>`
- `GET /api/timeline?conv_id=<id>`
- `GET /healthz`

## Run

```bash
cd go-inventory-chat

# seed (reset)
./scripts/seed.sh

# serve
go run ./cmd/inventory-chat serve \
  --db ./data/inventory.db \
  --timeline-db ./data/webchat-timeline.db \
  --turns-db ./data/webchat-turns.db \
  --allow-origin http://127.0.0.1:15173 \
  --llm-enabled=false
```

## Request example

```json
{
  "conv_id": "default",
  "prompt": "show low stock below 3"
}
```
