"""Health-check endpoints."""

import logging

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.db.session import SessionDep

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    """Response body for health checks."""

    status: str
    database: str


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service health check",
    description="Returns service status and whether the database answers a trivial query.",
)
async def health(session: SessionDep) -> HealthResponse:
    """Report API and database health.

    Args:
        session: Database session injected by FastAPI.

    Returns:
        ``status`` is ``ok`` when the database is reachable, otherwise ``degraded``.
    """
    try:
        await session.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="up")
    except Exception:
        logger.exception("Database health check failed")
        return HealthResponse(status="degraded", database="down")
