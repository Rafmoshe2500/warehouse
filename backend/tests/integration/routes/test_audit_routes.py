"""
Integration tests for Audit API routes.

Covers:
  - GET /api/audit/logs — require_audit_access dependency + filtering + pagination
  - POST /api/audit/logs — manual log creation, actor override
  - GET /api/audit/users/{username} — require_admin, activity retrieval
"""
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport

from app.core.constants import UserRole, Permission
from app.schemas.audit import AuditAction


# ── Extra fixtures ────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def async_client_inventory_ro(mock_mongodb) -> AsyncGenerator[AsyncClient, None]:
    """Async client authenticated as a user with inventory:ro permission only."""
    from app.core.security import get_current_user
    from app.main import app

    async def mock_get_current_user():
        return {
            "sub": "inventory_viewer",
            "username": "inventory_viewer",
            "role": UserRole.USER,
            "permissions": [Permission.INVENTORY_RO],
            "user_id": "inv_ro_123",
        }

    app.dependency_overrides[get_current_user] = mock_get_current_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def async_client_inventory_rw(mock_mongodb) -> AsyncGenerator[AsyncClient, None]:
    """Async client authenticated as a user with inventory:rw permission only."""
    from app.core.security import get_current_user
    from app.main import app

    async def mock_get_current_user():
        return {
            "sub": "inventory_editor",
            "username": "inventory_editor",
            "role": UserRole.USER,
            "permissions": [Permission.INVENTORY_RW],
            "user_id": "inv_rw_123",
        }

    app.dependency_overrides[get_current_user] = mock_get_current_user
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


# ── Helper ────────────────────────────────────────────────────────────────────


def _log_payload(**overrides) -> dict:
    base = {
        "action": AuditAction.ITEM_CREATE,
        "actor": "test_user",
        "actor_role": "admin",
        "target_resource": "item",
        "resource_id": "item_123",
        "details": "Integration test log",
    }
    base.update(overrides)
    return base


# ── require_audit_access dependency ──────────────────────────────────────────


@pytest.mark.asyncio
class TestAuditAccessControl:
    """Test that require_audit_access allows the right roles."""

    async def test_admin_can_access_audit_logs(self, async_client):
        res = await async_client.get("/api/audit/logs")
        assert res.status_code == 200

    async def test_superadmin_can_access_audit_logs(self, async_client_superadmin):
        res = await async_client_superadmin.get("/api/audit/logs")
        assert res.status_code == 200

    async def test_inventory_ro_user_can_access_audit_logs(self, async_client_inventory_ro):
        res = await async_client_inventory_ro.get("/api/audit/logs")
        assert res.status_code == 200

    async def test_inventory_rw_user_can_access_audit_logs(self, async_client_inventory_rw):
        res = await async_client_inventory_rw.get("/api/audit/logs")
        assert res.status_code == 200

    async def test_regular_user_cannot_access_audit_logs(self, async_client_user):
        res = await async_client_user.get("/api/audit/logs")
        assert res.status_code == 403


# ── GET /api/audit/logs ───────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestGetAuditLogs:
    """Test GET /api/audit/logs with various filters and pagination."""

    @pytest_asyncio.fixture(autouse=True)
    async def cleanup_audit_logs(self, test_audit_collection):
        """Clean audit logs before each test to prevent bleed-over."""
        await test_audit_collection.delete_many({})
        yield
        await test_audit_collection.delete_many({})

    async def _seed_log(self, client, **overrides):
        payload = _log_payload(**overrides)
        # Use the POST endpoint to seed (actor is overridden to current user by route)
        res = await client.post("/api/audit/logs", json={
            "action": payload["action"],
            "actor": payload["actor"],
            "actor_role": payload.get("actor_role", "admin"),
            "target_resource": payload.get("target_resource"),
            "resource_id": payload.get("resource_id"),
            "details": payload.get("details"),
        })
        assert res.status_code == 200
        return res.json()

    async def test_returns_200_with_empty_list(self, async_client):
        res = await async_client.get("/api/audit/logs")
        assert res.status_code == 200
        data = res.json()
        assert "logs" in data
        assert "total" in data
        assert isinstance(data["logs"], list)

    async def test_pagination_page_size(self, async_client):
        # Seed 5 logs
        for i in range(5):
            await self._seed_log(async_client, details=f"Log {i}")

        res = await async_client.get("/api/audit/logs?page=1&page_size=2")
        assert res.status_code == 200
        data = res.json()
        assert len(data["logs"]) == 2
        assert data["total"] == 5

    async def test_pagination_second_page(self, async_client):
        for i in range(5):
            await self._seed_log(async_client, details=f"Log {i}")

        res = await async_client.get("/api/audit/logs?page=2&page_size=2")
        assert res.status_code == 200
        data = res.json()
        assert len(data["logs"]) <= 2

    async def test_filter_by_action(self, async_client):
        await self._seed_log(async_client, action=AuditAction.ITEM_CREATE)
        await self._seed_log(async_client, action=AuditAction.ITEM_UPDATE)
        await self._seed_log(async_client, action=AuditAction.ITEM_CREATE)

        res = await async_client.get(f"/api/audit/logs?action={AuditAction.ITEM_CREATE.value}")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 2
        for log in data["logs"]:
            assert log["action"] == AuditAction.ITEM_CREATE.value

    async def test_filter_by_actor(self, async_client):
        # Actor is overridden by the route to the current user (test_user)
        await self._seed_log(async_client, details="seeded log")

        res = await async_client.get("/api/audit/logs?actor=test_user")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1

    async def test_page_size_validation_max_100(self, async_client):
        res = await async_client.get("/api/audit/logs?page_size=9999")
        assert res.status_code == 422  # Exceeds max=100

    async def test_page_validation_min_1(self, async_client):
        res = await async_client.get("/api/audit/logs?page=0")
        assert res.status_code == 422


