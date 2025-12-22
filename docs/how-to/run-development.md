# Run in Development

This guide covers different ways to run Gnosis during development.

## Run Everything

From the repository root:

```bash
pnpm dev
```

This starts both the API (port 8000) and web frontend (port 3000) using Turborepo.

## Run Individual Services

### Frontend Only

```bash
pnpm dev:web
```

Starts Next.js at http://localhost:3000. Requires the API to be running for full functionality.

### API Only

```bash
pnpm dev:api
```

Or directly:

```bash
cd apps/api
uv run uvicorn main:app --reload --port 8000
```

## API Development Features

### Interactive Documentation

When the API is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Export OpenAPI Schema

Generate the schema file for frontend type generation:

```bash
cd apps/api
uv run python -c "from main import app; import json; print(json.dumps(app.openapi()))" > openapi.json
```

### Regenerate Frontend Types

After updating API schemas:

```bash
pnpm generate:api
```

This runs Orval to regenerate TypeScript types and React Query hooks.

## Frontend Development Features

### Hot Module Replacement

Next.js automatically reloads when you edit:
- Components in `apps/web/components/`
- Pages in `apps/web/app/`
- Styles in `globals.css`

### React Query DevTools

In development, React Query DevTools are available. Click the floating icon to inspect:
- Active queries
- Cache state
- Refetch controls

## Environment-Specific Settings

### Development Defaults

```env
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=["http://localhost:3000"]
```

### Enable Debug Logging

For verbose API logs:

```env
LOG_LEVEL=DEBUG
```

## Common Development Tasks

### Clear Browser State

The frontend persists graph state in localStorage. To reset:

1. Open browser DevTools
2. Go to Application > Local Storage
3. Delete `gnosis-state`

Or click the "Clear" button in the UI when nodes exist.

### Clear Vector Database

To reset Qdrant collection:

```python
from qdrant_client import QdrantClient

client = QdrantClient(url="...", api_key="...")
client.delete_collection("gnosis_concepts")
```

The API recreates it automatically on next startup.

## Troubleshooting

### Port conflicts

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### Type errors after API changes

Regenerate types:

```bash
pnpm generate:api
pnpm check-types
```
