# Deploy to Production

This guide covers deploying Gnosis to production environments.

## Architecture for Production

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Railway   │────▶│   Qdrant    │
│  (Frontend) │     │   (API)     │     │   Cloud     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │ Voyage  │   │Cerebras │
              │   AI    │   │         │
              └─────────┘   └─────────┘
```

## Deploy the API

### Option A: Railway

1. Connect your GitHub repository
2. Select the `apps/api` directory
3. Set environment variables:
   ```
   VOYAGE_API_KEY=...
   CEREBRAS_API_KEY=...
   QDRANT_URL=...
   QDRANT_API_KEY=...
   ENVIRONMENT=production
   CORS_ORIGINS=["https://your-frontend.vercel.app"]
   ```
4. Deploy

Railway auto-detects Python and uses uvicorn.

### Option B: Fly.io

Create `apps/api/fly.toml`:

```toml
app = "gnosis-api"
primary_region = "ord"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  ENVIRONMENT = "production"

[http_service]
  internal_port = 8000
  force_https = true

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

Deploy:

```bash
cd apps/api
fly launch
fly secrets set VOYAGE_API_KEY=... CEREBRAS_API_KEY=... QDRANT_URL=... QDRANT_API_KEY=...
```

### Option C: Docker

Create `apps/api/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN pip install uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t gnosis-api .
docker run -p 8000:8000 --env-file .env gnosis-api
```

## Deploy the Frontend

### Vercel (Recommended)

1. Import your repository
2. Set root directory to `apps/web`
3. Framework preset: Next.js
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
5. Deploy

### Alternative: Self-hosted

Build and serve:

```bash
cd apps/web
pnpm build
pnpm start
```

Or use the standalone output:

```bash
# In next.config.ts, add:
# output: 'standalone'

pnpm build
node .next/standalone/server.js
```

## Production Configuration

### API Settings

```env
ENVIRONMENT=production
LOG_LEVEL=WARNING
API_TIMEOUT=60.0
CORS_ORIGINS=["https://your-domain.com"]
```

### Security Checklist

- [ ] Set restrictive CORS origins
- [ ] Use HTTPS everywhere
- [ ] Rotate API keys regularly
- [ ] Enable rate limiting (via reverse proxy)
- [ ] Monitor error rates

### Qdrant Cloud Setup

For production, use Qdrant Cloud:

1. Create a production cluster (not free tier for high availability)
2. Enable authentication
3. Set up backups
4. Monitor collection size

## Monitoring

### Health Checks

Configure your platform to ping:
- API: `GET /health`
- Frontend: `GET /`

### Logging

The API logs to stdout. Configure your platform to capture:
- Request/response times
- Error traces
- LLM token usage

## Scaling Considerations

### API

- Stateless - scale horizontally
- Consider caching LLM responses
- Monitor Voyage AI rate limits

### Qdrant

- Collection size grows with usage
- Consider retention policies
- Monitor query latency

### Cost Optimization

| Service | Cost Factor | Optimization |
|---------|-------------|--------------|
| Cerebras | Tokens | Use smaller model, cache responses |
| Voyage AI | Embeddings | Batch requests, deduplicate |
| Qdrant | Storage + queries | Prune old vectors |
