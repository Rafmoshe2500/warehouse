"""Tests for AuthAuditor."""
import pytest
from unittest.mock import AsyncMock
from app.services.audit.auth_auditor import AuthAuditor
from app.schemas.audit import AuditAction


@pytest.fixture
def mock_audit_service():
    return AsyncMock()


@pytest.fixture
def auditor(mock_audit_service):
    return AuthAuditor(mock_audit_service)


@pytest.mark.asyncio
async def test_log_login(auditor, mock_audit_service):
    await auditor.log_login("admin", "uid_1", "admin", ip_address="10.0.0.1", user_agent="Mozilla")

    mock_audit_service.log_user_action.assert_called_once()
    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_LOGIN
    assert call_kwargs["actor"] == "admin"
    assert call_kwargs["actor_role"] == "admin"
    assert call_kwargs["target_user"] == "admin"
    assert call_kwargs["resource_id"] == "uid_1"
    assert call_kwargs["ip_address"] == "10.0.0.1"
    assert call_kwargs["user_agent"] == "Mozilla"


@pytest.mark.asyncio
async def test_log_login_without_optional_fields(auditor, mock_audit_service):
    await auditor.log_login("user1", "uid_2", "user")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["ip_address"] is None
    assert call_kwargs["user_agent"] is None


@pytest.mark.asyncio
async def test_log_domain_login(auditor, mock_audit_service):
    await auditor.log_domain_login("ad_user", "user", ip_address="192.168.1.1")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_DOMAIN_LOGIN
    assert call_kwargs["actor"] == "ad_user"
    assert call_kwargs["resource_id"] == "ADFS"
    assert "ADFS" in call_kwargs["details"]


@pytest.mark.asyncio
async def test_log_logout(auditor, mock_audit_service):
    await auditor.log_logout("user1", "admin", ip_address="10.0.0.1")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.USER_LOGOUT
    assert call_kwargs["actor"] == "user1"
    assert call_kwargs["target_user"] == "user1"
