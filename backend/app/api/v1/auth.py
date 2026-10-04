"""Authentication endpoints: register, login, refresh, logout, current user."""

import logging
from typing import Annotated

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from app.api.v1.deps import CurrentUser
from app.core.clock import utcnow
from app.core.config import get_settings
from app.core.exceptions import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from app.db.session import SessionDep
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserRead
from app.services.auth_service import AuthResult, AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

_REFRESH_COOKIE = get_settings().refresh_cookie_name


def _set_refresh_cookie(response: Response, result: AuthResult) -> None:
    """Attach the refresh token to the response as an httpOnly cookie."""
    settings = get_settings()
    max_age = int((result.refresh_expires_at - utcnow()).total_seconds())
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=result.refresh_token,
        max_age=max(max_age, 0),
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        path=settings.refresh_cookie_path,
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Remove the refresh cookie from the browser."""
    settings = get_settings()
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=settings.refresh_cookie_path,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


def _to_response(result: AuthResult) -> AuthResponse:
    """Convert a service result into the public response body."""
    return AuthResponse(
        access_token=result.access_token,
        expires_in=result.access_expires_in,
        user=UserRead.model_validate(result.user),
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a parent account",
    description=(
        "Creates a new parent account and signs it in. Returns an access token in the body "
        "and sets the refresh token as an httpOnly cookie. Responds 409 if the email is taken."
    ),
)
async def register(body: RegisterRequest, response: Response, session: SessionDep) -> AuthResponse:
    """Register a new parent.

    Args:
        body: Email, password and full name.
        response: Used to set the refresh cookie.
        session: Database session.

    Returns:
        Access token and the new user.
    """
    try:
        result = await AuthService(session).register_parent(
            body.email, body.password, body.full_name
        )
    except EmailAlreadyRegisteredError as exc:
        raise HTTPException(
            status.HTTP_409_CONFLICT, detail="An account with this email already exists"
        ) from exc
    _set_refresh_cookie(response, result)
    return _to_response(result)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Log in with email and password",
    description=(
        "Returns an access token in the body and sets the refresh token as an httpOnly cookie. "
        "Responds 401 with a generic message for any invalid credentials."
    ),
)
async def login(body: LoginRequest, response: Response, session: SessionDep) -> AuthResponse:
    """Authenticate a user.

    Args:
        body: Email and password.
        response: Used to set the refresh cookie.
        session: Database session.

    Returns:
        Access token and the user.
    """
    try:
        result = await AuthService(session).login(body.email, body.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    _set_refresh_cookie(response, result)
    return _to_response(result)


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh the access token",
    description=(
        "Reads the refresh-token cookie, rotates it, and returns a new access token. "
        "Responds 401 if the cookie is missing, invalid, expired or already used."
    ),
)
async def refresh(
    response: Response,
    session: SessionDep,
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> AuthResponse:
    """Exchange the refresh cookie for a new token pair.

    Args:
        response: Used to set the rotated refresh cookie.
        session: Database session.
        refresh_token: The refresh JWT from the cookie.

    Returns:
        A new access token and the user.
    """
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        result = await AuthService(session).refresh(refresh_token)
    except InvalidTokenError as exc:
        _clear_refresh_cookie(response)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Session expired") from exc
    _set_refresh_cookie(response, result)
    return _to_response(result)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Log out",
    description="Revokes the refresh token (if any) and clears the refresh cookie.",
)
async def logout(
    response: Response,
    session: SessionDep,
    refresh_token: Annotated[str | None, Cookie(alias=_REFRESH_COOKIE)] = None,
) -> None:
    """End the current session.

    Args:
        response: Used to clear the refresh cookie.
        session: Database session.
        refresh_token: The refresh JWT from the cookie, if present.
    """
    await AuthService(session).logout(refresh_token)
    _clear_refresh_cookie(response)


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get the current user",
    description="Returns the user identified by the bearer access token.",
)
async def me(user: CurrentUser) -> UserRead:
    """Return the authenticated user's profile.

    Args:
        user: The user resolved from the access token.

    Returns:
        The user's public profile.
    """
    return UserRead.model_validate(user)
