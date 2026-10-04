"""Domain exceptions raised by services and translated to HTTP errors by the API layer."""


class EmailAlreadyRegisteredError(Exception):
    """Raised when registering an email that already has an account."""


class InvalidCredentialsError(Exception):
    """Raised when an email/password pair does not match an active account."""


class InvalidTokenError(Exception):
    """Raised when a JWT is malformed, expired, revoked or of the wrong type."""
