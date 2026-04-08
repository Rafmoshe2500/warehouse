"""Tests for CollectionAuditor."""
import pytest
from unittest.mock import AsyncMock
from app.services.audit.collection_auditor import CollectionAuditor
from app.schemas.audit import AuditAction


@pytest.fixture
def mock_audit_service():
    return AsyncMock()


@pytest.fixture
def auditor(mock_audit_service):
    return CollectionAuditor(mock_audit_service)


@pytest.mark.asyncio
async def test_log_create_collection(auditor, mock_audit_service):
    data = {"name": "My Collection", "description": "Test"}
    await auditor.log_create_collection("user1", "col_1", data)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.COLLECTION_CREATE
    assert call_kwargs["actor"] == "user1"
    assert call_kwargs["resource_id"] == "col_1"
    assert call_kwargs["target_resource"] == "collection"
    assert call_kwargs["changes"] == data


@pytest.mark.asyncio
async def test_log_update_collection(auditor, mock_audit_service):
    changes = {"name": {"old": "Old", "new": "New"}}
    await auditor.log_update_collection("user1", "col_1", changes)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.COLLECTION_UPDATE
    assert call_kwargs["changes"] == changes


@pytest.mark.asyncio
async def test_log_delete_collection(auditor, mock_audit_service):
    await auditor.log_delete_collection("user1", "col_1")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.COLLECTION_DELETE
    assert call_kwargs["resource_id"] == "col_1"


@pytest.mark.asyncio
async def test_log_add_item(auditor, mock_audit_service):
    await auditor.log_add_item("user1", "My Collection", "ITEM-001", "Server")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.COLLECTION_ITEM_ADD
    assert call_kwargs["resource_id"] == "ITEM-001"
    assert call_kwargs["target_resource_name"] == "Server"
    assert "My Collection" in call_kwargs["details"]
    assert call_kwargs["changes"]["collection_name"] == "My Collection"


@pytest.mark.asyncio
async def test_log_add_item_without_description(auditor, mock_audit_service):
    await auditor.log_add_item("user1", "My Collection", "ITEM-001")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["target_resource_name"] is None


@pytest.mark.asyncio
async def test_log_remove_item(auditor, mock_audit_service):
    await auditor.log_remove_item("user1", "My Collection", "ITEM-001", "Server")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.COLLECTION_ITEM_REMOVE
    assert call_kwargs["resource_id"] == "ITEM-001"
    assert "My Collection" in call_kwargs["details"]
