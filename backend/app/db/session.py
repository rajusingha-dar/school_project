"""Async database engine and session management."""

import logging
from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """Return the process-wide async engine, creating it on first use.

    Returns:
        The shared ``AsyncEngine``.
    """
    global _engine, _session_factory
    if _engine is None:
        settings = get_settings()
        _engine = create_async_engine(settings.database_url, pool_pre_ping=True, pool_recycle=1800)
        _session_factory = async_sessionmaker(_engine, expire_on_commit=False)
        logger.info("Database engine created for %s:%s", settings.db_host, settings.db_port)
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return the shared session factory, creating the engine on first use.

    Returns:
        A factory producing ``AsyncSession`` objects (use as an async context manager).
    """
    get_engine()
    assert _session_factory is not None
    return _session_factory


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding a database session per request.

    Yields:
        An ``AsyncSession`` that is closed when the request finishes.
    """
    async with get_session_factory()() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
"""Annotated dependency: ``session: SessionDep`` in route handlers."""


async def dispose_engine() -> None:
    """Close all pooled connections; called on application shutdown."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        logger.info("Database engine disposed")
    _engine = None
    _session_factory = None
