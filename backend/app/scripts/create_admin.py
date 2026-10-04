"""Create a school-admin account from the command line.

Usage (from ``backend/``)::

    uv run python -m app.scripts.create_admin --email EMAIL --name NAME --school SCHOOL

The password is read from a hidden prompt so it never lands in shell history.
"""

import argparse
import asyncio
import getpass
import logging
import sys

from pydantic import TypeAdapter, ValidationError

from app.core.config import get_settings
from app.core.exceptions import EmailAlreadyRegisteredError
from app.core.logging import setup_logging
from app.db.session import dispose_engine, get_session_factory
from app.schemas.auth import Password
from app.services.auth_service import AuthService

logger = logging.getLogger("create_admin")


def _parse_args() -> argparse.Namespace:
    """Parse command-line arguments.

    Returns:
        The parsed arguments (``email``, ``name``, ``school``).
    """
    parser = argparse.ArgumentParser(description="Create a school-admin account.")
    parser.add_argument("--email", required=True, help="Login email for the admin")
    parser.add_argument("--name", required=True, help="Admin's full name")
    parser.add_argument("--school", required=True, help="School name (created if new)")
    return parser.parse_args()


def _prompt_password() -> str:
    """Prompt twice for a password and validate it against the register rules.

    Returns:
        The confirmed, valid password.

    Raises:
        SystemExit: If the entries differ or the password is too short/long.
    """
    password = getpass.getpass("Password: ")
    if password != getpass.getpass("Confirm password: "):
        raise SystemExit("Passwords do not match.")
    try:
        return TypeAdapter(Password).validate_python(password)
    except ValidationError as exc:
        raise SystemExit("Password must be 8-128 characters.") from exc


async def _run(email: str, name: str, school: str, password: str) -> int:
    """Create the admin and report the outcome.

    Args:
        email: Login email.
        name: Full name.
        school: School name.
        password: Plain-text password.

    Returns:
        Process exit code (0 on success).
    """
    try:
        async with get_session_factory()() as session:
            await AuthService(session).create_school_admin(
                email.strip().lower(), password, name.strip(), school.strip()
            )
    except EmailAlreadyRegisteredError:
        logger.error("An account with %s already exists.", email)
        return 1
    finally:
        await dispose_engine()
    logger.info("School admin %s created for %s.", email, school)
    return 0


def main() -> None:
    """Entry point for ``python -m app.scripts.create_admin``."""
    setup_logging(get_settings().log_level)
    args = _parse_args()
    password = _prompt_password()
    sys.exit(asyncio.run(_run(args.email, args.name, args.school, password)))


if __name__ == "__main__":
    main()
