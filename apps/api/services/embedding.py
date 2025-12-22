import asyncio
import logging

import voyageai

from core.config import settings
from core.exceptions import EmbeddingServiceError

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self, client: voyageai.Client):
        self.client = client
        self.model = settings.embedding_model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        try:
            logger.debug(f"Embedding {len(texts)} texts with model {self.model}")
            result = await asyncio.to_thread(
                self.client.embed,
                texts,
                model=self.model,
                input_type="document",
            )
            return result.embeddings
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            raise EmbeddingServiceError(
                message=f"Failed to generate embeddings: {e}",
                error_code="EMBEDDING_FAILED",
            ) from e

    async def embed_query(self, text: str) -> list[float]:
        try:
            logger.debug(f"Embedding query: {text[:50]}...")
            result = await asyncio.to_thread(
                self.client.embed,
                [text],
                model=self.model,
                input_type="query",
            )
            return result.embeddings[0]
        except Exception as e:
            logger.error(f"Query embedding failed: {e}")
            raise EmbeddingServiceError(
                message=f"Failed to generate query embedding: {e}",
                error_code="EMBEDDING_FAILED",
            ) from e
