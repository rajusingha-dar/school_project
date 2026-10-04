"""Password hashing and JWT creation/verification."""

import asyncio
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.clock import utcnow
from app.core.config import get_settings
from app.core.exceptions import InvalidTokenError

TokenType = Literal["access", "refresh"]

_hasher = PasswordHasher()
# Verified against when the email is unknown so response time doesn't reveal which emails exist.
DUMMY_PASSWORD_HASH = _hasher.hash("learncurve-dummy-password")


@dataclass(frozen=True)
class IssuedToken:
    """A freshly signed JWT with its metadata."""

    token: str
    jti: str
    expires_at: datetime


@dataclass(frozen=True)
class TokenClaims:
    """Verified claims extracted from a JWT."""

    user_id: int
    token_type: TokenType
    jti: str
    role: str | None


async def hash_password(plain_password: str) -> str:
    """Hash a password with Argon2id without blocking the event loop.

    Args:
        plain_password: The raw password.

    Returns:
        The encoded Argon2 hash.
    """
    return await asyncio.to_thread(_hasher.hash, plain_password)


async def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a password against a stored hash without blocking the event loop.

    Args:
        plain_password: The raw password supplied by the user.
        password_hash: The stored Argon2 hash.

    Returns:
        ``True`` if the password matches, otherwise ``False``.
    """

    def _verify() -> bool:
        try:
            return _hasher.verify(password_hash, plain_password)
        except (VerificationError, InvalidHashError):
            return False

    return await asyncio.to_thread(_verify)


def _issue_token(
    user_id: int, token_type: TokenType, lifetime: timedelta, role: str | None
) -> IssuedToken:
    settings = get_settings()
    now = utcnow()
    expires_at = now + lifetime
    jti = uuid.uuid4().hex
    claims: dict[str, object] = {
        "sub": str(user_id),
        "type": token_type,
        "jti": jti,
        "iat": now,
        "exp": expires_at,
    }
    if role is not None:
        claims["role"] = role
    # utcnow() is naive UTC; PyJWT treats naive datetimes as UTC.
    token = jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return IssuedToken(token=token, jti=jti, expires_at=expires_at)


def create_access_token(user_id: int, role: str) -> IssuedToken:
    """Create a short-lived access token.

    Args:
        user_id: The authenticated user's id.
        role: The user's role, embedded for convenience (always re-checked server-side).

    Returns:
        The signed access token and its metadata.
    """
    minutes = get_settings().access_token_expire_minutes
    return _issue_token(user_id, "access", timedelta(minutes=minutes), role)


def create_refresh_token(user_id: int) -> IssuedToken:
    """Create a long-lived refresh token.

    Args:
        user_id: The authenticated user's id.

    Returns:
        The signed refresh token and its metadata (``jti`` is persisted for revocation).
    """
    days = get_settings().refresh_token_expire_days
    return _issue_token(user_id, "refresh", timedelta(days=days), None)


def decode_token(token: str, expected_type: TokenType) -> TokenClaims:
    """Verify a JWT's signature, expiry and type.

    Args:
        token: The encoded JWT.
        expected_type: Either ``"access"`` or ``"refresh"``.

    Returns:
        The verified claims.

    Raises:
        InvalidTokenError: If the token is invalid, expired, or of the wrong type.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub", "jti", "type"]},
        )
        if payload["type"] != expected_type:
            raise InvalidTokenError("Wrong token type")
        return TokenClaims(
            user_id=int(payload["sub"]),
            token_type=payload["type"],
            jti=payload["jti"],
            role=payload.get("role"),
        )
    except (jwt.PyJWTError, ValueError) as exc:
        raise InvalidTokenError("Invalid token") from exc
