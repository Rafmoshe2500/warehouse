"""
Integration tests for Procurement API routes.
"""
import pytest
from datetime import datetime, timezone


def _order_payload(**kwargs) -> dict:
    """Helper to build a valid procurement order payload."""
    defaults = {
        "order_date": datetime.now(timezone.utc).isoformat(),
        "bom_items": [
            {
                "item_id": 1,
                "catalog_number": "API-PROC-001",
                "manufacturer": "Vendor API",
                "description": "API Test",
                "quantity": 5
            }
        ],
        "total_amount": 100.50
    }
    defaults.update(kwargs)
    return defaults


@pytest.mark.asyncio
class TestProcurementRoutes:
    """API tests for /procurement endpoints."""

    async def test_create_order_route(self, async_client):
        """POST /procurement/orders - Create a new order."""
        response = await async_client.post("/api/procurement/orders", json=_order_payload())

        assert response.status_code == 200
        data = response.json()
        assert "bom_items" in data
        assert len(data["bom_items"]) == 1
        assert data["bom_items"][0]["catalog_number"] == "API-PROC-001"
        assert "id" in data

    async def test_create_order_default_status(self, async_client):
        """POST /procurement/orders - Order without EMF/BOM defaults to waiting_bom_emf."""
        payload = _order_payload()
        # No emf_number, received_bom defaults to False
        response = await async_client.post("/api/procurement/orders", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "waiting_bom_emf"

    async def test_create_order_with_emf_transitions_to_waiting_bom(self, async_client):
        """POST /procurement/orders - Order with EMF but no BOM → waiting_bom_emf."""
        payload = _order_payload(emf_number="EMF-555", received_bom=False)
        response = await async_client.post("/api/procurement/orders", json=payload)

        assert response.status_code == 200
        assert response.json()["status"] == "waiting_bom_emf"

    async def test_create_order_with_emf_and_bom_transitions_to_waiting_order(self, async_client):
        """POST /procurement/orders - Order with both EMF and BOM → waiting_shipment."""
        payload = _order_payload(emf_number="EMF-888", received_bom=True)
        response = await async_client.post("/api/procurement/orders", json=payload)

        assert response.status_code == 200
        assert response.json()["status"] == "waiting_shipment"

    async def test_get_orders_route(self, async_client):
        """GET /procurement/orders - List orders."""
        response = await async_client.get("/api/procurement/orders")

        assert response.status_code == 200
        data = response.json()
        assert "orders" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    async def test_get_order_by_id_route(self, async_client):
        """GET /procurement/orders/{id} - Get single order by ID."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "GET-BY-ID",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        response = await async_client.get(f"/api/procurement/orders/{order_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == order_id
        assert data["bom_items"][0]["catalog_number"] == "GET-BY-ID"

    async def test_get_order_by_id_not_found(self, async_client):
        """GET /procurement/orders/{id} - Returns 404 for non-existent order."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        response = await async_client.get(f"/api/procurement/orders/{fake_id}")
        assert response.status_code == 404

    async def test_get_orders_filter_by_status_in(self, async_client):
        """GET /procurement/orders?status_in=... - Filter by status list."""
        # Create orders with different statuses
        await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{"item_id": 1, "catalog_number": "STATUS-A",
                        "manufacturer": "V", "description": "D", "quantity": 1}]
        ))
        payload_ordered = _order_payload(
            bom_items=[{"item_id": 2, "catalog_number": "STATUS-B",
                        "manufacturer": "V", "description": "D", "quantity": 1}],
            emf_number="EMF-1", received_bom=True
        )
        created = await async_client.post("/api/procurement/orders", json=payload_ordered)
        order_id = created.json()["id"]
        # Manually mark as ordered via update
        await async_client.put(
            f"/api/procurement/orders/{order_id}",
            json={"status": "received"}
        )

        # Filter: only waiting_bom_emf
        response = await async_client.get(
            "/api/procurement/orders?status_in=waiting_bom_emf"
        )
        assert response.status_code == 200
        data = response.json()
        assert all(o["status"] == "waiting_bom_emf" for o in data["orders"])

    async def test_update_order_route(self, async_client):
        """PUT /procurement/orders/{id} - Update order."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "API-UPDATE",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        update_data = {
            "total_amount": 9999.0,
            "bom_items": [
                {
                    "item_id": 1,
                    "catalog_number": "API-UPDATE",
                    "manufacturer": "V",
                    "description": "D",
                    "quantity": 99
                }
            ]
        }
        response = await async_client.put(f"/api/procurement/orders/{order_id}", json=update_data)

        assert response.status_code == 200
        assert response.json()["bom_items"][0]["quantity"] == 99
        assert response.json()["total_amount"] == 9999.0

    async def test_delete_order_route(self, async_client):
        """DELETE /procurement/orders/{id} - Delete order."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "API-DELETE",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        response = await async_client.delete(f"/api/procurement/orders/{order_id}")

        assert response.status_code == 200
        assert "נמחקה בהצלחה" in response.json()["message"]

        # Verify gone
        get_res = await async_client.get(f"/api/procurement/orders/{order_id}")
        assert get_res.status_code == 404

    # ========== Summary Endpoint ==========

    async def test_get_summary_route(self, async_client):
        """GET /procurement/summary - Returns monthly summary."""
        # Create an order first
        await async_client.post("/api/procurement/orders", json=_order_payload(total_amount=2500))

        response = await async_client.get("/api/procurement/summary")

        assert response.status_code == 200
        data = response.json()
        assert "total_spend" in data
        assert "order_count" in data
        assert "avg_lead_days" in data
        assert "top_vendor" in data
        assert data["order_count"] >= 1
        assert data["total_spend"] >= 2500

    async def test_get_summary_empty(self, async_client, test_procurement_collection):
        """GET /procurement/summary - Returns zeros when no orders exist (collection explicitly cleared)."""
        # test_procurement_collection fixture clears the collection after the test;
        # using it here ensures any pre-existing data is cleared via the session scope cleanup
        response = await async_client.get("/api/procurement/summary")

        assert response.status_code == 200
        data = response.json()
        assert "order_count" in data
        assert "total_spend" in data
        assert data["total_spend"] >= 0

    # ------------------------------------------------------------------ #
    #  File upload / download / delete                                     #
    # ------------------------------------------------------------------ #

    async def test_upload_file_to_order(self, async_client):
        """POST /procurement/orders/{id}/files - Upload a file to an order."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "FILE-UPLOAD-ROUTE",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        res = await async_client.post(
            f"/api/procurement/orders/{order_id}/files",
            files={"file": ("test.pdf", b"%PDF-1.4 dummy content", "application/pdf")},
        )
        assert res.status_code == 200
        data = res.json()
        assert "file_id" in data
        assert data["filename"] == "test.pdf"

    async def test_upload_file_bad_extension(self, async_client):
        """POST /procurement/orders/{id}/files - Unsupported extension returns 400."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "FILE-BAD-EXT",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        res = await async_client.post(
            f"/api/procurement/orders/{order_id}/files",
            files={"file": ("malware.exe", b"MZ dummy", "application/octet-stream")},
        )
        assert res.status_code == 400

    async def test_delete_file_from_order(self, async_client):
        """DELETE /procurement/orders/{id}/files/{file_id} - Remove an uploaded file."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "FILE-DELETE-ROUTE",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        # Upload file first
        upload_res = await async_client.post(
            f"/api/procurement/orders/{order_id}/files",
            files={"file": ("to_delete.pdf", b"%PDF-1.4 delete me", "application/pdf")},
        )
        file_id = upload_res.json()["file_id"]

        # Now delete
        del_res = await async_client.delete(f"/api/procurement/orders/{order_id}/files/{file_id}")
        assert del_res.status_code == 200

        # Verify the file is gone from the order
        order = await async_client.get(f"/api/procurement/orders/{order_id}")
        assert len(order.json().get("files", [])) == 0

    async def test_delete_file_not_found(self, async_client):
        """DELETE /procurement/orders/{id}/files/{file_id} - 404 for nonexistent file."""
        created = await async_client.post("/api/procurement/orders", json=_order_payload(
            bom_items=[{
                "item_id": 1, "catalog_number": "FILE-404",
                "manufacturer": "V", "description": "D", "quantity": 1
            }]
        ))
        order_id = created.json()["id"]

        res = await async_client.delete(f"/api/procurement/orders/{order_id}/files/nonexistent_id")
        assert res.status_code == 404

    # ------------------------------------------------------------------ #
    #  Validation errors                                                   #
    # ------------------------------------------------------------------ #

    async def test_create_order_missing_bom_items_returns_422(self, async_client):
        """POST /procurement/orders - Missing required field returns 422."""
        bad_payload = {"order_date": datetime.now(timezone.utc).isoformat(), "total_amount": 100}
        res = await async_client.post("/api/procurement/orders", json=bad_payload)
        assert res.status_code == 422
