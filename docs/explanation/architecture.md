# Architecture Overview

This document explains the system design and data flow of Gnosis.

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   OmniBar   │  │   MindMap   │  │     NeuralLog       │  │
│  │   (Input)   │  │   (D3.js)   │  │    (Reasoning)      │  │
│  └──────┬──────┘  └──────▲──────┘  └──────────▲──────────┘  │
│         │                │                     │             │
│         ▼                │                     │             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              useGraphState (React State)              │   │
│  │         + React Query + localStorage                  │   │
│  └──────────────────────────┬───────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              FastAPI Router (/api/v1/graph)          │    │
│  │         /seed  /expand  /check-similarity            │    │
│  └────────────────────────┬────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────▼────────────────────────────┐    │
│  │                  Service Layer                       │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐ │    │
│  │  │ Embedding  │  │  Vector    │  │   Inference    │ │    │
│  │  │  Service   │  │   Store    │  │    Service     │ │    │
│  │  └─────┬──────┘  └─────┬──────┘  └───────┬────────┘ │    │
│  └────────┼───────────────┼─────────────────┼──────────┘    │
└───────────┼───────────────┼─────────────────┼───────────────┘
            │               │                 │
            ▼               ▼                 ▼
     ┌──────────┐    ┌──────────┐      ┌──────────┐
     │ Voyage   │    │  Qdrant  │      │ Cerebras │
     │   AI     │    │  Cloud   │      │   LLM    │
     └──────────┘    └──────────┘      └──────────┘
```

## Data Flow

### 1. Seed Topic Flow

When a user creates the first node:

```
User Input ("Machine Learning")
       │
       ▼
┌──────────────────┐
│  POST /seed      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Embed topic      │──────▶ Voyage AI
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Store embedding  │──────▶ Qdrant
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Return node      │
└──────────────────┘
```

### 2. Expand Topic Flow

When a user expands an existing node:

```
User Input ("Neural Networks" + context)
       │
       ▼
┌──────────────────┐
│  POST /expand    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Embed topic      │──────▶ Voyage AI (query mode)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Search similar   │──────▶ Qdrant (cosine similarity)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Generate concepts│──────▶ Cerebras LLM
│ (with context)   │        (structured output)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Embed new nodes  │──────▶ Voyage AI (document mode)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Store embeddings │──────▶ Qdrant
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Return nodes,    │
│ edges, reasoning │
└──────────────────┘
```

### 3. Similarity Check Flow

Before expanding, check if the topic relates:

```
User Input ("Quantum Computing" + context)
       │
       ▼
┌──────────────────────┐
│ POST /check-similarity│
└────────┬─────────────┘
         │
         ▼
┌──────────────────┐
│ Embed topic      │──────▶ Voyage AI
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Embed context    │──────▶ Voyage AI
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Compute cosine   │
│ similarity       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Return score,    │
│ suggested action │
└──────────────────┘
```

## Component Responsibilities

### Frontend Components

| Component | Responsibility |
|-----------|---------------|
| `OmniBar` | User input, keyboard shortcuts, submit handling |
| `MindMap` | D3 force simulation, canvas rendering, interactions |
| `NeuralLog` | Display AI reasoning history |
| `useGraphState` | State management, persistence, deduplication |
| `Providers` | React Query setup, error handling |

### Backend Services

| Service | Responsibility |
|---------|---------------|
| `EmbeddingService` | Convert text to vectors via Voyage AI |
| `VectorStoreService` | Store/search vectors in Qdrant |
| `InferenceService` | Generate concepts via Cerebras LLM |

## State Management

### Frontend State

```
localStorage ←→ useGraphState ←→ React Components
                     │
                     ▼
              React Query Cache
                     │
                     ▼
                 API Calls
```

- **Persistence**: Auto-saved to localStorage (debounced 500ms)
- **Caching**: React Query caches API responses (1 min stale, 5 min GC)
- **Optimistic Updates**: State updated before API confirmation

### Vector State

```
Qdrant Collection: "gnosis_concepts"
│
├── Point 1: { vector: [...], payload: { label: "Machine Learning" } }
├── Point 2: { vector: [...], payload: { label: "Neural Networks" } }
└── ...
```

- **Persistence**: Permanent until explicitly deleted
- **Deduplication**: Same concept won't be stored twice
- **Search**: Cosine similarity for semantic matching

## Error Handling

### API Errors

```
Service Error
     │
     ▼
Custom Exception (EmbeddingServiceError, etc.)
     │
     ▼
FastAPI Exception Handler
     │
     ▼
HTTP 5xx Response
     │
     ▼
React Query Error
     │
     ▼
Toast Notification
```

### Error Handling

When services fail, the frontend:
1. Shows error toast with helpful message
2. Suggests checking backend connectivity
