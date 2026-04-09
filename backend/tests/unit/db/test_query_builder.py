"""
Tests for MongoQueryBuilder.
Tests query construction for search, filters, and stale_days.
"""
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

from app.db.utils.query_builder import MongoQueryBuilder
from app.schemas.item import ItemFilter


class TestMongoQueryBuilder:
    """Test suite for MongoQueryBuilder.build_search_query()."""

    def test_empty_filter_returns_empty_query(self):
        """No filters → empty query."""
        params = ItemFilter()
        query = MongoQueryBuilder.build_search_query(params)
        assert query == {}

    def test_global_search_creates_or_query(self):
        """Global search creates $or across multiple fields."""
        params = ItemFilter(search="test")
        query = MongoQueryBuilder.build_search_query(params)

        assert "$or" in query
        assert len(query["$or"]) > 0
        for condition in query["$or"]:
            field = list(condition.keys())[0]
            assert condition[field]["$regex"] == "test"
            assert condition[field]["$options"] == "i"

    def test_specific_field_filter(self):
        """Single field filter creates direct regex match."""
        params = ItemFilter(catalog_number="ABC")
        query = MongoQueryBuilder.build_search_query(params)

        assert "catalog_number" in query
        assert query["catalog_number"]["$regex"] == "ABC"
        assert query["catalog_number"]["$options"] == "i"

    def test_multiple_field_filters(self):
        """Multiple field filters are ANDed together."""
        params = ItemFilter(catalog_number="ABC", location="shelf1")
        query = MongoQueryBuilder.build_search_query(params)

        assert "catalog_number" in query
        assert "location" in query

    def test_stale_days_adds_updated_at_filter(self):
        """stale_days adds updated_at $lt condition."""
        params = ItemFilter(stale_days=30)

        fixed_now = datetime(2026, 4, 9, 12, 0, 0, tzinfo=timezone.utc)
        with patch("app.db.utils.query_builder.datetime") as mock_dt:
            mock_dt.now.return_value = fixed_now
            mock_dt.side_effect = lambda *a, **kw: datetime(*a, **kw)
            query = MongoQueryBuilder.build_search_query(params)

        assert "updated_at" in query
        assert "$lt" in query["updated_at"]
        expected_cutoff = fixed_now - timedelta(days=30)
        assert query["updated_at"]["$lt"] == expected_cutoff

    def test_stale_days_with_search(self):
        """stale_days + global search combine both conditions."""
        params = ItemFilter(stale_days=30, search="test")
        query = MongoQueryBuilder.build_search_query(params)

        assert "updated_at" in query
        assert "$or" in query

    def test_stale_days_with_field_filters(self):
        """stale_days + field filters combine all conditions."""
        params = ItemFilter(stale_days=60, location="A1", purpose="Testing")
        query = MongoQueryBuilder.build_search_query(params)

        assert "updated_at" in query
        assert "location" in query
        assert "purpose" in query

    def test_stale_days_none_does_not_add_filter(self):
        """stale_days=None does not add updated_at filter."""
        params = ItemFilter(stale_days=None)
        query = MongoQueryBuilder.build_search_query(params)
        assert "updated_at" not in query

    def test_project_allocations_filter(self):
        """project_allocations maps to reserved_stock field."""
        params = ItemFilter(project_allocations="proj1")
        query = MongoQueryBuilder.build_search_query(params)

        assert "reserved_stock" in query
        assert query["reserved_stock"]["$regex"] == "proj1"
