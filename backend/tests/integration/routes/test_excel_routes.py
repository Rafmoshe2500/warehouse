"""
Integration tests for Excel API routes.
"""
import pytest

@pytest.mark.asyncio
class TestExcelRoutes:
    """API tests for /excel endpoints."""

    async def test_export_excel_route(self, async_client):
        """GET /api/items/export-excel - Export items."""
        # Seed an item so export doesn't fail with 400 (no items found)
        await async_client.post("/api/items", json={"catalog_number": "SEED-EXT", "description": "Seed Item"})
        
        response = await async_client.get("/api/items/export-excel")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    async def test_import_excel_route_no_file(self, async_client):
        """POST /api/items/import-excel - Attempt import without file."""
        response = await async_client.post("/api/items/import-excel")
        assert response.status_code == 422 # Validation error
