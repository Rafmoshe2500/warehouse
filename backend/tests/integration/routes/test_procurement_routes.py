"""
Integration tests for Procurement API routes.
"""
import pytest
from datetime import datetime

@pytest.mark.asyncio
class TestProcurementRoutes:
    """API tests for /procurement endpoints."""

    async def test_create_order_route(self, async_client):
        """POST /procurement/orders - Create a new order."""
        order_data = {
            "catalog_number": "API-PROC-001",
            "manufacturer": "Vendor API",
            "description": "API Test",
            "quantity": 5,
            "order_date": datetime.utcnow().isoformat(),
            "amount": 100.50
        }
        
        response = await async_client.post("/api/procurement/orders", json=order_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["catalog_number"] == "API-PROC-001"
        assert "id" in data

    async def test_get_orders_route(self, async_client):
        """GET /procurement/orders - List orders."""
        response = await async_client.get("/api/procurement/orders")
        
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "total" in data

    async def test_update_order_route(self, async_client):
        """PUT /procurement/orders/{id} - Update order."""
        # Create
        order_data = {
            "catalog_number": "API-UPDATE",
            "manufacturer": "V",
            "description": "D",
            "quantity": 1,
            "order_date": datetime.utcnow().isoformat(),
            "amount": 10.0
        }
        created = await async_client.post("/api/procurement/orders", json=order_data)
        order_id = created.json()["id"]
        
        # Update
        response = await async_client.put(f"/api/procurement/orders/{order_id}", json={"quantity": 99})
        
        assert response.status_code == 200
        assert response.json()["quantity"] == 99

    async def test_delete_order_route(self, async_client):
        """DELETE /procurement/orders/{id} - Delete order."""
        # Create
        order_data = {
            "catalog_number": "API-DELETE",
            "manufacturer": "V",
            "description": "D",
            "quantity": 1,
            "order_date": datetime.utcnow().isoformat(),
            "amount": 10.0
        }
        created = await async_client.post("/api/procurement/orders", json=order_data)
        order_id = created.json()["id"]
        
        response = await async_client.delete(f"/api/procurement/orders/{order_id}")
        
        assert response.status_code == 200
        assert "נמחקה בהצלחה" in response.json()["message"]
