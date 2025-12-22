import logging
import uuid

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams

from core.config import settings
from core.exceptions import VectorStoreError

logger = logging.getLogger(__name__)

COLLECTION_NAME = "gnosis_concepts"


class VectorStoreService:
    def __init__(self, client: AsyncQdrantClient):
        self.client = client
        self.collection_name = COLLECTION_NAME

    async def ensure_collection(self) -> None:
        try:
            collections = await self.client.get_collections()
            exists = any(c.name == self.collection_name for c in collections.collections)

            if not exists:
                logger.info(f"Creating collection: {self.collection_name}")
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=settings.embedding_dimension,
                        distance=Distance.COSINE,
                    ),
                )
        except Exception as e:
            logger.error(f"Failed to ensure collection: {e}")
            raise VectorStoreError(
                message=f"Failed to initialize vector store: {e}",
                error_code="VECTOR_STORE_INIT_FAILED",
            ) from e

    async def search_similar(
        self,
        embedding: list[float],
        limit: int = 10,
    ) -> list[dict]:
        try:
            logger.debug(f"Searching for {limit} similar concepts")
            results = await self.client.query_points(
                collection_name=self.collection_name,
                query=embedding,
                limit=limit,
            )
            return [
                {"id": str(point.id), "label": point.payload.get("label", ""), "score": point.score}
                for point in results.points
            ]
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            raise VectorStoreError(
                message=f"Failed to search similar concepts: {e}",
                error_code="VECTOR_SEARCH_FAILED",
            ) from e

    async def store_concept(
        self,
        label: str,
        embedding: list[float],
        metadata: dict | None = None,
    ) -> str:
        try:
            point_id = str(uuid.uuid4())
            payload = {"label": label, **(metadata or {})}

            logger.debug(f"Storing concept: {label}")
            await self.client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload=payload,
                    )
                ],
            )
            return point_id
        except Exception as e:
            logger.error(f"Failed to store concept: {e}")
            raise VectorStoreError(
                message=f"Failed to store concept: {e}",
                error_code="VECTOR_STORE_FAILED",
            ) from e

    async def health_check(self) -> bool:
        try:
            await self.client.get_collections()
            return True
        except Exception:
            return False
