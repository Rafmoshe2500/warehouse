import pytest
from unittest.mock import MagicMock, AsyncMock
from app.main import app
from app.dependencies import get_bom_analytics_service

@pytest.fixture
def mock_analytics_service():
    mock = AsyncMock()
    app.dependency_overrides[get_bom_analytics_service] = lambda: mock
    yield mock
    app.dependency_overrides.pop(get_bom_analytics_service, None)

@pytest.mark.asyncio
class TestBomAnalyticsRoutes:

    async def test_seed_historical_data(self, async_client_superadmin, mock_analytics_service):
        mock_analytics_service.seed_historical_data.return_value = {"processed": 5}
        
        res = await async_client_superadmin.post("/api/bom-analytics/seed")
        
        assert res.status_code == 200
        assert res.json()["data"]["processed"] == 5

    async def test_search_parts(self, async_client_user, mock_analytics_service):
        mock_analytics_service.search_part_numbers.return_value = [{"part_number": "P1"}]
        
        res = await async_client_user.get("/api/bom-analytics/search-parts?q=P1&item_type=main")
        
        assert res.status_code == 200
        assert res.json()["parts"][0]["part_number"] == "P1"
        mock_analytics_service.search_part_numbers.assert_called_with(query="P1", is_main=True, limit=15)

    async def test_get_part_trends(self, async_client_user, mock_analytics_service):
        mock_analytics_service.get_part_trends.return_value = [{"recorded_at": "date"}]
        
        res = await async_client_user.get("/api/bom-analytics/trends/P1")
        
        assert res.status_code == 200
        assert res.json()["total_points"] == 1

    async def test_aggregate_trends(self, async_client_user, mock_analytics_service):
        mock_analytics_service.get_aggregated_trends.return_value = [{"total_price": 500}]
        
        body = {
            "main_part": "P1",
            "secondary_parts": ["P2", "P3"]
        }
        res = await async_client_user.post("/api/bom-analytics/aggregate-trends", json=body)
        
        assert res.status_code == 200
        assert res.json()["trends"][0]["total_price"] == 500

    async def test_vendor_spending(self, async_client_user, mock_analytics_service):
        mock_analytics_service.get_vendor_spending.return_value = [{"vendor": "DELL", "total": 1000}]
        
        res = await async_client_user.get("/api/bom-analytics/vendor-spending?resolution=monthly")
        
        assert res.status_code == 200
        assert res.json()["data"][0]["vendor"] == "DELL"
