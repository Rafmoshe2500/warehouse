"""
Tests for ProcurementService.
Tests business logic for procurement orders, status transitions, and file handling.
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi import UploadFile
from datetime import datetime, timezone

from app.services.procurement_service import ProcurementService
from app.schemas.procurement import ProcurementOrderCreate, ProcurementOrderUpdate, BOMItem
from app.core.constants import UserRole


def _make_order_create(**kwargs) -> ProcurementOrderCreate:
    """Helper to build a ProcurementOrderCreate with sane defaults."""
    defaults = {
        "order_date": datetime.now(timezone.utc),
        "bom_items": [
            BOMItem(item_id=1, catalog_number="DEFAULT-001",
                    manufacturer="Test Vendor", description="Default Item", quantity=1)
        ],
        "total_amount": 100.0,
    }
    defaults.update(kwargs)
    return ProcurementOrderCreate(**defaults)


class TestProcurementService:
    """Test suite for ProcurementService."""

    @pytest.fixture
    def procurement_service(self, mock_mongodb):
        """
        Create service. mock_mongodb fixture patches MongoDB.get_collection
        so the repository initialized in __init__ uses test collections.
        """
        from app.db.repositories.procurement_repository import ProcurementRepository

        repository = ProcurementRepository()

        s3_service = MagicMock()
        s3_service.upload_file = AsyncMock(return_value={"file_id": "f", "s3_key": "k"})

        auditor = AsyncMock()  # Mock ProcurementAuditor
        analytics_service = AsyncMock()  # Mock BomAnalyticsService

        return ProcurementService(repository, s3_service, auditor, analytics_service)

    # ========== Create Tests ==========

    @pytest.mark.asyncio
    async def test_create_order(self, procurement_service, mock_admin_user):
        """Test creating a basic order."""
        order_data = _make_order_create(
            bom_items=[
                BOMItem(item_id=1, catalog_number="S-PROC-001",
                        manufacturer="Service Mfr", description="Service Test", quantity=10, part_alias="Service Test Alias")
            ],
            total_amount=500.0
        )

        result = await procurement_service.create_order(order_data, mock_admin_user["username"])

        assert result["bom_items"][0]["catalog_number"] == "S-PROC-001"
        assert result["bom_items"][0]["part_alias"] == "Service Test Alias"
        assert result["created_by"] == mock_admin_user["username"]

        # Verify auditor called
        procurement_service.auditor.log_create_order.assert_called_once()
        call_kwargs = procurement_service.auditor.log_create_order.call_args.kwargs
        assert call_kwargs["username"] == mock_admin_user["username"]
        assert call_kwargs["order_id"] == str(result["id"])

    @pytest.mark.asyncio
    async def test_auto_status_waiting_bom_emf(self, procurement_service, mock_admin_user):
        """Test that order with no EMF and no BOM defaults to waiting_bom_emf."""
        order_data = _make_order_create(emf_number=None, received_bom=False)
        result = await procurement_service.create_order(order_data, mock_admin_user["username"])

        assert result["status"] == "waiting_bom_emf"

    @pytest.mark.asyncio
    async def test_auto_status_waiting_bom_when_emf_provided(self, procurement_service, mock_admin_user):
        """Test that order with EMF but no BOM transitions to waiting_bom_emf."""
        order_data = _make_order_create(emf_number="EMF-1234", received_bom=False)
        result = await procurement_service.create_order(order_data, mock_admin_user["username"])

        assert result["status"] == "waiting_bom_emf"

    @pytest.mark.asyncio
    async def test_auto_status_waiting_emf_when_bom_received(self, procurement_service, mock_admin_user):
        """Test that order with BOM but no EMF transitions to waiting_bom_emf."""
        order_data = _make_order_create(emf_number=None, received_bom=True)
        result = await procurement_service.create_order(order_data, mock_admin_user["username"])

        assert result["status"] == "waiting_bom_emf"

    @pytest.mark.asyncio
    async def test_auto_status_waiting_shipment_when_both_present(self, procurement_service, mock_admin_user):
        """Test that order with both EMF and BOM transitions to waiting_shipment."""
        order_data = _make_order_create(emf_number="EMF-9999", received_bom=True)
        result = await procurement_service.create_order(order_data, mock_admin_user["username"])

        assert result["status"] == "waiting_shipment"

    # ========== Read Tests ==========

    @pytest.mark.asyncio
    async def test_get_orders(self, procurement_service, mock_admin_user):
        """Test getting paginated orders."""
        await procurement_service.create_order(
            _make_order_create(bom_items=[
                BOMItem(item_id=1, catalog_number="P1", manufacturer="M", description="D", quantity=1)
            ]),
            mock_admin_user["username"]
        )

        orders, total = await procurement_service.get_orders(page=1, page_size=10)
        assert total >= 1
        assert len(orders) >= 1

    # ========== Update Tests ==========

    @pytest.mark.asyncio
    async def test_update_order_as_admin(self, procurement_service, mock_admin_user):
        """Test updating order as admin succeeds."""
        created = await procurement_service.create_order(
            _make_order_create(bom_items=[
                BOMItem(item_id=1, catalog_number="UPDATE-ME",
                        manufacturer="M", description="D", quantity=1)
            ]),
            mock_admin_user["username"]
        )

        update_data = ProcurementOrderUpdate(total_amount=9999.0)
        result = await procurement_service.update_order(
            created["id"], update_data, username=mock_admin_user["username"]
        )

        assert result["total_amount"] == 9999.0

        # Verify auditor called
        procurement_service.auditor.log_update_order.assert_called_once()
        call_kwargs = procurement_service.auditor.log_update_order.call_args.kwargs
        assert call_kwargs["username"] == mock_admin_user["username"]
        assert call_kwargs["order_id"] == created["id"]
        assert "total_amount" in call_kwargs["changes"]

    @pytest.mark.asyncio
    async def test_update_order_to_received(self, procurement_service, mock_admin_user):
        """Test updating an order status to received."""
        created = await procurement_service.create_order(
            _make_order_create(emf_number="EMF-123", received_bom=True),
            mock_admin_user["username"]
        )
        # Should be waiting_shipment at this point
        assert created["status"] == "waiting_shipment"

        update_data = ProcurementOrderUpdate(status="received")
        result = await procurement_service.update_order(
            created["id"], update_data, username=mock_admin_user["username"]
        )

        assert result["status"] == "received"

    @pytest.mark.asyncio
    async def test_update_order_add_emf_transitions_status(self, procurement_service, mock_admin_user):
        """Test that adding EMF to an order with BOM transitions to waiting_shipment."""
        created = await procurement_service.create_order(
            _make_order_create(emf_number=None, received_bom=True),
            mock_admin_user["username"]
        )
        assert created["status"] == "waiting_bom_emf"

        update_data = ProcurementOrderUpdate(emf_number="EMF-NEW")
        result = await procurement_service.update_order(
            created["id"], update_data, username=mock_admin_user["username"]
        )

        assert result["status"] == "waiting_shipment"
        assert result["emf_number"] == "EMF-NEW"

    # ========== Delete Tests ==========

    @pytest.mark.asyncio
    async def test_delete_order(self, procurement_service, mock_admin_user):
        """Test deleting order."""
        created = await procurement_service.create_order(
            _make_order_create(bom_items=[
                BOMItem(item_id=1, catalog_number="DELETE-ME",
                        manufacturer="M", description="D", quantity=1)
            ]),
            mock_admin_user["username"]
        )

        await procurement_service.delete_order(
            created["id"], username=mock_admin_user["username"]
        )

        # Verify gone
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            await procurement_service.get_order_by_id(created["id"])

        # Verify auditor called
        procurement_service.auditor.delete_all_order_logs.assert_called_once()
        
        # Verify analytics cleanup called
        procurement_service.analytics_service.delete_order_history.assert_called_once()

    # ========== File Tests ==========

    @pytest.mark.asyncio
    async def test_upload_file_mocked_s3(self, procurement_service, mock_admin_user, monkeypatch):
        """Test file upload with S3Service mocked."""
        created = await procurement_service.create_order(
            _make_order_create(bom_items=[
                BOMItem(item_id=1, catalog_number="FILE-TEST",
                        manufacturer="M", description="D", quantity=1)
            ]),
            mock_admin_user["username"]
        )

        # Mock S3Service
        mock_s3 = MagicMock()
        mock_s3.upload_file = AsyncMock(return_value={
            "file_id": "file_123",
            "s3_key": "some/key",
            "local_path": None
        })
        monkeypatch.setattr(procurement_service, "s3_service", mock_s3)

        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "test.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.read = AsyncMock(return_value=b"dummy pdf content")
        mock_file.size = 100

        result = await procurement_service.upload_file(
            created["id"], mock_file, uploaded_by="admin"
        )

        assert result["file_id"] == "file_123"
        assert result["filename"] == "test.pdf"

        # Verify order updated with file
        order = await procurement_service.get_order_by_id(created["id"])
        assert len(order["files"]) == 1
        assert order["files"][0]["file_id"] == "file_123"

        # Verify auditor called
        procurement_service.auditor.log_upload_file.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_file_mocked_s3(self, procurement_service, mock_admin_user, monkeypatch):
        """Test file deletion."""
        # 1. Create Order
        created = await procurement_service.create_order(
            _make_order_create(bom_items=[
                BOMItem(item_id=1, catalog_number="FILE-DEL-TEST",
                        manufacturer="M", description="D", quantity=1)
            ]),
            mock_admin_user["username"]
        )
        # 2. Add file manually to repo
        file_meta = {
            "file_id": "file_to_del",
            "filename": "del.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "uploaded_at": datetime.now(timezone.utc),
            "uploaded_by": "admin",
            "s3_key": "k",
            "local_path": "l"
        }
        await procurement_service.repository.add_file_to_order(created["id"], file_meta)

        # 3. Delete file
        mock_s3 = MagicMock()
        mock_s3.delete_file = AsyncMock()
        monkeypatch.setattr(procurement_service, "s3_service", mock_s3)

        await procurement_service.delete_file(created["id"], "file_to_del", username="admin")

        # 4. Verify gone from order
        order = await procurement_service.get_order_by_id(created["id"])
        assert len(order["files"]) == 0

        # 5. Verify auditor
        procurement_service.auditor.log_delete_file.assert_called_once()

    # ========== Status Machine Edge Cases ==========

    @pytest.mark.asyncio
    async def test_shipped_status_does_not_auto_revert(self, procurement_service, mock_admin_user):
        """Once SHIPPED, removing BOM/EMF must NOT auto-revert status."""
        created = await procurement_service.create_order(
            _make_order_create(emf_number="EMF-1", received_bom=True),
            mock_admin_user["username"],
        )
        assert created["status"] == "waiting_shipment"

        # Transition to SHIPPED
        shipped = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(status="shipped"),
            username=mock_admin_user["username"],
        )
        assert shipped["status"] == "shipped"
        assert shipped.get("shipped_at") is not None

        # Even removing EMF should NOT revert from shipped
        result = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(emf_number=""),
            username=mock_admin_user["username"],
        )
        assert result["status"] == "shipped"

    @pytest.mark.asyncio
    async def test_received_status_stays_locked(self, procurement_service, mock_admin_user):
        """Once RECEIVED, status must stay locked."""
        created = await procurement_service.create_order(
            _make_order_create(emf_number="EMF-1", received_bom=True),
            mock_admin_user["username"],
        )
        result = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(status="received"),
            username=mock_admin_user["username"],
        )
        assert result["status"] == "received"
        assert result.get("received_at") is not None

    @pytest.mark.asyncio
    async def test_bom_received_sets_timestamp(self, procurement_service, mock_admin_user):
        """Setting received_bom=True should record bom_received_at."""
        created = await procurement_service.create_order(
            _make_order_create(received_bom=False),
            mock_admin_user["username"],
        )
        result = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(received_bom=True),
            username=mock_admin_user["username"],
        )
        assert result.get("bom_received_at") is not None

    @pytest.mark.asyncio
    async def test_emf_set_records_timestamp(self, procurement_service, mock_admin_user):
        """Setting emf_number should record emf_received_at."""
        created = await procurement_service.create_order(
            _make_order_create(emf_number=None),
            mock_admin_user["username"],
        )
        result = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(emf_number="EMF-NEW"),
            username=mock_admin_user["username"],
        )
        assert result.get("emf_received_at") is not None

    @pytest.mark.asyncio
    async def test_clearing_bom_clears_timestamp(self, procurement_service, mock_admin_user):
        """Clearing received_bom should set bom_received_at to None."""
        created = await procurement_service.create_order(
            _make_order_create(received_bom=True),
            mock_admin_user["username"],
        )
        result = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(received_bom=False),
            username=mock_admin_user["username"],
        )
        assert result.get("bom_received_at") is None

    @pytest.mark.asyncio
    async def test_waiting_shipment_timestamp_recorded(self, procurement_service, mock_admin_user):
        """When auto-transitioning to waiting_shipment, timestamp is set."""
        created = await procurement_service.create_order(
            _make_order_create(received_bom=True, emf_number=None),
            mock_admin_user["username"],
        )
        assert created["status"] == "waiting_bom_emf"

        result = await procurement_service.update_order(
            created["id"],
            ProcurementOrderUpdate(emf_number="EMF-FINAL"),
            username=mock_admin_user["username"],
        )
        assert result["status"] == "waiting_shipment"
        assert result.get("waiting_shipment_at") is not None
