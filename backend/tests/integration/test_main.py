"""
Tests for main.py — root endpoint, health check, middleware, global exception handler.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock

from app.main import app
from app.core.security import get_current_user
from app.core.constants import UserRole, Permission


@pytest_asyncio.fixture
async def client(mock_mongodb):
    """Unauthenticated async client for public endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


class TestRootEndpoint:

    @pytest.mark.asyncio
    async def test_root_returns_api_info(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["version"] == "2.0.0"
        assert "docs" in data

    @pytest.mark.asyncio
    async def test_root_contains_message(self, client):
        resp = await client.get("/")
        data = resp.json()
        assert "message" in data


class TestHealthCheck:

    @pytest.mark.asyncio
    async def test_health_check_healthy(self, client):
        with patch("app.db.mongodb.MongoDB.health_check", new_callable=AsyncMock, return_value=True):
            resp = await client.get("/health")
            assert resp.status_code == 200
            data = resp.json()
            assert data["status"] == "healthy"
            assert data["mongodb"] == "connected"

    @pytest.mark.asyncio
    async def test_health_check_unhealthy(self, client):
        with patch("app.db.mongodb.MongoDB.health_check", new_callable=AsyncMock, return_value=False):
            resp = await client.get("/health")
            assert resp.status_code == 503
            data = resp.json()
            assert data["status"] == "unhealthy"
            assert data["mongodb"] == "disconnected"


class TestProcessTimeMiddleware:

    @pytest.mark.asyncio
    async def test_response_has_process_time_header(self, client):
        resp = await client.get("/")
        assert "x-process-time" in resp.headers
        process_time = float(resp.headers["x-process-time"])
        assert process_time >= 0


class TestPrivateNetworkMiddleware:

    @pytest.mark.asyncio
    async def test_response_has_private_network_header(self, client):
        resp = await client.get("/")
        assert resp.headers.get("access-control-allow-private-network") == "true"


class TestGlobalExceptionHandler:

    @pytest.mark.asyncio
    async def test_unhandled_exception_returns_500(self, mock_mongodb):
        """Inject an unhandled exception into a route and verify 500 response."""
        from app.main import app as test_app

        @test_app.get("/test-exception-route")
        async def raise_error():
            raise RuntimeError("Unexpected failure")

        # Use raise_server_exceptions=False so httpx doesn't re-raise
        transport = ASGITransport(app=test_app, raise_app_exceptions=False)
        async with AsyncClient(transport=transport, base_url="http://test") as c:
            resp = await c.get("/test-exception-route")
            assert resp.status_code == 500
            data = resp.json()
            assert data["detail"] == "Internal Server Error"
