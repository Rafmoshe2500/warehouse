"""
Tests for ItemsRepository.
Tests CRUD operations, search, filtering, and bulk operations.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from bson import ObjectId

from app.db.repositories.items import ItemsRepository
from app.schemas.item import ItemFilter


class TestItemsRepository:
    """Test suite for ItemsRepository."""

    @pytest_asyncio.fixture
    async def repository(self, test_items_collection):
        """Create repository with test collection."""
        repo = ItemsRepository(test_items_collection)
        return repo

    # ========== Create Tests ==========

    @pytest.mark.asyncio
    async def test_create_item(self, test_items_collection, sample_item_data):
        """Test creating a new item."""
        repo = ItemsRepository(test_items_collection)
        
        result = await repo.create(sample_item_data)
        
        assert result is not None
        assert "_id" in result
        assert result["catalog_number"] == "TEST-001"
        assert result["description"] == "Test Item Description"

    @pytest.mark.asyncio
    async def test_create_item_with_serial(self, test_items_collection, sample_item_data):
        """Test creating an item with serial number."""
        repo = ItemsRepository(test_items_collection)
        sample_item_data["serial"] = "UNIQUE-SERIAL-123"
        
        result = await repo.create(sample_item_data)
        
        assert result["serial"] == "UNIQUE-SERIAL-123"

    # ========== Read Tests ==========

    @pytest.mark.asyncio
    async def test_get_by_id(self, test_items_collection, sample_item_data):
        """Test getting item by ID."""
        repo = ItemsRepository(test_items_collection)
        created = await repo.create(sample_item_data)
        item_id = created["_id"]
        
        result = await repo.get_by_id(item_id)
        
        assert result is not None
        assert result["_id"] == item_id
        assert result["catalog_number"] == "TEST-001"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, test_items_collection):
        """Test getting non-existent item returns None."""
        repo = ItemsRepository(test_items_collection)
        fake_id = str(ObjectId())
        
        result = await repo.get_by_id(fake_id)
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_id_or_raise(self, test_items_collection, sample_item_data):
        """Test get_by_id_or_raise returns item when found."""
        repo = ItemsRepository(test_items_collection)
        created = await repo.create(sample_item_data)
        item_id = created["_id"]
        
        result = await repo.get_by_id_or_raise(item_id)
        
        assert result is not None
        assert result["_id"] == item_id

    @pytest.mark.asyncio
    async def test_get_by_id_or_raise_not_found(self, test_items_collection):
        """Test get_by_id_or_raise raises exception when not found."""
        from app.core.exceptions import ItemNotFoundException
        repo = ItemsRepository(test_items_collection)
        fake_id = str(ObjectId())
        
        with pytest.raises(ItemNotFoundException):
            await repo.get_by_id_or_raise(fake_id)

    # ========== Find By Field Tests ==========

    @pytest.mark.asyncio
    async def test_find_by_serial(self, test_items_collection, sample_item_data):
        """Test finding item by serial number."""
        repo = ItemsRepository(test_items_collection)
        sample_item_data["serial"] = "EXACT-SERIAL-MATCH"
        await repo.create(sample_item_data)
        
        result = await repo.find_by_serial("EXACT-SERIAL-MATCH")
        
        assert result is not None
        assert result["serial"] == "EXACT-SERIAL-MATCH"

    @pytest.mark.asyncio
    async def test_find_by_serial_not_found(self, test_items_collection):
        """Test finding non-existent serial returns None."""
        repo = ItemsRepository(test_items_collection)
        
        result = await repo.find_by_serial("NON-EXISTENT-SERIAL")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_find_by_catalog_number(self, test_items_collection, sample_item_data):
        """Test finding item by catalog number."""
        repo = ItemsRepository(test_items_collection)
        await repo.create(sample_item_data)
        
        result = await repo.find_by_catalog_number("TEST-001")
        
        assert result is not None
        assert result["catalog_number"] == "TEST-001"

    @pytest.mark.asyncio
    async def test_find_by_catalog_and_location(self, test_items_collection, sample_item_data):
        """Test finding item by catalog number and location."""
        repo = ItemsRepository(test_items_collection)
        sample_item_data["location"] = "SHELF-A1"
        await repo.create(sample_item_data)
        
        result = await repo.find_by_catalog_and_location("TEST-001", "SHELF-A1")
        
        assert result is not None
        assert result["catalog_number"] == "TEST-001"
        assert result["location"] == "SHELF-A1"

    # ========== Search Tests ==========

    @pytest.mark.asyncio
    async def test_search_with_pagination(self, test_items_collection, sample_item_data):
        """Test search with pagination."""
        repo = ItemsRepository(test_items_collection)
        
        # Create multiple items
        for i in range(5):
            data = sample_item_data.copy()
            data["catalog_number"] = f"CAT-{i:03d}"
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            await repo.create(data)
        
        filter_params = ItemFilter(page=1, limit=3)
        items, total = await repo.search(filter_params)
        
        assert len(items) == 3
        assert total == 5

    @pytest.mark.asyncio
    async def test_search_with_catalog_filter(self, test_items_collection, sample_item_data):
        """Test search with catalog number filter."""
        repo = ItemsRepository(test_items_collection)
        
        # Create items with different catalogs
        for cat in ["ALPHA-001", "BETA-002", "ALPHA-003"]:
            data = sample_item_data.copy()
            data["catalog_number"] = cat
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            await repo.create(data)
        
        filter_params = ItemFilter(catalog_number="ALPHA", page=1, limit=10)
        items, total = await repo.search(filter_params)
        
        assert total == 2
        assert all("ALPHA" in item["catalog_number"] for item in items)

    @pytest.mark.asyncio
    async def test_search_with_sorting(self, test_items_collection, sample_item_data):
        """Test search with sorting."""
        repo = ItemsRepository(test_items_collection)
        
        for cat in ["C-001", "A-001", "B-001"]:
            data = sample_item_data.copy()
            data["catalog_number"] = cat
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            await repo.create(data)
        
        filter_params = ItemFilter(sort_by="catalog_number", sort_order="asc", page=1, limit=10)
        items, total = await repo.search(filter_params)
        
        assert items[0]["catalog_number"] == "A-001"
        assert items[1]["catalog_number"] == "B-001"
        assert items[2]["catalog_number"] == "C-001"

    # ========== Update Tests ==========

    @pytest.mark.asyncio
    async def test_update_item(self, test_items_collection, sample_item_data):
        """Test updating an item."""
        repo = ItemsRepository(test_items_collection)
        created = await repo.create(sample_item_data)
        item_id = created["_id"]
        
        result = await repo.update(item_id, {"description": "Updated Description"})
        
        assert result is not None
        assert result["description"] == "Updated Description"

    @pytest.mark.asyncio
    async def test_bulk_update_by_ids(self, test_items_collection, sample_item_data):
        """Test bulk update of multiple items."""
        repo = ItemsRepository(test_items_collection)
        
        # Create multiple items
        item_ids = []
        for i in range(3):
            data = sample_item_data.copy()
            data["catalog_number"] = f"BULK-{i}"
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            created = await repo.create(data)
            item_ids.append(created["_id"])
        
        items_before, count = await repo.bulk_update_by_ids(
            item_ids, 
            {"notes": "Bulk updated"}
        )
        
        assert count == 3
        assert len(items_before) == 3
        
        # Verify updates
        for item_id in item_ids:
            item = await repo.get_by_id(item_id)
            assert item["notes"] == "Bulk updated"

    # ========== Delete Tests ==========

    @pytest.mark.asyncio
    async def test_delete_item(self, test_items_collection, sample_item_data):
        """Test deleting an item."""
        repo = ItemsRepository(test_items_collection)
        created = await repo.create(sample_item_data)
        item_id = created["_id"]
        
        result = await repo.delete(item_id)
        
        assert result is True
        
        # Verify deletion
        item = await repo.get_by_id(item_id)
        assert item is None

    @pytest.mark.asyncio
    async def test_bulk_delete_by_ids(self, test_items_collection, sample_item_data):
        """Test bulk deletion of items."""
        repo = ItemsRepository(test_items_collection)
        
        # Create multiple items
        item_ids = []
        for i in range(3):
            data = sample_item_data.copy()
            data["catalog_number"] = f"DEL-{i}"
            data["created_at"] = datetime.utcnow()
            data["updated_at"] = datetime.utcnow()
            created = await repo.create(data)
            item_ids.append(created["_id"])
        
        items_before, count = await repo.bulk_delete_by_ids(item_ids)
        
        assert count == 3
        assert len(items_before) == 3
        
        # Verify all deleted
        for item_id in item_ids:
            item = await repo.get_by_id(item_id)
            assert item is None

    # ========== Stale Items Tests ==========

    @pytest.mark.asyncio
    async def test_get_stale_items(self, test_items_collection, sample_item_data):
        """Test getting stale items (not updated in X days)."""
        repo = ItemsRepository(test_items_collection)
        
        # Create old item (60 days ago)
        old_data = sample_item_data.copy()
        old_data["catalog_number"] = "OLD-001"
        old_data["updated_at"] = datetime.utcnow() - timedelta(days=60)
        old_data["created_at"] = datetime.utcnow() - timedelta(days=60)
        await repo.create(old_data)
        
        # Create recent item
        new_data = sample_item_data.copy()
        new_data["catalog_number"] = "NEW-001"
        new_data["updated_at"] = datetime.utcnow()
        new_data["created_at"] = datetime.utcnow()
        await repo.create(new_data)
        
        items, total = await repo.get_stale_items(days=30)
        
        assert total == 1
        assert items[0]["catalog_number"] == "OLD-001"



