from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+psycopg://releasetwin:releasetwin@localhost:5544/releasetwin"
    valkey_url: str = "redis://localhost:6380/0"

    zerops_api_token: str | None = None
    zerops_project_id: str | None = None

    github_token: str | None = None

    nvidia_api_key: str | None = None
    nvidia_model: str = "meta/llama-3.1-8b-instruct"

    risk_safe_max: int = 20
    risk_review_max: int = 50
    risk_high_risk_max: int = 75

    jwt_secret_key: str = "dev-only-insecure-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    # Fernet key (44-char urlsafe-base64) used to encrypt sensitive columns at rest
    # (Project.github_token, Project.env_vars). Generate with:
    #   python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    field_encryption_key: str = "_LadxmhCB0iTPaXFYYoSjwTprbcFUoWfkdOka3kxUH4="


@lru_cache
def get_settings() -> Settings:
    return Settings()
