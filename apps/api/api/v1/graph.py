import logging
from typing import Annotated

import voyageai
from fastapi import APIRouter, Depends, HTTPException
from langchain_cerebras import ChatCerebras
from qdrant_client import AsyncQdrantClient

from core.clients import get_cerebras_llm, get_qdrant_client, get_voyage_client
from core.exceptions import EmbeddingServiceError, InferenceError, VectorStoreError
from models.schemas import (
    ExpandRequest,
    ExpandResponse,
    GraphNode,
    SeedRequest,
    SeedResponse,
    SimilarityRequest,
    SimilarityResponse,
)
from services.embedding import EmbeddingService
from services.inference import InferenceService
from services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/graph", tags=["graph"])


def to_kebab_case(text: str) -> str:
    return text.lower().replace(" ", "-").replace("_", "-")


@router.post("/expand", response_model=ExpandResponse)
async def expand_topic(
    request: ExpandRequest,
    voyage_client: Annotated[voyageai.Client, Depends(get_voyage_client)],
    qdrant_client: Annotated[AsyncQdrantClient, Depends(get_qdrant_client)],
    cerebras_llm: Annotated[ChatCerebras, Depends(get_cerebras_llm)],
) -> ExpandResponse:
    logger.info(f"Expanding topic: {request.topic}")

    embedding_service = EmbeddingService(voyage_client)
    vector_store = VectorStoreService(qdrant_client)
    inference_service = InferenceService(cerebras_llm)

    try:
        query_embedding = await embedding_service.embed_query(request.topic)
        similar_concepts = await vector_store.search_similar(query_embedding, limit=10)

        result = await inference_service.expand_topic(
            topic=request.topic,
            context=request.context,
            similar_concepts=similar_concepts,
            num_expansions=request.num_expansions,
            source_node_id=request.source_node_id,
        )

        for node in result.nodes:
            node_embedding = await embedding_service.embed_query(node.label)
            await vector_store.store_concept(
                label=node.label,
                embedding=node_embedding,
                metadata={"reason": node.reason, "type": node.type},
            )

        logger.info(f"Successfully expanded topic '{request.topic}' with {len(result.nodes)} nodes")
        return ExpandResponse(
            nodes=result.nodes,
            edges=result.edges,
            reasoning=result.reasoning,
        )
    except EmbeddingServiceError as e:
        logger.error(f"Embedding error: {e.message}")
        raise HTTPException(status_code=503, detail=e.message)
    except VectorStoreError as e:
        logger.error(f"Vector store error: {e.message}")
        raise HTTPException(status_code=503, detail=e.message)
    except InferenceError as e:
        logger.error(f"Inference error: {e.message}")
        raise HTTPException(status_code=503, detail=e.message)


@router.post("/seed", response_model=SeedResponse)
async def seed_topic(
    request: SeedRequest,
    voyage_client: Annotated[voyageai.Client, Depends(get_voyage_client)],
    qdrant_client: Annotated[AsyncQdrantClient, Depends(get_qdrant_client)],
) -> SeedResponse:
    logger.info(f"Seeding topic: {request.topic}")

    embedding_service = EmbeddingService(voyage_client)
    vector_store = VectorStoreService(qdrant_client)

    try:
        node_id = to_kebab_case(request.topic)
        node = GraphNode(
            id=node_id,
            label=request.topic,
            type="root",
            reason="User-provided seed topic",
        )

        node_embedding = await embedding_service.embed_query(request.topic)
        await vector_store.store_concept(
            label=request.topic,
            embedding=node_embedding,
            metadata={"reason": node.reason, "type": "root"},
        )

        logger.info(f"Successfully seeded topic: {request.topic}")
        return SeedResponse(
            node=node,
            reasoning=f"Created root node for '{request.topic}' and stored in vector database.",
        )
    except EmbeddingServiceError as e:
        logger.error(f"Embedding error: {e.message}")
        raise HTTPException(status_code=503, detail=e.message)
    except VectorStoreError as e:
        logger.error(f"Vector store error: {e.message}")
        raise HTTPException(status_code=503, detail=e.message)


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


@router.post("/check-similarity", response_model=SimilarityResponse)
async def check_similarity(
    request: SimilarityRequest,
    voyage_client: Annotated[voyageai.Client, Depends(get_voyage_client)],
) -> SimilarityResponse:
    """
    Check if a topic is semantically related to existing graph context.
    Returns similarity score and recommended action (expand vs new_root).
    """
    logger.info(f"Checking similarity for topic: {request.topic}")

    embedding_service = EmbeddingService(voyage_client)

    try:
        # Embed the new topic
        topic_embedding = await embedding_service.embed_query(request.topic)

        # Embed all context items
        context_embeddings = await embedding_service.embed(request.context)

        # Calculate similarity with each context item
        similarities = []
        for i, ctx_embedding in enumerate(context_embeddings):
            score = cosine_similarity(topic_embedding, ctx_embedding)
            similarities.append((request.context[i], score))

        # Find the highest similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        closest_match, highest_score = similarities[0] if similarities else (None, 0.0)

        # Determine if related based on threshold
        is_related = highest_score >= request.threshold
        suggested_action = "expand" if is_related else "new_root"

        logger.info(
            f"Similarity check for '{request.topic}': "
            f"score={highest_score:.3f}, related={is_related}, action={suggested_action}"
        )

        return SimilarityResponse(
            is_related=is_related,
            similarity_score=highest_score,
            closest_match=closest_match,
            suggested_action=suggested_action,
        )

    except EmbeddingServiceError as e:
        logger.error(f"Embedding error during similarity check: {e.message}")
        raise HTTPException(status_code=503, detail=e.message)
