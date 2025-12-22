# Configure API Keys

This guide explains how to obtain and configure the required API keys for Gnosis.

## Required Services

Gnosis requires three external services:

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Voyage AI](https://voyageai.com) | Text embeddings | Yes |
| [Cerebras](https://cerebras.ai) | LLM inference | Yes |
| [Qdrant](https://qdrant.tech) | Vector database | Yes (1GB) |

## Get Voyage AI Key

1. Go to [dash.voyageai.com](https://dash.voyageai.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new key
5. Copy the key (starts with `vo-`)

## Get Cerebras Key

1. Go to [cloud.cerebras.ai](https://cloud.cerebras.ai)
2. Sign up or log in
3. Navigate to **API Keys**
4. Generate a new key
5. Copy the key (starts with `csk-`)

## Set Up Qdrant

### Option A: Qdrant Cloud (Recommended)

1. Go to [cloud.qdrant.io](https://cloud.qdrant.io)
2. Create a free cluster
3. Note your cluster URL (e.g., `https://abc-123.aws.cloud.qdrant.io`)
4. Generate an API key from the cluster dashboard

### Option B: Self-Hosted

Run Qdrant locally with Docker:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

Use these settings:
```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Leave empty for local
```

## Configure the Environment

Create or edit `apps/api/.env`:

```env
# Voyage AI - Embeddings
VOYAGE_API_KEY=vo-your-key-here

# Cerebras - LLM
CEREBRAS_API_KEY=csk-your-key-here

# Qdrant - Vector Database
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key

# Optional Settings
ENVIRONMENT=development
LOG_LEVEL=INFO
CORS_ORIGINS=["http://localhost:3000"]
```

## Verify Configuration

Start the API and check the health endpoint:

```bash
cd apps/api
uv run uvicorn main:app --reload
```

Visit http://localhost:8000/health. You should see:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "voyage": true,
    "qdrant": true
  }
}
```

## Troubleshooting

### "Invalid API key" errors

- Ensure no extra whitespace in your `.env` file
- Check that keys don't contain placeholder text like `your-key-here`
- Regenerate keys if they've been revoked

### Qdrant connection timeout

- Verify your cluster URL is correct
- Check if your IP is allowlisted (cloud clusters)
- For local Qdrant, ensure Docker is running

### Health check shows degraded

One or more services failed to connect. Check the `services` object in the response to identify which one.
