import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "FridgeFlow AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"

    # Ollama settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_VISION_MODEL: str = "gemma3:4b"
    OLLAMA_TEXT_MODEL: str = "gemma3:4b"
    OLLAMA_TIMEOUT_SECONDS: float = 90.0

    # Image upload limits & storage
    MAX_UPLOAD_SIZE_MB: int = 15
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    UPLOAD_DIR: Path = BASE_DIR / "data" / "uploads"
    DATABASE_URL: str = f"sqlite:///{(BASE_DIR / 'data' / 'fridgeflow.db').as_posix()}"

    # Privacy and security
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    AUTO_DELETE_IMAGES_AFTER_ANALYSIS: bool = False

    # Default inventory low-stock thresholds
    DEFAULT_LOW_STOCK_THRESHOLD: float = 1.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
# Ensure directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
