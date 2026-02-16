import pytest
from unittest.mock import AsyncMock, Mock
from app.services.audit.item_auditor import ItemAuditor
from app.schemas.audit import AuditAction

@pytest.fixture
def mock_audit_service():
    return AsyncMock()

@pytest.fixture
def item_auditor(mock_audit_service):
    return ItemAuditor(mock_audit_service)

@pytest.mark.asyncio
async def test_log_creation(item_auditor, mock_audit_service):
    user = {"username": "testuser", "role": "admin"}
    item = {"_id": "123", "name": "Test Item", "description": "Desc"}
    
    await item_auditor.log_creation(user, item)
    
    mock_audit_service.log_user_action.assert_called_once_with(
        action=AuditAction.ITEM_CREATE,
        actor="testuser",
        actor_role="admin",
        target_resource="item",
        resource_id="123",
        target_resource_name="Desc", # fallback to description if catalog_number missing
        changes={"name": "Test Item", "description": "Desc"},
        details="נוסף פריט חדש למלאי"
    )

@pytest.mark.asyncio
async def test_log_update(item_auditor, mock_audit_service):
    user = {"username": "testuser", "role": "user"}
    item = {"_id": "456", "catalog_number": "CAT123"}
    changes = {"field": {"old": "a", "new": "b"}}
    details = "Updated field"
    
    await item_auditor.log_update(user, item, changes, details)
    
    mock_audit_service.log_user_action.assert_called_once_with(
        action=AuditAction.ITEM_UPDATE,
        actor="testuser",
        actor_role="user",
        target_resource="item",
        resource_id="456",
        target_resource_name="CAT123",
        changes=changes,
        details=details
    )
    
@pytest.mark.asyncio
async def test_log_deletion(item_auditor, mock_audit_service):
    user = {"username": "testuser", "role": "admin"}
    item = {"_id": "789", "name": "Delete Me", "description": "Desc"}
    reason = "Obsolete"
    
    await item_auditor.log_deletion(user, item, reason)
    
    mock_audit_service.log_user_action.assert_called_once_with(
        action=AuditAction.ITEM_DELETE,
        actor="testuser",
        actor_role="admin",
        target_resource="item",
        resource_id="789",
        target_resource_name="Desc",
        changes={"name": "Delete Me", "description": "Desc"},
        details=f"סיבת מחיקה: {reason}"
    )

