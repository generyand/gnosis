import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.graph import router as graph_router
from core.clients import get_qdrant_client, get_voyage_client
from core.config import configure_logging, settings
from models.schemas import HealthResponse
from services.embedding import EmbeddingService
from services.vector_store import VectorStoreService

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    logger.info("Starting Gnosis API")

    try:
        qdrant_client = get_qdrant_client()
        vector_store = VectorStoreService(qdrant_client)
        await vector_store.ensure_collection()
        logger.info("Vector store collection initialized")
    except Exception as e:
        logger.error(f"Failed to initialize vector store: {e}")
        raise

    yield

    logger.info("Shutting down Gnosis API")


app = FastAPI(
    title="Gnosis API",
    description="Real-time semantic mind-mapping engine",
    version="1.0.0",
    lifespan=lifespan,
)

if settings.environment == "development":
    origins = ["*"]
    logger.info("CORS: Development mode - allowing all origins")
else:
    origins = settings.cors_origins
    logger.info(f"CORS: Production mode - allowing origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(graph_router, prefix="/api/v1")


@app.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    services = {}

    try:
        voyage_client = get_voyage_client()
        embedding_service = EmbeddingService(voyage_client)
        await embedding_service.embed_query("health check")
        services["voyage"] = True
    except Exception:
        services["voyage"] = False

    try:
        qdrant_client = get_qdrant_client()
        vector_store = VectorStoreService(qdrant_client)
        services["qdrant"] = await vector_store.health_check()
    except Exception:
        services["qdrant"] = False

    all_healthy = all(services.values())

    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        services=services,
    )
