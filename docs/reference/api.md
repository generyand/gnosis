# API Reference

Base URL: `http://localhost:8000` (development) or your production URL.

## Endpoints

### Health Check

Check API and service connectivity.

```
GET /health
```

**Response**

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

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"healthy" \| "degraded" \| "unhealthy"` | Overall API status |
| `version` | `string` | API version |
| `services.voyage` | `boolean` | Voyage AI connectivity |
| `services.qdrant` | `boolean` | Qdrant connectivity |

---

### Seed Topic

Create a root node for a new knowledge graph.

```
POST /api/v1/graph/seed
```

**Request Body**

```json
{
  "topic": "Machine Learning"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `topic` | `string` | Yes | Initial topic (1-200 chars) |

**Response**

```json
{
  "node": {
    "id": "machine-learning",
    "label": "Machine Learning",
    "type": "root",
    "reason": null
  },
  "reasoning": "Machine Learning is a foundational topic in AI..."
}
```

---

### Expand Topic

Generate related concepts for an existing node.

```
POST /api/v1/graph/expand
```

**Request Body**

```json
{
  "topic": "Neural Networks",
  "source_node_id": "machine-learning",
  "context": ["Machine Learning", "Deep Learning"],
  "num_expansions": 5
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `topic` | `string` | Yes | - | Topic to expand (1-200 chars) |
| `source_node_id` | `string` | No | `null` | Node to connect new concepts to |
| `context` | `string[]` | Yes | - | Existing labels for context (max 50) |
| `num_expansions` | `integer` | Yes | - | Number of concepts to generate (1-20) |

**Response**

```json
{
  "nodes": [
    {
      "id": "convolutional-neural-networks",
      "label": "Convolutional Neural Networks",
      "type": "generated",
      "reason": "Specialized architecture for image processing"
    },
    {
      "id": "recurrent-neural-networks",
      "label": "Recurrent Neural Networks",
      "type": "generated",
      "reason": "Designed for sequential data processing"
    }
  ],
  "edges": [
    {
      "source": "neural-networks",
      "target": "convolutional-neural-networks",
      "label": "specializes into"
    },
    {
      "source": "neural-networks",
      "target": "recurrent-neural-networks",
      "label": "specializes into"
    }
  ],
  "reasoning": "Neural Networks branch into specialized architectures..."
}
```

---

### Check Similarity

Determine if a topic relates to existing context.

```
POST /api/v1/graph/check-similarity
```

**Request Body**

```json
{
  "topic": "Quantum Computing",
  "context": ["Machine Learning", "Neural Networks", "Deep Learning"],
  "threshold": 0.3
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `topic` | `string` | Yes | - | Topic to check (1-200 chars) |
| `context` | `string[]` | Yes | - | Existing labels to compare (1-50) |
| `threshold` | `float` | No | `0.3` | Similarity threshold (0.0-1.0) |

**Response**

```json
{
  "is_related": false,
  "similarity_score": 0.21,
  "closest_match": "Machine Learning",
  "suggested_action": "new_root"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `is_related` | `boolean` | Whether score exceeds threshold |
| `similarity_score` | `float` | Cosine similarity (0.0-1.0) |
| `closest_match` | `string \| null` | Most similar context item |
| `suggested_action` | `"expand" \| "new_root"` | Recommended action |

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad request (invalid input) |
| `422` | Validation error (schema mismatch) |
| `500` | Internal server error |
| `503` | Service unavailable (external service down) |

---

## Interactive Documentation

When the API is running:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json
