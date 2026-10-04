"""Database access for users and refresh tokens."""

from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import utcnow
from app.models.user import RefreshToken, User, UserRole


class UserRepository:
    """CRUD operations for ``User``. Callers own the transaction (commit/rollback)."""

    def __init__(self, session: AsyncSession) -> None:
        """Create a repository bound to a session.

        Args:
            session: The active async database session.
        """
        self._session = session

    async def get_by_id(self, user_id: int) -> User | None:
        """Fetch a user by primary key.

        Args:
            user_id: The user's id.

        Returns:
            The user, or ``None`` if not found.
        """
        return await self._session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        """Fetch a user by (already normalised) email.

        Args:
            email: Lower-cased email address.

        Returns:
            The user, or ``None`` if not found.
        """
        result = await self._session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def add(self, email: str, password_hash: str, full_name: str, role: UserRole) -> User:
        """Insert a new user and flush so the id and unique constraints are checked.

        Args:
            email: Lower-cased email address.
            password_hash: Argon2 hash of the password.
            full_name: Display name.
            role: The account role.

        Returns:
            The persisted user.

        Raises:
            sqlalchemy.exc.IntegrityError: If the email already exists.
        """
        user = User(email=email, password_hash=password_hash, full_name=full_name, role=role)
        self._session.add(user)
        await self._session.flush()
        return user


class RefreshTokenRepository:
    """Persistence for refresh-token ``jti`` records. Callers own the transaction."""

    def __init__(self, session: AsyncSession) -> None:
        """Create a repository bound to a session.

        Args:
            session: The active async database session.
        """
        self._session = session

    async def add(self, user_id: int, jti: str, expires_at: datetime) -> RefreshToken:
        """Record a newly issued refresh token.

        Args:
            user_id: Owner of the token.
            jti: The token's unique id.
            expires_at: Naive-UTC expiry time.

        Returns:
            The persisted record.
        """
        record = RefreshToken(user_id=user_id, jti=jti, expires_at=expires_at)
        self._session.add(record)
        await self._session.flush()
        return record

    async def get_by_jti(self, jti: str) -> RefreshToken | None:
        """Look up a refresh-token record by ``jti``.

        Args:
            jti: The token's unique id.

        Returns:
            The record, or ``None`` if unknown.
        """
        result = await self._session.execute(select(RefreshToken).where(RefreshToken.jti == jti))
        return result.scalar_one_or_none()

    async def revoke(self, record: RefreshToken) -> None:
        """Mark a single token as revoked.

        Args:
            record: The record to revoke.
        """
        record.revoked_at = utcnow()
        await self._session.flush()

    async def revoke_all_for_user(self, user_id: int) -> None:
        """Revoke every still-active refresh token of a user.

        Args:
            user_id: The user whose sessions should end.
        """
        await self._session.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )
