import pytest
from unittest.mock import MagicMock, AsyncMock
from app.services.bom_service import FORMAT_NETAPP
from app.main import app
from app.routes.api.bom import get_bom_service, get_bom_catalog_service
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
