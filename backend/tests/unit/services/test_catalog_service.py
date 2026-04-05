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
