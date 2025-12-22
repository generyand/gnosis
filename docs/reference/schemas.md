# Data Schemas Reference

This document describes all data models used in Gnosis.

## Core Models

### GraphNode

Represents a concept in the knowledge graph.

```typescript
interface GraphNode {
  id: string        // Unique identifier (kebab-case, 1-100 chars)
  label: string     // Human-readable name (1-200 chars)
  type: "root" | "generated"
  reason: string | null  // Why this node relates (max 500 chars)
}
```

**Python (Pydantic)**

```python
class GraphNode(BaseModel):
    id: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=200)
    type: Literal["root", "generated"]
    reason: str | None = Field(None, max_length=500)
```

**Example**

```json
{
  "id": "neural-networks",
  "label": "Neural Networks",
  "type": "generated",
  "reason": "Foundational architecture for deep learning"
}
```

---

### GraphEdge

Represents a relationship between two nodes.

```typescript
interface GraphEdge {
  source: string     // Source node ID
  target: string     // Target node ID
  label: string | null  // Relationship type (max 100 chars)
}
```

**Python (Pydantic)**

```python
class GraphEdge(BaseModel):
    source: str
    target: str
    label: str | None = Field(None, max_length=100)
```

**Example**

```json
{
  "source": "machine-learning",
  "target": "neural-networks",
  "label": "uses"
}
```

---

## Request Schemas

### SeedRequest

```typescript
interface SeedRequest {
  topic: string  // 1-200 chars
}
```

### ExpandRequest

```typescript
interface ExpandRequest {
  topic: string           // 1-200 chars
  source_node_id?: string // Optional: node to connect to
  context: string[]       // Max 50 items
  num_expansions: number  // 1-20
}
```

### SimilarityRequest

```typescript
interface SimilarityRequest {
  topic: string       // 1-200 chars
  context: string[]   // 1-50 items
  threshold?: number  // 0.0-1.0, default 0.3
}
```

---

## Response Schemas

### SeedResponse

```typescript
interface SeedResponse {
  node: GraphNode
  reasoning: string
}
```

### ExpandResponse

```typescript
interface ExpandResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  reasoning: string
}
```

### SimilarityResponse

```typescript
interface SimilarityResponse {
  is_related: boolean
  similarity_score: number  // 0.0-1.0
  closest_match: string | null
  suggested_action: "expand" | "new_root"
}
```

### HealthResponse

```typescript
interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy"
  version: string
  services: {
    voyage: boolean
    qdrant: boolean
  }
}
```

---

## Frontend State Schemas

### GraphState

Internal state managed by `useGraphState` hook.

```typescript
interface GraphState {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
```

### LogEntry

Reasoning history entry.

```typescript
interface LogEntry {
  id: string
  timestamp: Date
  topic: string
  reasoning: string
  nodeCount: number
}
```

---

## Vector Store Schema

### Qdrant Point Structure

Each concept is stored as a Qdrant point:

```typescript
interface QdrantPoint {
  id: string           // UUID
  vector: number[]     // 1024 dimensions
  payload: {
    label: string      // Concept label
    created_at: string // ISO timestamp
  }
}
```

**Collection Configuration**

```python
VectorParams(
    size=1024,           # Matches Voyage AI dimension
    distance=Distance.COSINE
)
```

---

## LLM Output Schema

### ExpansionOutput

Structured output from Cerebras LLM.

```python
class ExpansionOutput(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    reasoning: str
```

This schema is enforced via LangChain's `.with_structured_output()`.

---

## Validation Constraints

| Field | Constraint |
|-------|------------|
| `topic` | 1-200 characters |
| `node.id` | 1-100 characters, kebab-case |
| `node.label` | 1-200 characters |
| `node.reason` | Max 500 characters |
| `edge.label` | Max 100 characters |
| `context` | 1-50 items |
| `num_expansions` | 1-20 |
| `threshold` | 0.0-1.0 |
