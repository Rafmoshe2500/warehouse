"""
Integration tests for Items API routes.
"""
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestItemsRoutes:
    """API tests for /items endpoints."""

    async def test_create_item_route(self, async_client):
        """POST /items - Create a new item."""
        item_data = {
            "catalog_number": "ROUTE-001",
            "description": "Route Test",
            "manufacturer": "Mfr",
            "location": "Loc"
        }
        
        response = await async_client.post("/api/items", json=item_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["catalog_number"] == "ROUTE-001"
        assert "_id" in data

    async def test_get_items_route(self, async_client):
        """GET /items - List items."""
        # Create one first
        await async_client.post("/api/items", json={"catalog_number": "GET-API-001"})
        
        response = await async_client.get("/api/items")
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["total"] >= 1

    async def test_update_item_route(self, async_client):
        """PATCH /items/{id} - Update item field."""
        # Create
        created = await async_client.post("/api/items", json={"catalog_number": "UPDATE-API"})
        item_id = created.json()["_id"]
        
        # Update
        update_data = {"field": "description", "value": "New API Desc"}
        response = await async_client.patch(f"/api/items/{item_id}", json=update_data)
        
        assert response.status_code == 200
        assert response.json()["description"] == "New API Desc"

    async def test_bulk_update_route(self, async_client):
        """POST /items/bulk-update - Bulk update items."""
        c1 = await async_client.post("/api/items", json={"catalog_number": "B1"})
        c2 = await async_client.post("/api/items", json={"catalog_number": "B2"})
        ids = [c1.json()["_id"], c2.json()["_id"]]
        
        response = await async_client.post("/api/items/bulk-update", json={
            "ids": ids,
            "notes": "Bulk API Update"
        })
        
        assert response.status_code == 200
        assert response.json()["modified_count"] == 2

    async def test_delete_item_route(self, async_client):
        """DELETE /items/{id} - Delete item."""
        created = await async_client.post("/api/items", json={"catalog_number": "DEL-API"})
        item_id = created.json()["_id"]
        
        response = await async_client.request(
            "DELETE", 
            f"/api/items/{item_id}", 
            json={"reason": "API delete test"}
        )
        
        assert response.status_code == 200
        assert response.json()["message"] == "פריט נמחק בהצלחה"

    async def test_get_stale_items_route(self, async_client):
        """GET /items/stale - List stale items."""
        response = await async_client.get("/api/items/stale")
        assert response.status_code == 200
        assert "items" in response.json()

    async def test_bulk_delete_route(self, async_client):
        """POST /items/bulk-delete - Bulk delete multiple items."""
        c1 = await async_client.post("/api/items", json={"catalog_number": "BDEL-R1"})
        c2 = await async_client.post("/api/items", json={"catalog_number": "BDEL-R2"})
        ids = [c1.json()["_id"], c2.json()["_id"]]

        response = await async_client.post("/api/items/bulk-delete", json={
            "ids": ids,
            "reason": "Route bulk delete test"
        })

        assert response.status_code == 200
        assert response.json()["deleted_count"] == 2

    async def test_get_items_with_catalog_filter(self, async_client):
        """GET /items?catalog_number=... - Filter items by catalog number."""
        await async_client.post("/api/items", json={"catalog_number": "FILTER-ROUTE-MATCH"})
        await async_client.post("/api/items", json={"catalog_number": "DIFFERENT-ITEM"})

        response = await async_client.get("/api/items?catalog_number=FILTER-ROUTE")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["catalog_number"] == "FILTER-ROUTE-MATCH"

    async def test_get_items_with_stale_days_filter(self, async_client, test_db):
        """GET /items?stale_days=1 - Filter items by staleness via main endpoint."""
        from datetime import datetime, timezone, timedelta

        collection = test_db["test_inventory"]

        # Insert an old item directly to control updated_at
        old_date = datetime.now(timezone.utc) - timedelta(days=60)
        await collection.insert_one({
            "catalog_number": "STALE-FILTER-001",
            "description": "Old item",
            "updated_at": old_date,
            "created_at": old_date
        })

        # Create a fresh item via API (will have current updated_at)
        await async_client.post("/api/items", json={"catalog_number": "FRESH-FILTER-001"})

        response = await async_client.get("/api/items?stale_days=30")

        assert response.status_code == 200
        data = response.json()
        catalog_numbers = [item["catalog_number"] for item in data["items"]]
        assert "STALE-FILTER-001" in catalog_numbers
        assert "FRESH-FILTER-001" not in catalog_numbers

    async def test_get_items_stale_days_with_search(self, async_client, test_db):
        """GET /items?stale_days=1&search=... - Stale + search filter combine."""
        from datetime import datetime, timezone, timedelta

        collection = test_db["test_inventory"]

        old_date = datetime.now(timezone.utc) - timedelta(days=60)
        await collection.insert_one({
            "catalog_number": "STALE-SEARCH-MATCH",
            "description": "Findable",
            "updated_at": old_date,
            "created_at": old_date
        })
        await collection.insert_one({
            "catalog_number": "STALE-SEARCH-OTHER",
            "description": "Something else",
            "updated_at": old_date,
            "created_at": old_date
        })

        response = await async_client.get("/api/items?stale_days=30&search=Findable")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["catalog_number"] == "STALE-SEARCH-MATCH"
