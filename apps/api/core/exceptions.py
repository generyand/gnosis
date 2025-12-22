class GnosisError(Exception):
    """Base exception for Gnosis API."""

    def __init__(self, message: str, error_code: str | None = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class EmbeddingServiceError(GnosisError):
    """Error from the embedding service (Voyage AI)."""

    pass


class VectorStoreError(GnosisError):
    """Error from the vector store (Qdrant)."""

    pass


class InferenceError(GnosisError):
    """Error from the LLM inference service (Cerebras)."""

    pass
