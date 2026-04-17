import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services.bom_service import FORMAT_NETAPP
from app.main import app
from app.routes.api.bom import get_bom_service, get_bom_catalog_service, get_procurement_repository
from app.dependencies import get_s3_service

@pytest.fixture
def mock_bom_service():
    mock = AsyncMock()
    app.dependency_overrides[get_bom_service] = lambda: mock
    yield mock
    app.dependency_overrides.pop(get_bom_service, None)

@pytest.fixture
def mock_catalog_service():
    mock = AsyncMock()
    app.dependency_overrides[get_bom_catalog_service] = lambda: mock
    yield mock
    app.dependency_overrides.pop(get_bom_catalog_service, None)

@pytest.fixture
def mock_s3_service():
    mock = AsyncMock()
    app.dependency_overrides[get_s3_service] = lambda: mock
    yield mock
    app.dependency_overrides.pop(get_s3_service, None)

@pytest.mark.asyncio
class TestBomRoutes:

    async def test_scan_bom_missing_permissions(self, async_client_user):
        """Test failing to scan because of lack of vendor write permissions."""
        file_content = b"fake-excel-data"
        files = {"file": ("test.xlsx", file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        
        res = await async_client_user.post("/api/bom/scan?format=netapp_pricing_template", files=files)
        
        assert res.status_code == 403
        assert "אין לך הרשאת" in res.json()["detail"]

    async def test_scan_bom_success(self, async_client_superadmin, mock_bom_service, mock_s3_service):
        """Test successful scan upload."""
        mock_bom_service.scan_bom.return_value = {
            "groups": [],
            "unknown_parts": [],
            "total_groups": 0
        }
        
        mock_s3_service.upload_file.return_value = {"s3_key": "some-s3-key", "local_path": None}
        
        file_content = b"fake-excel-data"
        files = {"file": ("test.xlsx", file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        
        res = await async_client_superadmin.post("/api/bom/scan?format=netapp_pricing_template", files=files)
        
        assert res.status_code == 200
        data = res.json()
        assert data["bom_file_s3_key"] == "some-s3-key"
        mock_bom_service.scan_bom.assert_called_once()
        mock_s3_service.upload_file.assert_called_once()

    async def test_save_part(self, async_client_superadmin, mock_catalog_service):
        """Test saving part."""
        mock_catalog_service.save_part.return_value = {"part_number": "P1", "description_he": "He"}
        
        res = await async_client_superadmin.post(
            "/api/bom/parts/P1",
            json={"description_he": "He", "category": "server", "important": True}
        )
        
        assert res.status_code == 200
        assert res.json()["part"]["part_number"] == "P1"

    async def test_get_all_parts(self, async_client_user, mock_catalog_service):
        """Test fetching parts."""
        mock_catalog_service.get_all_parts.return_value = [{"part_number": "P1"}, {"part_number": "P2"}]
        
        res = await async_client_user.get("/api/bom/parts")
        
        assert res.status_code == 200
        assert res.json()["total"] == 2

    async def test_edit_bom_items_success(self, async_client_superadmin, mock_catalog_service):
        """Test successful batch edit of BOM items by superadmin."""
        mock_catalog_service.apply_item_edits.return_value = [
            {"part_number": "P1", "description_he": "תיאור חדש", "category": "server", "updated": True}
        ]

        res = await async_client_superadmin.patch(
            "/api/bom/scan/items",
            json={
                "vendor": "NETAPP",
                "items": [
                    {"part_number": "P1", "description_he": "תיאור חדש", "category": "server"}
                ],
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert len(data["updated"]) == 1
        mock_catalog_service.apply_item_edits.assert_called_once()

    async def test_edit_bom_items_forbidden_for_user(self, async_client_user):
        """Regular user without vendor write permission should be denied."""
        res = await async_client_user.patch(
            "/api/bom/scan/items",
            json={
                "vendor": "NETAPP",
                "items": [
                    {"part_number": "P1", "description_he": "hack"}
                ],
            },
        )

        assert res.status_code == 403

    async def test_edit_bom_items_invalid_body(self, async_client_superadmin):
        """Empty items list should fail validation."""
        res = await async_client_superadmin.patch(
            "/api/bom/scan/items",
            json={"vendor": "NETAPP", "items": []},
        )

        assert res.status_code == 422

    async def test_edit_bom_items_with_part_alias(self, async_client_superadmin, mock_catalog_service):
        """Batch edit should forward part_alias to the service layer."""
        mock_catalog_service.apply_item_edits.return_value = [
            {"part_number": "PA-1", "description_he": "שרת", "category": "server", "part_alias": "SRV-01"}
        ]

        res = await async_client_superadmin.patch(
            "/api/bom/scan/items",
            json={
                "vendor": "NETAPP",
                "items": [
                    {"part_number": "PA-1", "description_he": "שרת", "category": "server", "part_alias": "SRV-01"}
                ],
            },
        )

        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        # Verify the service received the part_alias in the payload
        call_args = mock_catalog_service.apply_item_edits.call_args[0][0]
        assert call_args[0]["part_alias"] == "SRV-01"

    async def test_edit_bom_items_persists_to_order_document(
        self, async_client_superadmin, mock_catalog_service, test_procurement_collection
    ):
        """
        When order_id is provided in the request body the route must also update
        bom_data.groups inside the procurement_orders document so that a fresh
        DB fetch (e.g. after page reload / modal reopen) returns the edited data.

        This test simulates the full close/reopen scenario:
          1. Insert an order with original bom_data.
          2. Edit items via PATCH /bom/scan/items (with order_id).
          3. Re-fetch the order directly from the DB.
          4. Assert the bom_data.groups reflects the saved edits.
        """
        from bson import ObjectId
        from datetime import datetime, timezone

        mock_catalog_service.apply_item_edits.return_value = [
            {"part_number": "SRV-X100", "description_he": "שרת חדש", "category": "server", "updated": True}
        ]

        # Insert a real order in the test collection with original (pre-edit) data
        order_oid = ObjectId()
        order_id = str(order_oid)
        await test_procurement_collection.insert_one({
            "_id": order_oid,
            "order_date": datetime.now(timezone.utc),
            "status": "waiting_bom_emf",
            "bom_vendor": "NETAPP",
            "bom_data": {
                "groups": [
                    {
                        "main": {
                            "part_number": "SRV-X100",
                            "product": "Server X100",
                            "ext_qty": 1,
                            "catalog": {"description_he": "שרת ישן", "category": "other"},
                        },
                        "children": [],
                        "total_net_price": 5000,
                    }
                ]
            },
            "bom_items": [],
            "total_amount": 0.0,
            "files": [],
            "created_by": "test_user",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        # Edit — with order_id so the DB document also gets patched
        res = await async_client_superadmin.patch(
            "/api/bom/scan/items",
            json={
                "vendor": "NETAPP",
                "order_id": order_id,
                "items": [
                    {"part_number": "SRV-X100", "description_he": "שרת חדש", "category": "server"}
                ],
            },
        )
        assert res.status_code == 200
        assert res.json()["ok"] is True

        # Simulate "modal reopen": fetch order fresh from DB (no React Query cache)
        updated_doc = await test_procurement_collection.find_one({"_id": order_oid})
        assert updated_doc is not None, "Order document must still exist after edit"
        main_catalog = updated_doc["bom_data"]["groups"][0]["main"]["catalog"]
        assert main_catalog["description_he"] == "שרת חדש", (
            "description_he was not persisted to bom_data.groups — modal reopen will show stale data"
        )
        assert main_catalog["category"] == "server", (
            "category was not persisted to bom_data.groups — modal reopen will show stale data"
        )
