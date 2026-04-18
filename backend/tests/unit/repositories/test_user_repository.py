"""
Tests for UserRepository.
Covers: list_users, get_by_id, get_by_username, create, update,
        update_by_username, delete, search, count.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone

from app.db.repositories.user_repository import UserRepository


def _user_doc(**kwargs) -> dict:
    defaults = {
        "username": "testuser",
        "email": "testuser@example.com",
        "role": "user",
        "permissions": [],
        "is_active": True,
        "user_type": "local",
        "password_hash": "hashed_pw",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    defaults.update(kwargs)
    return defaults


@pytest.mark.asyncio
class TestUserRepository:
    """Unit tests for UserRepository against the test MongoDB database."""

    @pytest_asyncio.fixture
    async def repo(self, test_users_collection):
        return UserRepository()

    # ------------------------------------------------------------------ #
    #  create                                                              #
    # ------------------------------------------------------------------ #

    async def test_create_returns_doc_with_id(self, repo, test_users_collection):
        doc = _user_doc(username="alice")
        result = await repo.create(doc)
        assert "id" in result
        assert result["username"] == "alice"

    async def test_create_persists_in_db(self, repo, test_users_collection):
        doc = _user_doc(username="bob")
        created = await repo.create(doc)
        raw = await test_users_collection.find_one({"username": "bob"})
        assert raw is not None
        assert str(raw["_id"]) == created["id"]

    # ------------------------------------------------------------------ #
    #  get_by_id                                                           #
    # ------------------------------------------------------------------ #

    async def test_get_by_id_found(self, repo, test_users_collection):
        doc = _user_doc(username="charlie")
        created = await repo.create(doc)
        found = await repo.get_by_id(created["id"])
        assert found is not None
        assert found["username"] == "charlie"

    async def test_get_by_id_not_found(self, repo):
        from bson import ObjectId
        result = await repo.get_by_id(str(ObjectId()))
        assert result is None

    async def test_get_by_id_strips_object_id(self, repo, test_users_collection):
        doc = _user_doc(username="dave")
        created = await repo.create(doc)
        found = await repo.get_by_id(created["id"])
        assert "id" in found
        assert "_id" not in found

    # ------------------------------------------------------------------ #
    #  get_by_username                                                     #
    # ------------------------------------------------------------------ #

    async def test_get_by_username_found(self, repo, test_users_collection):
        await repo.create(_user_doc(username="eve"))
        result = await repo.get_by_username("eve")
        assert result is not None
        assert result["username"] == "eve"

    async def test_get_by_username_not_found(self, repo):
        result = await repo.get_by_username("nonexistent_user_xyz")
        assert result is None

    async def test_get_by_username_case_sensitive(self, repo, test_users_collection):
        """Username lookup is exact/case-sensitive."""
        await repo.create(_user_doc(username="Frank"))
        result = await repo.get_by_username("frank")
        assert result is None

    # ------------------------------------------------------------------ #
    #  list_users                                                          #
    # ------------------------------------------------------------------ #

    async def test_list_users_empty(self, repo, test_users_collection):
        result = await repo.list_users()
        assert result == []

    async def test_list_users_returns_all(self, repo, test_users_collection):
        await repo.create(_user_doc(username="u1"))
        await repo.create(_user_doc(username="u2"))
        await repo.create(_user_doc(username="u3"))
        result = await repo.list_users()
        assert len(result) == 3

    async def test_list_users_strips_password_hash(self, repo, test_users_collection):
        await repo.create(_user_doc(username="u_pw", password_hash="secret"))
        result = await repo.list_users()
        for user in result:
            assert "password_hash" not in user

    async def test_list_users_pagination(self, repo, test_users_collection):
        for i in range(5):
            await repo.create(_user_doc(username=f"pager_{i}"))
        page1 = await repo.list_users(skip=0, limit=2)
        page2 = await repo.list_users(skip=2, limit=2)
        assert len(page1) == 2
        assert len(page2) == 2
        usernames1 = {u["username"] for u in page1}
        usernames2 = {u["username"] for u in page2}
        assert usernames1.isdisjoint(usernames2)

    # ------------------------------------------------------------------ #
    #  update                                                              #
    # ------------------------------------------------------------------ #

    async def test_update_returns_true_on_success(self, repo, test_users_collection):
        created = await repo.create(_user_doc(username="update_me"))
        result = await repo.update(created["id"], {"role": "admin"})
        assert result is True

    async def test_update_persists_changes(self, repo, test_users_collection):
        created = await repo.create(_user_doc(username="will_change"))
        await repo.update(created["id"], {"role": "admin", "is_active": False})
        updated = await repo.get_by_id(created["id"])
        assert updated["role"] == "admin"
        assert updated["is_active"] is False

    async def test_update_nonexistent_returns_false(self, repo):
        from bson import ObjectId
        result = await repo.update(str(ObjectId()), {"role": "admin"})
        assert result is False

    # ------------------------------------------------------------------ #
    #  update_by_username                                                  #
    # ------------------------------------------------------------------ #

    async def test_update_by_username_success(self, repo, test_users_collection):
        await repo.create(_user_doc(username="name_update"))
        result = await repo.update_by_username("name_update", {"role": "admin"})
        assert result is True

    async def test_update_by_username_persists(self, repo, test_users_collection):
        await repo.create(_user_doc(username="persisted_name"))
        await repo.update_by_username("persisted_name", {"email": "new@test.com"})
        found = await repo.get_by_username("persisted_name")
        assert found["email"] == "new@test.com"

    async def test_update_by_username_not_found(self, repo):
        result = await repo.update_by_username("ghost_user_xyz", {"role": "admin"})
        assert result is False

    # ------------------------------------------------------------------ #
    #  delete                                                              #
    # ------------------------------------------------------------------ #

    async def test_delete_returns_true(self, repo, test_users_collection):
        created = await repo.create(_user_doc(username="delete_me"))
        result = await repo.delete(created["id"])
        assert result is True

    async def test_delete_removes_from_db(self, repo, test_users_collection):
        created = await repo.create(_user_doc(username="gone_user"))
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

    async def test_search_by_username(self, repo, test_users_collection):
        await repo.create(_user_doc(username="searchable_user"))
        await repo.create(_user_doc(username="other_user"))
        results = await repo.search("searchable")
        assert len(results) == 1
        assert results[0]["username"] == "searchable_user"

    async def test_search_by_email(self, repo, test_users_collection):
        await repo.create(_user_doc(username="email_search", email="unique@corp.com"))
        results = await repo.search("unique@corp")
        assert any(u["username"] == "email_search" for u in results)

    async def test_search_case_insensitive(self, repo, test_users_collection):
        await repo.create(_user_doc(username="CaseSensUser"))
        results = await repo.search("casesens")
        assert len(results) == 1

    async def test_search_no_results(self, repo, test_users_collection):
        await repo.create(_user_doc(username="findme"))
        results = await repo.search("zzznomatch_xyz")
        assert results == []

    async def test_search_respects_limit(self, repo, test_users_collection):
        for i in range(10):
            await repo.create(_user_doc(username=f"limituser{i}"))
        results = await repo.search("limituser", limit=3)
        assert len(results) <= 3

    # ------------------------------------------------------------------ #
    #  count                                                               #
    # ------------------------------------------------------------------ #

    async def test_count_empty(self, repo, test_users_collection):
        result = await repo.count()
        assert result == 0

    async def test_count_with_records(self, repo, test_users_collection):
        await repo.create(_user_doc(username="cnt1"))
        await repo.create(_user_doc(username="cnt2"))
        result = await repo.count()
        assert result == 2

    async def test_count_with_filter(self, repo, test_users_collection):
        await repo.create(_user_doc(username="admin1", role="admin"))
        await repo.create(_user_doc(username="user1", role="user"))
        result = await repo.count({"role": "admin"})
        assert result == 1
