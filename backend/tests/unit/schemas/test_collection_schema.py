"""
Tests for Collection schemas.
Covers: CollectionCreate, CollectionUpdate, CollectionPermission,
        CollectionItemCreate, CollectionBulkItemCreate, CollectionBulkItemDelete.
"""
import pytest
from pydantic import ValidationError
from app.schemas.collection import (
    CollectionCreate,
    CollectionUpdate,
    CollectionPermission,
    CollectionItemCreate,
    CollectionBulkItemCreate,
    CollectionBulkItemDelete,
    CollectionItemUpdate,
    CollectionRole,
    PermissionType,
    CustomFieldDefinition,
    CustomFieldType,
)


class TestCollectionCreate:
    """CollectionCreate — name required, others optional."""

    def test_valid_minimal(self):
        col = CollectionCreate(name="My Collection")
        assert col.name == "My Collection"
        assert col.description is None
        assert col.group_ids == []
        assert col.custom_fields == []

    def test_valid_full(self):
        col = CollectionCreate(
            name="Full Collection",
            description="A description",
            group_ids=["g1", "g2"],
        )
        assert col.description == "A description"
        assert len(col.group_ids) == 2

    def test_missing_name_raises(self):
        with pytest.raises(ValidationError):
            CollectionCreate()

    def test_with_custom_fields(self):
        col = CollectionCreate(
            name="With Fields",
            custom_fields=[
                {"key": "notes", "label": "Notes", "type": "text"}
            ]
        )
        assert len(col.custom_fields) == 1
        assert col.custom_fields[0].key == "notes"


class TestCollectionUpdate:
    """CollectionUpdate — all fields optional."""

    def test_empty_update_is_valid(self):
        update = CollectionUpdate()
        assert update.name is None
        assert update.description is None

    def test_partial_name_update(self):
        update = CollectionUpdate(name="New Name")
        assert update.name == "New Name"
        assert update.description is None

    def test_full_update(self):
        update = CollectionUpdate(name="Name", description="Desc", group_ids=["g1"])
        assert update.name == "Name"
        assert update.group_ids == ["g1"]


class TestCollectionPermission:
    """CollectionPermission — type/id/level validation."""

    def test_valid_user_permission(self):
        perm = CollectionPermission(type=PermissionType.USER, id="user123", level=CollectionRole.RO)
        assert perm.type == PermissionType.USER
        assert perm.level == CollectionRole.RO

    def test_valid_group_permission(self):
        perm = CollectionPermission(type=PermissionType.GROUP, id="group_abc", level=CollectionRole.RW)
        assert perm.type == PermissionType.GROUP
        assert perm.level == CollectionRole.RW

    def test_owner_level_accepted(self):
        perm = CollectionPermission(type=PermissionType.USER, id="owner", level=CollectionRole.OWNER)
        assert perm.level == CollectionRole.OWNER

    def test_invalid_level_raises(self):
        with pytest.raises(ValidationError):
            CollectionPermission(type="user", id="u1", level="superuser")

    def test_invalid_type_raises(self):
        with pytest.raises(ValidationError):
            CollectionPermission(type="unknown", id="u1", level="ro")

    def test_missing_id_raises(self):
        with pytest.raises(ValidationError):
            CollectionPermission(type="user", level="ro")


class TestCollectionItemCreate:
    """CollectionItemCreate — item_id required."""

    def test_valid_item_create(self):
        item = CollectionItemCreate(item_id="item_abc123")
        assert item.item_id == "item_abc123"
        assert item.custom_values == {}

    def test_with_custom_values(self):
        item = CollectionItemCreate(item_id="item1", custom_values={"rack": "A1"})
        assert item.custom_values["rack"] == "A1"

    def test_missing_item_id_raises(self):
        with pytest.raises(ValidationError):
            CollectionItemCreate()


class TestCollectionBulkItemCreate:
    """CollectionBulkItemCreate — item_ids list."""

    def test_valid_bulk_create(self):
        bulk = CollectionBulkItemCreate(item_ids=["id1", "id2", "id3"])
        assert len(bulk.item_ids) == 3

    def test_empty_list_is_valid(self):
        bulk = CollectionBulkItemCreate(item_ids=[])
        assert bulk.item_ids == []

    def test_missing_item_ids_raises(self):
        with pytest.raises(ValidationError):
            CollectionBulkItemCreate()

    def test_with_custom_values(self):
        bulk = CollectionBulkItemCreate(item_ids=["id1"], custom_values={"notes": "test"})
        assert bulk.custom_values["notes"] == "test"


class TestCollectionBulkItemDelete:
    """CollectionBulkItemDelete — item_ids list."""

    def test_valid_bulk_delete(self):
        bulk = CollectionBulkItemDelete(item_ids=["id1", "id2"])
        assert len(bulk.item_ids) == 2

    def test_empty_list_is_valid(self):
        bulk = CollectionBulkItemDelete(item_ids=[])
        assert bulk.item_ids == []

    def test_missing_item_ids_raises(self):
        with pytest.raises(ValidationError):
            CollectionBulkItemDelete()


class TestCollectionItemUpdate:
    """CollectionItemUpdate — all optional."""

    def test_empty_update_valid(self):
        update = CollectionItemUpdate()
        assert update.custom_values is None

    def test_with_custom_values(self):
        update = CollectionItemUpdate(custom_values={"rack": "B3", "slot": "12"})
        assert update.custom_values["rack"] == "B3"


class TestCustomFieldDefinition:
    """CustomFieldDefinition — validates field types."""

    def test_valid_text_field(self):
        field = CustomFieldDefinition(key="notes", label="Notes", type=CustomFieldType.TEXT)
        assert field.type == CustomFieldType.TEXT
        assert field.required is False

    def test_valid_select_field_with_options(self):
        field = CustomFieldDefinition(
            key="status", label="Status", type=CustomFieldType.SELECT,
            options=["Active", "Inactive"]
        )
        assert len(field.options) == 2

    def test_invalid_type_raises(self):
        with pytest.raises(ValidationError):
            CustomFieldDefinition(key="k", label="L", type="unknown_type")

    def test_required_field(self):
        field = CustomFieldDefinition(key="rack", label="Rack", type=CustomFieldType.TEXT, required=True)
        assert field.required is True
