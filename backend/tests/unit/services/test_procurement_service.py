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
        from app.db.repositories.procurement_repository import ProcurementRepository
        
        repository = ProcurementRepository()
        
        s3_service = MagicMock()
        s3_service.upload_file = AsyncMock(return_value={"file_id": "f", "s3_key": "k"})
        
        auditor = AsyncMock() # Mock ProcurementAuditor
        
        return ProcurementService(repository, s3_service, auditor)

    @pytest.mark.asyncio
    async def test_create_order(self, procurement_service, mock_admin_user):
        """Test creating an order."""
        from datetime import datetime
        from datetime import timezone
        order_data = ProcurementOrderCreate(
            catalog_number="S-PROC-001",
            manufacturer="Service Mfr",
            description="Service Test",
            quantity=10,
            order_date=datetime.now(timezone.utc),
            amount=500.0
        )
        
        result = await procurement_service.create_order(order_data, mock_admin_user["username"])
        
        assert result["catalog_number"] == "S-PROC-001"
        assert result["created_by"] == mock_admin_user["username"]
        
        # Verify auditor called
        procurement_service.auditor.log_create_order.assert_called_once()
        call_kwargs = procurement_service.auditor.log_create_order.call_args.kwargs
        assert call_kwargs["username"] == mock_admin_user["username"]
        assert call_kwargs["order_id"] == str(result["id"])

    @pytest.mark.asyncio
    async def test_get_orders(self, procurement_service, mock_admin_user):
        """Test getting paginated orders."""
        # Create one
        from datetime import datetime
        from datetime import timezone
        await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="P1", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.now(timezone.utc), amount=10.0
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
        from datetime import timezone
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="UPDATE-ME", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.now(timezone.utc), amount=10.0
            ),
            mock_admin_user["username"]
        )
        
        update_data = ProcurementOrderUpdate(quantity=50)
        result = await procurement_service.update_order(
            created["id"], update_data, username=mock_admin_user["username"]
        )
        
        assert result["quantity"] == 50
        
        # Verify auditor called
        procurement_service.auditor.log_update_order.assert_called_once()
        call_kwargs = procurement_service.auditor.log_update_order.call_args.kwargs
        assert call_kwargs["username"] == mock_admin_user["username"]
        assert call_kwargs["order_id"] == created["id"]
        assert "quantity" in call_kwargs["changes"]


    @pytest.mark.asyncio
    async def test_delete_order(self, procurement_service, mock_admin_user):
        """Test deleting order."""
        from datetime import datetime
        from datetime import timezone
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="DELETE-ME", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.now(timezone.utc), amount=10.0
            ),
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
        procurement_service.auditor.log_delete_order.assert_called_once()
        call_kwargs = procurement_service.auditor.log_delete_order.call_args.kwargs
        assert call_kwargs["username"] == mock_admin_user["username"]
        assert call_kwargs["order_id"] == created["id"]

    @pytest.mark.asyncio
    async def test_upload_file_mocked_s3(self, procurement_service, mock_admin_user, monkeypatch):
        """Test file upload with S3Service mocked."""
        # Setup order
        from datetime import datetime
        from datetime import timezone
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="FILE-TEST", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.now(timezone.utc), amount=10.0
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
        mock_file.read = AsyncMock(return_value=b"dummy pdf content")
        mock_file.size = 100
        # mock_file.file = io.BytesIO(b"dummy pdf content") # not strictly needed if read is mocked
        
        result = await procurement_service.upload_file(
            created["id"], mock_file, uploaded_by="admin"
        )
        
        assert result["file_id"] == "file_123"
        assert result["filename"] == "test.pdf"
        
        # Verify order updated with file
        order = await procurement_service.get_order_by_id(created["id"])
        # In a real Mongo test, the update would happen. But here we are using the repository 
        # which uses the real mongo collection (mocked by mongomock). 
        # So we should expect the file to be there.
        # Wait, repository relies on find_one_and_update.
        assert len(order["files"]) == 1
        assert order["files"][0]["file_id"] == "file_123"
        
        # Verify auditor called
        procurement_service.auditor.log_upload_file.assert_called_once()
        
    @pytest.mark.asyncio
    async def test_delete_file_mocked_s3(self, procurement_service, mock_admin_user, monkeypatch):
        """Test file deletion."""
        # 1. Create Order
        from datetime import datetime
        from datetime import timezone
        created = await procurement_service.create_order(
            ProcurementOrderCreate(
                catalog_number="FILE-DEL-TEST", manufacturer="M", description="D", 
                quantity=1, order_date=datetime.now(timezone.utc), amount=10.0
            ),
            mock_admin_user["username"]
        )
        # 2. Add file manually to repo (easier than re-uploading)
        file_meta = {
            "file_id": "file_to_del",
            "filename": "del.pdf",
            "file_type": "application/pdf",
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
