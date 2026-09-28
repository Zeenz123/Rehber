import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Rehber Backend"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_PREFIX: str = "/api"

    # Database
    # Default to local SQLite for instant zero-dependency execution.
    # Set to postgresql+asyncpg://user:pass@localhost:5432/rehber for PostgreSQL
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./rehber.db")

    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "rehber-secret-key-rural-education-2025")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for rural offline/intermittent usage

    # SMS Gateway Configuration
    SMS_GATEWAY_API_KEY: str = os.getenv("SMS_GATEWAY_API_KEY", "rehber-sms-gw-test-key-xyz")
    SMS_GATEWAY_PHONE_NUMBER: str = os.getenv("SMS_GATEWAY_PHONE_NUMBER", "+923001234567")

    # Network Thresholds
    LATENCY_THRESHOLD_MS: int = 3000

    # AI Configuration (Optional Gemini API key)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]


    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
