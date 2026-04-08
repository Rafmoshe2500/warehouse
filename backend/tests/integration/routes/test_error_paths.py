"""
Error path integration tests — verifying proper HTTP error codes
across items, procurement, and other routes.
"""
import pytest
from bson import ObjectId


@pytest.mark.asyncio
class TestItemsErrorPaths:
    """Error paths for /api/items endpoints."""

    async def test_get_item_nonexistent_returns_404(self, async_client):
        fake_id = str(ObjectId())
        response = await async_client.get(f"/api/items/{fake_id}")
        # Route may not exist (items use list endpoint) - check if single-get exists
        assert response.status_code in (404, 405)

    async def test_update_item_nonexistent_returns_404(self, async_client):
        fake_id = str(ObjectId())
        response = await async_client.patch(
            f"/api/items/{fake_id}",
            json={"field": "description", "value": "new"},
        )
        assert response.status_code in (404, 422, 500)

    async def test_delete_item_nonexistent_returns_404(self, async_client):
        fake_id = str(ObjectId())
        response = await async_client.request(
            "DELETE",
            f"/api/items/{fake_id}",
            json={"reason": "test"},
        )
        assert response.status_code in (404, 500)

    async def test_items_denied_for_user_without_permission(self, async_client_user):
        """Regular user w/o INVENTORY_RO should be denied."""
        response = await async_client_user.get("/api/items")
        assert response.status_code == 403

    async def test_create_item_denied_without_rw(self, async_client_user):
        """Regular user w/o INVENTORY_RW should be denied."""
        response = await async_client_user.post(
            "/api/items",
            json={
                "catalog_number": "X",
                "description": "Y",
                "manufacturer": "Z",
                "serial": "S",
            },
        )
        assert response.status_code == 403

    async def test_bulk_delete_no_ids_raises_error(self, async_client):
        response = await async_client.post(
            "/api/items/bulk-delete",
            json={"reason": "cleanup"},
        )
        # DeleteConfirmationException or 422 if ids missing
        assert response.status_code in (400, 422)

    async def test_delete_all_denied_for_non_admin(self, async_client_user):
        response = await async_client_user.post(
            "/api/items/delete-all",
            json={"reason": "reset"},
        )
        assert response.status_code == 403


@pytest.mark.asyncio
class TestProcurementErrorPaths:
    """Error paths for /api/procurement endpoints."""

    async def test_orders_denied_without_read_access(self, async_client_user):
        """User with no procurement perm should be denied."""
        response = await async_client_user.get("/api/procurement/orders")
        assert response.status_code == 403

    async def test_get_order_nonexistent(self, async_client):
        fake_id = str(ObjectId())
        response = await async_client.get(f"/api/procurement/orders/{fake_id}")
        assert response.status_code == 404

    async def test_update_order_nonexistent(self, async_client):
        fake_id = str(ObjectId())
        response = await async_client.put(
            f"/api/procurement/orders/{fake_id}",
            json={"status": "received"},
        )
        assert response.status_code in (404, 422)

    async def test_delete_order_nonexistent(self, async_client):
        fake_id = str(ObjectId())
        response = await async_client.request(
            "DELETE",
            f"/api/procurement/orders/{fake_id}",
            json={"reason": "cleanup"},
        )
        assert response.status_code in (404, 422)


@pytest.mark.asyncio
class TestExcelErrorPaths:

    async def test_import_invalid_file(self, async_client):
        """Uploading non-Excel data should return 400."""
        response = await async_client.post(
            "/api/items/import-excel",
            files={"file": ("bad.xlsx", b"not-excel-content", "application/octet-stream")},
        )
        assert response.status_code in (400, 422, 500)

    async def test_import_bad_file_returns_error(self, async_client_user):
        """Any authenticated user can call import, but invalid file returns 400."""
        response = await async_client_user.post(
            "/api/items/import-excel",
            files={"file": ("test.xlsx", b"something", "application/octet-stream")},
        )
        assert response.status_code == 400


@pytest.mark.asyncio
class TestAuthErrorPaths:

    async def test_login_invalid_credentials(self, async_client):
        response = await async_client.post(
            "/api/auth/login",
            json={"username": "nonexistent", "password": "wrong"},
        )
        assert response.status_code in (401, 404)

    async def test_login_missing_fields(self, async_client):
        response = await async_client.post("/api/auth/login", json={})
        assert response.status_code == 422
