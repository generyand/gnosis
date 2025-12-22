# Configuration Reference

All configuration is done through environment variables in `apps/api/.env`.

## Required Variables

These must be set for the API to function:

| Variable | Description | Example |
|----------|-------------|---------|
| `VOYAGE_API_KEY` | Voyage AI API key for embeddings | `vo-abc123...` |
| `CEREBRAS_API_KEY` | Cerebras API key for LLM inference | `csk-xyz789...` |
| `QDRANT_URL` | Qdrant cluster URL | `https://abc.qdrant.io` |
| `QDRANT_API_KEY` | Qdrant API key | `qdr-key123...` |

## Optional Variables

### Application Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `development` | `development` or `production` |
| `LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |

### CORS Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `["http://localhost:3000"]` | JSON array of allowed origins |

Example for production:
```env
CORS_ORIGINS=["https://gnosis.example.com"]
```

### Model Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `EMBEDDING_MODEL` | `voyage-3` | Voyage AI model name |
| `LLM_MODEL` | `llama-4-scout-17b-16e-instruct` | Cerebras model name |
| `EMBEDDING_DIMENSION` | `1024` | Vector dimension (must match model) |

### Timeout Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `API_TIMEOUT` | `30.0` | Request timeout in seconds |

## Example Configuration

### Development

```env
# Required
VOYAGE_API_KEY=vo-your-key
CEREBRAS_API_KEY=csk-your-key
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key

# Development settings
ENVIRONMENT=development
LOG_LEVEL=DEBUG
CORS_ORIGINS=["http://localhost:3000"]
```

### Production

```env
# Required
VOYAGE_API_KEY=vo-production-key
CEREBRAS_API_KEY=csk-production-key
QDRANT_URL=https://production-cluster.qdrant.io
QDRANT_API_KEY=production-qdrant-key

# Production settings
ENVIRONMENT=production
LOG_LEVEL=WARNING
CORS_ORIGINS=["https://gnosis.example.com"]
API_TIMEOUT=60.0
```

### Local Qdrant (Docker)

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
```

## Validation Rules

The settings validator rejects placeholder values:

- Keys containing `your_`, `xxx`, `placeholder`, `changeme`, or `TODO`
- Empty string values for required fields

## Frontend Configuration

The Next.js frontend uses these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

For Vercel deployment, set this in the project settings.
