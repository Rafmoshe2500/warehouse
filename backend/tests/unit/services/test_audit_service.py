"""
Tests for AuditService.
Tests high-level audit logging operations.
"""
import pytest
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction, AuditLogCreate
from app.core.constants import UserRole


class TestAuditService:
    """Test suite for AuditService."""

    @pytest.fixture
    def audit_service(self, mock_mongodb, test_audit_collection):
        return AuditService()

    @pytest.mark.asyncio
    async def test_log_user_action(self, audit_service):
        """Test logging a user action."""
        log_id = await audit_service.log_user_action(
            action=AuditAction.ITEM_CREATE,
            actor="admin_user",
            actor_role=UserRole.ADMIN,
            target_resource="item",
            resource_id="123",
            details="Test log"
        )
        
        assert log_id is not None
        
        # Verify saved in DB
        logs_resp = await audit_service.get_audit_logs()
        assert logs_resp.total == 1
        assert logs_resp.logs[0].actor == "admin_user"
        assert logs_resp.logs[0].action == "item_create"

    @pytest.mark.asyncio
    async def test_get_audit_logs_pagination(self, audit_service):
        """Test fetching audit logs with pagination."""
        for i in range(5):
            await audit_service.log_user_action(
                action=AuditAction.ITEM_UPDATE,
                actor="user",
                actor_role=UserRole.USER,
                details=f"Log {i}"
            )
        
        result = await audit_service.get_audit_logs(page=1, page_size=2)
        assert len(result.logs) == 2
        assert result.total == 5

    @pytest.mark.asyncio
    async def test_create_manual_log(self, audit_service):
        """Test manual log creation."""
        log_data = AuditLogCreate(
            action=AuditAction.UNDO,
            actor="sys",
            actor_role=UserRole.ADMIN,
            details="Manual undo log"
        )
        
        log_id = await audit_service.create_manual_log(log_data)
        assert log_id is not None
        
        log = await audit_service.repository.get_audit_log_by_id(log_id)
        assert log["action"] == "undo"


# ── get_user_activity ─────────────────────────────────────────────────────────


class TestGetUserActivity:
    """Tests for AuditService.get_user_activity."""

    @pytest.fixture
    def audit_service(self, mock_mongodb, test_audit_collection):
        svc = AuditService()
        svc.repository.collection = test_audit_collection
        return svc

    @pytest.mark.asyncio
    async def test_get_user_activity_returns_logs_for_user(self, audit_service):
        """get_user_activity returns AuditLogsListResponse with user's logs."""
        for _ in range(3):
            await audit_service.log_user_action(
                action=AuditAction.ITEM_CREATE,
                actor="target_user",
                actor_role="admin",
            )

        result = await audit_service.get_user_activity("target_user")
        assert result.total == 3
        assert len(result.logs) == 3
        assert all(log.actor == "target_user" for log in result.logs)

    @pytest.mark.asyncio
    async def test_get_user_activity_filters_other_users(self, audit_service):
        """get_user_activity does not return logs belonging to other users."""
        await audit_service.log_user_action(
            action=AuditAction.ITEM_CREATE, actor="user_a", actor_role="admin"
        )
        await audit_service.log_user_action(
            action=AuditAction.ITEM_UPDATE, actor="user_b", actor_role="admin"
        )

        result = await audit_service.get_user_activity("user_a")
        assert result.total == 1
        assert result.logs[0].actor == "user_a"

    @pytest.mark.asyncio
    async def test_get_user_activity_empty_for_unknown_user(self, audit_service):
        result = await audit_service.get_user_activity("nobody")
        assert result.total == 0
        assert result.logs == []

    @pytest.mark.asyncio
    async def test_get_user_activity_pagination(self, audit_service):
        for _ in range(5):
            await audit_service.log_user_action(
                action=AuditAction.ITEM_DELETE, actor="active_user", actor_role="admin"
            )

        result = await audit_service.get_user_activity("active_user", page=1, page_size=2)
        assert len(result.logs) == 2
        assert result.total == 5


# ── get_action_count ──────────────────────────────────────────────────────────


class TestGetActionCount:
    """Tests for AuditService.get_action_count."""

    @pytest.fixture
    def audit_service(self, mock_mongodb, test_audit_collection):
        svc = AuditService()
        svc.repository.collection = test_audit_collection
        return svc

    @pytest.mark.asyncio
    async def test_get_action_count_returns_correct_count(self, audit_service):
        for _ in range(4):
            await audit_service.log_user_action(
                action=AuditAction.ITEM_CREATE, actor="admin", actor_role="admin"
            )
        # Only item_create in last 7 days
        count = await audit_service.get_action_count(["item_create"], days=7)
        assert count == 4

    @pytest.mark.asyncio
    async def test_get_action_count_excludes_other_actions(self, audit_service):
        await audit_service.log_user_action(
            action=AuditAction.ITEM_CREATE, actor="admin", actor_role="admin"
        )
        await audit_service.log_user_action(
            action=AuditAction.ITEM_DELETE, actor="admin", actor_role="admin"
        )

        count = await audit_service.get_action_count(["item_create"], days=7)
        assert count == 1

    @pytest.mark.asyncio
    async def test_get_action_count_zero_when_empty(self, audit_service):
        count = await audit_service.get_action_count(["item_create"], days=7)
        assert count == 0


# ── delete_resource_logs ──────────────────────────────────────────────────────


class TestDeleteResourceLogs:
    """Tests for AuditService.delete_resource_logs."""

    @pytest.fixture
    def audit_service(self, mock_mongodb, test_audit_collection):
        svc = AuditService()
        svc.repository.collection = test_audit_collection
        return svc

    @pytest.mark.asyncio
    async def test_delete_resource_logs_removes_logs(self, audit_service):
        for _ in range(3):
            await audit_service.log_user_action(
                action=AuditAction.ITEM_DELETE,
                actor="admin",
                actor_role="admin",
                target_resource="item",
                resource_id="item_xyz",
            )

        deleted = await audit_service.delete_resource_logs("item", "item_xyz")
        assert deleted == 3

        remaining = await audit_service.get_audit_logs()
        assert remaining.total == 0

    @pytest.mark.asyncio
    async def test_delete_resource_logs_does_not_affect_other_resources(self, audit_service):
        await audit_service.log_user_action(
            action=AuditAction.ITEM_DELETE,
            actor="admin",
            actor_role="admin",
            target_resource="item",
            resource_id="item_a",
        )
        await audit_service.log_user_action(
            action=AuditAction.ITEM_UPDATE,
            actor="admin",
            actor_role="admin",
            target_resource="item",
            resource_id="item_b",
        )

        deleted = await audit_service.delete_resource_logs("item", "item_a")
        assert deleted == 1

        remaining = await audit_service.get_audit_logs()
        assert remaining.total == 1

    @pytest.mark.asyncio
    async def test_delete_resource_logs_returns_zero_when_nothing_to_delete(self, audit_service):
        deleted = await audit_service.delete_resource_logs("item", "ghost_id")
        assert deleted == 0
