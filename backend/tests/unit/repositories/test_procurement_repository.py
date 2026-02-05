"""
Tests for ProcurementRepository.
Tests order CRUD operations, file management, and filtering.
"""
import pytest
import pytest_asyncio
from datetime import datetime
from bson import ObjectId

from app.db.repositories.procurement_repository import ProcurementRepository


class TestProcurementRepository:
    """Test suite for ProcurementRepository."""

    # ========== Create Tests ==========

    @pytest.mark.asyncio
    async def test_create_order(self, test_procurement_collection, sample_procurement_data):
        """Test creating a new procurement order."""
        # Manually set collection for repository
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        result = await repo.create_order(sample_procurement_data)
        
        assert result is not None
        assert "id" in result
        assert result["catalog_number"] == "PROC-001"
        assert result["manufacturer"] == "Test Vendor"
        assert result["quantity"] == 5
        assert result["files"] == []

    @pytest.mark.asyncio
    async def test_create_order_initializes_timestamps(self, test_procurement_collection, sample_procurement_data):
        """Test that created order has timestamps."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        # Remove timestamps from input
        del sample_procurement_data["created_at"]
        del sample_procurement_data["updated_at"]
        
        result = await repo.create_order(sample_procurement_data)
        
        assert "created_at" in result
        assert "updated_at" in result

    # ========== Read Tests ==========

    @pytest.mark.asyncio
    async def test_get_order_by_id(self, test_procurement_collection, sample_procurement_data):
        """Test getting order by ID."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        result = await repo.get_order_by_id(order_id)
        
        assert result is not None
        assert result["id"] == order_id
        assert result["catalog_number"] == "PROC-001"

    @pytest.mark.asyncio
    async def test_get_order_by_id_not_found(self, test_procurement_collection):
        """Test getting non-existent order returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        fake_id = str(ObjectId())
        result = await repo.get_order_by_id(fake_id)
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_order_by_id_invalid_id(self, test_procurement_collection):
        """Test getting order with invalid ID returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        result = await repo.get_order_by_id("invalid-id")
        
        assert result is None

    # ========== Pagination & Filter Tests ==========

    @pytest.mark.asyncio
    async def test_get_orders_with_pagination(self, test_procurement_collection, sample_procurement_data):
        """Test getting orders with pagination."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        # Create multiple orders
        for i in range(5):
            data = sample_procurement_data.copy()
            data["catalog_number"] = f"PROC-{i:03d}"
            await repo.create_order(data)
        
        orders, total = await repo.get_orders(skip=0, limit=3)
        
        assert len(orders) == 3
        assert total == 5

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_catalog_number(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by catalog number."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        # Create orders with different catalogs
        for cat in ["ALPHA-001", "BETA-002", "ALPHA-003"]:
            data = sample_procurement_data.copy()
            data["catalog_number"] = cat
            await repo.create_order(data)
        
        orders, total = await repo.get_orders(catalog_number="ALPHA")
        
        assert total == 2
        assert all("ALPHA" in order["catalog_number"] for order in orders)

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_manufacturer(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by manufacturer."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        for mfr in ["Vendor A", "Vendor B", "Vendor A"]:
            data = sample_procurement_data.copy()
            data["manufacturer"] = mfr
            data["catalog_number"] = f"CAT-{mfr}"
            await repo.create_order(data)
        
        orders, total = await repo.get_orders(manufacturer="Vendor A")
        
        assert total == 2

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_status_in(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by status list."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        for status in ["waiting_emf", "ordered", "received"]:
            data = sample_procurement_data.copy()
            data["status"] = status
            data["catalog_number"] = f"CAT-{status}"
            await repo.create_order(data)
        
        orders, total = await repo.get_orders(status_in=["waiting_emf", "ordered"])
        
        assert total == 2

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_status_ne(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by excluding a status."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        for status in ["waiting_emf", "ordered", "received"]:
            data = sample_procurement_data.copy()
            data["status"] = status
            data["catalog_number"] = f"CAT-{status}"
            await repo.create_order(data)
        
        orders, total = await repo.get_orders(status_ne="received")
        
        assert total == 2

    # ========== Update Tests ==========

    @pytest.mark.asyncio
    async def test_update_order(self, test_procurement_collection, sample_procurement_data):
        """Test updating an order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        result = await repo.update_order(order_id, {
            "quantity": 10,
            "status": "ordered"
        })
        
        assert result is not None
        assert result["quantity"] == 10
        assert result["status"] == "ordered"

    @pytest.mark.asyncio
    async def test_update_order_updates_timestamp(self, test_procurement_collection, sample_procurement_data):
        """Test that update modifies updated_at timestamp."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        original_updated_at = created["updated_at"]
        
        # Wait a moment and update
        import asyncio
        await asyncio.sleep(0.1)
        
        result = await repo.update_order(order_id, {"quantity": 20})
        
        assert result["updated_at"] > original_updated_at

    @pytest.mark.asyncio
    async def test_update_order_not_found(self, test_procurement_collection):
        """Test updating non-existent order returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        fake_id = str(ObjectId())
        result = await repo.update_order(fake_id, {"quantity": 10})
        
        assert result is None

    # ========== Delete Tests ==========

    @pytest.mark.asyncio
    async def test_delete_order(self, test_procurement_collection, sample_procurement_data):
        """Test deleting an order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        result = await repo.delete_order(order_id)
        
        assert result is True
        
        # Verify deletion
        order = await repo.get_order_by_id(order_id)
        assert order is None

    @pytest.mark.asyncio
    async def test_delete_order_not_found(self, test_procurement_collection):
        """Test deleting non-existent order returns False."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        fake_id = str(ObjectId())
        result = await repo.delete_order(fake_id)
        
        assert result is False

    # ========== File Management Tests ==========

    @pytest.mark.asyncio
    async def test_add_file_to_order(self, test_procurement_collection, sample_procurement_data):
        """Test adding file metadata to order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        file_metadata = {
            "file_id": "file-123",
            "filename": "test.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "uploaded_by": "test_user",
            "uploaded_at": datetime.utcnow()
        }
        
        result = await repo.add_file_to_order(order_id, file_metadata)
        
        assert result is not None
        assert len(result["files"]) == 1
        assert result["files"][0]["file_id"] == "file-123"
        assert result["files"][0]["filename"] == "test.pdf"

    @pytest.mark.asyncio
    async def test_add_multiple_files_to_order(self, test_procurement_collection, sample_procurement_data):
        """Test adding multiple files to order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        for i in range(3):
            file_metadata = {
                "file_id": f"file-{i}",
                "filename": f"test-{i}.pdf",
                "file_type": "application/pdf",
                "file_size": 1024,
                "uploaded_by": "test_user",
                "uploaded_at": datetime.utcnow()
            }
            await repo.add_file_to_order(order_id, file_metadata)
        
        order = await repo.get_order_by_id(order_id)
        assert len(order["files"]) == 3

    @pytest.mark.asyncio
    async def test_remove_file_from_order(self, test_procurement_collection, sample_procurement_data):
        """Test removing file from order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        # Add a file
        file_metadata = {
            "file_id": "file-to-remove",
            "filename": "test.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "uploaded_by": "test_user",
            "uploaded_at": datetime.utcnow()
        }
        await repo.add_file_to_order(order_id, file_metadata)
        
        # Remove the file
        result = await repo.remove_file_from_order(order_id, "file-to-remove")
        
        assert result is not None
        assert len(result["files"]) == 0

    @pytest.mark.asyncio
    async def test_get_file_metadata(self, test_procurement_collection, sample_procurement_data):
        """Test getting specific file metadata."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        file_metadata = {
            "file_id": "file-123",
            "filename": "important.pdf",
            "file_type": "application/pdf",
            "file_size": 2048,
            "uploaded_by": "test_user",
            "uploaded_at": datetime.utcnow()
        }
        await repo.add_file_to_order(order_id, file_metadata)
        
        result = await repo.get_file_metadata(order_id, "file-123")
        
        assert result is not None
        assert result["filename"] == "important.pdf"
        assert result["file_size"] == 2048

    @pytest.mark.asyncio
    async def test_get_file_metadata_not_found(self, test_procurement_collection, sample_procurement_data):
        """Test getting non-existent file metadata returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection
        
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        
        result = await repo.get_file_metadata(order_id, "non-existent-file")
        
        assert result is None
