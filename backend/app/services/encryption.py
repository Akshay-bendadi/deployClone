"""Field-level encryption for sensitive DB columns (github_token, env_vars)."""

import json
from functools import lru_cache

from cryptography.fernet import Fernet
from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator

from app.config import get_settings


@lru_cache
def _fernet() -> Fernet:
    return Fernet(get_settings().field_encryption_key.encode())


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    return _fernet().decrypt(value.encode()).decode()


class EncryptedString(TypeDecorator):
    """Transparently encrypts a string column at rest."""

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: object) -> str | None:
        if value is None:
            return None
        return encrypt(value)

    def process_result_value(self, value: str | None, dialect: object) -> str | None:
        if value is None:
            return None
        return decrypt(value)


class EncryptedJSON(TypeDecorator):
    """Transparently encrypts a JSON-serializable column at rest.

    Stored as encrypted text rather than JSONB — the DB can no longer query into the
    structure, but this column (env_vars) is only ever read/written as a whole list by
    the app, never filtered on, so that's not a real loss.
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: object | None, dialect: object) -> str | None:
        if value is None:
            return None
        return encrypt(json.dumps(value))

    def process_result_value(self, value: str | None, dialect: object) -> object | None:
        if value is None:
            return None
        return json.loads(decrypt(value))
