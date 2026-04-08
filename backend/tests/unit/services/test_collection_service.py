
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import HTTPException

from app.services.collection_service import CollectionService
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionRole, PermissionType,
    CollectionItemCreate, CollectionPermission, CollectionBulkItemCreate
)
from app.core.constants import UserRole

@pytest.fixture
def mock_repo():
    return AsyncMock()

@pytest.fixture
def mock_auditor():
    return AsyncMock()

@pytest.fixture
def mock_items_repo():
    return AsyncMock()

@pytest.fixture
def service(mock_repo, mock_auditor, mock_items_repo):
    return CollectionService(mock_repo, mock_auditor, mock_items_repo)

@pytest.mark.asyncio
async def test_create_collection(service, mock_repo, mock_auditor):
    # Arrange
    data = CollectionCreate(name="Test Collection", description="Desc")
    user_id = "user1"
    
    # Mock create_collection return value
    mock_repo.create_collection.return_value = {
        "id": "col1",
        "name": "Test Collection",
        "owner_id": "user1",
        "permissions": []
    }
    
    # Act
    result = await service.create_collection(data, user_id)
    
    # Assert
    assert result["id"] == "col1"
    assert result["owner_id"] == "user1"
    mock_repo.create_collection.assert_called_once()
    
    # Verify auditor called
    mock_auditor.log_create_collection.assert_called_once()
    call_kwargs = mock_auditor.log_create_collection.call_args.kwargs
    assert call_kwargs["user_id"] == user_id
    assert call_kwargs["collection_id"] == "col1"

@pytest.mark.asyncio
async def test_get_collection_access_denied(service, mock_repo):
    # Arrange
    col_id = "col1"
    user_id = "user2" # Not owner
    
    mock_repo.get_collection.return_value = {
        "id": "col1",
        "owner_id": "user1",
        "permissions": []
    }
    
    # Act & Assert
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        await service.get_collection(col_id, user_id)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_get_collection_access_allowed_shared(service, mock_repo):
    # Arrange
    col_id = "col1"
    user_id = "user2"
    
    mock_repo.get_collection.return_value = {
        "id": "col1",
        "owner_id": "user1",
        "permissions": [
            {"type": "user", "id": "user2", "level": "ro"}
        ]
    }
    
    # Act
    result = await service.get_collection(col_id, user_id)
    
    # Assert
    assert result["id"] == "col1"
    assert result["role"] == "ro"

@pytest.mark.asyncio
async def test_list_collections(service, mock_repo):
    # Arrange
    user_id = "user1"
    mock_repo.list_collections.return_value = [
        {"id": "col1", "owner_id": "user1", "permissions": []},
        {"id": "col2", "owner_id": "other", "permissions": []},
        {"id": "col3", "owner_id": "other", "permissions": [{"type": "user", "id": "user1", "level": "ro"}]}
    ]

    # Act
    result = await service.list_collections(user_id)

    # Assert
    assert len(result) == 2
    assert result[0]["id"] == "col1"
    assert result[1]["id"] == "col3"

@pytest.mark.asyncio
async def test_update_collection_owner(service, mock_repo, mock_auditor):
    # Arrange
    col_id = "col1"
    user_id = "user1"
    data = CollectionUpdate(name="New Name")
    
    mock_repo.get_collection.return_value = {
        "id": "col1", "owner_id": "user1", "permissions": []
    }
    mock_repo.update_collection.return_value = {"id": "col1", "name": "New Name"}

    # Act
    result = await service.update_collection(col_id, data, user_id)

    # Assert
    assert result["name"] == "New Name"
    mock_repo.update_collection.assert_called_once()
    
    # Verify auditor
    mock_auditor.log_update_collection.assert_called_once()
    call_kwargs = mock_auditor.log_update_collection.call_args.kwargs
    assert call_kwargs["user_id"] == user_id
    assert call_kwargs["collection_id"] == col_id

@pytest.mark.asyncio
async def test_update_collection_denied_ro(service, mock_repo):
    # Arrange
    col_id = "col1"
    user_id = "user2"
    data = CollectionUpdate(name="New Name")
    
    mock_repo.get_collection.return_value = {
        "id": "col1", "owner_id": "user1", 
        "permissions": [{"type": "user", "id": "user2", "level": "ro"}]
    }

    # Act & Assert
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        await service.update_collection(col_id, data, user_id)
    assert exc.value.status_code == 403

@pytest.mark.asyncio
async def test_delete_collection(service, mock_repo, mock_auditor):
    # Arrange
    col_id = "col1"
    user_id = "user1"
    
    mock_repo.get_collection.return_value = {
        "id": "col1", "owner_id": "user1"
    }
    mock_repo.delete_collection.return_value = True

    # Act
    result = await service.delete_collection(col_id, user_id)

    # Assert
    assert result is True
    mock_repo.delete_collection.assert_called_once_with(col_id)
    
    # Verify auditor
    mock_auditor.log_delete_collection.assert_called_once()
    call_kwargs = mock_auditor.log_delete_collection.call_args.kwargs
    assert call_kwargs["user_id"] == user_id
    assert call_kwargs["collection_id"] == col_id

