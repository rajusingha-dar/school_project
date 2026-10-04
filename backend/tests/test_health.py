from httpx import AsyncClient

from app.db.session import get_session
from app.main import app


class _BrokenSession:
    async def execute(self, *_args, **_kwargs):
        raise RuntimeError("db down")


async def test_health_ok(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "up"}


async def test_health_degraded_when_db_down(client: AsyncClient) -> None:
    app.dependency_overrides[get_session] = lambda: _BrokenSession()
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "degraded", "database": "down"}
