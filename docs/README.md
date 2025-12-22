# Gnosis Documentation

Gnosis is an AI-powered knowledge graph application that generates and visualizes semantic relationships between concepts using LLMs and vector embeddings.

## Documentation Structure

This documentation follows the [Diátaxis](https://diataxis.fr/) framework:

### [Tutorials](./tutorials/)
*Learning-oriented guides that take you through a series of steps*

- [Getting Started](./tutorials/getting-started.md) - Set up your development environment
- [Your First Knowledge Graph](./tutorials/first-graph.md) - Create and explore your first graph

### [How-to Guides](./how-to/)
*Task-oriented guides for specific goals*

- [Configure API Keys](./how-to/configure-api-keys.md) - Set up Voyage AI, Cerebras, and Qdrant
- [Run in Development](./how-to/run-development.md) - Start the dev servers
- [Add a New LLM Provider](./how-to/add-llm-provider.md) - Extend with different LLMs
- [Deploy to Production](./how-to/deploy-production.md) - Production deployment guide

### [Reference](./reference/)
*Technical descriptions of the APIs and configuration*

- [API Reference](./reference/api.md) - REST API endpoints and schemas
- [Configuration](./reference/configuration.md) - Environment variables and settings
- [Data Schemas](./reference/schemas.md) - Pydantic models and TypeScript types

### [Explanation](./explanation/)
*Understanding-oriented discussions of concepts and architecture*

- [Architecture Overview](./explanation/architecture.md) - System design and data flow
- [Technology Stack](./explanation/tech-stack.md) - Why we chose each technology
- [Semantic Search](./explanation/semantic-search.md) - How embeddings and similarity work

## Quick Links

| Resource | Description |
|----------|-------------|
| [API Docs](http://localhost:8000/docs) | Interactive Swagger UI (when running) |
| [Frontend](http://localhost:3000) | Web application |
| [Qdrant Dashboard](https://cloud.qdrant.io) | Vector database console |

## Project Structure

```
gnosis/
├── apps/
│   ├── api/          # Python FastAPI backend
│   └── web/          # Next.js 16 frontend
├── packages/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/
└── docs/             # This documentation
```
