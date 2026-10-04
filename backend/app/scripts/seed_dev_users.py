"""Create demo accounts for local testing. Development only.

Usage (from ``backend/``)::

    uv run python -m app.scripts.seed_dev_users

Safe to re-run: accounts that already exist are skipped. The credentials are public
(see docs/TEST_ACCOUNTS.md), so the script refuses to run unless APP_ENV=development.
"""

import asyncio
import logging
import sys
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import EmailAlreadyRegisteredError
from app.core.logging import setup_logging
from app.db.session import dispose_engine, get_session_factory
from app.services.auth_service import AuthService

logger = logging.getLogger("seed_dev_users")


@dataclass(frozen=True)
class DemoAccount:
    """A demo account to create."""

    email: str
    password: str
    full_name: str
    school_name: str | None = None  # set => school admin, otherwise parent


DEMO_ACCOUNTS = (
    DemoAccount("priya@example.com", "Parent@12345", "Priya Sharma"),
    DemoAccount("rahul@example.com", "Parent@12345", "Rahul Verma"),
    DemoAccount("admin@example.com", "Admin@12345", "Rekha Menon", "Greenwood Public School"),
)


async def seed_demo_accounts(session: AsyncSession) -> list[str]:
    """Create any missing demo accounts.

    Args:
        session: Database session (committed per account by the service).

    Returns:
        Emails of the accounts that were newly created.
    """
    service = AuthService(session)
    created: list[str] = []
    for account in DEMO_ACCOUNTS:
        try:
            if account.school_name:
                await service.create_school_admin(
                    account.email, account.password, account.full_name, account.school_name
                )
            else:
                await service.create_parent(account.email, account.password, account.full_name)
        except EmailAlreadyRegisteredError:
            logger.info("Skipped %s (already exists)", account.email)
            continue
        created.append(account.email)
        logger.info("Created %s", account.email)
    return created


async def _run() -> None:
    """Open a session, seed, and release the engine."""
    try:
        async with get_session_factory()() as session:
            created = await seed_demo_accounts(session)
    finally:
        await dispose_engine()
    logger.info(
        "Done: %d created, %d already existed.", len(created), len(DEMO_ACCOUNTS) - len(created)
    )


def main() -> None:
    """Entry point for ``python -m app.scripts.seed_dev_users``."""
    settings = get_settings()
    setup_logging(settings.log_level)
    if settings.app_env != "development":
        logger.error("Refusing to seed demo accounts when APP_ENV=%s.", settings.app_env)
        sys.exit(1)
    asyncio.run(_run())


if __name__ == "__main__":
    main()
