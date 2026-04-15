"""
Integration tests for Analytics, Catalog, and Retrain routes.
"""
import pytest


@pytest.mark.asyncio
class TestAnalyticsRoutes:
    """Integration tests for /api/analytics endpoints."""

    async def test_dashboard_stats(self, async_client):
        response = await async_client.get("/api/analytics/dashboard")
        assert response.status_code == 200
        data = response.json()
        assert "total_items" in data
        assert "projects" in data
        assert "procurement" in data

    async def test_dashboard_stats_with_date_range(self, async_client):
        response = await async_client.get(
            "/api/analytics/dashboard",
            params={"start_date": "2024-01-01", "end_date": "2025-01-01"},
        )
        assert response.status_code == 200
        assert "total_items" in response.json()

    async def test_activity_stats_default_days(self, async_client):
        response = await async_client.get("/api/analytics/activity")
        assert response.status_code == 200
        data = response.json()
        assert data["days"] == 7
        for key in ("created", "updated", "deleted"):
            assert key in data

    async def test_activity_stats_custom_days(self, async_client):
        response = await async_client.get("/api/analytics/activity", params={"days": 30})
        assert response.status_code == 200
        assert response.json()["days"] == 30

    async def test_item_stats(self, async_client, test_db):
        # Analytics service queries MongoDB.get_collection("inventory") → test_inventory
        inventory_col = test_db["test_inventory"]
        await inventory_col.delete_many({})  # Ensure clean state
        try:
            await inventory_col.insert_one({
                "catalog_number": "STAT-001",
                "description": "Test",
                "manufacturer": "Dell",
                "serial": "SN1",          # serial item → qty = 1
                "location": "LocTest",
                "project_allocations": {"ProjectA": 1},
            })
            response = await async_client.get("/api/analytics/item/STAT-001")
            assert response.status_code == 200
            data = response.json()
            # Response must be a dict with the expected keys
            assert isinstance(data, dict)
            assert data["total_quantity"] == 1
            assert data["total_allocated"] == 1
            assert data["unallocated"] == 0
            assert isinstance(data["projects"], list)
            assert len(data["projects"]) == 1
            assert data["projects"][0]["name"] == "ProjectA"
        finally:
            await inventory_col.delete_many({})

    async def test_item_stats_nonexistent(self, async_client):
        response = await async_client.get("/api/analytics/item/DOES-NOT-EXIST")
        assert response.status_code == 200
        data = response.json()
        # No items match → all counts should be zero, projects empty
        assert isinstance(data, dict)
        assert data["total_quantity"] == 0
        assert data["total_allocated"] == 0
        assert data["unallocated"] == 0
        assert data["projects"] == []

    async def test_analytics_requires_auth(self, async_client_user):
        """Regular user can still access analytics (no special permission check)."""
        response = await async_client_user.get("/api/analytics/dashboard")
        assert response.status_code == 200


@pytest.mark.asyncio
class TestCatalogRoutes:
    """Integration tests for /api/catalog endpoint."""

    async def test_catalog_list_empty(self, async_client):
        response = await async_client.get("/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 0

    async def test_catalog_list_with_items(self, async_client, test_items_collection):
        # Insert items with same catalog number to test grouping
        for i in range(3):
            await test_items_collection.insert_one({
                "catalog_number": "CAT-UNIQ",
                "description": "Widget",
                "manufacturer": "Acme",
                "serial": f"SN{i}",
                "current_stock": "1",
            })
        response = await async_client.get("/api/catalog")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)

    async def test_catalog_search_filter(self, async_client, test_items_collection):
        await test_items_collection.insert_one({
            "catalog_number": "FIND-ME",
            "description": "Searchable Item",
            "manufacturer": "Dell",
            "serial": "SN-FIND",
            "current_stock": "5",
        })
        response = await async_client.get("/api/catalog", params={"search": "FIND-ME"})
        assert response.status_code == 200

    async def test_catalog_pagination(self, async_client):
        response = await async_client.get(
            "/api/catalog", params={"page": 1, "limit": 10}
        )
        assert response.status_code == 200
        data = response.json()
        assert "page" in data
        assert "limit" in data

    async def test_catalog_requires_inventory_ro(self, async_client_user):
        """Regular user without INVENTORY_RO should be denied."""
        response = await async_client_user.get("/api/catalog")
        assert response.status_code == 403


@pytest.mark.asyncio
class TestRetrainRoutes:
    """Integration tests for /api/ai/retrain endpoint."""

    async def test_retrain_denied_for_regular_user(self, async_client_user):
        response = await async_client_user.post("/api/ai/retrain")
        assert response.status_code == 403

    async def test_retrain_allowed_for_admin(self, async_client):
        """Admin can trigger retrain. May fail with ValueError if < 20 samples,
        which the route translates to 400."""
        response = await async_client.post("/api/ai/retrain")
        # Accept 200 (success) or 400 (not enough samples) or 500 (model error)
        assert response.status_code in (200, 400, 500)

    async def test_retrain_allowed_for_superadmin(self, async_client_superadmin):
        response = await async_client_superadmin.post("/api/ai/retrain")
        assert response.status_code in (200, 400, 500)
