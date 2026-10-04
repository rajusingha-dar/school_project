"""SQLAlchemy models. Import every model module here so Alembic can discover it."""

from app.models.school import School
from app.models.user import RefreshToken, User, UserRole

__all__ = ["RefreshToken", "School", "User", "UserRole"]
