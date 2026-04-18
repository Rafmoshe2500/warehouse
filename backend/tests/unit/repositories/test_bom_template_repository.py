"""
Tests for BomTemplateRepository.
Covers: get_by_format_id, get_by_vendor_name, get_active_templates,
        upsert_by_format_id, deactivate, and BaseRepository CRUD.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone

from app.db.repositories.bom_template_repository import BomTemplateRepository


def _template_doc(**kwargs) -> dict:
    defaults = {
        "format_id": "VENDOR_FORMAT_001",
        "vendor_name": "TestVendor",
        "is_active": True,
        "column_map": {"part_number": "Part #", "description": "Description", "quantity": "Qty"},
        "header_detection": {"keywords": ["Part #"]},
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults


@pytest.mark.asyncio
class TestBomTemplateRepository:
    """Unit tests for BomTemplateRepository against the test MongoDB database."""

    @pytest_asyncio.fixture
    async def repo(self, test_db):
        collection = test_db["test_bom_templates"]
        repo = BomTemplateRepository.__new__(BomTemplateRepository)
        # Manually call super().__init__ with the test collection
        from app.db.repositories.base import BaseRepository
        BaseRepository.__init__(repo, collection)
        repo.collection = collection
        yield repo
        await collection.delete_many({})

    # ------------------------------------------------------------------ #
    #  get_by_format_id                                                    #
    # ------------------------------------------------------------------ #

    async def test_get_by_format_id_found(self, repo):
        await repo.collection.insert_one(_template_doc(format_id="FMT-FIND"))
        result = await repo.get_by_format_id("FMT-FIND")
        assert result is not None
        assert result["format_id"] == "FMT-FIND"

    async def test_get_by_format_id_not_found(self, repo):
        result = await repo.get_by_format_id("FMT-NONEXISTENT")
        assert result is None

    async def test_get_by_format_id_exact_match(self, repo):
        await repo.collection.insert_one(_template_doc(format_id="EXACT_FMT"))
        result = await repo.get_by_format_id("EXACT")
        assert result is None

    # ------------------------------------------------------------------ #
    #  get_by_vendor_name                                                  #
    # ------------------------------------------------------------------ #

    async def test_get_by_vendor_name_found(self, repo):
        await repo.collection.insert_one(_template_doc(vendor_name="DellVendor"))
        result = await repo.get_by_vendor_name("DellVendor")
        assert result is not None
        assert result["vendor_name"] == "DellVendor"

    async def test_get_by_vendor_name_case_insensitive(self, repo):
        await repo.collection.insert_one(_template_doc(vendor_name="HPEVendor"))
        result = await repo.get_by_vendor_name("hpevendor")
        assert result is not None

    async def test_get_by_vendor_name_not_found(self, repo):
        result = await repo.get_by_vendor_name("NonExistentVendor")
        assert result is None

    # ------------------------------------------------------------------ #
    #  get_active_templates                                                #
    # ------------------------------------------------------------------ #

    async def test_get_active_templates_returns_only_active(self, repo):
        await repo.collection.insert_one(_template_doc(vendor_name="Active1", is_active=True))
        await repo.collection.insert_one(_template_doc(vendor_name="Active2", is_active=True))
        await repo.collection.insert_one(_template_doc(vendor_name="Inactive", is_active=False))
        results = await repo.get_active_templates()
        assert len(results) == 2
        names = [r["vendor_name"] for r in results]
        assert "Inactive" not in names

    async def test_get_active_templates_sorted_by_vendor_name(self, repo):
        await repo.collection.insert_one(_template_doc(vendor_name="Zebra", is_active=True))
        await repo.collection.insert_one(_template_doc(vendor_name="Apple", is_active=True))
        await repo.collection.insert_one(_template_doc(vendor_name="Mango", is_active=True))
        results = await repo.get_active_templates()
        names = [r["vendor_name"] for r in results]
        assert names == sorted(names)

    async def test_get_active_templates_empty(self, repo):
        results = await repo.get_active_templates()
        assert results == []

    # ------------------------------------------------------------------ #
    #  upsert_by_format_id                                                 #
    # ------------------------------------------------------------------ #

    async def test_upsert_by_format_id_creates_new(self, repo):
        data = {"vendor_name": "NewVendor", "is_active": True, "column_map": {"part_number": "PN"}}
        result = await repo.upsert_by_format_id("NEW_FORMAT", data)
        assert result is not None
        assert result["vendor_name"] == "NewVendor"
        assert "id" in result

    async def test_upsert_by_format_id_updates_existing(self, repo):
        await repo.collection.insert_one(_template_doc(format_id="UPS_FMT", vendor_name="OldVendor"))
        data = {"vendor_name": "UpdatedVendor", "column_map": {"part_number": "Updated PN"}}
        result = await repo.upsert_by_format_id("UPS_FMT", data)
        assert result["vendor_name"] == "UpdatedVendor"

    async def test_upsert_by_format_id_only_one_document_created(self, repo):
        data = {"vendor_name": "OnlyOne", "is_active": True}
        await repo.upsert_by_format_id("ONCE_FMT", data)
        await repo.upsert_by_format_id("ONCE_FMT", {"vendor_name": "OnlyOne Updated"})
        count = await repo.collection.count_documents({"format_id": "ONCE_FMT"})
        assert count == 1

    async def test_upsert_by_format_id_sets_updated_at(self, repo):
        data = {"vendor_name": "TSVendor", "is_active": True}
        result = await repo.upsert_by_format_id("TS_FMT", data)
        assert "updated_at" in result

    # ------------------------------------------------------------------ #
    #  deactivate                                                          #
    # ------------------------------------------------------------------ #

    async def test_deactivate_sets_is_active_false(self, repo):
        # Insert via BaseRepository create to get proper ID
        doc = _template_doc(vendor_name="ToDeactivate", is_active=True)
        from bson import ObjectId
        result = await repo.collection.insert_one(doc)
        item_id = str(result.inserted_id)

        deactivated = await repo.deactivate(item_id)
        assert deactivated is not None
        assert deactivated["is_active"] is False

    async def test_deactivate_nonexistent_returns_none(self, repo):
        from bson import ObjectId
        result = await repo.deactivate(str(ObjectId()))
        assert result is None
