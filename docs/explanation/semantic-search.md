# Semantic Search

This document explains how Gnosis uses embeddings and similarity search to find related concepts.

## What Are Embeddings?

Embeddings are numerical representations of text that capture semantic meaning. Words and phrases with similar meanings have similar embeddings.

```
"Machine Learning"  →  [0.12, -0.34, 0.56, ...]  (1024 numbers)
"Deep Learning"     →  [0.14, -0.32, 0.58, ...]  (similar vector)
"Cooking Recipes"   →  [-0.45, 0.21, -0.33, ...] (different vector)
```

## How Voyage AI Creates Embeddings

Voyage AI's `voyage-3` model converts text to 1024-dimensional vectors:

```python
client = voyageai.Client(api_key="...")
result = client.embed(
    ["Machine Learning"],
    model="voyage-3",
    input_type="document"
)
# Returns: [[0.12, -0.34, 0.56, ...]]
```

### Document vs Query Mode

Voyage AI distinguishes between:

- **Document mode** (`input_type="document"`): Used when storing concepts
- **Query mode** (`input_type="query"`): Used when searching

This asymmetric approach optimizes for retrieval accuracy.

## Cosine Similarity

We measure similarity between vectors using cosine similarity:

```
           A · B
cos(θ) = ─────────
         |A| × |B|
```

Where:
- `A · B` is the dot product
- `|A|` and `|B|` are the magnitudes

**Result range**: -1 to 1
- **1.0**: Identical meaning
- **0.0**: Unrelated
- **-1.0**: Opposite meaning (rare in practice)

### Example

```python
from numpy import dot
from numpy.linalg import norm

def cosine_similarity(a, b):
    return dot(a, b) / (norm(a) * norm(b))

# Similar concepts
sim = cosine_similarity(
    embed("Neural Networks"),
    embed("Deep Learning")
)
# Result: ~0.85 (high similarity)

# Unrelated concepts
sim = cosine_similarity(
    embed("Neural Networks"),
    embed("Italian Cuisine")
)
# Result: ~0.15 (low similarity)
```

## Vector Storage in Qdrant

Qdrant stores embeddings as "points" in a collection:

```python
# Store a concept
await client.upsert(
    collection_name="gnosis_concepts",
    points=[
        PointStruct(
            id=uuid4(),
            vector=embedding,  # 1024 floats
            payload={"label": "Neural Networks"}
        )
    ]
)
```

## Similarity Search

When expanding a topic, we find related concepts:

```python
# Search for similar concepts
results = await client.query_points(
    collection_name="gnosis_concepts",
    query=topic_embedding,
    limit=10
)

# Returns ranked results
# [
#   {"label": "Deep Learning", "score": 0.92},
#   {"label": "Convolutional Networks", "score": 0.87},
#   ...
# ]
```

## How Gnosis Uses Similarity

### 1. Finding Related Context

Before LLM generation, we search for similar existing concepts:

```
User topic: "Transformers"
       │
       ▼
Search Qdrant
       │
       ▼
Similar: ["Attention Mechanism", "BERT", "GPT"]
       │
       ▼
LLM prompt includes these for context
```

This helps the LLM generate concepts that fit the existing graph.

### 2. Checking Topic Relevance

Before adding a new topic, we check if it relates:

```
New topic: "Quantum Computing"
Existing: ["Machine Learning", "Neural Networks", ...]
       │
       ▼
Compute similarity: 0.21
Threshold: 0.30
       │
       ▼
Result: Unrelated → Suggest new root
```

### 3. Deduplication

We avoid storing duplicate concepts:

```
New: "Deep Learning"
Existing: "Deep Learning" (exact match)
       │
       ▼
Skip storage (already exists)
```

## Threshold Tuning

The similarity threshold (default 0.3) affects behavior:

| Threshold | Effect |
|-----------|--------|
| 0.1 | Very permissive, almost everything connects |
| 0.3 | Balanced, reasonable semantic connection |
| 0.5 | Strict, only closely related topics |
| 0.7 | Very strict, near-synonyms only |

Users can adjust via the `threshold` parameter in `/check-similarity`.

## Why Not Keyword Search?

Traditional keyword search fails for semantic relationships:

| Query | Keyword Match | Semantic Match |
|-------|---------------|----------------|
| "ML" | ❌ | ✅ "Machine Learning" |
| "AI brain" | ❌ | ✅ "Neural Networks" |
| "learns from data" | ❌ | ✅ "Supervised Learning" |

Embeddings capture meaning, not just words.

## Performance Considerations

### Embedding Latency

- Voyage AI: ~100-200ms per batch
- We batch multiple texts in one call when possible

### Search Latency

- Qdrant: ~10-50ms for small collections
- Scales well with proper indexing (HNSW algorithm)

### Dimension Trade-offs

| Dimensions | Quality | Speed | Cost |
|------------|---------|-------|------|
| 256 | Lower | Faster | Lower |
| 1024 | Good | Good | Medium |
| 4096 | Highest | Slower | Higher |

We use 1024 as a balanced default.
