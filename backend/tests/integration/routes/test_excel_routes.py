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

    async def test_import_excel_route_valid_file(self, async_client):
        """POST /api/items/import-excel - Import a valid xlsx file."""
        import io
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        # Use Hebrew column headers that ExcelParser expects for inventory
        ws.append([
            'מק"ט', 'תאור פריט', 'יצרן', 'מיקום', 'סריאלי', 'מלאי קיים', 'תוקף אחריות'
        ])
        # Add 2+ data rows (parse_inventory strips the LAST row as a summary line)
        ws.append([
            "IMPORT-001", "Imported Item", "TestMfr",
            "Shelf-A", "SN-IMPORT-001", "5", ""
        ])
        ws.append([
            "IMPORT-002", "Imported Item 2", "TestMfr",
            "Shelf-B", "SN-IMPORT-002", "3", ""
        ])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        response = await async_client.post(
            "/api/items/import-excel",
            files={"file": ("items.xlsx", buf.read(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "added" in data or "updated" in data or "message" in data

    async def test_import_excel_route_wrong_extension(self, async_client):
        """POST /api/items/import-excel - Non-xlsx file should fail with 400."""
        response = await async_client.post(
            "/api/items/import-excel",
            files={"file": ("items.csv", b"col1,col2\n1,2", "text/csv")},
        )
        assert response.status_code == 400

    async def test_import_projects_route_valid_file(self, async_client):
        """POST /api/items/import-projects - Import a valid allocation xlsx."""
        import io
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        # Use Hebrew column headers that ExcelParser expects for project allocations
        ws.append(['מק"ט', 'מיקום', 'פרויקט', 'כמות'])
        ws.append(["PROJ-001", "Zone-A", "ProjectX", 5])
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        response = await async_client.post(
            "/api/items/import-projects",
            files={"file": ("alloc.xlsx", buf.read(),
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "updated" in data or "message" in data

    async def test_import_projects_route_no_file(self, async_client):
        """POST /api/items/import-projects - Missing file returns 422."""
        response = await async_client.post("/api/items/import-projects")
        assert response.status_code == 422
