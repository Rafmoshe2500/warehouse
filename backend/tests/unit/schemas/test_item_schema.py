"""
Tests for Item schemas.
Covers: ItemCreate, ItemUpdate, BulkUpdate, ItemFilter.
"""
import pytest
from pydantic import ValidationError
from app.schemas.item import ItemCreate, ItemUpdate, BulkUpdate, ItemFilter


class TestItemCreate:
    """ItemCreate — all fields optional, inherits ItemBase."""

    def test_empty_create_is_valid(self):
        item = ItemCreate()
        assert item.catalog_number is None
        assert item.description is None

    def test_create_with_all_fields(self):
        item = ItemCreate(
            catalog_number="CAT-001",
            description="Test item",
            manufacturer="Acme",
            location="Shelf A",
            serial="SN-12345",
            current_stock="10",
            purpose="lab",
            notes="important",
        )
        assert item.catalog_number == "CAT-001"
        assert item.serial == "SN-12345"

    def test_create_accepts_hebrew_alias_catalog_number(self):
        item = ItemCreate.model_validate({"מק\"ט": "HE-001"})
        assert item.catalog_number == "HE-001"

    def test_project_allocations_defaults_to_empty_dict(self):
        item = ItemCreate()
        assert item.project_allocations == {}

    def test_create_with_project_allocations(self):
        item = ItemCreate(project_allocations={"ProjectX": 5})
        assert item.project_allocations == {"ProjectX": 5}


class TestItemUpdate:
    """ItemUpdate — field + value pair."""

    def test_valid_update(self):
        update = ItemUpdate(field="location", value="Shelf B")
        assert update.field == "location"
        assert update.value == "Shelf B"

    def test_missing_field_raises(self):
        with pytest.raises(ValidationError):
            ItemUpdate(value="something")

    def test_missing_value_raises(self):
        with pytest.raises(ValidationError):
            ItemUpdate(field="location")

    def test_empty_string_value_allowed(self):
        update = ItemUpdate(field="notes", value="")
        assert update.value == ""


class TestBulkUpdate:
    """BulkUpdate — ids list + optional fields."""

    def test_valid_bulk_update_with_ids(self):
        bulk = BulkUpdate(ids=["id1", "id2"])
        assert len(bulk.ids) == 2

    def test_bulk_update_all_optional_fields(self):
        bulk = BulkUpdate(ids=["id1"], notes="n", purpose="p", target_site="ts")
        assert bulk.notes == "n"
        assert bulk.purpose == "p"
        assert bulk.target_site == "ts"

    def test_bulk_update_missing_ids_raises(self):
        with pytest.raises(ValidationError):
            BulkUpdate()

    def test_bulk_update_legacy_field_value(self):
        """Backward compat: field/value still accepted."""
        bulk = BulkUpdate(ids=["id1"], field="notes", value="old style")
        assert bulk.field == "notes"
        assert bulk.value == "old style"

    def test_bulk_update_all_optional_are_none_by_default(self):
        bulk = BulkUpdate(ids=["id1"])
        assert bulk.notes is None
        assert bulk.purpose is None
        assert bulk.target_site is None


class TestItemFilter:
    """ItemFilter — all optional, defaults for page/limit/sort."""

    def test_empty_filter_defaults(self):
        f = ItemFilter()
        assert f.page == 1
        assert f.limit == 30
        assert f.sort_order == "asc"
        assert f.search is None

    def test_filter_with_search(self):
        f = ItemFilter(search="test query")
        assert f.search == "test query"

    def test_filter_specific_field(self):
        f = ItemFilter(catalog_number="CAT-XYZ", location="Shelf B")
        assert f.catalog_number == "CAT-XYZ"
        assert f.location == "Shelf B"

    def test_filter_stale_days(self):
        f = ItemFilter(stale_days=30)
        assert f.stale_days == 30

    def test_filter_sort_desc(self):
        f = ItemFilter(sort_by="updated_at", sort_order="desc")
        assert f.sort_by == "updated_at"
        assert f.sort_order == "desc"

    def test_filter_page_and_limit(self):
        f = ItemFilter(page=3, limit=50)
        assert f.page == 3
        assert f.limit == 50

    def test_filter_project_allocations_string(self):
        f = ItemFilter(project_allocations="ProjectX")
        assert f.project_allocations == "ProjectX"
