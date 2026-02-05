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
