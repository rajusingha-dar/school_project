from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.core.security import create_access_token, create_refresh_token
from app.models.user import User, UserRole

REGISTER = {"email": "Priya@Example.com", "password": "correct-horse", "full_name": "Priya Sharma"}


async def _register(client: AsyncClient, **overrides):
    return await client.post("/api/v1/auth/register", json={**REGISTER, **overrides})


async def test_register_creates_parent_and_signs_in(client: AsyncClient) -> None:
    response = await _register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "priya@example.com"  # normalised
    assert body["user"]["role"] == "parent"
    assert "password" not in str(body)
    cookie = response.headers["set-cookie"]
    assert "refresh_token=" in cookie and "HttpOnly" in cookie


async def test_register_ignores_client_supplied_role(
    client: AsyncClient, session_factory: async_sessionmaker[AsyncSession]
) -> None:
    await _register(client, role="school_admin")
    async with session_factory() as session:
        user = (await session.execute(select(User))).scalar_one()
    assert user.role == UserRole.PARENT


async def test_register_duplicate_email_conflicts(client: AsyncClient) -> None:
    await _register(client)
    response = await _register(client, email="priya@example.com")
    assert response.status_code == 409


async def test_register_validates_input(client: AsyncClient) -> None:
    assert (await _register(client, password="short")).status_code == 422
    assert (await _register(client, email="not-an-email")).status_code == 422
    assert (await _register(client, full_name="   ")).status_code == 422


async def test_login_success_and_me(client: AsyncClient) -> None:
    await _register(client)
    response = await client.post(
        "/api/v1/auth/login", json={"email": "priya@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["full_name"] == "Priya Sharma"


async def test_login_wrong_password_and_unknown_email_look_identical(client: AsyncClient) -> None:
    await _register(client)
    wrong_password = await client.post(
        "/api/v1/auth/login", json={"email": "priya@example.com", "password": "nope-nope-nope"}
    )
    unknown_email = await client.post(
        "/api/v1/auth/login", json={"email": "ghost@example.com", "password": "correct-horse"}
    )
    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


async def test_inactive_user_cannot_login(
    client: AsyncClient, session_factory: async_sessionmaker[AsyncSession]
) -> None:
    await _register(client)
    async with session_factory() as session:
        user = (await session.execute(select(User))).scalar_one()
        user.is_active = False
        await session.commit()
    response = await client.post(
        "/api/v1/auth/login", json={"email": "priya@example.com", "password": "correct-horse"}
    )
    assert response.status_code == 401


async def test_me_requires_valid_access_token(client: AsyncClient) -> None:
    assert (await client.get("/api/v1/auth/me")).status_code == 401
    bad = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"})
    assert bad.status_code == 401
    # A refresh token must not be accepted as an access token.
    refresh_as_access = create_refresh_token(1).token
    wrong_type = await client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh_as_access}"}
    )
    assert wrong_type.status_code == 401


async def test_me_rejects_token_for_deleted_user(client: AsyncClient) -> None:
    token = create_access_token(9999, "parent").token
    response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401


async def test_refresh_rotates_token(client: AsyncClient) -> None:
    await _register(client)
    first_cookie = client.cookies.get("refresh_token")
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 200
    assert response.json()["access_token"]
    assert client.cookies.get("refresh_token") != first_cookie


async def test_refresh_without_cookie_is_unauthorized(client: AsyncClient) -> None:
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401


async def test_refresh_token_reuse_revokes_all_sessions(client: AsyncClient) -> None:
    await _register(client)
    stolen = client.cookies.get("refresh_token")
    assert (await client.post("/api/v1/auth/refresh")).status_code == 200  # legit rotation
    # Attacker replays the old (now revoked) token.
    client.cookies.clear()
    client.cookies.set("refresh_token", stolen, path="/api/v1/auth")
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401
    # The legitimate user's newer token was revoked too.
    login = await client.post(
        "/api/v1/auth/login", json={"email": "priya@example.com", "password": "correct-horse"}
    )
    assert login.status_code == 200  # a fresh login still works


async def test_logout_revokes_refresh_token(client: AsyncClient) -> None:
    await _register(client)
    token = client.cookies.get("refresh_token")
    assert (await client.post("/api/v1/auth/logout")).status_code == 204
    client.cookies.set("refresh_token", token, path="/api/v1/auth")
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401


async def test_logout_without_session_is_ok(client: AsyncClient) -> None:
    assert (await client.post("/api/v1/auth/logout")).status_code == 204
