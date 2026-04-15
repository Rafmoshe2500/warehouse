"""
Tests for AnalyticsService.
Tests dashboard statistics calculation and item project stats.
"""
import pytest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

from app.services.analytics_service import AnalyticsService
from app.db.repositories.items import ItemsRepository
from app.services.audit_service import AuditService


async def _async_empty_cursor():
    """Async generator that yields nothing — represents an empty MongoDB cursor."""
    return
    yield  # makes it an async generator


class TestAnalyticsService:
    """Test suite for AnalyticsService."""

    @pytest.fixture
    def analytics_service(self, test_db, test_items_collection, test_audit_collection):
        from unittest.mock import MagicMock
        items_repo = ItemsRepository(test_items_collection)
        audit_service = AuditService()
        audit_service.repository.collection = test_audit_collection
        mock_procurement_repo = MagicMock()
        mock_procurement_repo.collection.aggregate = MagicMock(return_value=_async_empty_cursor())
        return AnalyticsService(items_repo, audit_service, mock_procurement_repo)

    @pytest.mark.asyncio
    async def test_get_dashboard_stats_empty(self, analytics_service):
        """Test getting stats when DB is empty."""
        stats = await analytics_service.get_dashboard_stats()
        
        assert stats["total_items"] == 0
        assert stats["active_allocations"] == 0
        assert stats["projects"] == []

    @pytest.mark.asyncio
    async def test_dashboard_stats_calculation(self, analytics_service, test_items_collection):
        """Test dashboard stats with data."""
        # Insert items with allocations
        await test_items_collection.insert_one({
            "catalog_number": "A",
            "project_allocations": {"ProjectX": 5, "ProjectY": 2},
            "current_stock": "10",
            "manufacturer": "Mfr | Brand",
            "location": "Loc1"
        })
        await test_items_collection.insert_one({
            "catalog_number": "B",
            "project_allocations": {"ProjectX": 3},
            "current_stock": "5",
            "manufacturer": "Mfr2 | Brand2",
            "location": "Loc2"
        })
        
        stats = await analytics_service.get_dashboard_stats()
        
        assert stats["total_items"] == 2
        
        # Check project distribution
        proj_dist = {d["name"]: d["value"] for d in stats["projects"]}
        assert proj_dist["ProjectX"] == 8 # 5 + 3
        assert proj_dist["ProjectY"] == 2
        
        # Check manufacturer distribution
        mfr_dist = {d["name"]: d["value"] for d in stats["manufacturers"]}
        assert mfr_dist["Brand"] == 1
        assert mfr_dist["Brand2"] == 1

    @pytest.mark.asyncio
    async def test_get_activity_stats(self, analytics_service, test_audit_collection):
        """Test activity stats from audit logs."""
        now = datetime.now(timezone.utc)
        # Seed audit logs - MUST BE WRAPPED
        await test_audit_collection.insert_many([
            {"item_action": {"action": "item_create", "timestamp": now}},
            {"item_action": {"action": "item_update", "timestamp": now}},
            {"item_action": {"action": "item_create", "timestamp": now - timedelta(days=1)}},
            {"item_action": {"action": "item_delete", "timestamp": now}}
        ])
        
        # Default is last 7 days
        stats = await analytics_service.get_activity_stats(days=7)
        
        assert stats["created"] == 2
        assert stats["updated"] == 1
        assert stats["deleted"] == 1
        assert stats["days"] == 7

    # ── get_item_project_stats ────────────────────────────────────────────────

    @pytest.mark.asyncio
    async def test_get_item_project_stats_empty(self, analytics_service):
        """Should return zeroed-out stats when no items match the catalog number."""
        result = await analytics_service.get_item_project_stats("NONEXISTENT-9999")

        assert isinstance(result, dict)
        assert result["total_quantity"] == 0
        assert result["total_allocated"] == 0
        assert result["unallocated"] == 0
        assert result["projects"] == []

    @pytest.mark.asyncio
    async def test_get_item_project_stats_serial_items(self, analytics_service, test_items_collection):
        """Serial items each count as 1 unit; allocated qty comes from project_allocations."""
        # Insert 2 serial items with the same catalog number, one allocated
        await test_items_collection.insert_many([
            {
                "catalog_number": "SN-CAT-001",
                "serial": "SN-A",
                "location": "LocA",
                "project_allocations": {"ProjectAlpha": 1},
            },
            {
                "catalog_number": "SN-CAT-001",
                "serial": "SN-B",
                "location": "LocB",
                # No allocation — this one is free
            },
        ])

        result = await analytics_service.get_item_project_stats("SN-CAT-001")

        assert result["total_quantity"] == 2        # 2 serial documents = 2 units
        assert result["total_allocated"] == 1       # only ProjectAlpha:1
        assert result["unallocated"] == 1           # 2 - 1
        assert len(result["projects"]) == 1
        assert result["projects"][0] == {"name": "ProjectAlpha", "value": 1}

    @pytest.mark.asyncio
    async def test_get_item_project_stats_non_serial_multi_project(self, analytics_service, test_items_collection):
        """Non-serial item: quantity comes from current_stock string; multiple projects summed."""
        await test_items_collection.insert_one({
            "catalog_number": "NS-CAT-002",
            "serial": "",          # empty serial → non-serial item
            "current_stock": "50",  # 50 total units
            "location": "ShelfX",
            "project_allocations": {"ProjectBeta": 20, "ProjectGamma": 10},
        })

        result = await analytics_service.get_item_project_stats("NS-CAT-002")

        assert result["total_quantity"] == 50
        assert result["total_allocated"] == 30       # 20 + 10
        assert result["unallocated"] == 20           # 50 - 30
        # Projects should be sorted descending by value
        proj_names = [p["name"] for p in result["projects"]]
        assert "ProjectBeta" in proj_names
        assert "ProjectGamma" in proj_names
        assert result["projects"][0]["value"] >= result["projects"][1]["value"]
