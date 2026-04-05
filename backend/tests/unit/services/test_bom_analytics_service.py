"""
Tests for BomAnalyticsService.
Covers price history management, aggregation, and querying.
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from app.services.bom_analytics_service import BomAnalyticsService
from app.db.mongodb import MongoDB

@pytest.fixture
def analytics_service(mock_mongodb):
    """Provides a fresh instance of BomAnalyticsService connected to test collections."""
    service = BomAnalyticsService()
    # Mock orders collection for seed step if needed, or rely on test_db
    return service

@pytest.mark.asyncio
class TestBomAnalyticsService:
    
    async def test_record_bom_prices_and_search(self, analytics_service):
        """Test recording prices from a BOM structure and searching for them."""
        await analytics_service.create_indexes()
        order_id = "test_order_1"
        recorded_at = datetime.now(timezone.utc)
        vendor = "DELL"
        
        bom_groups = [
            {
                "main": {"part_number": "SYS1", "product_name": "Storage System", "ext_net_price": 1000, "ext_qty": 1},
                "total_net_price": 1000,
                "children": [
                    {"part_number": "DRIVE1", "product_name": "1TB SSD", "ext_net_price": 200, "ext_qty": 2}
                ]
            }
        ]
        
        await analytics_service.record_bom_prices(order_id, recorded_at, vendor, bom_groups)
        
        # Verify inserted documents by searching
        results = await analytics_service.search_part_numbers("Storage")
        assert len(results) == 1
        assert results[0]["part_number"] == "SYS1"

        # Verify child is saved
        results_child = await analytics_service.search_part_numbers("1TB")
        assert len(results_child) == 1
        assert results_child[0]["part_number"] == "DRIVE1"
        
        # Test trends (price calculations)
        trends = await analytics_service.get_part_trends("DRIVE1", is_main=False)
        assert len(trends) == 1
        assert trends[0]["unit_net_price"] == 100.0  # 200 total / 2 qty


    async def test_delete_order_history(self, analytics_service):
        """Test deleting price history for an order."""
        order_id = "test_order_delete"
        # Seed
        await analytics_service.record_manual_prices(
            order_id=order_id,
            recorded_at=datetime.now(timezone.utc),
            vendor="HPE",
            bom_items=[{"catalog_number": "HPE-1", "description": "HPE SERVER", "quantity": 1}]
        )
        # Verify existence
        assert len(await analytics_service.search_part_numbers("HPE-1")) == 1
        
        # Delete
        await analytics_service.delete_order_history(order_id)
        
        # Verify empty
        assert len(await analytics_service.search_part_numbers("HPE-1")) == 0

    async def test_record_manual_prices(self, analytics_service):
        """Test fallback placeholders for manual prices."""
        order_id = "test_manual_1"
        bom_items = [
            {"catalog_number": "HW-01", "description": "Generic Router", "quantity": 5, "part_alias": "Router X"},
            {"description": "No catalog part", "quantity": 1} # Fallback to slug
        ]
        
        await analytics_service.record_manual_prices(
            order_id=order_id,
            recorded_at=datetime.now(timezone.utc),
            vendor="NETAPP",
            bom_items=bom_items
        )
        
        # Search by alias
        res1 = await analytics_service.search_part_numbers("Router X")
        assert len(res1) == 1
        assert res1[0]["part_number"] == "HW-01"
        
        # Search by slug fallback
        res2 = await analytics_service.search_part_numbers("No catalog part")
        assert len(res2) == 1
        assert res2[0]["part_number"] == "NO-CATALOG-PART"

    async def test_get_aggregated_trends(self, analytics_service):
        """Test cross-order aggregated price calculations."""
        order1 = "order1"
        order2 = "order2"
        now = datetime.now(timezone.utc)
        
        # Order 1: MAIN + 2 SEC
        await analytics_service.record_bom_prices(order1, now, "NETAPP", [
            {
                "main": {"part_number": "MAIN1", "ext_net_price": 500, "ext_qty": 1},
                "total_net_price": 500,
                "children": [
                    {"part_number": "SEC1", "ext_net_price": 100, "ext_qty": 1},
                    {"part_number": "SEC2", "ext_net_price": 50, "ext_qty": 1}
                ]
            }
        ])
        
        # Order 2: MAIN + ONLY 1 SEC
        await analytics_service.record_bom_prices(order2, now + timedelta(days=1), "NETAPP", [
            {
                "main": {"part_number": "MAIN1", "ext_net_price": 500, "ext_qty": 1},
                "total_net_price": 500,
                "children": [
                    {"part_number": "SEC1", "ext_net_price": 120, "ext_qty": 1}
                ]
            }
        ])
        
        # Aggregate MAIN1 + (SEC1 or SEC2)
        trends = await analytics_service.get_aggregated_trends("MAIN1", ["SEC1", "SEC2"])
        
        assert len(trends) == 2
        # Order 1 total = 500 + 100 + 50 = 650
        assert trends[0]["total_price"] == 650.0
        # Order 2 total = 500 + 120 = 620
        assert trends[1]["total_price"] == 620.0

    async def test_get_vendor_spending_monthly(self, analytics_service):
        """Test get_vendor_spending."""
        order_id = "test_spending"
        date = datetime(2025, 5, 15, tzinfo=timezone.utc)
        
        await analytics_service.record_bom_prices(order_id, date, "DELL", [
            {
                "main": {"part_number": "SER1", "ext_net_price": 500, "ext_qty": 1},
                "total_net_price": 500,
            }
        ])
        
        spending = await analytics_service.get_vendor_spending(resolution="monthly")
        
        assert len(spending) >= 1
        found = False
        for s in spending:
            if s["bucket"] == "2025-05" and s["vendor"] == "DELL":
                assert s["total"] == 500
                found = True
        assert found
