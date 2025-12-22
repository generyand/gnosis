from typing import Literal

from pydantic import BaseModel, Field


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


class ErrorResponse(BaseModel):
    detail: str
    error_code: str | None = None


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
