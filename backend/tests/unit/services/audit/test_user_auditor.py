"""Tests for UserAuditor."""
import pytest
from unittest.mock import AsyncMock
from app.services.audit.user_auditor import UserAuditor
from app.schemas.audit import AuditAction


@pytest.fixture
def mock_audit_service():
    return AsyncMock()


@pytest.fixture
def auditor(mock_audit_service):
    return UserAuditor(mock_audit_service)


@pytest.mark.asyncio
async def test_log_create_user(auditor, mock_audit_service):
    await auditor.log_create_user("admin", "admin", "new_user", "user")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_CREATE
    assert call_kwargs["actor"] == "admin"
    assert call_kwargs["target_user"] == "new_user"
    assert call_kwargs["target_role"] == "user"
    assert call_kwargs["target_resource"] == "user"


@pytest.mark.asyncio
async def test_log_ad_user_creation(auditor, mock_audit_service):
    await auditor.log_ad_user_creation("ad_user", "user")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_CREATE
    assert call_kwargs["actor"] == "system_ad"
    assert call_kwargs["actor_role"] == "system"
    assert call_kwargs["target_user"] == "ad_user"
    assert "AD" in call_kwargs["details"]


@pytest.mark.asyncio
async def test_log_update_user(auditor, mock_audit_service):
    changes = {"role": {"old": "user", "new": "admin"}}
    await auditor.log_update_user("superadmin", "superadmin", "target_user", changes)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_UPDATE
    assert call_kwargs["actor"] == "superadmin"
    assert call_kwargs["target_user"] == "target_user"
    assert call_kwargs["changes"] == changes


@pytest.mark.asyncio
async def test_log_delete_user(auditor, mock_audit_service):
    await auditor.log_delete_user("admin", "admin", "deleted_user")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_DELETE
    assert call_kwargs["target_user"] == "deleted_user"


@pytest.mark.asyncio
async def test_log_password_change(auditor, mock_audit_service):
    await auditor.log_password_change("admin", "admin", "user1")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_UPDATE
    assert call_kwargs["target_user"] == "user1"
    assert "Password" in call_kwargs["details"]
