"""Tests for GroupAuditor."""
import pytest
from unittest.mock import AsyncMock
from app.services.audit.group_auditor import GroupAuditor
from app.schemas.audit import AuditAction


@pytest.fixture
def mock_audit_service():
    return AsyncMock()


@pytest.fixture
def auditor(mock_audit_service):
    return GroupAuditor(mock_audit_service)


@pytest.mark.asyncio
async def test_log_create_group(auditor, mock_audit_service):
    changes = {"name": "DevOps", "permissions": ["inventory:rw"]}
    await auditor.log_create_group("admin", "admin", "grp_1", "DevOps", changes)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.GROUP_CREATE
    assert call_kwargs["resource_id"] == "grp_1"
    assert call_kwargs["target_resource"] == "group"
    assert "DevOps" in call_kwargs["details"]
    assert call_kwargs["changes"] == changes


@pytest.mark.asyncio
async def test_log_update_group(auditor, mock_audit_service):
    changes = {"permissions": {"old": [], "new": ["inventory:rw"]}}
    await auditor.log_update_group("admin", "admin", "grp_1", "DevOps", changes)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.GROUP_UPDATE
    assert call_kwargs["resource_id"] == "grp_1"
    assert call_kwargs["changes"] == changes


@pytest.mark.asyncio
async def test_log_delete_group(auditor, mock_audit_service):
    await auditor.log_delete_group("admin", "admin", "grp_1", "DevOps", "No longer needed")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.GROUP_DELETE
    assert call_kwargs["resource_id"] == "grp_1"
    assert "DevOps" in call_kwargs["details"]
    assert call_kwargs["reason"] == "No longer needed"
