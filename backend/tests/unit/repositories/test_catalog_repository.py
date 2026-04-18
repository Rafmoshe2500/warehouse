"""
Tests for CatalogRepository.
Covers: upsert (insert new / update existing) and search (pagination, filters).
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone

from app.db.repositories.catalog_repository import CatalogRepository
from app.schemas.catalog import CatalogFilter


@pytest.mark.asyncio
class TestCatalogRepository:
    """Unit tests for CatalogRepository against the test MongoDB database."""

    @pytest_asyncio.fixture
    async def repo(self, test_db):
        collection = test_db["test_catalog"]
        yield CatalogRepository(collection)
        await collection.delete_many({})

    # ------------------------------------------------------------------ #
    #  upsert                                                              #
    # ------------------------------------------------------------------ #

    async def test_upsert_creates_new_item(self, repo, test_db):
        await repo.upsert(catalog_number="CAT-001", description="Widget", manufacturer="Acme")
        raw = await test_db["test_catalog"].find_one({"catalog_number": "CAT-001"})
        assert raw is not None
        assert raw["description"] == "Widget"
        assert raw["manufacturer"] == "Acme"

    async def test_upsert_sets_timestamps_on_insert(self, repo, test_db):
        await repo.upsert(catalog_number="CAT-TS")
        raw = await test_db["test_catalog"].find_one({"catalog_number": "CAT-TS"})
        assert "created_at" in raw
        assert "updated_at" in raw

    async def test_upsert_updates_existing_item(self, repo, test_db):
        await repo.upsert(catalog_number="CAT-UP", description="Old", manufacturer="OldMfr")
        await repo.upsert(catalog_number="CAT-UP", description="New", manufacturer="NewMfr")
        count = await test_db["test_catalog"].count_documents({"catalog_number": "CAT-UP"})
        assert count == 1
        raw = await test_db["test_catalog"].find_one({"catalog_number": "CAT-UP"})
        assert raw["description"] == "New"
        assert raw["manufacturer"] == "NewMfr"

    async def test_upsert_updates_updated_at_on_second_call(self, repo, test_db):
        await repo.upsert(catalog_number="CAT-DT")
        raw1 = await test_db["test_catalog"].find_one({"catalog_number": "CAT-DT"})
        ts1 = raw1["updated_at"]

        import asyncio
        await asyncio.sleep(0.01)
        await repo.upsert(catalog_number="CAT-DT", description="Changed")
        raw2 = await test_db["test_catalog"].find_one({"catalog_number": "CAT-DT"})
        assert raw2["updated_at"] >= ts1

    async def test_upsert_does_not_overwrite_created_at(self, repo, test_db):
        await repo.upsert(catalog_number="CAT-CA")
        raw1 = await test_db["test_catalog"].find_one({"catalog_number": "CAT-CA"})
        orig_created = raw1["created_at"]

        await repo.upsert(catalog_number="CAT-CA", description="Updated again")
        raw2 = await test_db["test_catalog"].find_one({"catalog_number": "CAT-CA"})
        assert raw2["created_at"] == orig_created

    async def test_upsert_empty_catalog_number_is_noop(self, repo, test_db):
        await repo.upsert(catalog_number="")
        count = await test_db["test_catalog"].count_documents({})
        assert count == 0

    async def test_upsert_none_catalog_number_is_noop(self, repo, test_db):
        await repo.upsert(catalog_number=None)
        count = await test_db["test_catalog"].count_documents({})
        assert count == 0

    async def test_upsert_partial_fields(self, repo, test_db):
        """Only description provided — manufacturer should not be overwritten."""
        await repo.upsert(catalog_number="CAT-PART", description="First", manufacturer="MfrA")
        await repo.upsert(catalog_number="CAT-PART", description="Second")
        raw = await test_db["test_catalog"].find_one({"catalog_number": "CAT-PART"})
        assert raw["description"] == "Second"
        assert raw["manufacturer"] == "MfrA"

    # ------------------------------------------------------------------ #
    #  search                                                              #
    # ------------------------------------------------------------------ #

    async def test_search_no_filters_returns_all(self, repo, test_db):
        await repo.upsert(catalog_number="S1", description="Alpha", manufacturer="MfrA")
        await repo.upsert(catalog_number="S2", description="Beta", manufacturer="MfrB")
        items, total = await repo.search(CatalogFilter())
        assert total == 2
        assert len(items) == 2

    async def test_search_by_catalog_number(self, repo, test_db):
        await repo.upsert(catalog_number="FIND-ME", description="FindTest")
        await repo.upsert(catalog_number="OTHER", description="Other")
        items, total = await repo.search(CatalogFilter(catalog_number="FIND"))
        assert total == 1
        assert items[0]["catalog_number"] == "FIND-ME"

    async def test_search_by_description(self, repo, test_db):
        await repo.upsert(catalog_number="DESC-1", description="Unique Desc")
        await repo.upsert(catalog_number="DESC-2", description="Common")
        items, total = await repo.search(CatalogFilter(description="Unique"))
        assert total == 1

    async def test_search_by_manufacturer(self, repo, test_db):
        await repo.upsert(catalog_number="MFR-1", manufacturer="SpecialMfr")
        await repo.upsert(catalog_number="MFR-2", manufacturer="OtherMfr")
        items, total = await repo.search(CatalogFilter(manufacturer="SpecialMfr"))
        assert total == 1

    async def test_search_global_search_field(self, repo, test_db):
        await repo.upsert(catalog_number="GLOB-1", description="GlobalSearch hit")
        await repo.upsert(catalog_number="GLOB-2", description="no match here")
        items, total = await repo.search(CatalogFilter(search="GlobalSearch"))
        assert total == 1

    async def test_search_pagination(self, repo, test_db):
        for i in range(10):
            await repo.upsert(catalog_number=f"PAGE-{i:02d}", description=f"Item {i}")
        f = CatalogFilter(page=1, limit=4)
        items, total = await repo.search(f)
        assert total == 10
        assert len(items) == 4

    async def test_search_second_page(self, repo, test_db):
        for i in range(6):
            await repo.upsert(catalog_number=f"PAGEB-{i:02d}")
        p1, _ = await repo.search(CatalogFilter(page=1, limit=3))
        p2, _ = await repo.search(CatalogFilter(page=2, limit=3))
        cats1 = {item["catalog_number"] for item in p1}
        cats2 = {item["catalog_number"] for item in p2}
        assert cats1.isdisjoint(cats2)

    async def test_search_empty_result(self, repo, test_db):
        await repo.upsert(catalog_number="EXISTS")
        items, total = await repo.search(CatalogFilter(catalog_number="ZZZNOMATCH"))
        assert total == 0
        assert items == []

    async def test_search_case_insensitive(self, repo, test_db):
        await repo.upsert(catalog_number="CASE-ABC", description="lowercase test")
        items, total = await repo.search(CatalogFilter(description="LOWERCASE"))
        assert total == 1