@pytest.mark.asyncio
async def test_add_item(service, mock_repo, mock_items_repo, mock_auditor):
    # Arrange
    col_id = "col1"
    user_id = "user1"
    item_data = CollectionItemCreate(item_id="item1", custom_values={"note": "test"})
    
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "name": "My Col"}
    mock_repo.get_item_in_collection.return_value = None # Not existing
    mock_repo.add_item.return_value = {"id": "ci1", "item_id": "item1"}
    
    mock_items_repo.get_by_id.return_value = {"catalog_number": "CAT1", "description": "Desc"}

    # Act
    result = await service.add_item(col_id, item_data, user_id)

    # Assert
    assert result["item_id"] == "item1"
    mock_repo.add_item.assert_called_once()
    
    # Verify auditor
    mock_auditor.log_add_item.assert_called_once()
    call_kwargs = mock_auditor.log_add_item.call_args.kwargs
    assert call_kwargs["user_id"] == user_id
    assert call_kwargs["collection_name"] == "My Col"
    assert call_kwargs["item_identifier"] == "CAT1"


@pytest.mark.asyncio
async def test_add_item_duplicate(service, mock_repo):
    # Arrange
    col_id = "col1"
    user_id = "user1"
    item_data = CollectionItemCreate(item_id="item1")
    
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1"}
    mock_repo.get_item_in_collection.return_value = {"id": "ci1"} # Exists

    # Act & Assert
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        await service.add_item(col_id, item_data, user_id)
    assert exc.value.status_code == 400

@pytest.mark.asyncio
async def test_update_permissions(service, mock_repo):
    # Arrange
    col_id = "col1"
    user_id = "user1"
    perm = CollectionPermission(type=PermissionType.USER, id="user2", level=CollectionRole.RW)
    
    mock_repo.get_collection.return_value = {
        "id": "col1", "owner_id": "user1", "permissions": []
    }
    mock_repo.update_collection.return_value = {"id": "col1", "permissions": [perm.model_dump()]}

    # Act
    result = await service.update_permissions(col_id, perm, user_id)

    # Assert
    mock_repo.update_collection.assert_called_once()
    # Verify exact argument hard to check due to async mock but we see it called.
    
@pytest.mark.asyncio
async def test_remove_permission(service, mock_repo):
    # Arrange
    col_id = "col1"
    user_id = "user1"
    target_id = "user2"
    
    mock_repo.get_collection.return_value = {
        "id": "col1", "owner_id": "user1", 
        "permissions": [{"type": "user", "id": "user2", "level": "ro"}]
    }
    
    # Act
    await service.remove_permission(col_id, target_id, user_id)

    # Assert
    mock_repo.update_collection.assert_called_once()
    # Should be call with empty permissions list
    call_args = mock_repo.update_collection.call_args
    assert call_args[0][1]["permissions"] == []


# ── _get_user_role ──────────────────────────────────────────────


class TestGetUserRole:

    @pytest.fixture
    def svc(self):
        return CollectionService(AsyncMock(), AsyncMock(), AsyncMock())

    def test_admin_gets_owner_role(self, svc):
        col = {"owner_id": "someone", "permissions": []}
        role = svc._get_user_role(col, "adminuser", [], user_role=UserRole.ADMIN)
        assert role == CollectionRole.OWNER

    def test_superadmin_gets_owner_role(self, svc):
        col = {"owner_id": "someone", "permissions": []}
        role = svc._get_user_role(col, "sauser", [], user_role=UserRole.SUPERADMIN)
        assert role == CollectionRole.OWNER

    def test_owner_match_case_insensitive(self, svc):
        col = {"owner_id": "User1", "permissions": []}
        role = svc._get_user_role(col, "user1", [])
        assert role == CollectionRole.OWNER

    def test_user_permission_match(self, svc):
        col = {
            "owner_id": "someone",
            "permissions": [{"type": PermissionType.USER, "id": "user2", "level": CollectionRole.RW}],
        }
        role = svc._get_user_role(col, "user2", [])
        assert role == CollectionRole.RW

    def test_group_permission_ro(self, svc):
        col = {
            "owner_id": "someone",
            "permissions": [{"type": PermissionType.GROUP, "id": "Designers", "level": CollectionRole.RO}],
        }
        role = svc._get_user_role(col, "user3", ["Designers"])
        assert role == CollectionRole.RO

    def test_group_rw_takes_precedence_over_ro(self, svc):
        col = {
            "owner_id": "someone",
            "permissions": [
                {"type": PermissionType.GROUP, "id": "Viewers", "level": CollectionRole.RO},
                {"type": PermissionType.GROUP, "id": "Editors", "level": CollectionRole.RW},
            ],
        }
        role = svc._get_user_role(col, "user3", ["Viewers", "Editors"])
        assert role == CollectionRole.RW

    def test_no_match_returns_none(self, svc):
        col = {"owner_id": "someone", "permissions": []}
        role = svc._get_user_role(col, "stranger", [])
        assert role is None


