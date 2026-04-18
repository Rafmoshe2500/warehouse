"""
Tests for Catalog schemas.
Covers: CatalogItemBase, CatalogItemCreate, CatalogFilter.
"""
import pytest
from pydantic import ValidationError
from app.schemas.catalog import CatalogItemBase, CatalogItemCreate, CatalogFilter


class TestCatalogItemBase:
    """CatalogItemBase — catalog_number required via alias."""

    def test_valid_with_catalog_number(self):
        item = CatalogItemBase(**{"מק\"ט": "CAT-001"})
        assert item.catalog_number == "CAT-001"

    def test_valid_with_english_field(self):
        item = CatalogItemBase(catalog_number="CAT-002")
        assert item.catalog_number == "CAT-002"

    def test_optional_description_defaults_none(self):
        item = CatalogItemBase(catalog_number="CAT-003")
        assert item.description is None

    def test_optional_manufacturer_defaults_none(self):
        item = CatalogItemBase(catalog_number="CAT-004")
        assert item.manufacturer is None

    def test_with_all_fields(self):
        item = CatalogItemBase(
            catalog_number="CAT-005",
            description="Test Description",
            manufacturer="Test Manufacturer"
        )
        assert item.description == "Test Description"
        assert item.manufacturer == "Test Manufacturer"


class TestCatalogItemCreate:
    """CatalogItemCreate inherits CatalogItemBase — same validation."""

    def test_valid_create(self):
        item = CatalogItemCreate(catalog_number="CREATE-001", description="New item")
        assert item.catalog_number == "CREATE-001"

    def test_missing_catalog_number_raises(self):
        with pytest.raises(ValidationError):
            CatalogItemCreate()

    def test_description_optional(self):
        item = CatalogItemCreate(catalog_number="CREATE-002")
        assert item.description is None

    def test_manufacturer_optional(self):
        item = CatalogItemCreate(catalog_number="CREATE-003")
        assert item.manufacturer is None


class TestCatalogFilter:
    """CatalogFilter — all optional, defaults for page/limit/sort."""

    def test_empty_filter_defaults(self):
        f = CatalogFilter()
        assert f.page == 1
        assert f.limit == 30
        assert f.sort_order == "asc"
        assert f.search is None
        assert f.catalog_number is None
        assert f.description is None
        assert f.manufacturer is None

    def test_filter_with_search(self):
        f = CatalogFilter(search="widget")
        assert f.search == "widget"

    def test_filter_catalog_number(self):
        f = CatalogFilter(catalog_number="CAT-")
        assert f.catalog_number == "CAT-"

    def test_filter_description(self):
        f = CatalogFilter(description="switch")
        assert f.description == "switch"

    def test_filter_manufacturer(self):
        f = CatalogFilter(manufacturer="Cisco")
        assert f.manufacturer == "Cisco"

    def test_filter_pagination(self):
        f = CatalogFilter(page=2, limit=50)
        assert f.page == 2
        assert f.limit == 50

    def test_filter_sort(self):
        f = CatalogFilter(sort_by="catalog_number", sort_order="desc")
        assert f.sort_by == "catalog_number"
        assert f.sort_order == "desc"

    def test_filter_combined_fields(self):
        f = CatalogFilter(manufacturer="Dell", catalog_number="PE-", page=1, limit=10)
        assert f.manufacturer == "Dell"
        assert f.catalog_number == "PE-"
        assert f.limit == 10
