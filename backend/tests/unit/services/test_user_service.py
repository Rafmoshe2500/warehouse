"""
Tests for UserService.
Tests user management, permissions, and password hashing.
"""
import pytest
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate
from app.core.constants import UserRole
from app.core.exceptions import NotFoundException, BadRequestException


class TestUserService:
    """Test suite for UserService."""

    @pytest.fixture
    def user_service(self, mock_mongodb):
        """Patched UserService using test collections."""
        return UserService()

    @pytest.mark.asyncio
    async def test_create_user(self, user_service, mock_admin_user):
        """Test creating a new user."""
        user_data = UserCreate(
            username="newuser",
            password="password123",
            role=UserRole.USER
        )
        
        result = await user_service.create_user(
            user_data=user_data,
            created_by=mock_admin_user["username"],
            creator_role=mock_admin_user["role"]
        )
        
        assert result["username"] == "newuser"
        assert "password_hash" not in result # Response schema should hide hash
        
        # Verify can find it
        saved = await user_service.get_user_by_username("newuser")
        assert saved is not None
        assert saved["username"] == "newuser"

    @pytest.mark.asyncio
    async def test_create_duplicate_user_fails(self, user_service, mock_admin_user):
        """Test that creating a user with existing username fails."""
        user_data = UserCreate(username="dup", password="password123", role=UserRole.USER)
        await user_service.create_user(user_data, mock_admin_user["username"], UserRole.ADMIN)
        
        with pytest.raises(BadRequestException) as exc:
            await user_service.create_user(user_data, mock_admin_user["username"], UserRole.ADMIN)
        assert "כבר קיים" in str(exc.value) or "קיים" in str(exc.value)

    @pytest.mark.asyncio
    async def test_update_user(self, user_service, mock_admin_user):
        """Test updating user fields."""
        # Create
        created = await user_service.create_user(
            UserCreate(username="update_me", password="password123", role=UserRole.USER),
            mock_admin_user["username"], UserRole.ADMIN
        )
        user_id = created["id"]
        
        # Update
        update_data = UserUpdate(role=UserRole.ADMIN)
        result = await user_service.update_user(
            user_id=user_id,
            update_data=update_data,

            updated_by=mock_admin_user["username"],
            updater_role=UserRole.SUPERADMIN
        )
        
        assert result["role"] == UserRole.ADMIN

    @pytest.mark.asyncio
    async def test_admin_cannot_update_superadmin(self, user_service, mock_superadmin_user):
        """Test that Admin cannot manage SuperAdmin users."""
        from app.core.password import hash_password
        # Manually insert a superadmin to simplify
        collection = user_service._get_collection()
        sa_doc = {
            "username": "sa",
            "password_hash": hash_password("p"),
            "role": "superadmin",
            "is_active": True
        }
        res = await collection.insert_one(sa_doc)
        sa_id = str(res.inserted_id)
        
        from fastapi import HTTPException
        # Try to update as admin
        with pytest.raises(HTTPException) as exc:
            await user_service.update_user(
                user_id=sa_id,
                update_data=UserUpdate(role=UserRole.USER),
                updated_by="some_admin",
                updater_role="admin"
            )
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_user(self, user_service, mock_admin_user):
        """Test deleting a user."""
        created = await user_service.create_user(
            UserCreate(username="delete_me", password="password123", role=UserRole.USER),
            mock_admin_user["username"], UserRole.ADMIN
        )
        user_id = created["id"]
        
        result = await user_service.delete_user(
            user_id=user_id,
            reason="Cleanup",
            deleted_by=mock_admin_user["username"],
            deleter_role=mock_admin_user["role"]
        )
        
        assert "נמחק בהצלחה" in result["message"]
        
        # Verify gone
        with pytest.raises(NotFoundException):
            await user_service.get_user_by_id(user_id)

    @pytest.mark.asyncio
    async def test_change_password(self, user_service, mock_admin_user):
        """Test user changing their own password."""
        username = "pwd_user"
        created = await user_service.create_user(
            UserCreate(username=username, password="old_password", role=UserRole.USER),
            mock_admin_user["username"], UserRole.ADMIN
        )
        user_id = created["id"]
        
        await user_service.change_password(
            user_id=user_id,
            current_password="old_password",
            new_password="new_password_123"
        )
        
        # Verify login works with new password
        user = await user_service.get_user_by_username(username)
        from app.core.password import verify_password
        assert verify_password("new_password_123", user["password_hash"])
        assert not verify_password("old_password", user["password_hash"])
