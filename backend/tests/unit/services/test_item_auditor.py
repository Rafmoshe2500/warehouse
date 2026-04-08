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
        changes={},
        details=f"סיבת מחיקה: {reason}"
    )


@pytest.mark.asyncio
async def test_log_bulk_update_item(item_auditor, mock_audit_service):
    user = {"username": "admin", "role": "admin"}
    item = {"_id": "100", "catalog_number": "CAT-X", "location": "A1"}
    update_data = {"location": "B2", "updated_at": "2026-01-01"}
    description_parts = ["location: A1 → B2"]

    await item_auditor.log_bulk_update_item(user, item, update_data, description_parts)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.ITEM_UPDATE
    assert call_kwargs["resource_id"] == "100"
    assert "location" in call_kwargs["changes"]
    assert call_kwargs["changes"]["location"]["old"] == "A1"
    assert call_kwargs["changes"]["location"]["new"] == "B2"
    assert "updated_at" not in call_kwargs["changes"]
    assert "עדכון מרובה" in call_kwargs["details"]


@pytest.mark.asyncio
async def test_log_bulk_delete_item(item_auditor, mock_audit_service):
    user = {"username": "admin", "role": "admin"}
    item = {"_id": "200", "description": "Old item"}

    await item_auditor.log_bulk_delete_item(user, item, "Cleanup")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.ITEM_DELETE
    assert call_kwargs["resource_id"] == "200"
    assert "Cleanup" in call_kwargs["details"]


@pytest.mark.asyncio
async def test_log_delete_all(item_auditor, mock_audit_service):
    user = {"username": "superadmin", "role": "superadmin"}

    await item_auditor.log_delete_all(user, 150, "Full reset")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.ITEM_BULK_DELETE
    assert call_kwargs["resource_id"] == "ALL"
    assert call_kwargs["changes"]["deleted_count"] == 150
    assert "Full reset" in call_kwargs["details"]


@pytest.mark.asyncio
async def test_log_import_summary(item_auditor, mock_audit_service):
    await item_auditor.log_import_summary("admin", added=10, updated=5, total=15)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.ITEM_IMPORT
    assert call_kwargs["resource_id"] == "BULK_IMPORT"
    assert call_kwargs["changes"]["added"] == 10
    assert call_kwargs["changes"]["updated"] == 5
    assert call_kwargs["changes"]["total_rows"] == 15
