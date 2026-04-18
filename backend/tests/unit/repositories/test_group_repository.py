"""
Tests for GroupRepository.
Covers: list_groups, get_by_id, get_by_name, create, update, delete, search.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone

from app.db.repositories.group_repository import GroupRepository


def _group_doc(**kwargs) -> dict:
    defaults = {
        "name": "Test Group",
        "role": "user",
        "permissions": [],
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults


@pytest.mark.asyncio
class TestGroupRepository:
    """Unit tests for GroupRepository against the test MongoDB database."""

    @pytest_asyncio.fixture
    async def repo(self, test_groups_collection):
        return GroupRepository()

    # ------------------------------------------------------------------ #
    #  create                                                              #
    # ------------------------------------------------------------------ #

    async def test_create_returns_doc_with_id(self, repo, test_groups_collection):
        doc = _group_doc(name="Creators")
        result = await repo.create(doc)
        assert "id" in result
        assert result["name"] == "Creators"

    async def test_create_persists_in_db(self, repo, test_groups_collection):
        doc = _group_doc(name="Persistent Group")
        created = await repo.create(doc)
        raw = await test_groups_collection.find_one({"name": "Persistent Group"})
        assert raw is not None
        assert str(raw["_id"]) == created["id"]

    # ------------------------------------------------------------------ #
    #  get_by_id                                                           #
    # ------------------------------------------------------------------ #

    async def test_get_by_id_found(self, repo, test_groups_collection):
        created = await repo.create(_group_doc(name="Find By ID"))
        found = await repo.get_by_id(created["id"])
        assert found is not None
        assert found["name"] == "Find By ID"

    async def test_get_by_id_not_found(self, repo):
        from bson import ObjectId
        result = await repo.get_by_id(str(ObjectId()))
        assert result is None

    async def test_get_by_id_invalid_id_returns_none(self, repo):
        result = await repo.get_by_id("not_a_valid_object_id")
        assert result is None

    async def test_get_by_id_strips_object_id(self, repo, test_groups_collection):
        created = await repo.create(_group_doc(name="Strip ID Test"))
        found = await repo.get_by_id(created["id"])
        assert "id" in found
        assert "_id" not in found

    # ------------------------------------------------------------------ #
    #  get_by_name                                                         #
    # ------------------------------------------------------------------ #

    async def test_get_by_name_found(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="Named Group"))
        result = await repo.get_by_name("Named Group")
        assert result is not None
        assert result["name"] == "Named Group"

    async def test_get_by_name_not_found(self, repo):
        result = await repo.get_by_name("nonexistent_group_xyz")
        assert result is None

    async def test_get_by_name_exact_match(self, repo, test_groups_collection):
        """get_by_name should not return partial matches."""
        await repo.create(_group_doc(name="Exact Group"))
        result = await repo.get_by_name("Exact")
        assert result is None

    # ------------------------------------------------------------------ #
    #  list_groups                                                         #
    # ------------------------------------------------------------------ #

    async def test_list_groups_empty(self, repo, test_groups_collection):
        result = await repo.list_groups()
        assert result == []

    async def test_list_groups_returns_all(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="G1"))
        await repo.create(_group_doc(name="G2"))
        await repo.create(_group_doc(name="G3"))
        result = await repo.list_groups()
        assert len(result) == 3

    async def test_list_groups_each_has_id(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="HasId Group"))
        result = await repo.list_groups()
        for g in result:
            assert "id" in g
            assert "_id" not in g

    # ------------------------------------------------------------------ #
    #  update                                                              #
    # ------------------------------------------------------------------ #

    async def test_update_returns_true(self, repo, test_groups_collection):
        created = await repo.create(_group_doc(name="UpdateGroup"))
        result = await repo.update(created["id"], {"name": "Updated Name"})
        assert result is True

    async def test_update_persists_changes(self, repo, test_groups_collection):
        created = await repo.create(_group_doc(name="BeforeUpdate"))
        await repo.update(created["id"], {"name": "AfterUpdate", "role": "admin"})
        found = await repo.get_by_id(created["id"])
        assert found["name"] == "AfterUpdate"
        assert found["role"] == "admin"

    async def test_update_nonexistent_returns_false(self, repo):
        from bson import ObjectId
        result = await repo.update(str(ObjectId()), {"name": "ghost"})
        assert result is False

    # ------------------------------------------------------------------ #
    #  delete                                                              #
    # ------------------------------------------------------------------ #

    async def test_delete_returns_true(self, repo, test_groups_collection):
        created = await repo.create(_group_doc(name="ToDelete"))
        result = await repo.delete(created["id"])
        assert result is True

    async def test_delete_removes_from_db(self, repo, test_groups_collection):
        created = await repo.create(_group_doc(name="GoneGroup"))
        await repo.delete(created["id"])
        found = await repo.get_by_id(created["id"])
        assert found is None

    async def test_delete_nonexistent_returns_false(self, repo):
        from bson import ObjectId
        result = await repo.delete(str(ObjectId()))
        assert result is False

    # ------------------------------------------------------------------ #
    #  search                                                              #
    # ------------------------------------------------------------------ #

    async def test_search_by_name(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="NetworkAdmins"))
        await repo.create(_group_doc(name="Developers"))
        results = await repo.search("Network")
        assert len(results) == 1
        assert results[0]["name"] == "NetworkAdmins"

    async def test_search_case_insensitive(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="CaseGroup"))
        results = await repo.search("casegroup")
        assert len(results) == 1

    async def test_search_no_results(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="SomeGroup"))
        results = await repo.search("zzznomatch_xyz")
        assert results == []

    async def test_search_respects_limit(self, repo, test_groups_collection):
        for i in range(8):
            await repo.create(_group_doc(name=f"LimitGroup{i}"))
        results = await repo.search("LimitGroup", limit=3)
        assert len(results) <= 3

    async def test_search_result_has_required_fields(self, repo, test_groups_collection):
        await repo.create(_group_doc(name="FieldCheckGroup"))
        results = await repo.search("FieldCheck")
        assert len(results) == 1
        assert "id" in results[0]
        assert "name" in results[0]