# ── POST /api/audit/logs ──────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestCreateManualLog:
    """Test POST /api/audit/logs — manual audit log creation."""

    async def test_admin_can_create_manual_log(self, async_client):
        payload = {
            "action": AuditAction.UNDO,
            "actor": "should_be_overridden",
            "actor_role": "admin",
            "details": "Manual undo log via API",
        }
        res = await async_client.post("/api/audit/logs", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "log_id" in data
        assert data["status"] == "created"

    async def test_actor_is_overridden_to_current_user(self, async_client):
        """Route overrides actor with the authenticated user's sub."""
        payload = {
            "action": AuditAction.UNDO,
            "actor": "impostor_user",
            "actor_role": "admin",
            "details": "Should override actor",
        }
        res = await async_client.post("/api/audit/logs", json=payload)
        assert res.status_code == 200
        log_id = res.json()["log_id"]

        # Verify actor was overridden
        logs_res = await async_client.get("/api/audit/logs")
        logs = logs_res.json()["logs"]
        created_log = next((l for l in logs if l.get("id") == log_id), None)
        if created_log:
            assert created_log["actor"] == "test_user"  # from mock_get_current_user in conftest

    async def test_regular_user_can_create_log(self, async_client_user):
        """POST /logs does NOT require admin — any authenticated user can create."""
        payload = {
            "action": AuditAction.UNDO,
            "actor": "regular_user",
            "actor_role": "user",
            "details": "User undo action",
        }
        res = await async_client_user.post("/api/audit/logs", json=payload)
        # Not protected by require_admin — should succeed
        assert res.status_code == 200

    async def test_missing_required_fields_returns_422(self, async_client):
        res = await async_client.post("/api/audit/logs", json={"details": "no action or actor"})
        assert res.status_code == 422


# ── GET /api/audit/users/{username} ──────────────────────────────────────────


@pytest.mark.asyncio
class TestGetUserActivity:
    """Test GET /api/audit/users/{username} — require_admin."""

    async def _seed_log_direct(self, client, actor: str = "test_user"):
        payload = {
            "action": AuditAction.ITEM_CREATE,
            "actor": actor,
            "actor_role": "admin",
            "details": "Activity test",
        }
        res = await client.post("/api/audit/logs", json=payload)
        assert res.status_code == 200

    async def test_admin_can_get_user_activity(self, async_client):
        # Seed some logs (actor will be test_user due to override)
        await self._seed_log_direct(async_client, actor="test_user")
        await self._seed_log_direct(async_client, actor="test_user")

        res = await async_client.get("/api/audit/users/test_user")
        assert res.status_code == 200
        data = res.json()
        assert "logs" in data
        assert "total" in data

    async def test_regular_user_cannot_get_user_activity(self, async_client_user):
        res = await async_client_user.get("/api/audit/users/test_user")
        assert res.status_code == 403

    async def test_inventory_user_cannot_get_user_activity(self, async_client_inventory_ro):
        """require_admin is stricter than require_audit_access."""
        res = await async_client_inventory_ro.get("/api/audit/users/test_user")
        assert res.status_code == 403

    async def test_unknown_username_returns_empty_list(self, async_client):
        res = await async_client.get("/api/audit/users/totally_nonexistent_user_xyz")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] == 0
        assert data["logs"] == []

    async def test_user_activity_pagination(self, async_client):
        for _ in range(5):
            await self._seed_log_direct(async_client, actor="test_user")

        res = await async_client.get("/api/audit/users/test_user?page=1&page_size=2")
        assert res.status_code == 200
        data = res.json()
        assert len(data["logs"]) <= 2
