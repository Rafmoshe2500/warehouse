"""Tests for SearchService - unified global search."""
import pytest
from datetime import datetime, timezone
import pytest_asyncio

from app.services.search_service import SearchService


class TestSearchService:

    @pytest.fixture
    def search_service(self, mock_mongodb):
        return SearchService()

    @pytest_asyncio.fixture
    async def inventory_collection(self, test_db):
        """Raw inventory collection (matches MongoDB.get_collection('inventory') → test_inventory)."""
        col = test_db["test_inventory"]
        yield col
        await col.delete_many({})

    @pytest_asyncio.fixture
    async def procurement_collection(self, test_db):
        """Raw procurement collection mapped from 'procurement_orders' → 'test_procurement_orders'."""
        col = test_db["test_procurement_orders"]
        yield col
        await col.delete_many({})

    @pytest_asyncio.fixture
    async def collections_col(self, test_db):
        """Raw collections collection mapped from 'collections' → 'test_collections'."""
        col = test_db["test_collections"]
        yield col
        await col.delete_many({})

    @pytest.mark.asyncio
    async def test_search_items(self, search_service, inventory_collection):
        """Search should return matching items."""
        await inventory_collection.insert_one({
            "catalog_number": "ABC-100",
            "description": "Server module",
            "manufacturer": "Dell",
            "serial": "SN001",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        await inventory_collection.insert_one({
            "catalog_number": "XYZ-200",
            "description": "Switch board",
            "manufacturer": "Cisco",
            "serial": "SN002",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        results = await search_service.search("ABC", limit=5)

        assert len(results["items"]) == 1
        assert results["items"][0]["catalog_number"] == "ABC-100"

    @pytest.mark.asyncio
    async def test_search_orders(self, search_service, procurement_collection):
        """Search should return matching procurement orders."""
        await procurement_collection.insert_one({
            "emf_number": "EMF-555",
            "status": "waiting_bom_emf",
            "bom_items": [{"catalog_number": "PART-A", "manufacturer": "HPE", "description": "Disk", "quantity": 1, "item_id": 1}],
            "total_amount": 5000,
            "order_date": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })

        results = await search_service.search("EMF-555", limit=5)

        assert len(results["orders"]) == 1
        assert results["orders"][0]["emf_number"] == "EMF-555"

    @pytest.mark.asyncio
    async def test_search_collections(self, search_service, collections_col):
        """Search should return matching collections."""
        await collections_col.insert_one({
            "name": "Network Equipment",
            "description": "All switches and routers",
            "owner": "admin",
            "created_at": datetime.now(timezone.utc),
        })

        results = await search_service.search("Network", limit=5)

        assert len(results["collections"]) == 1
        assert results["collections"][0]["name"] == "Network Equipment"

    @pytest.mark.asyncio
    async def test_search_no_results(self, search_service, inventory_collection):
        """Search with no matches returns empty lists."""
        results = await search_service.search("NONEXISTENT", limit=5)

        assert results["items"] == []
        assert results["orders"] == []
        assert results["collections"] == []

    @pytest.mark.asyncio
    async def test_search_respects_limit(self, search_service, inventory_collection):
        """Search should limit results per category."""
        for i in range(10):
            await inventory_collection.insert_one({
                "catalog_number": f"ITEM-{i:03d}",
                "description": "Matching item",
                "manufacturer": "TestMfg",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

        results = await search_service.search("ITEM", limit=3)

        assert len(results["items"]) == 3

    @pytest.mark.asyncio
    async def test_search_across_all_types(
        self, search_service,
        inventory_collection, procurement_collection, collections_col
    ):
        """Search should return results from all categories at once."""
        await inventory_collection.insert_one({
            "catalog_number": "UNIVERSAL-001",
            "description": "Universal widget",
            "manufacturer": "Acme",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })
        await procurement_collection.insert_one({
            "emf_number": "UNIVERSAL-EMF",
            "bom_items": [{"catalog_number": "UNIVERSAL-001", "manufacturer": "Acme", "description": "Widget", "quantity": 1, "item_id": 1}],
            "status": "ordered",
            "total_amount": 100,
            "order_date": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })
        await collections_col.insert_one({
            "name": "Universal Collection",
            "description": "Test",
            "owner": "admin",
            "created_at": datetime.now(timezone.utc),
        })

        results = await search_service.search("UNIVERSAL", limit=5)

        assert len(results["items"]) >= 1
        assert len(results["orders"]) >= 1
        assert len(results["collections"]) >= 1
