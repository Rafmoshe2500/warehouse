"""
Tests for ProcurementService.
Tests business logic for procurement orders and file handling.
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi import UploadFile
import io

from app.services.procurement_service import ProcurementService
from app.schemas.procurement import ProcurementOrderCreate, ProcurementOrderUpdate
from app.core.constants import UserRole


class TestProcurementService:
    """Test suite for ProcurementService."""

    @pytest.fixture
    def procurement_service(self, mock_mongodb):
        """
        Create service. mock_mongodb fixture patches MongoDB.get_collection
        so the repository initialized in __init__ uses test collections.
        """
        return ProcurementService()

    @pytest.mark.asyncio
    async def test_create_order(self, procurement_service, mock_admin_user):
        """Test creating an order."""
        from datetime import datetime
        order_data = ProcurementOrderCreate(
            catalog_number="S-PROC-001",
            manufacturer="Service Mfr",
            description="Service Test",
            quantity=10,
            order_date=datetime.utcnow(),
            amount=500.0
        )
        
        result = await procurement_service.create_order(order_data, mock_admin_user["username"])
        
        assert result["catalog_number"] == "S-PROC-001"
        assert result["created_by"] == mock_admin_user["username"]

    @pytest.mark.asyncio
    async def test_get_orders(self, procurement_service, mock_admin_user):
        """Test getting paginated orders."""
        # Create one
        from datetime import datetime
        await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="P1", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.utcnow(), amount=10.0
            ),
            mock_admin_user["username"]
        )
        
        orders, total = await procurement_service.get_orders(page=1, page_size=10)
        assert total >= 1
        assert len(orders) >= 1

    @pytest.mark.asyncio
    async def test_update_order_as_admin(self, procurement_service, mock_admin_user):
        """Test updating order as admin succeeds."""
        from datetime import datetime
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="UPDATE-ME", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.utcnow(), amount=10.0
            ),
            mock_admin_user["username"]
        )
        
        update_data = ProcurementOrderUpdate(quantity=50)
        result = await procurement_service.update_order(
            created["id"], update_data, user_role=UserRole.ADMIN, username=mock_admin_user["username"]
        )
        
        assert result["quantity"] == 50

    @pytest.mark.asyncio
    async def test_update_order_as_user_fails(self, procurement_service):
        """Test updating order as regular user fails."""
        # (Assuming can_edit_procurement returns False for 'user')
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await procurement_service.update_order(
                "some-id", ProcurementOrderUpdate(quantity=5), user_role=UserRole.USER
            )
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_order(self, procurement_service, mock_admin_user):
        """Test deleting order."""
        from datetime import datetime
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="DELETE-ME", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.utcnow(), amount=10.0
            ),
            mock_admin_user["username"]
        )
        
        await procurement_service.delete_order(
            created["id"], user_role=UserRole.ADMIN, username=mock_admin_user["username"]
        )
        
        # Verify gone
        # Verify gone
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            await procurement_service.get_order_by_id(created["id"])

    @pytest.mark.asyncio
    async def test_upload_file_mocked_s3(self, procurement_service, mock_admin_user, monkeypatch):
        """Test file upload with S3Service mocked."""
        # Setup order
        from datetime import datetime
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="FILE-TEST", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.utcnow(), amount=10.0
            ),
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
        
        # Simulate upload
        mock_file = MagicMock(spec=UploadFile)
        mock_file.filename = "test.pdf"
        mock_file.content_type = "application/pdf"
        mock_file.size = 100
        mock_file.file = io.BytesIO(b"dummy pdf content")
        
        result = await procurement_service.upload_file(
            created["id"], mock_file, uploaded_by="admin", user_role=UserRole.ADMIN
        )
        
        assert result["file_id"] == "file_123"
        assert result["filename"] == "test.pdf"
        
        # Verify order updated with file
        order = await procurement_service.get_order_by_id(created["id"])
        assert len(order["files"]) == 1
        assert order["files"][0]["file_id"] == "file_123"
