"""
Integration tests for BOM Templates API routes.
Tests CRUD operations and access control (admin only for write operations).
"""
import io
import json
import pytest
from openpyxl import Workbook
from app.core.security import require_admin


def _make_xlsx_bytes(headers: list, rows: list) -> bytes:
    """Helper: build an in-memory xlsx and return raw bytes."""
    wb = Workbook()
    ws = wb.active
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def _template_payload(**kwargs) -> dict:
    defaults = {
        "vendor_name": "TestVendor",
        "column_map": {
            "Part #": "part_number",
            "Description": "product",
            "Qty": "ext_qty",
        },
        "header_detection": {
            "keyword": "Part #",
            "max_scan_rows": 25
        },
        "group_detection": {
            "mode": "all_rows",
            "config": {}
        }
    }
    defaults.update(kwargs)
    return defaults


@pytest.mark.asyncio
class TestBomTemplateRoutes:
    """Integration tests for /bom/templates endpoints."""

    # ------------------------------------------------------------------ #
    #  GET /bom/templates/ — list (any authenticated user)                #
    # ------------------------------------------------------------------ #

    async def test_list_templates_empty(self, async_client):
        """GET /bom/templates/ - Returns empty list when no templates exist."""
        res = await async_client.get("/api/bom/templates/")
        assert res.status_code == 200
        data = res.json()
        assert "templates" in data
        assert "total" in data
        assert data["total"] == 0

    async def test_list_templates_returns_created(self, async_client):
        """GET /bom/templates/ - After create, list should include new template."""
        await async_client.post("/api/bom/templates/", json=_template_payload(
            vendor_name="ListVendor"
        ))
        res = await async_client.get("/api/bom/templates/")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 1
        names = [t["vendor_name"] for t in data["templates"]]
        assert "ListVendor" in names

    # ------------------------------------------------------------------ #
    #  POST /bom/templates/ — create (admin only)                         #
    # ------------------------------------------------------------------ #

    async def test_create_template_success(self, async_client):
        """POST /bom/templates/ - Admin creates a new BOM template."""
        payload = _template_payload(vendor_name="CreateVendor")
        res = await async_client.post("/api/bom/templates/", json=payload)
        assert res.status_code == 201
        data = res.json()
        assert data["vendor_name"] == "CreateVendor"
        assert "id" in data

    async def test_create_template_requires_column_map_with_part_number(self, async_client):
        """POST /bom/templates/ - column_map must map at least one column to 'part_number'."""
        payload = _template_payload(
            column_map={"Description": "product", "Qty": "ext_qty"}  # no part_number value
        )
        res = await async_client.post("/api/bom/templates/", json=payload)
        assert res.status_code == 422  # Pydantic validation fails

    async def test_create_template_non_admin_is_denied(self, async_client_user):
        """POST /bom/templates/ - Regular user should get 403."""
        payload = _template_payload(vendor_name="UserVendor")
        res = await async_client_user.post("/api/bom/templates/", json=payload)
        assert res.status_code == 403

    # ------------------------------------------------------------------ #
    #  GET /bom/templates/{id} — get single                               #
    # ------------------------------------------------------------------ #

    async def test_get_template_by_id(self, async_client):
        """GET /bom/templates/{id} - Returns the correct template."""
        create_res = await async_client.post("/api/bom/templates/", json=_template_payload(
            vendor_name="GetVendor"
        ))
        assert create_res.status_code == 201
        template_id = create_res.json()["id"]

        res = await async_client.get(f"/api/bom/templates/{template_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == template_id
        assert data["vendor_name"] == "GetVendor"

    async def test_get_template_not_found(self, async_client):
        """GET /bom/templates/{id} - Returns 404 for nonexistent ID."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        res = await async_client.get(f"/api/bom/templates/{fake_id}")
        assert res.status_code == 404

    # ------------------------------------------------------------------ #
    #  PUT /bom/templates/{id} — update (admin only)                      #
    # ------------------------------------------------------------------ #

    async def test_update_template_success(self, async_client):
        """PUT /bom/templates/{id} - Admin updates an existing template."""
        create_res = await async_client.post("/api/bom/templates/", json=_template_payload(
            vendor_name="BeforeUpdate"
        ))
        assert create_res.status_code == 201
        template_id = create_res.json()["id"]

        update_payload = {"vendor_name": "AfterUpdate"}
        res = await async_client.put(f"/api/bom/templates/{template_id}", json=update_payload)
        assert res.status_code == 200
        assert res.json()["vendor_name"] == "AfterUpdate"

    async def test_update_template_not_found(self, async_client):
        """PUT /bom/templates/{id} - Returns 404 for nonexistent ID."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        res = await async_client.put(f"/api/bom/templates/{fake_id}", json={"vendor_name": "Ghost"})
        assert res.status_code == 404

    async def test_update_template_non_admin_is_denied(self, async_client_user):
        """PUT /bom/templates/{id} - Regular user should get 403."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        res = await async_client_user.put(f"/api/bom/templates/{fake_id}", json={"vendor_name": "Sneaky"})
        assert res.status_code == 403

    # ------------------------------------------------------------------ #
    #  DELETE /bom/templates/{id} — deactivate (admin only)               #
    # ------------------------------------------------------------------ #

    async def test_delete_template_deactivates(self, async_client):
        """DELETE /bom/templates/{id} - Deactivates the template (sets is_active=False)."""
        create_res = await async_client.post("/api/bom/templates/", json=_template_payload(
            vendor_name="ToDeactivate"
        ))
        assert create_res.status_code == 201
        template_id = create_res.json()["id"]

        res = await async_client.delete(f"/api/bom/templates/{template_id}")
        assert res.status_code in (200, 204)

    async def test_delete_template_not_found(self, async_client):
        """DELETE /bom/templates/{id} - Returns 404 for nonexistent ID."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        res = await async_client.delete(f"/api/bom/templates/{fake_id}")
        assert res.status_code == 404

    async def test_delete_template_non_admin_is_denied(self, async_client_user):
        """DELETE /bom/templates/{id} - Regular user should get 403."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        res = await async_client_user.delete(f"/api/bom/templates/{fake_id}")
        assert res.status_code == 403


# ─────────────────────────────────────────────────────────────────────────── #
#  POST /bom/templates/preview-excel  (admin only)                            #
# ─────────────────────────────────────────────────────────────────────────── #

@pytest.mark.asyncio
class TestBomTemplatePreviewExcel:

    async def test_preview_excel_valid_file_returns_rows(self, async_client):
        """Valid xlsx → 200 with sheet_name, total_sheets, rows."""
        xlsx_bytes = _make_xlsx_bytes(
            headers=["Part Number", "Description", "Qty"],
            rows=[["PN-001", "Widget", 5], ["PN-002", "Gadget", 3]],
        )
        res = await async_client.post(
            "/api/bom/templates/preview-excel",
            files={"file": ("test.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert res.status_code == 200
        data = res.json()
        assert "sheet_name" in data
        assert "rows" in data
        assert len(data["rows"]) >= 1

    async def test_preview_excel_non_xlsx_returns_400(self, async_client):
        """Non-xlsx file extension → 400."""
        res = await async_client.post(
            "/api/bom/templates/preview-excel",
            files={"file": ("test.csv", b"col1,col2\nval1,val2", "text/csv")},
        )
        assert res.status_code == 400

    async def test_preview_excel_non_admin_returns_403(self, async_client_user):
        """Regular user → 403."""
        xlsx_bytes = _make_xlsx_bytes(headers=["Part Number"], rows=[["PN-001"]])
        res = await async_client_user.post(
            "/api/bom/templates/preview-excel",
            files={"file": ("test.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert res.status_code == 403

    async def test_preview_excel_corrupted_file_returns_422(self, async_client):
        """Corrupt file bytes → 422."""
        res = await async_client.post(
            "/api/bom/templates/preview-excel",
            files={"file": ("corrupt.xlsx", b"this is not xlsx content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────── #
#  POST /bom/templates/validate  (admin only)                                 #
# ─────────────────────────────────────────────────────────────────────────── #

@pytest.mark.asyncio
class TestBomTemplateValidate:

    def _valid_config(self) -> str:
        return json.dumps({
            "format_id": "test_vendor",
            "vendor_name": "TestVendor",
            "header_detection": {"keyword": "Part Number", "max_scan_rows": 25},
            "column_map": {"Part Number": "part_number", "Description": "product", "Qty": "ext_qty"},
            "group_detection": {"mode": "all_rows", "config": {}},
        })

    async def test_validate_valid_config_and_file_returns_valid_true(self, async_client):
        """Valid config + matching xlsx → 200 with valid=True."""
        xlsx_bytes = _make_xlsx_bytes(
            headers=["Part Number", "Description", "Qty"],
            rows=[["PN-001", "Widget", 5], ["PN-002", "Gadget", 3]],
        )
        res = await async_client.post(
            "/api/bom/templates/validate",
            files={"file": ("sample.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"config": self._valid_config()},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True

    async def test_validate_keyword_not_found_returns_valid_false_200(self, async_client):
        """Header keyword absent → 200 with valid=False (not an error, a validation result)."""
        xlsx_bytes = _make_xlsx_bytes(
            headers=["SKU", "Name", "Count"],
            rows=[["SKU-001", "Thing", 1]],
        )
        config_str = json.dumps({
            "format_id": "test_vendor",
            "vendor_name": "TestVendor",
            "header_detection": {"keyword": "Part Number", "max_scan_rows": 5},
            "column_map": {"SKU": "part_number"},
            "group_detection": {"mode": "all_rows", "config": {}},
        })
        res = await async_client.post(
            "/api/bom/templates/validate",
            files={"file": ("sample.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"config": config_str},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is False

    async def test_validate_bad_json_config_returns_400(self, async_client):
        """Malformed JSON config → 400."""
        xlsx_bytes = _make_xlsx_bytes(headers=["Part Number"], rows=[["PN-001"]])
        res = await async_client.post(
            "/api/bom/templates/validate",
            files={"file": ("sample.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"config": "not json {{{"},
        )
        assert res.status_code == 400

    async def test_validate_non_xlsx_returns_400(self, async_client):
        """Non-xlsx file extension → 400."""
        config_str = self._valid_config()
        res = await async_client.post(
            "/api/bom/templates/validate",
            files={"file": ("data.txt", b"Part Number,Desc\nPN-001,Widget", "text/plain")},
            data={"config": config_str},
        )
        assert res.status_code == 400

    async def test_validate_non_admin_returns_403(self, async_client_user):
        """Regular user → 403."""
        xlsx_bytes = _make_xlsx_bytes(headers=["Part Number"], rows=[["PN-001"]])
        res = await async_client_user.post(
            "/api/bom/templates/validate",
            files={"file": ("sample.xlsx", xlsx_bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
            data={"config": self._valid_config()},
        )
        assert res.status_code == 403
