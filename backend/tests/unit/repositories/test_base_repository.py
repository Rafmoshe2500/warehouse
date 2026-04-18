"""
Tests for BaseRepository.
Tests the basic CRUD logic inherited by all repositories.
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
from bson import ObjectId
from app.db.repositories.base import BaseRepository
from app.core.exceptions import InvalidItemIdException


class TestBaseRepository:
    """Test suite for BaseRepository."""

    @pytest.fixture
    def repository(self, test_items_collection):
        """Create a base repository using the items collection for testing."""
        return BaseRepository(test_items_collection)

    @pytest.mark.asyncio
    async def test_create(self, repository):
        """Test creating a document."""
        data = {"name": "test", "value": 123}
        result = await repository.create(data)
        
        assert result["_id"] is not None
        assert result["name"] == "test"
        assert result["value"] == 123

    @pytest.mark.asyncio
    async def test_get_by_id(self, repository):
        """Test getting a document by ID."""
        data = {"name": "test_get"}
        created = await repository.create(data)
        doc_id = created["_id"]
        
        result = await repository.get_by_id(doc_id)
        assert result is not None
        assert str(result["_id"]) == doc_id
        assert result["name"] == "test_get"

    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self, repository):
        """Test getting non-existent ID returns None."""
        fake_id = str(ObjectId())
        result = await repository.get_by_id(fake_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_id_invalid_raises(self, repository):
        """Test that invalid ID format raises InvalidItemIdException."""
        with pytest.raises(InvalidItemIdException):
            await repository.get_by_id("invalid-id-format")

    @pytest.mark.asyncio
    async def test_get_all(self, repository):
        """Test getting all documents with pagination."""
        await repository.create({"idx": 1})
        await repository.create({"idx": 2})
        await repository.create({"idx": 3})
        
        results = await repository.get_all(limit=2)
        assert len(results) == 2
        
        total = await repository.count()
        assert total == 3

    @pytest.mark.asyncio
    async def test_update(self, repository):
        """Test updating a document."""
        created = await repository.create({"status": "old"})
        doc_id = created["_id"]
        
        updated = await repository.update(doc_id, {"status": "new"})
        assert updated["status"] == "new"
        
        # Verify in DB
        result = await repository.get_by_id(doc_id)
        assert result["status"] == "new"

    @pytest.mark.asyncio
    async def test_update_many(self, repository):
        """Test updating multiple documents."""
        await repository.create({"type": "A", "val": 1})
        await repository.create({"type": "A", "val": 2})
        await repository.create({"type": "B", "val": 3})
        
        count = await repository.update_many({"type": "A"}, {"val": 10})
        assert count == 2
        
        results = await repository.get_all({"val": 10})
        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_delete(self, repository):
        """Test deleting a document."""
        created = await repository.create({"to_delete": True})
        doc_id = created["_id"]
        
        success = await repository.delete(doc_id)
        assert success is True
        
        result = await repository.get_by_id(doc_id)
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_many(self, repository):
        """Test deleting multiple documents."""
        await repository.create({"tag": "tmp"})
        await repository.create({"tag": "tmp"})
        await repository.create({"tag": "keep"})
        
        count = await repository.delete_many({"tag": "tmp"})
        assert count == 2
        
        total = await repository.count()
        assert total == 1


# ── Exception / DB-failure paths ──────────────────────────────────────────────


def _make_failing_repo(method_names: list) -> BaseRepository:
    """Return a BaseRepository whose collection methods raise Exception('DB error')."""
    mock_col = MagicMock()
    mock_col.name = "test_collection"
    for name in method_names:
        setattr(mock_col, name, AsyncMock(side_effect=Exception("DB error")))
    repo = BaseRepository.__new__(BaseRepository)
    repo.collection = mock_col
    return repo


class TestBaseRepositoryExceptionPaths:
    """All except blocks in BaseRepository must log and re-raise."""

    @pytest.mark.asyncio
    async def test_get_by_id_db_failure_raises(self):
        repo = _make_failing_repo(["find_one"])
        with pytest.raises(Exception, match="DB error"):
            await repo.get_by_id(str(ObjectId()))

    @pytest.mark.asyncio
    async def test_get_all_db_failure_raises(self):
        mock_col = MagicMock()
        mock_col.name = "test_collection"
        cursor = MagicMock()
        cursor.sort.return_value = cursor
        cursor.skip.return_value = cursor
        cursor.limit.return_value = cursor
        cursor.to_list = AsyncMock(side_effect=Exception("DB error"))
        mock_col.find.return_value = cursor
        repo = BaseRepository.__new__(BaseRepository)
        repo.collection = mock_col
        with pytest.raises(Exception, match="DB error"):
            await repo.get_all()

    @pytest.mark.asyncio
    async def test_count_db_failure_raises(self):
        repo = _make_failing_repo(["count_documents"])
        with pytest.raises(Exception, match="DB error"):
            await repo.count()

    @pytest.mark.asyncio
    async def test_create_db_failure_raises(self):
        repo = _make_failing_repo(["insert_one"])
        with pytest.raises(Exception, match="DB error"):
            await repo.create({"name": "test"})

    @pytest.mark.asyncio
    async def test_update_db_failure_raises(self):
        # update_one raises; find_one is never reached
        mock_col = MagicMock()
        mock_col.name = "test_collection"
        mock_col.update_one = AsyncMock(side_effect=Exception("DB error"))
        repo = BaseRepository.__new__(BaseRepository)
        repo.collection = mock_col
        with pytest.raises(Exception, match="DB error"):
            await repo.update(str(ObjectId()), {"field": "value"})

    @pytest.mark.asyncio
    async def test_update_many_db_failure_raises(self):
        repo = _make_failing_repo(["update_many"])
        with pytest.raises(Exception, match="DB error"):
            await repo.update_many({"type": "A"}, {"val": 0})

    @pytest.mark.asyncio
    async def test_delete_db_failure_raises(self):
        repo = _make_failing_repo(["delete_one"])
        with pytest.raises(Exception, match="DB error"):
            await repo.delete(str(ObjectId()))

    @pytest.mark.asyncio
    async def test_delete_many_db_failure_raises(self):
        repo = _make_failing_repo(["delete_many"])
        with pytest.raises(Exception, match="DB error"):
            await repo.delete_many({"tag": "tmp"})

    @pytest.mark.asyncio
    async def test_validate_object_id_invalid_raises(self):
        repo = _make_failing_repo([])
        with pytest.raises(InvalidItemIdException):
            repo._validate_object_id("not-a-valid-objectid")
