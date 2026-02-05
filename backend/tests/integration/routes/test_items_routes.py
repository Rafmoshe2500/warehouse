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