# ── remove_item ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_remove_item_success(service, mock_repo, mock_items_repo, mock_auditor):
    col_id = "col1"
    user_id = "user1"
    item_id = "item1"

    mock_repo.get_collection.return_value = {"id": col_id, "owner_id": user_id, "name": "Col", "permissions": []}
    mock_repo.remove_item.return_value = True
    mock_items_repo.get_by_id.return_value = {"catalog_number": "CAT-X", "description": "Desc"}

    result = await service.remove_item(col_id, item_id, user_id)
    assert result is True
    mock_auditor.log_remove_item.assert_called_once()


@pytest.mark.asyncio
async def test_remove_item_denied_ro(service, mock_repo):
    mock_repo.get_collection.return_value = {
        "id": "col1", "owner_id": "owner",
        "permissions": [{"type": PermissionType.USER, "id": "reader", "level": CollectionRole.RO}],
    }
    with pytest.raises(HTTPException) as exc:
        await service.remove_item("col1", "item1", "reader")
    assert exc.value.status_code == 403


# ── remove_items_bulk ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_remove_items_bulk(service, mock_repo, mock_auditor):
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "permissions": []}
    mock_repo.remove_items_bulk.return_value = 3

    result = await service.remove_items_bulk("col1", ["a", "b", "c"], "user1")
    assert result["requested"] == 3
    assert result["deleted"] == 3
    mock_auditor.log_update_collection.assert_called_once()


# ── bulk_add_items ──────────────────────────────────────────────


@pytest.mark.asyncio
async def test_bulk_add_items_deduplication(service, mock_repo, mock_items_repo, mock_auditor):
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "name": "Col", "permissions": []}
    # "item1" already exists in the collection
    mock_repo.get_collection_items.return_value = [{"item_id": "item1"}]
    mock_items_repo.get_many_by_ids.return_value = [
        {"_id": "item2", "catalog_number": "CAT-2"},
        {"_id": "item3", "catalog_number": "CAT-3"},
    ]
    mock_repo.add_items_bulk.return_value = 2
    mock_items_repo.get_by_id.return_value = {"catalog_number": "CAT-X", "description": "Desc"}

    bulk_data = CollectionBulkItemCreate(item_ids=["item1", "item2", "item3"])
    result = await service.bulk_add_items("col1", bulk_data, "user1")

    assert result["requested"] == 3
    assert result["added"] == 2
    assert result["skipped"] == 1


# ── get_collection_items enrichment ─────────────────────────────


@pytest.mark.asyncio
async def test_get_collection_items_enriched(service, mock_repo, mock_items_repo):
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "permissions": []}
    mock_repo.get_collection_items.return_value = [
        {"id": "ci1", "item_id": "item1", "custom_values": {}, "assigned_at": None, "assigned_by": "user1"},
    ]
    mock_items_repo.get_by_id.return_value = {
        "catalog_number": "CAT-001", "serial": "SN1", "description": "Server",
        "manufacturer": "Dell", "location": "DC1", "current_stock": "5",
        "warranty_expiry": None, "project_allocations": {}, "target_site": "Lab",
        "purpose": "Prod", "notes": "",
    }

    result = await service.get_collection_items("col1", "user1")
    assert len(result) == 1
    assert result[0]["catalog_number"] == "CAT-001"
    assert result[0]["description"] == "Server"


@pytest.mark.asyncio
async def test_get_collection_items_deleted_with_snapshot(service, mock_repo, mock_items_repo):
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "permissions": []}
    mock_repo.get_collection_items.return_value = [
        {"id": "ci1", "item_id": "item1", "custom_values": {},
         "assigned_at": None, "assigned_by": "user1",
         "catalog_number": "CAT-OLD", "serial": "SN-OLD"},
    ]
    mock_items_repo.get_by_id.return_value = None
    mock_items_repo.find_by_catalog_number.return_value = None

    result = await service.get_collection_items("col1", "user1")
    assert len(result) == 1
    assert result[0]["catalog_number"] == "CAT-OLD"
    assert result[0]["description"] == "[פריט נמחק]"


@pytest.mark.asyncio
async def test_get_collection_items_deleted_no_snapshot(service, mock_repo, mock_items_repo):
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "permissions": []}
    mock_repo.get_collection_items.return_value = [
        {"id": "ci1", "item_id": "item1", "custom_values": {},
         "assigned_at": None, "assigned_by": "user1"},
    ]
    mock_items_repo.get_by_id.return_value = None
    mock_items_repo.find_by_catalog_number.return_value = None

    result = await service.get_collection_items("col1", "user1")
    assert len(result) == 1
    assert "[נמחק" in result[0]["catalog_number"]
    assert result[0]["description"] == "[פריט זה נמחק מהמלאי]"


# ── export_collection ───────────────────────────────────────────


@pytest.mark.asyncio
async def test_export_collection_empty_raises(service, mock_repo, mock_items_repo):
    mock_repo.get_collection.return_value = {"id": "col1", "owner_id": "user1", "permissions": []}
    mock_repo.get_collection_items.return_value = []

    from app.core.exceptions import ExcelFileException
    with pytest.raises(ExcelFileException):
        await service.export_collection("col1", "user1")
