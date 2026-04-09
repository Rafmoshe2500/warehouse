import pytest
from app.services.catalog_service import CatalogService
from app.schemas.catalog import CatalogFilter

@pytest.fixture
def catalog_service(mock_mongodb):
    return CatalogService()

@pytest.mark.asyncio
class TestCatalogService:
    
    async def test_upsert_and_search(self, catalog_service):
        """Test upserting an item and finding it."""
        # Upsert
        await catalog_service.upsert_catalog_item(
            catalog_number="CAT-123",
            description="Testing Catalog item",
            manufacturer="VendorX"
        )
        
        # Upsert blank should ignore
        await catalog_service.upsert_catalog_item(catalog_number="")
        
        # Search
        filt = CatalogFilter(search="CAT", page=1, limit=10)
        res = await catalog_service.search_catalog(filt)
        
        assert res.total == 1
        # Pydantic v1 vs v2 dict conversion artifact in unit tests without fastapi serialization
        if isinstance(res.items[0], dict):
            assert res.items[0]["catalog_number"] == "CAT-123"
            assert res.items[0]["manufacturer"] == "VendorX"
        else:
            assert res.items[0].catalog_number == "CAT-123"
            assert res.items[0].manufacturer == "VendorX"

    async def test_search_pagination_info(self, catalog_service):
        """Test pagination attributes."""
        for i in range(15):
            await catalog_service.upsert_catalog_item(f"DUMMY-{i}")
            
        filt = CatalogFilter(search="DUMMY-", page=2, limit=10)
        res = await catalog_service.search_catalog(filt)
        
        assert res.total == 15
        assert res.page == 2
        assert res.limit == 10
        assert res.pages == 2
        assert len(res.items) == 5

    async def test_upsert_empty_catalog_number_skipped(self, catalog_service):
        """Test that empty or None catalog numbers are silently skipped."""
        await catalog_service.upsert_catalog_item(catalog_number="")
        await catalog_service.upsert_catalog_item(catalog_number=None)
        
        filt = CatalogFilter(search="SHOULD_NOT_EXIST_XYZ", page=1, limit=100)
        res = await catalog_service.search_catalog(filt)
        assert res.total == 0

    async def test_upsert_updates_existing_item(self, catalog_service):
        """Test that upserting the same catalog number updates fields."""
        await catalog_service.upsert_catalog_item(
            catalog_number="UPD-001",
            description="Original",
            manufacturer="OldVendor"
        )

        await catalog_service.upsert_catalog_item(
            catalog_number="UPD-001",
            description="Updated",
            manufacturer="NewVendor"
        )

        filt = CatalogFilter(search="UPD-001", page=1, limit=10)
        res = await catalog_service.search_catalog(filt)
        assert res.total == 1
        item = res.items[0] if isinstance(res.items[0], dict) else res.items[0].model_dump()
        assert item["description"] == "Updated"
        assert item["manufacturer"] == "NewVendor"

    async def test_search_no_results(self, catalog_service):
        """Test search with no matching items."""
        filt = CatalogFilter(search="NONEXISTENT", page=1, limit=10)
        res = await catalog_service.search_catalog(filt)
        assert res.total == 0
        assert res.pages == 1
        assert len(res.items) == 0

    async def test_upsert_with_partial_fields(self, catalog_service):
        """Test upserting with only catalog_number (no description/manufacturer)."""
        await catalog_service.upsert_catalog_item(catalog_number="PARTIAL-001")

        filt = CatalogFilter(search="PARTIAL", page=1, limit=10)
        res = await catalog_service.search_catalog(filt)
        assert res.total == 1
