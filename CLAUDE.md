# Gnosis - Semantic Mind-Mapping Engine

A real-time semantic mind-mapping application using Turborepo monorepo with Python backend (FastAPI) and TypeScript frontend (Next.js).

## Project Structure

```
gnosis/
├── apps/
│   ├── api/          # FastAPI backend (Python 3.12+)
│   └── web/          # Next.js 16 frontend (React 19)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── eslint-config/
│   └── typescript-config/
└── docs/             # Project documentation
```

## Tech Stack

### Backend (apps/api)
- **FastAPI** - Python web framework
- **LangChain + Cerebras** - LLM inference
- **Voyage AI** - Embeddings (voyage-3)
- **Qdrant** - Vector database (cloud-hosted)
- **uv** - Python package manager

### Frontend (apps/web)
- **Next.js 16** - React framework
- **React 19** - UI library
- **TanStack Query v5** - Server state management
- **react-force-graph-2d** - Graph visualization
- **Motion (Framer Motion v12)** - Animations
- **Tailwind CSS v4** - Styling (CSS-first config)
- **shadcn/ui** - UI components
- **Orval** - API client generation from OpenAPI

## Development Commands

```bash
# Install dependencies
pnpm install

# Run full stack (concurrent)
pnpm dev

# Run individual apps
pnpm dev:web        # Frontend only (port 3000)
pnpm dev:api        # Backend only (port 8000)

# Build
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint

# Format code
pnpm format

# Generate API client (after backend OpenAPI changes)
pnpm generate:api
```

### Backend-specific (apps/api)
```bash
cd apps/api

# Run dev server
uv run fastapi dev

# Export OpenAPI schema
uv run export-openapi
```

## Environment Setup

### Backend (apps/api/.env)
Copy `.env.example` to `.env` and configure:
- `VOYAGE_API_KEY` - Voyage AI API key
- `CEREBRAS_API_KEY` - Cerebras API key
- `QDRANT_URL` - Qdrant Cloud cluster URL
- `QDRANT_API_KEY` - Qdrant API key

## API Architecture

### Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/v1/graph/expand | Expand topic into nodes/edges |
| POST | /api/v1/graph/seed | Seed initial knowledge |
| POST | /api/v1/graph/check-similarity | Check topic similarity |

### Data Flow
1. Frontend sends topic via TanStack Query hooks (Orval-generated)
2. Backend embeds query using Voyage AI
3. Searches similar concepts in Qdrant
4. Generates related nodes using Cerebras LLM
5. Stores new concepts in Qdrant
6. Returns nodes/edges to frontend

## Key Frontend Components

- `apps/web/components/mind-map.tsx` - Force-directed graph visualization
- `apps/web/components/omni-bar.tsx` - Topic input bar
- `apps/web/components/neural-log.tsx` - AI reasoning sidebar
- `apps/web/hooks/use-graph-state.ts` - Graph state with localStorage persistence

## Code Generation

API types are auto-generated from OpenAPI:
```bash
# 1. Export OpenAPI from backend
cd apps/api && uv run export-openapi

# 2. Generate TypeScript types + React Query hooks
pnpm generate:api
```

Generated files: `apps/web/lib/api/`

## Important Notes

- **Tailwind v4**: Uses CSS-first config (`@theme` in CSS), no `tailwind.config.js`
- **Motion v12**: Import from `motion` not `framer-motion`
- **TanStack Query v5**: Use `isPending` instead of `isLoading`
- **Orval v7**: Uses `fetch` by default (not axios)
- **Next.js 16**: Requires Node.js 22+
