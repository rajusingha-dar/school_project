"""Business logic for registration, login, token refresh and logout."""

import logging
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.clock import utcnow
from app.core.config import get_settings
from app.core.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.core.security import (
    DUMMY_PASSWORD_HASH,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.school_repository import SchoolRepository
from app.repositories.user_repository import RefreshTokenRepository, UserRepository

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AuthResult:
    """Outcome of a successful authentication step."""

    user: User
    access_token: str
    access_expires_in: int
    refresh_token: str
    refresh_expires_at: datetime


class AuthService:
    """Orchestrates authentication use-cases; owns the database transaction."""

    def __init__(self, session: AsyncSession) -> None:
        """Create a service bound to a session.

        Args:
            session: The active async database session.
        """
        self._session = session
        self._users = UserRepository(session)
        self._refresh_tokens = RefreshTokenRepository(session)

    async def register_parent(self, email: str, password: str, full_name: str) -> AuthResult:
        """Create a parent account and sign it in.

        Args:
            email: Normalised email address.
            password: Plain-text password (hashed before storage).
            full_name: Display name.

        Returns:
            Tokens and the new user.

        Raises:
            EmailAlreadyRegisteredError: If the email is already in use.
        """
        user = await self._add_parent(email, password, full_name)
        result = await self._start_session(user)
        await self._session.commit()
        logger.info("Registered parent account user_id=%s", user.id)
        return result

    async def create_parent(self, email: str, password: str, full_name: str) -> User:
        """Create a parent account without signing it in (used by dev seeding).

        Args:
            email: Normalised email address.
            password: Plain-text password (hashed before storage).
            full_name: Display name.

        Returns:
            The new parent user.

        Raises:
            EmailAlreadyRegisteredError: If the email is already in use.
        """
        user = await self._add_parent(email, password, full_name)
        await self._session.commit()
        logger.info("Created parent account user_id=%s", user.id)
        return user

    async def _add_parent(self, email: str, password: str, full_name: str) -> User:
        """Insert a parent user (no commit), mapping duplicate emails to a domain error."""
        if await self._users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(email)
        password_hash = await hash_password(password)
        try:
            return await self._users.add(email, password_hash, full_name, UserRole.PARENT)
        except IntegrityError as exc:  # concurrent registration with the same email
            await self._session.rollback()
            raise EmailAlreadyRegisteredError(email) from exc

    async def create_school_admin(
        self, email: str, password: str, full_name: str, school_name: str
    ) -> User:
        """Create a school-admin account (and its school if new). Not exposed over HTTP.

        Args:
            email: Normalised email address.
            password: Plain-text password (hashed before storage).
            full_name: Display name.
            school_name: Name of the school to attach the admin to.

        Returns:
            The new admin user.

        Raises:
            EmailAlreadyRegisteredError: If the email is already in use.
        """
        if await self._users.get_by_email(email) is not None:
            raise EmailAlreadyRegisteredError(email)
        school = await SchoolRepository(self._session).get_or_create(school_name)
        password_hash = await hash_password(password)
        user = await self._users.add(
            email, password_hash, full_name, UserRole.SCHOOL_ADMIN, school_id=school.id
        )
        await self._session.commit()
        logger.info("Created school admin user_id=%s school_id=%s", user.id, school.id)
        return user

    async def login(self, email: str, password: str) -> AuthResult:
        """Authenticate with email and password.

        Args:
            email: Normalised email address.
            password: Plain-text password.

        Returns:
            Tokens and the authenticated user.

        Raises:
            InvalidCredentialsError: If the credentials don't match an active account.
        """
        user = await self._users.get_by_email(email)
        # Always run one hash verification so timing doesn't reveal whether the email exists.
        password_ok = await verify_password(
            password, user.password_hash if user else DUMMY_PASSWORD_HASH
        )
        if user is None or not password_ok or not user.is_active:
            logger.info("Failed login attempt")
            raise InvalidCredentialsError
        result = await self._start_session(user)
        await self._session.commit()
        logger.info("User logged in user_id=%s", user.id)
        return result

    async def refresh(self, refresh_token: str) -> AuthResult:
        """Rotate a refresh token and issue a new access token.

        Presenting an already-revoked token is treated as theft: every session of
        that user is revoked.

        Args:
            refresh_token: The encoded refresh JWT from the cookie.

        Returns:
            New tokens and the user.

        Raises:
            InvalidTokenError: If the token is invalid, expired, revoked or its user is inactive.
        """
        claims = decode_token(refresh_token, "refresh")
        record = await self._refresh_tokens.get_by_jti(claims.jti)
        if record is None or record.user_id != claims.user_id:
            raise InvalidTokenError("Unknown refresh token")
        if record.revoked_at is not None:
            await self._refresh_tokens.revoke_all_for_user(record.user_id)
            await self._session.commit()
            logger.warning("Refresh token reuse detected user_id=%s", record.user_id)
            raise InvalidTokenError("Refresh token already used")
        if record.expires_at <= utcnow():
            raise InvalidTokenError("Refresh token expired")
        user = await self._users.get_by_id(record.user_id)
        if user is None or not user.is_active:
            raise InvalidTokenError("User unavailable")
        await self._refresh_tokens.revoke(record)
        result = await self._start_session(user)
        await self._session.commit()
        return result

    async def logout(self, refresh_token: str | None) -> None:
        """Revoke the presented refresh token, if it is valid. Never raises for bad tokens.

        Args:
            refresh_token: The encoded refresh JWT from the cookie, if any.
        """
        if not refresh_token:
            return
        try:
            claims = decode_token(refresh_token, "refresh")
        except InvalidTokenError:
            return
        record = await self._refresh_tokens.get_by_jti(claims.jti)
        if record is not None and record.revoked_at is None:
            await self._refresh_tokens.revoke(record)
            await self._session.commit()
            logger.info("User logged out user_id=%s", record.user_id)

    async def _start_session(self, user: User) -> AuthResult:
        """Issue and persist a fresh access/refresh token pair for a user."""
        access = create_access_token(user.id, user.role.value)
        refresh = create_refresh_token(user.id)
        await self._refresh_tokens.add(user.id, refresh.jti, refresh.expires_at)
        return AuthResult(
            user=user,
            access_token=access.token,
            access_expires_in=get_settings().access_token_expire_minutes * 60,
            refresh_token=refresh.token,
            refresh_expires_at=refresh.expires_at,
        )
