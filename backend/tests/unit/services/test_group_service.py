"""
Tests for GroupService.
Tests group management (CRUD) with mocks.
"""
import pytest
from unittest.mock import AsyncMock
from app.services.group_service import GroupService
from app.schemas.group import GroupCreate, GroupUpdate
from app.core.exceptions import NotFoundException, BadRequestException


class TestGroupService:
    """Test suite for GroupService."""

    @pytest.fixture
    def mock_repo(self):
        repo = AsyncMock()
        repo.get_by_name.return_value = None
        repo.create.side_effect = lambda x: {**x, "id": "g_id"}
        repo.get_by_id.return_value = {"id": "g_id", "name": "Group", "role": "user"}
        repo.update.return_value = True
        return repo

    @pytest.fixture
    def mock_auditor(self):
        return AsyncMock()

    @pytest.fixture
    def group_service(self, mock_repo, mock_auditor):
        return GroupService(mock_repo, mock_auditor)

    @pytest.mark.asyncio
    async def test_create_group(self, group_service, mock_repo, mock_auditor):
        """Test creating a new group."""
        group_data = GroupCreate(name="New Group", role="user")
        
        result = await group_service.create_group(
            group_data, 
            created_by="admin", 
            creator_role="superadmin"
        )
        
        assert result["name"] == "New Group"
        assert "id" in result
        
        mock_repo.create.assert_called_once()
        mock_auditor.log_create_group.assert_called_once()

    @pytest.mark.asyncio
    async def test_create_duplicate_group_fails(self, group_service, mock_repo):
        """Test that creating a group with duplicate name fails."""
        mock_repo.get_by_name.return_value = {"id": "existing_id", "name": "Shared Name"}
        
        group_data = GroupCreate(name="Shared Name", role="user")
        
        with pytest.raises(BadRequestException) as exc:
            await group_service.create_group(
                group_data, 
                created_by="admin", 
                creator_role="superadmin"
            )
        assert "שם קבוצה כבר קיים" in str(exc.value)

    @pytest.mark.asyncio
    async def test_get_groups(self, group_service, mock_repo):
        """Test fetching all groups."""
        mock_repo.list_groups.return_value = [
            {"id": "1", "name": "G1", "role": "user"},
            {"id": "2", "name": "G2", "role": "user"}
        ]
        
        result = await group_service.get_groups()
        assert result["total"] == 2
        assert len(result["groups"]) == 2

    @pytest.mark.asyncio
    async def test_update_group(self, group_service, mock_repo, mock_auditor):
        """Test updating a group."""
        mock_repo.get_by_id.return_value = {"id": "g_id", "name": "Old Name", "role": "user"}
        
        update_data = GroupUpdate(name="New Name", role="admin")
        
        await group_service.update_group(
            "g_id", 
            update_data,
            updated_by="admin",
            updater_role="superadmin"
        )
        
        mock_repo.update.assert_called_once()
        mock_auditor.log_update_group.assert_called_once()

    @pytest.mark.asyncio
    async def test_delete_group(self, group_service, mock_repo, mock_auditor):
        """Test deleting a group."""
        mock_repo.get_by_id.return_value = {"id": "g_id", "name": "To Delete"}
        
        result = await group_service.delete_group(
            "g_id", 
            reason="Cleanup",
            deleted_by="admin",
            deleter_role="superadmin"
        )
        assert "נמחקה בהצלחה" in result["message"]
        
        mock_repo.delete.assert_called_once_with("g_id")
        mock_auditor.log_delete_group.assert_called_once()
