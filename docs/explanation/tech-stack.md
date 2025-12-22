# Technology Stack

This document explains why each technology was chosen for Gnosis.

## Overview

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 + React 19 | Modern web framework |
| Visualization | D3.js + react-force-graph | Interactive graph rendering |
| State | React Query + localStorage | Data fetching and persistence |
| Backend | FastAPI | High-performance Python API |
| LLM | Cerebras + LangChain | Fast concept generation |
| Embeddings | Voyage AI | Semantic text vectors |
| Vector DB | Qdrant | Similarity search and storage |
| Monorepo | Turborepo + pnpm | Build orchestration |

## Frontend

### Next.js 16

**Why**: The latest Next.js with React 19 support provides:
- App Router for file-based routing
- Server components (though we use client-side for interactivity)
- Built-in TypeScript support
- Optimized production builds

**Alternative considered**: Vite + React - simpler but lacks SSR capabilities for future SEO needs.

### React 19

**Why**: Latest React with:
- Improved concurrent rendering
- Better Suspense support
- New hooks like `use()` for data fetching

### D3.js + react-force-graph-2d

**Why**: D3's force simulation provides:
- Physics-based node positioning
- Smooth animations
- Canvas rendering for performance
- Fine-grained control over layout

**Alternative considered**: Vis.js - easier API but less customization for our specific needs.

### React Query (TanStack Query)

**Why**: Handles all data fetching concerns:
- Automatic caching and revalidation
- Loading/error states
- Retry logic with exponential backoff
- DevTools for debugging

**Alternative considered**: SWR - similar but React Query has better TypeScript support.

### Tailwind CSS v4

**Why**: Utility-first CSS provides:
- Rapid styling without context switching
- Consistent design tokens
- Small production bundle (unused styles purged)
- Dark mode support built-in

## Backend

### FastAPI

**Why**: Modern Python framework with:
- Automatic OpenAPI documentation
- Native async/await support
- Pydantic validation built-in
- High performance (comparable to Node.js)

**Alternative considered**: Flask - simpler but lacks async support and auto-documentation.

### Pydantic

**Why**: Data validation and serialization:
- Type hints as the source of truth
- Automatic request/response validation
- JSON Schema generation for OpenAPI
- Excellent error messages

### LangChain

**Why**: LLM framework providing:
- Unified interface for multiple providers
- `.with_structured_output()` for guaranteed JSON
- Async support via `.ainvoke()`
- Easy provider switching

**Alternative considered**: Direct API calls - works but requires manual JSON parsing and error handling.

## AI Services

### Cerebras

**Why**: Ultra-fast LLM inference:
- ~3,000 tokens/second (10x faster than typical)
- Low latency for interactive UX
- Competitive pricing
- Open-source models (Llama)

**Trade-off**: Less capable than GPT-4 but fast enough for concept generation.

### Voyage AI

**Why**: Best-in-class embeddings:
- Optimized for semantic similarity
- Separate modes for documents vs queries
- 1024 dimensions balance quality/cost
- Competitive pricing

**Alternative considered**: OpenAI embeddings - good quality but Voyage AI benchmarks higher for retrieval tasks.

### Qdrant

**Why**: Purpose-built vector database:
- Native vector similarity search
- Payload filtering
- Cloud-hosted option (free tier)
- Excellent Python client
- Async support

**Alternative considered**: Pinecone - similar features but Qdrant has better open-source story.

## Monorepo

### Turborepo

**Why**: Build system for monorepos:
- Caching (local and remote)
- Parallel task execution
- Dependency-aware builds
- Simple configuration

### pnpm

**Why**: Fast, disk-efficient package manager:
- Symlinked node_modules (saves disk space)
- Strict dependency resolution
- Built-in workspace support
- Faster installs than npm/yarn

## Development Tools

### TypeScript

**Why**: Type safety across the stack:
- Catch errors at compile time
- IDE autocompletion
- Self-documenting code
- Generated types from OpenAPI

### Orval

**Why**: Generate API client from OpenAPI:
- Type-safe API calls
- React Query hooks auto-generated
- Always in sync with backend
- Custom fetcher support

### uv

**Why**: Fast Python package manager:
- 10-100x faster than pip
- Built-in virtual environment management
- Lockfile support
- Compatible with pyproject.toml

## Design Decisions

### Why Canvas over SVG for Graph?

Canvas provides better performance for:
- Large graphs (100+ nodes)
- Continuous animations
- Complex interactions

SVG would be simpler but sluggish above ~50 nodes.

### Why localStorage for Persistence?

Simple client-side storage that:
- Works offline
- No backend changes needed
- Instant save/load
- Sufficient for single-user graphs

For multi-user, we'd add a database-backed persistence layer.

### Why Cosine Similarity?

Standard for text embeddings because:
- Measures angle, not magnitude
- Works well with normalized vectors
- Computationally efficient
- Industry standard for semantic search
