"""
Unit tests for CollectionRepository.
Tests CRUD operations for collections and collection item management.
"""
import pytest
import pytest_asyncio
from bson import ObjectId

from app.db.repositories.collection_repository import CollectionRepository


def _make_repo(collections_col, items_col) -> CollectionRepository:
    """Helper: create a CollectionRepository pointing at test collections."""
    repo = CollectionRepository()
    repo.collections = collections_col
    repo.items = items_col
    return repo


def _collection_data(owner_id: str = "user_123", name: str = "My Collection") -> dict:
    """Minimal data dict for creating a collection."""
    return {"name": name, "owner_id": owner_id}


class TestCollectionRepository:
    """Test suite for CollectionRepository."""

    # ========== Collection CRUD ==========

    @pytest.mark.asyncio
    async def test_create_collection(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test creating a collection returns a doc with string 'id'."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        data = _collection_data()

        result = await repo.create_collection(data)

        assert result is not None
        assert "id" in result
        assert result["name"] == "My Collection"
        assert result["owner_id"] == "user_123"
        assert "created_at" in result
        assert "updated_at" in result

    @pytest.mark.asyncio
    async def test_get_collection_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test get_collection returns the correct doc."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        created = await repo.create_collection(_collection_data(name="Found"))

        result = await repo.get_collection(created["id"])

        assert result is not None
        assert result["id"] == created["id"]
        assert result["name"] == "Found"

    @pytest.mark.asyncio
    async def test_get_collection_not_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test get_collection returns None for a non-existent ID."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        fake_id = str(ObjectId())

        result = await repo.get_collection(fake_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_collection_invalid_id(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test get_collection returns None for an invalid ObjectId string."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)

        result = await repo.get_collection("not-a-valid-id")

        assert result is None

    @pytest.mark.asyncio
    async def test_list_collections_by_owner(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test list_collections only returns collections for a specific owner."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)

        await repo.create_collection(_collection_data(owner_id="alice", name="Alice-1"))
        await repo.create_collection(_collection_data(owner_id="alice", name="Alice-2"))
        await repo.create_collection(_collection_data(owner_id="bob", name="Bob-1"))

        results = await repo.list_collections(owner_id="alice")

        assert len(results) == 2
        assert all(r["owner_id"] == "alice" for r in results)

    @pytest.mark.asyncio
    async def test_list_collections_no_filter_returns_all(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test list_collections with no filter returns all collections."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)

        await repo.create_collection(_collection_data(owner_id="alice"))
        await repo.create_collection(_collection_data(owner_id="bob"))

        results = await repo.list_collections()

        assert len(results) == 2

    @pytest.mark.asyncio
    async def test_update_collection(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test update_collection modifies name and sets updated_at."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        created = await repo.create_collection(_collection_data(name="Old Name"))
        original_updated_at = created["updated_at"]

        import asyncio
        await asyncio.sleep(0.05)

        result = await repo.update_collection(created["id"], {"name": "New Name"})

        assert result is not None
        assert result["name"] == "New Name"
        assert result["updated_at"] > original_updated_at

    @pytest.mark.asyncio
    async def test_update_collection_not_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test update_collection returns None for non-existent ID."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        fake_id = str(ObjectId())

        result = await repo.update_collection(fake_id, {"name": "Ghost"})

        assert result is None

    @pytest.mark.asyncio
    async def test_delete_collection(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test delete_collection removes the collection and its items."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        created = await repo.create_collection(_collection_data())
        coll_id = created["id"]

        # Add an item to the collection first
        await repo.add_item({
            "collection_id": coll_id,
            "item_id": "item_abc",
            "catalog_number": "CAT-001"
        })

        result = await repo.delete_collection(coll_id)

        assert result is True
        # Collection should be gone
        assert await repo.get_collection(coll_id) is None
        # Items should also be gone
        items = await repo.get_collection_items(coll_id)
        assert items == []

    @pytest.mark.asyncio
    async def test_delete_collection_not_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test delete_collection returns False for non-existent ID."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        fake_id = str(ObjectId())

        result = await repo.delete_collection(fake_id)

        assert result is False

    # ========== Item Operations ==========

    @pytest.mark.asyncio
    async def test_add_item_to_collection(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test add_item returns item with 'id', 'collection_id', and 'assigned_at'."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        collection = await repo.create_collection(_collection_data())
        coll_id = collection["id"]

        item = await repo.add_item({
            "collection_id": coll_id,
            "item_id": "item_001",
            "catalog_number": "CAT-001"
        })

        assert item is not None
        assert "id" in item
        assert item["collection_id"] == coll_id
        assert item["item_id"] == "item_001"
        assert "assigned_at" in item

    @pytest.mark.asyncio
    async def test_get_collection_items(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test get_collection_items returns items for the correct collection only."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll_a = await repo.create_collection(_collection_data(name="A"))
        coll_b = await repo.create_collection(_collection_data(name="B"))

        await repo.add_item({"collection_id": coll_a["id"], "item_id": "i1"})
        await repo.add_item({"collection_id": coll_a["id"], "item_id": "i2"})
        await repo.add_item({"collection_id": coll_b["id"], "item_id": "i3"})

        items_a = await repo.get_collection_items(coll_a["id"])

        assert len(items_a) == 2
        item_ids_a = {i["item_id"] for i in items_a}
        assert item_ids_a == {"i1", "i2"}

    @pytest.mark.asyncio
    async def test_get_item_in_collection_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test get_item_in_collection returns the correct item."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())
        await repo.add_item({"collection_id": coll["id"], "item_id": "target_item"})

        result = await repo.get_item_in_collection(coll["id"], "target_item")

        assert result is not None
        assert result["item_id"] == "target_item"
        assert result["collection_id"] == coll["id"]

    @pytest.mark.asyncio
    async def test_get_item_in_collection_not_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test get_item_in_collection returns None for non-existent item."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())

        result = await repo.get_item_in_collection(coll["id"], "ghost_item")

        assert result is None

    @pytest.mark.asyncio
    async def test_update_item_custom_values(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test update_item sets custom fields on a collection item."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())
        await repo.add_item({"collection_id": coll["id"], "item_id": "upd_item"})

        result = await repo.update_item(coll["id"], "upd_item", {"custom_notes": "Important"})

        assert result is not None
        assert result["custom_notes"] == "Important"
        assert result["item_id"] == "upd_item"

    @pytest.mark.asyncio
    async def test_remove_item(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test remove_item deletes a specific item from a collection."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())
        await repo.add_item({"collection_id": coll["id"], "item_id": "remove_me"})
        await repo.add_item({"collection_id": coll["id"], "item_id": "keep_me"})

        deleted = await repo.remove_item(coll["id"], "remove_me")

        assert deleted is True
        # "remove_me" should be gone
        assert await repo.get_item_in_collection(coll["id"], "remove_me") is None
        # "keep_me" should still be there
        assert await repo.get_item_in_collection(coll["id"], "keep_me") is not None

    @pytest.mark.asyncio
    async def test_remove_item_not_found(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test remove_item returns False when item doesn't exist in collection."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())

        result = await repo.remove_item(coll["id"], "ghost_item")

        assert result is False

    @pytest.mark.asyncio
    async def test_remove_items_bulk(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test remove_items_bulk deletes multiple items and returns the count."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())

        for i in range(4):
            await repo.add_item({"collection_id": coll["id"], "item_id": f"item_{i}"})

        count = await repo.remove_items_bulk(coll["id"], ["item_0", "item_1"])

        assert count == 2
        remaining = await repo.get_collection_items(coll["id"])
        assert len(remaining) == 2
        remaining_ids = {i["item_id"] for i in remaining}
        assert remaining_ids == {"item_2", "item_3"}

    @pytest.mark.asyncio
    async def test_add_items_bulk(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test add_items_bulk inserts multiple items at once."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())
        coll_id = coll["id"]

        items_data = [
            {"collection_id": coll_id, "item_id": "bulk_item_1", "catalog_number": "CAT-B1"},
            {"collection_id": coll_id, "item_id": "bulk_item_2", "catalog_number": "CAT-B2"},
            {"collection_id": coll_id, "item_id": "bulk_item_3", "catalog_number": "CAT-B3"},
        ]

        count = await repo.add_items_bulk(items_data)

        assert count == 3
        stored = await repo.get_collection_items(coll_id)
        assert len(stored) == 3
        stored_item_ids = {i["item_id"] for i in stored}
        assert stored_item_ids == {"bulk_item_1", "bulk_item_2", "bulk_item_3"}
        # Each item should have assigned_at
        assert all("assigned_at" in i for i in stored)

    @pytest.mark.asyncio
    async def test_add_items_bulk_empty(
        self, test_collections_collection, test_collection_items_collection
    ):
        """Test add_items_bulk with empty list returns 0."""
        repo = _make_repo(test_collections_collection, test_collection_items_collection)
        coll = await repo.create_collection(_collection_data())

        count = await repo.add_items_bulk([])

        assert count == 0
