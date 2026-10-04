"""Shared FastAPI dependencies: current user and role guards."""

from collections.abc import Callable, Coroutine
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import InvalidTokenError
from app.core.security import decode_token
from app.db.session import SessionDep
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer_scheme)],
    session: SessionDep,
) -> User:
    """Resolve the authenticated user from the ``Authorization: Bearer`` access token.

    Args:
        credentials: Parsed bearer credentials, if present.
        session: Database session.

    Returns:
        The active user the token belongs to.

    Raises:
        HTTPException: 401 if the token is missing/invalid or the user is gone or inactive.
    """
    if credentials is None:
        raise _UNAUTHORIZED
    try:
        claims = decode_token(credentials.credentials, "access")
    except InvalidTokenError as exc:
        raise _UNAUTHORIZED from exc
    user = await UserRepository(session).get_by_id(claims.user_id)
    if user is None or not user.is_active:
        raise _UNAUTHORIZED
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
"""Annotated dependency: ``user: CurrentUser`` in protected route handlers."""


def require_role(*allowed_roles: UserRole) -> Callable[..., Coroutine[Any, Any, User]]:
    """Build a dependency that only admits users with one of the given roles.

    Args:
        *allowed_roles: Roles permitted to call the endpoint.

    Returns:
        A dependency returning the user, or raising 403 for other roles.
    """

    async def _guard(user: CurrentUser) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return _guard
