from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+psycopg://releasetwin:releasetwin@localhost:5544/releasetwin"
    valkey_url: str = "redis://localhost:6380/0"

    zerops_api_token: str | None = None
    zerops_project_id: str | None = None

    nvidia_api_key: str | None = None
    nvidia_model: str = "meta/llama-3.1-8b-instruct"

    risk_safe_max: int = 20
    risk_review_max: int = 50
    risk_high_risk_max: int = 75


@lru_cache
def get_settings() -> Settings:
    return Settings()
