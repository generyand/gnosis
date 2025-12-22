#!/usr/bin/env python3
"""Export OpenAPI schema to JSON file for Orval client generation.

This script generates the OpenAPI schema without requiring environment variables.
"""

import json
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from typing import Literal

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from pydantic import BaseModel, Field

OUTPUT_PATH = Path(__file__).parent.parent / "openapi.json"


# Duplicate schema definitions to avoid loading settings
class GraphNode(BaseModel):
    id: str = Field(..., min_length=1, max_length=100, description="Unique kebab-case identifier")
    label: str = Field(..., min_length=1, max_length=200, description="Human-readable label")
    type: Literal["root", "generated"]
    reason: str | None = Field(default=None, max_length=500, description="Why this concept relates")


class GraphEdge(BaseModel):
    source: str = Field(..., min_length=1, max_length=100)
    target: str = Field(..., min_length=1, max_length=100)
    label: str | None = Field(default=None, max_length=100, description="Relationship type")


class ExpandRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200, description="The concept to expand")
    source_node_id: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="ID of existing node to connect new concepts to. If not provided, creates edges from topic.",
    )
    context: list[str] = Field(
        default_factory=list,
        max_length=50,
        description="Previous concepts in the exploration path",
    )
    num_expansions: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of related concepts to generate",
    )


class ExpandResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    reasoning: str


class SeedRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200, description="The seed topic to start with")


class SeedResponse(BaseModel):
    node: GraphNode
    reasoning: str


class HealthResponse(BaseModel):
    status: Literal["healthy", "degraded", "unhealthy"]
    version: str = "1.0.0"
    services: dict[str, bool] = Field(default_factory=dict)


class SimilarityRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200, description="The topic to check similarity for")
    context: list[str] = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Existing node labels to compare against",
    )
    threshold: float = Field(
        default=0.3,
        ge=0.0,
        le=1.0,
        description="Similarity threshold (0-1). Below this = unrelated",
    )


class SimilarityResponse(BaseModel):
    is_related: bool = Field(..., description="Whether the topic is semantically related to context")
    similarity_score: float = Field(..., ge=0.0, le=1.0, description="Highest similarity score found")
    closest_match: str | None = Field(default=None, description="The context item most similar to the topic")
    suggested_action: Literal["expand", "new_root"] = Field(
        ...,
        description="Recommended action: expand existing graph or create new root",
    )


def create_app_for_schema() -> FastAPI:
    """Create a minimal FastAPI app for schema generation."""
    app = FastAPI(
        title="Gnosis API",
        description="Real-time semantic mind-mapping engine",
        version="1.0.0",
    )

    @app.post("/api/v1/graph/expand", response_model=ExpandResponse, tags=["graph"])
    async def expand_topic(request: ExpandRequest) -> ExpandResponse:
        """Expand a topic into related concepts."""
        ...

    @app.post("/api/v1/graph/seed", response_model=SeedResponse, tags=["graph"])
    async def seed_topic(request: SeedRequest) -> SeedResponse:
        """Seed the graph with an initial topic."""
        ...

    @app.post("/api/v1/graph/check-similarity", response_model=SimilarityResponse, tags=["graph"])
    async def check_similarity(request: SimilarityRequest) -> SimilarityResponse:
        """Check if a topic is semantically related to existing graph context."""
        ...

    @app.get("/health", response_model=HealthResponse)
    async def health_check() -> HealthResponse:
        """Check API health status."""
        ...

    return app


def main() -> None:
    app = create_app_for_schema()
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    OUTPUT_PATH.write_text(json.dumps(schema, indent=2))
    print(f"OpenAPI schema exported to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
