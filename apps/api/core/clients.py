import logging
from functools import lru_cache

import voyageai
from langchain_cerebras import ChatCerebras
from qdrant_client import AsyncQdrantClient

from core.config import settings

logger = logging.getLogger(__name__)


@lru_cache()
def get_voyage_client() -> voyageai.Client:
    logger.info("Initializing Voyage AI client")
    return voyageai.Client(api_key=settings.voyage_api_key)


@lru_cache()
def get_qdrant_client() -> AsyncQdrantClient:
    logger.info("Initializing Qdrant client")
    return AsyncQdrantClient(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key,
        timeout=settings.api_timeout,
    )


@lru_cache()
def get_cerebras_llm() -> ChatCerebras:
    logger.info("Initializing Cerebras LLM client")
    return ChatCerebras(
        model=settings.llm_model,
        api_key=settings.cerebras_api_key,
    )
