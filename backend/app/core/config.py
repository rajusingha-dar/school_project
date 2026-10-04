"""Application settings loaded from environment variables and ``.env``."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import URL


class Settings(BaseSettings):
    """Typed application configuration.

    Values are read from environment variables (case-insensitive) and, in
    development, from ``backend/.env``. Secrets have no defaults on purpose so
    that a missing value fails fast at startup.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "LearnCurve API"
    app_env: str = "development"
    log_level: str = "INFO"

    db_host: str = "127.0.0.1"
    db_port: int = 3307
    db_name: str = "learncurve"
    db_user: str = "learncurve"
    db_password: str

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    refresh_cookie_name: str = "refresh_token"
    refresh_cookie_path: str = "/api/v1/auth"

    cors_origins: str = "http://localhost:5173"

    @property
    def database_url(self) -> URL:
        """Build the async SQLAlchemy URL, safely escaping the password.

        Returns:
            A ``mysql+asyncmy`` SQLAlchemy URL object.
        """
        return URL.create(
            drivername="mysql+asyncmy",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name,
            query={"charset": "utf8mb4"},
        )

    @property
    def cookie_secure(self) -> bool:
        """Whether cookies must be HTTPS-only (everything except local development).

        Returns:
            ``True`` outside the ``development`` environment.
        """
        return self.app_env != "development"

    @property
    def cors_origin_list(self) -> list[str]:
        """Split the comma-separated ``cors_origins`` setting into a list.

        Returns:
            Allowed CORS origins with blanks removed.
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return the cached application settings.

    Returns:
        The process-wide ``Settings`` instance.
    """
    return Settings()
