"""
Tests for GroupService.
Tests group management (CRUD).
"""
import pytest
from app.services.group_service import GroupService
from app.schemas.group import GroupCreate, GroupUpdate
from app.core.exceptions import NotFoundException, BadRequestException


class TestGroupService:
    """Test suite for GroupService."""

    @pytest.fixture
    def group_service(self, mock_mongodb):
        return GroupService()

    @pytest.mark.asyncio
    async def test_create_group(self, group_service):
        """Test creating a new group."""
        group_data = GroupCreate(name="New Group", role="user")
        result = await group_service.create_group(
            group_data, 
            created_by="admin", 
            creator_role="superadmin"
        )
        
        assert result["name"] == "New Group"
        assert result["role"] == "user"
        assert "id" in result

    @pytest.mark.asyncio
    async def test_create_duplicate_group_fails(self, group_service):
        """Test that creating a group with duplicate name fails."""
        group_data = GroupCreate(name="Shared Name", role="user")
        await group_service.create_group(
            group_data, 
            created_by="admin", 
            creator_role="superadmin"
        )
        
        with pytest.raises(BadRequestException) as exc:
            await group_service.create_group(
                group_data, 
                created_by="admin", 
                creator_role="superadmin"
            )
        assert "שם קבוצה כבר קיים" in str(exc.value)

    @pytest.mark.asyncio
    async def test_get_groups(self, group_service):
        """Test fetching all groups."""
        await group_service.create_group(
            GroupCreate(name="G1", role="user"), 
            created_by="admin", 
            creator_role="superadmin"
        )
        await group_service.create_group(
            GroupCreate(name="G2", role="user"), 
            created_by="admin", 
            creator_role="superadmin"
        )
        
        result = await group_service.get_groups()
        assert result["total"] >= 2
        assert any(g["name"] == "G1" for g in result["groups"])

    @pytest.mark.asyncio
    async def test_update_group(self, group_service):
        """Test updating a group."""
        created = await group_service.create_group(
            GroupCreate(name="Old Name", role="user"), 
            created_by="admin", 
            creator_role="superadmin"
        )
        group_id = created["id"]
        
        update_data = GroupUpdate(name="New Name", role="admin")
        result = await group_service.update_group(
            group_id, 
            update_data,
            updated_by="admin",
            updater_role="superadmin"
        )
        
        assert result["name"] == "New Name"
        assert result["role"] == "admin"

    @pytest.mark.asyncio
    async def test_delete_group(self, group_service):
        """Test deleting a group."""
        created = await group_service.create_group(
            GroupCreate(name="To Delete", role="user"), 
            created_by="admin", 
            creator_role="superadmin"
        )
        group_id = created["id"]
        
        result = await group_service.delete_group(
            group_id, 
            reason="Cleanup",
            deleted_by="admin",
            deleter_role="superadmin"
        )
        assert "נמחקה בהצלחה" in result["message"]
        
        # Verify gone
        with pytest.raises(NotFoundException):
            await group_service.get_group_by_id(group_id)
