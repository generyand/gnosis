import logging
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Environment
    environment: Literal["development", "production"] = "development"
    log_level: str = "INFO"

    # API Keys
    voyage_api_key: str = Field(..., min_length=1)
    cerebras_api_key: str = Field(..., min_length=1)
    qdrant_url: str = Field(..., min_length=1)
    qdrant_api_key: str = Field(..., min_length=1)

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Model settings
    embedding_model: str = "voyage-3"
    llm_model: str = "llama-4-scout-17b-16e-instruct"
    embedding_dimension: int = 1024

    # Timeouts (seconds)
    api_timeout: float = 30.0

    @field_validator("voyage_api_key", "cerebras_api_key", "qdrant_api_key")
    @classmethod
    def validate_not_placeholder(cls, v: str, info) -> str:
        placeholders = {"your_", "xxx", "placeholder", "changeme", "TODO"}
        if any(p in v.lower() for p in placeholders):
            raise ValueError(f"{info.field_name} appears to be a placeholder value")
        return v


def get_settings() -> Settings:
    return Settings()


def _lazy_settings() -> Settings:
    """Lazy settings loader - only loads when accessed."""
    global _settings_instance
    if "_settings_instance" not in globals():
        _settings_instance = get_settings()
    return _settings_instance


class _SettingsProxy:
    """Proxy that delays settings loading until first access."""

    def __getattr__(self, name: str):
        return getattr(_lazy_settings(), name)


settings = _SettingsProxy()  # type: ignore


def configure_logging() -> None:
    logging.basicConfig(
        level=_lazy_settings().log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
