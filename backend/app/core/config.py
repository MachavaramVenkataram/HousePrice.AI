import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HOUSEPRICE AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DESCRIPTION: str = "Machine-learning property price estimation platform generating data-driven estimates using historical housing data with conformal uncertainty and SHAP explainability."
    
    # Database configuration (Defaults to SQLite for seamless local execution)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./houseprice_ai.db")
    
    # Redis configuration (Graceful fallback if Redis is unavailable)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
