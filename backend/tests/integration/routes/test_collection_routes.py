
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestCollectionRoutes:
    """Integration tests for /collections endpoints."""

    async def test_create_collection(self, async_client):
        """POST /collections - Create a new collection."""
        data = {
            "name": "Integration Test Collection",
            "description": "Created via integration test"
        }
        response = await async_client.post("/api/collections/", json=data)
        assert response.status_code == 201
        result = response.json()
        assert result["name"] == data["name"]
        assert result["owner_id"] is not None
        assert "id" in result

    async def test_list_collections(self, async_client):
        """GET /collections - List collections."""
        # Create a collection first
        await async_client.post("/api/collections/", json={"name": "List Test Col"})
        
        response = await async_client.get("/api/collections/")
        assert response.status_code == 200
        result = response.json()
        assert isinstance(result, list)
        assert len(result) >= 1
        assert any(c["name"] == "List Test Col" for c in result)

    async def test_get_collection_details(self, async_client):
        """GET /collections/{id} - Get details."""
        create_res = await async_client.post("/api/collections/", json={"name": "Details Test"})
        col_id = create_res.json()["id"]
        
        response = await async_client.get(f"/api/collections/{col_id}")
        assert response.status_code == 200
        assert response.json()["id"] == col_id
        assert response.json()["name"] == "Details Test"

    async def test_update_collection(self, async_client):
        """PUT /collections/{id} - Update details."""
        create_res = await async_client.post("/api/collections/", json={"name": "Update Test"})
        col_id = create_res.json()["id"]
        
        update_data = {"name": "Updated Name", "description": "New Desc"}
        response = await async_client.put(f"/api/collections/{col_id}", json=update_data)
        
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "Updated Name"
        assert result["description"] == "New Desc"

    async def test_delete_collection(self, async_client):
        """DELETE /collections/{id} - Delete collection."""
        create_res = await async_client.post("/api/collections/", json={"name": "Delete Test"})
        col_id = create_res.json()["id"]
        
        response = await async_client.delete(f"/api/collections/{col_id}")
        assert response.status_code == 204
        
        # Verify gone
        get_res = await async_client.get(f"/api/collections/{col_id}")
        assert get_res.status_code == 404

    async def test_add_item_to_collection(self, async_client, test_db):
        """POST /collections/{id}/items - Add item."""
        # Setup: Create Collection and Item
        col_res = await async_client.post("/api/collections/", json={"name": "Item Test"})
        col_id = col_res.json()["id"]
        
        # Create item directly in DB or via API if available (using mock logic)
        # For integration test, we simulate item_id. 
        # But service checks existence. Let's rely on service logic.
        # If service checks inventory, we need a real item.
        # Let's create an item via item API first
        item_res = await async_client.post("/api/items", json={"catalog_number": "COL-ITEM-001", "description": "Test Item"})
        item_id = item_res.json()["_id"]

        data = {
            "item_id": item_id,
            "custom_values": {"notes": "Test Note"}
        }
        
        response = await async_client.post(f"/api/collections/{col_id}/items", json=data)
        assert response.status_code == 201
        
        # Verify in list
        list_res = await async_client.get(f"/api/collections/{col_id}/items")
        items = list_res.json()
        assert len(items) == 1
        assert items[0]["item_id"] == item_id
        assert items[0]["custom_values"]["notes"] == "Test Note"

    async def test_remove_item_from_collection(self, async_client):
        """DELETE /collections/{id}/items/{item_id} - Remove item."""
        # Setup
        col_res = await async_client.post("/api/collections/", json={"name": "Remove Item Test"})
        col_id = col_res.json()["id"]
        
        item_res = await async_client.post("/api/items", json={"catalog_number": "COL-ITEM-RM"})
        item_id = item_res.json()["_id"]
        
        await async_client.post(f"/api/collections/{col_id}/items", json={"item_id": item_id})
        
        # Remove
        response = await async_client.delete(f"/api/collections/{col_id}/items/{item_id}")
        assert response.status_code == 204
        
        # Verify gone
        list_res = await async_client.get(f"/api/collections/{col_id}/items")
        assert len(list_res.json()) == 0

    async def test_permissions_flow(self, async_client):
        """Test adding and removing permissions."""
        col_res = await async_client.post("/api/collections/", json={"name": "Perms Test"})
        col_id = col_res.json()["id"]
        
        # Add Permission
        perm_data = {
            "type": "user",
            "id": "other_user",
            "level": "ro"
        }
        res = await async_client.post(f"/api/collections/{col_id}/permissions", json=perm_data)
        assert res.status_code == 200
        
        # Verify
        get_res = await async_client.get(f"/api/collections/{col_id}")
        perms = get_res.json()["permissions"]
        assert len(perms) == 1
        assert perms[0]["id"] == "other_user"
        assert perms[0]["level"] == "ro"
        
        # Remove Permission
        del_res = await async_client.delete(f"/api/collections/{col_id}/permissions/other_user")
        assert del_res.status_code == 200
        
        # Verify gone
        get_res = await async_client.get(f"/api/collections/{col_id}")
        assert len(get_res.json()["permissions"]) == 0
