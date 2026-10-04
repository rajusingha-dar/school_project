"""Pydantic schemas for authentication endpoints."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

from app.models.user import UserRole

Password = Annotated[str, Field(min_length=8, max_length=128)]


class _EmailMixin(BaseModel):
    """Normalises email addresses to lower-case and trims whitespace."""

    email: EmailStr

    @field_validator("email", mode="after")
    @classmethod
    def _normalise_email(cls, value: str) -> str:
        return value.strip().lower()


class RegisterRequest(_EmailMixin):
    """Body for creating a new parent account."""

    password: Password
    full_name: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=1, max_length=120)
    ]


class LoginRequest(_EmailMixin):
    """Body for logging in with email and password."""

    password: Annotated[str, Field(min_length=1, max_length=128)]


class UserRead(BaseModel):
    """Public representation of a user (never includes the password hash)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole


class AuthResponse(BaseModel):
    """Returned after register, login and refresh. The refresh token travels as a cookie."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Access token lifetime in seconds.")
    user: UserRead
