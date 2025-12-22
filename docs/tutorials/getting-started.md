# Getting Started

This tutorial walks you through setting up Gnosis on your local machine. By the end, you'll have both the API and web application running.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** >= 22.x
- **Python** >= 3.12
- **pnpm** >= 10.26.1 (install with `npm install -g pnpm`)
- **uv** (Python package manager, install with `curl -LsSf https://astral.sh/uv/install.sh | sh`)

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/gnosis.git
cd gnosis
```

## Step 2: Install Dependencies

Install all dependencies for the monorepo:

```bash
pnpm install
```

This installs dependencies for both the web frontend and shared packages.

## Step 3: Set Up the API

Navigate to the API directory and set up Python dependencies:

```bash
cd apps/api
uv sync
```

## Step 4: Configure Environment Variables

Create your environment file from the example:

```bash
cp .env.example .env
```

Open `.env` and add your API keys:

```env
VOYAGE_API_KEY=your-voyage-api-key
CEREBRAS_API_KEY=your-cerebras-api-key
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
```

## Step 5: Start the Development Servers

From the repository root, start both servers:

```bash
cd ../..  # Back to root
pnpm dev
```

This runs:
- **API** at http://localhost:8000
- **Web** at http://localhost:3000

## Step 6: Verify the Setup

1. Open http://localhost:3000 in your browser
2. You should see the Gnosis interface with a dark theme
3. Check the API health at http://localhost:8000/health

## What's Next?

Now that you have Gnosis running, continue to [Your First Knowledge Graph](./first-graph.md) to create and explore your first graph.

## Troubleshooting

### "Module not found" errors

Make sure you've run `pnpm install` from the repository root and `uv sync` in the `apps/api` directory.

### API health check fails

Check that your `.env` file has valid API keys. The health endpoint tests connectivity to Voyage AI and Qdrant.

### Port already in use

The API defaults to port 8000 and web to port 3000. Kill any existing processes or configure different ports:

```bash
# API
uvicorn main:app --port 8001

# Web
PORT=3001 pnpm dev:web
```
