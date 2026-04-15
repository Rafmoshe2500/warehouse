"""Integration tests for the global search route."""
import pytest
from datetime import datetime, timezone


@pytest.mark.asyncio
class TestSearchRoute:

    async def test_search_returns_items(self, async_client, test_db):
        """GET /api/search?q=... returns matching items."""
        col = test_db["test_inventory"]
        await col.insert_one({
            "catalog_number": "SRCH-001",
            "description": "Test item for search",
            "manufacturer": "TestMfg",
            "serial": "SN-SRCH",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        response = await async_client.get("/api/search", params={"q": "SRCH-001"})

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "orders" in data
        assert "collections" in data
        assert len(data["items"]) == 1
        assert data["items"][0]["catalog_number"] == "SRCH-001"

    async def test_search_returns_orders(self, async_client, test_procurement_collection):
        """GET /api/search?q=... returns matching orders."""
        await test_procurement_collection.insert_one({
            "emf_number": "EMF-SRCH",
            "bom_items": [{"catalog_number": "P1", "manufacturer": "X", "description": "D", "quantity": 1, "item_id": 1}],
            "status": "ordered",
            "total_amount": 100,
            "order_date": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })

        response = await async_client.get("/api/search", params={"q": "EMF-SRCH"})

        assert response.status_code == 200
        assert len(response.json()["orders"]) == 1

    async def test_search_returns_collections(self, async_client, test_collections_collection):
        """GET /api/search?q=... returns matching collections."""
        await test_collections_collection.insert_one({
            "name": "Search Test Collection",
            "description": "A test",
            "owner": "admin",
            "created_at": datetime.now(timezone.utc),
        })

        response = await async_client.get("/api/search", params={"q": "Search Test"})

        assert response.status_code == 200
        assert len(response.json()["collections"]) == 1

    async def test_search_requires_query(self, async_client):
        """GET /api/search without q returns 422."""
        response = await async_client.get("/api/search")

        assert response.status_code == 422

    async def test_search_empty_query(self, async_client):
        """GET /api/search?q= (empty) returns 422."""
        response = await async_client.get("/api/search", params={"q": ""})

        assert response.status_code == 422

    async def test_search_no_results(self, async_client):
        """GET /api/search?q=nonexist returns empty lists."""
        response = await async_client.get("/api/search", params={"q": "ZZZZNONEXIST"})

        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["orders"] == []
        assert data["collections"] == []

    async def test_search_limit_param(self, async_client, test_db):
        """GET /api/search?q=...&limit=2 limits results."""
        col = test_db["test_inventory"]
        for i in range(5):
            await col.insert_one({
                "catalog_number": f"LIMIT-{i:03d}",
                "description": "Limit test item",
                "manufacturer": "LtdMfg",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
            })

        response = await async_client.get("/api/search", params={"q": "LIMIT", "limit": 2})

        assert response.status_code == 200
        assert len(response.json()["items"]) == 2

    async def test_search_unauthorized(self, async_client_user):
        """Regular user should still be able to search (read access)."""
        response = await async_client_user.get("/api/search", params={"q": "test"})

        assert response.status_code == 200
