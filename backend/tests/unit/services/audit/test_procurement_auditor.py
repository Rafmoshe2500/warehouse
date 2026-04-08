"""Tests for ProcurementAuditor."""
import pytest
from unittest.mock import AsyncMock
from app.services.audit.procurement_auditor import ProcurementAuditor
from app.schemas.audit import AuditAction


@pytest.fixture
def mock_audit_service():
    return AsyncMock()


@pytest.fixture
def auditor(mock_audit_service):
    return ProcurementAuditor(mock_audit_service)


@pytest.mark.asyncio
async def test_log_create_order(auditor, mock_audit_service):
    order_data = {"vendor": "DELL", "total": 5000}
    await auditor.log_create_order("admin", "ord_1", order_data)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.PROCUREMENT_CREATE
    assert call_kwargs["actor"] == "admin"
    assert call_kwargs["resource_id"] == "ord_1"
    assert call_kwargs["target_resource"] == "procurement_order"
    assert call_kwargs["changes"] == order_data


@pytest.mark.asyncio
async def test_log_update_order(auditor, mock_audit_service):
    changes = {"status": {"old": "waiting_bom_emf", "new": "waiting_shipment"}}
    await auditor.log_update_order("admin", "ord_1", changes)

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.PROCUREMENT_UPDATE
    assert call_kwargs["resource_id"] == "ord_1"
    assert call_kwargs["changes"] == changes


@pytest.mark.asyncio
async def test_log_delete_order(auditor, mock_audit_service):
    await auditor.log_delete_order("admin", "ord_1", reason="Cancelled")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.PROCUREMENT_DELETE
    assert call_kwargs["resource_id"] == "ord_1"
    assert call_kwargs["reason"] == "Cancelled"


@pytest.mark.asyncio
async def test_log_delete_order_default_reason(auditor, mock_audit_service):
    await auditor.log_delete_order("admin", "ord_1")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["reason"] == "Deleted by user"


@pytest.mark.asyncio
async def test_log_upload_file(auditor, mock_audit_service):
    await auditor.log_upload_file("admin", "ord_1", "quote.xlsx")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.PROCUREMENT_FILE_UPLOAD
    assert call_kwargs["changes"]["filename"] == "quote.xlsx"


@pytest.mark.asyncio
async def test_log_delete_file(auditor, mock_audit_service):
    await auditor.log_delete_file("admin", "ord_1", "quote.xlsx")

    call_kwargs = mock_audit_service.log_user_action.call_args.kwargs
    assert call_kwargs["action"] == AuditAction.PROCUREMENT_FILE_DELETE
    assert call_kwargs["changes"]["filename"] == "quote.xlsx"


@pytest.mark.asyncio
async def test_delete_all_order_logs(auditor, mock_audit_service):
    await auditor.delete_all_order_logs("ord_1")

    mock_audit_service.delete_resource_logs.assert_called_once_with(
        target_resource="procurement_order",
        resource_id="ord_1"
    )
