"""
Tests for AnalyticsService.
Tests dashboard statistics calculation.
"""
import pytest
from datetime import datetime, timedelta
from unittest.mock import MagicMock

from app.services.analytics_service import AnalyticsService
from app.db.repositories.items import ItemsRepository
from app.services.audit_service import AuditService


class TestAnalyticsService:
    """Test suite for AnalyticsService."""

    @pytest.fixture
    def analytics_service(self, test_db, test_items_collection, test_audit_collection):
        items_repo = ItemsRepository(test_items_collection)
        audit_service = AuditService()
        audit_service.repository.collection = test_audit_collection
        return AnalyticsService(items_repo, audit_service)

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
        now = datetime.utcnow()
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
