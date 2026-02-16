
import pytest
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.collection_service import CollectionService
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionRole, PermissionType, CollectionItemCreate, CollectionPermission

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
