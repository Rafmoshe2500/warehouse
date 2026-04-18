"""
Tests for AuditRepository.
Tests audit log creation, filtering, and user activity.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from bson import ObjectId

from app.db.repositories.audit_repository import AuditRepository
from app.schemas.audit import AuditLogCreate, AuditAction


class TestAuditRepository:
    """Test suite for AuditRepository."""

    # ========== Create Tests ==========

    @pytest.mark.asyncio
    async def test_create_audit_log(self, test_audit_collection):
        """Test creating an audit log entry."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        audit_data = AuditLogCreate(
            action=AuditAction.ITEM_CREATE,
            actor="test_user",
            actor_role="admin",
            target_resource="item",
            resource_id="item_123",
            details="Created test item"
        )
        
        log_id = await repo.create_audit_log(audit_data)
        
        assert log_id is not None
        assert isinstance(log_id, str)

    @pytest.mark.asyncio
    async def test_create_audit_log_with_all_fields(self, test_audit_collection):
        """Test creating audit log with all optional fields."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        audit_data = AuditLogCreate(
            action=AuditAction.USER_UPDATE,
            actor="admin",
            actor_role="superadmin",
            target_user="john_doe",
            target_role="user",
            target_resource="user",
            resource_id="user_456",
            changes={"role": {"old": "user", "new": "admin"}},
            reason="Promotion",
            details="User promoted to admin",
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0"
        )
        
        log_id = await repo.create_audit_log(audit_data)
        
        assert log_id is not None

    @pytest.mark.asyncio
    async def test_create_audit_log_sets_timestamp(self, test_audit_collection):
        """Test that created audit log has timestamp."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        audit_data = AuditLogCreate(
            action=AuditAction.ITEM_DELETE,
            actor="admin",
            actor_role="admin",
            details="Deleted item"
        )
        
        log_id = await repo.create_audit_log(audit_data)
        
        # Verify timestamp was set
        log = await repo.get_audit_log_by_id(log_id)
        assert "timestamp" in log

    # ========== Get Logs Tests ==========

    @pytest.mark.asyncio
    async def test_get_audit_logs_pagination(self, test_audit_collection):
        """Test getting audit logs with pagination."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        # Create multiple logs
        for i in range(5):
            audit_data = AuditLogCreate(
                action=AuditAction.ITEM_CREATE,
                actor=f"user_{i}",
                actor_role="admin",
                details=f"Action {i}"
            )
            await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_audit_logs(skip=0, limit=3)
        
        assert len(logs) == 3
        assert total == 5

    @pytest.mark.asyncio
    async def test_get_audit_logs_filter_by_action(self, test_audit_collection):
        """Test filtering logs by action type."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        # Create logs with different actions
        for action in [AuditAction.ITEM_CREATE, AuditAction.ITEM_UPDATE, AuditAction.ITEM_CREATE]:
            audit_data = AuditLogCreate(
                action=action,
                actor="admin",
                actor_role="admin"
            )
            await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_audit_logs(action=AuditAction.ITEM_CREATE)
        
        assert total == 2

    @pytest.mark.asyncio
    async def test_get_audit_logs_filter_by_actor(self, test_audit_collection):
        """Test filtering logs by actor."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        for actor in ["alice", "bob", "alice"]:
            audit_data = AuditLogCreate(
                action=AuditAction.ITEM_UPDATE,
                actor=actor,
                actor_role="admin"
            )
            await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_audit_logs(actor="alice")
        
        assert total == 2

    @pytest.mark.asyncio
    async def test_get_audit_logs_filter_by_target_user(self, test_audit_collection):
        """Test filtering logs by target user."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        for target in ["john", "jane", "john"]:
            audit_data = AuditLogCreate(
                action=AuditAction.USER_UPDATE,
                actor="admin",
                actor_role="admin",
                target_user=target
            )
            await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_audit_logs(target_user="john")
        
        assert total == 2

    @pytest.mark.asyncio
    async def test_get_audit_logs_filter_by_resource(self, test_audit_collection):
        """Test filtering logs by target resource."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        for resource in ["item", "procurement_order", "item"]:
            audit_data = AuditLogCreate(
                action=AuditAction.ITEM_CREATE,
                actor="admin",
                actor_role="admin",
                target_resource=resource
            )
            await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_audit_logs(target_resource="item")
        
        assert total == 2

    @pytest.mark.asyncio
    async def test_get_audit_logs_filter_by_date_range(self, test_audit_collection):
        """Test filtering logs by date range."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        now = datetime.now(timezone.utc)
        
        # Create logs with different timestamps
        # Insert directly to control timestamp, must be wrapped!
        await test_audit_collection.insert_one({
            "item_action": {
                "action": "item_create",
                "actor": "admin",
                "actor_role": "admin",
                "timestamp": now - timedelta(days=5)
            }
        })
        await test_audit_collection.insert_one({
            "item_action": {
                "action": "item_create",
                "actor": "admin",
                "actor_role": "admin",
                "timestamp": now - timedelta(days=1)
            }
        })
        await test_audit_collection.insert_one({
            "item_action": {
                "action": "item_create",
                "actor": "admin",
                "actor_role": "admin",
                "timestamp": now
            }
        })
        
        # Filter for last 3 days
        start_date = now - timedelta(days=3)
        logs, total = await repo.get_audit_logs(start_date=start_date)
        
        assert total == 2

    # ========== Get By ID Tests ==========

    @pytest.mark.asyncio
    async def test_get_audit_log_by_id(self, test_audit_collection):
        """Test getting audit log by ID."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        audit_data = AuditLogCreate(
            action=AuditAction.PROCUREMENT_CREATE,
            actor="admin",
            actor_role="admin",
            details="Created procurement order"
        )
        log_id = await repo.create_audit_log(audit_data)
        
        result = await repo.get_audit_log_by_id(log_id)
        
        assert result is not None
        assert result["id"] == log_id
        assert result["action"] == "procurement_create"

    @pytest.mark.asyncio
    async def test_get_audit_log_by_id_not_found(self, test_audit_collection):
        """Test getting non-existent audit log returns None."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        fake_id = str(ObjectId())
        result = await repo.get_audit_log_by_id(fake_id)
        
        assert result is None

    # ========== User Activity Tests ==========

    @pytest.mark.asyncio
    async def test_get_user_activity(self, test_audit_collection):
        """Test getting all activity for a specific user."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        # Create logs where user is actor
        for i in range(2):
            audit_data = AuditLogCreate(
                action=AuditAction.ITEM_CREATE,
                actor="target_user",
                actor_role="admin",
                details=f"User action {i}"
            )
            await repo.create_audit_log(audit_data)
        
        # Create logs where user is target
        for i in range(2):
            audit_data = AuditLogCreate(
                action=AuditAction.USER_UPDATE,
                actor="admin",
                actor_role="superadmin",
                target_user="target_user",
                details=f"Action on user {i}"
            )
            await repo.create_audit_log(audit_data)
        
        # Create unrelated logs
        audit_data = AuditLogCreate(
            action=AuditAction.ITEM_DELETE,
            actor="other_user",
            actor_role="admin"
        )
        await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_user_activity("target_user")
        
        # Should get logs where user is actor OR target
        assert total == 4

    @pytest.mark.asyncio
    async def test_get_user_activity_pagination(self, test_audit_collection):
        """Test user activity with pagination."""
        repo = AuditRepository()
        repo.collection = test_audit_collection
        
        # Create multiple logs for user
        for i in range(5):
            audit_data = AuditLogCreate(
                action=AuditAction.ITEM_UPDATE,
                actor="active_user",
                actor_role="admin",
                details=f"Action {i}"
            )
            await repo.create_audit_log(audit_data)
        
        logs, total = await repo.get_user_activity("active_user", skip=0, limit=3)
        
        assert len(logs) == 3
        assert total == 5


# ── count_actions ─────────────────────────────────────────────────────────────


class TestCountActions:
    """Tests for AuditRepository.count_actions."""

    @pytest.mark.asyncio
    async def test_count_actions_since_date(self, test_audit_collection):
        """Count only actions that fall within the date window."""
        from datetime import timedelta, timezone as tz
        repo = AuditRepository()
        repo.collection = test_audit_collection

        now = datetime.now(timezone.utc)

        # Two logs within range
        for _ in range(2):
            await repo.create_audit_log(AuditLogCreate(
                action=AuditAction.ITEM_CREATE,
                actor="admin",
                actor_role="admin",
            ))

        # One log with older timestamp — insert directly
        await test_audit_collection.insert_one({
            "item_action": {
                "action": "item_create",
                "actor": "admin",
                "actor_role": "admin",
                "timestamp": now - timedelta(days=10),
            }
        })

        start_date = now - timedelta(days=3)
        count = await repo.count_actions(["item_create"], start_date)
        assert count == 2

    @pytest.mark.asyncio
    async def test_count_actions_multiple_action_types(self, test_audit_collection):
        repo = AuditRepository()
        repo.collection = test_audit_collection

        for action in [AuditAction.ITEM_CREATE, AuditAction.USER_CREATE, AuditAction.ITEM_DELETE]:
            await repo.create_audit_log(AuditLogCreate(
                action=action, actor="admin", actor_role="admin"
            ))

        from datetime import timedelta
        start_date = datetime.now(timezone.utc) - timedelta(minutes=5)
        count = await repo.count_actions(["item_create", "item_delete"], start_date)
        assert count == 2

    @pytest.mark.asyncio
    async def test_count_actions_no_match_returns_zero(self, test_audit_collection):
        repo = AuditRepository()
        repo.collection = test_audit_collection

        from datetime import timedelta
        start_date = datetime.now(timezone.utc) - timedelta(minutes=5)
        count = await repo.count_actions(["item_create"], start_date)
        assert count == 0


# ── delete_logs_by_resource ───────────────────────────────────────────────────


class TestDeleteLogsByResource:
    """Tests for AuditRepository.delete_logs_by_resource."""

    @pytest.mark.asyncio
    async def test_delete_logs_for_specific_resource(self, test_audit_collection):
        repo = AuditRepository()
        repo.collection = test_audit_collection

        # Create logs for target resource
        for _ in range(3):
            await repo.create_audit_log(AuditLogCreate(
                action=AuditAction.ITEM_DELETE,
                actor="admin",
                actor_role="admin",
                target_resource="item",
                resource_id="item_to_delete",
            ))

        # Create an unrelated log
        await repo.create_audit_log(AuditLogCreate(
            action=AuditAction.ITEM_CREATE,
            actor="admin",
            actor_role="admin",
            target_resource="item",
            resource_id="other_item",
        ))

        deleted = await repo.delete_logs_by_resource("item", "item_to_delete")
        assert deleted == 3

        # Unrelated log still present
        remaining, total = await repo.get_audit_logs()
        assert total == 1

    @pytest.mark.asyncio
    async def test_delete_logs_no_matching_resource_returns_zero(self, test_audit_collection):
        repo = AuditRepository()
        repo.collection = test_audit_collection

        deleted = await repo.delete_logs_by_resource("item", "nonexistent_id")
        assert deleted == 0
