"""
Tests for UserService.
Tests user management, permissions, and password hashing.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate
from app.core.constants import UserRole, UserType
from app.core.exceptions import NotFoundException, BadRequestException

class TestUserService:
    """Test suite for UserService."""

    @pytest.fixture
    def mock_auditor(self):
        return AsyncMock()

    @pytest.fixture
    def mock_repo(self):
        repo = AsyncMock()
        # Default behavior: generic success / None
        repo.get_by_id.return_value = None
        repo.get_by_username.return_value = None
        repo.create.side_effect = lambda x: {**x, "id": "new_id"}
        repo.update.return_value = True
        repo.update_by_username.return_value = True
        repo.delete.return_value = True
        repo.count.return_value = 0
        return repo

    @pytest.fixture
    def user_service(self, mock_auditor, mock_repo):
        """Patched UserService using mocks."""
        return UserService(mock_auditor, mock_repo)

    @pytest.mark.asyncio
    async def test_create_user(self, user_service, mock_admin_user, mock_auditor, mock_repo):
        """Test creating a new user with audit logging."""
        user_data = UserCreate(
            username="newuser",
            password="password123",
            role=UserRole.USER,
            user_type=UserType.LOCAL
        )
        
        result = await user_service.create_user(
            user_data=user_data,
            created_by=mock_admin_user["username"],
            creator_role=mock_admin_user["role"]
        )
        
        assert result["username"] == "newuser"
        # Since repo.create returns the dict directly, password_hash might be there if repo doesn't strip it? 
        # But UserService strips it: created_user.pop("password_hash", None)
        assert "password_hash" not in result 
        
        # Verify auditor call
        mock_auditor.log_create_user.assert_called_once()
        call_kwargs = mock_auditor.log_create_user.call_args.kwargs
        assert call_kwargs["actor"] == mock_admin_user["username"]
        assert call_kwargs["target_user"] == "newuser"
        
        # Verify repo create call
        mock_repo.create.assert_called_once()
        user_doc_passed = mock_repo.create.call_args[0][0]
        assert user_doc_passed["username"] == "newuser"

    @pytest.mark.asyncio
    async def test_create_duplicate_user_fails(self, user_service, mock_admin_user, mock_repo):
        """Test that creating a user with existing username fails."""
        mock_repo.get_by_username.return_value = {"id": "existing_id", "username": "dup"}
        
        user_data = UserCreate(username="dup", password="password123", role=UserRole.USER, user_type=UserType.LOCAL)
        
        with pytest.raises(BadRequestException) as exc:
            await user_service.create_user(user_data, mock_admin_user["username"], UserRole.ADMIN)
        assert "כבר קיים" in str(exc.value) or "קיים" in str(exc.value)

    @pytest.mark.asyncio
    async def test_update_user(self, user_service, mock_admin_user, mock_auditor, mock_repo):
        """Test updating user fields and audit logging."""
        user_id = "target_uid"
        mock_repo.get_by_id.return_value = {
            "id": user_id, 
            "username": "update_me", 
            "role": "user",
            "permissions": []
        }
        
        # Simulating get_by_id call at the end of update_user
        mock_repo.get_by_id.side_effect = [
             {
                "id": user_id, 
                "username": "update_me", 
                "role": "user",
                "permissions": []
            },
            {
                "id": user_id, 
                "username": "update_me", 
                "role": "admin", # Updated version
                "permissions": []
            }
        ]

        # Update
        update_data = UserUpdate(role=UserRole.ADMIN)
        result = await user_service.update_user(
            user_id=user_id,
            update_data=update_data,
            updated_by=mock_admin_user["username"],
            updater_role=UserRole.SUPERADMIN
        )
        
        assert result["role"] == UserRole.ADMIN
        
        # Verify auditor call
        mock_auditor.log_update_user.assert_called_once()
        call_kwargs = mock_auditor.log_update_user.call_args.kwargs
        assert call_kwargs["actor"] == mock_admin_user["username"]
        assert "changes" in call_kwargs

    @pytest.mark.asyncio
    async def test_admin_cannot_update_superadmin(self, user_service, mock_superadmin_user, mock_repo):
        """Test that Admin cannot manage SuperAdmin users."""
        from app.core.password import hash_password
        
        mock_repo.get_by_id.return_value = {
            "id": "sa_id",
            "username": "sa",
            "password_hash": hash_password("p"),
            "role": "superadmin",
            "is_active": True
        }
        
        from fastapi import HTTPException
        # Try to update as admin
        with pytest.raises(HTTPException) as exc:
            await user_service.update_user(
                user_id="sa_id",
                update_data=UserUpdate(role=UserRole.USER),
                updated_by="some_admin",
                updater_role="admin"
            )
        assert exc.value.status_code == 403

    @pytest.mark.asyncio
    async def test_delete_user(self, user_service, mock_admin_user, mock_auditor, mock_repo):
        """Test deleting a user and audit logging."""
        mock_repo.get_by_id.return_value = {
            "id": "del_id",
            "username": "delete_me",
            "role": "user"
        }
        mock_repo.count.return_value = 10 # Plenty of admins
        
        result = await user_service.delete_user(
            user_id="del_id",
            reason="Cleanup",
            deleted_by=mock_admin_user["username"],
            deleter_role=mock_admin_user["role"]
        )
        
        assert "נמחק בהצלחה" in result["message"]
        
        mock_repo.delete.assert_called_once_with("del_id")
            
        # Verify auditor
        mock_auditor.log_delete_user.assert_called_once()
        call_kwargs = mock_auditor.log_delete_user.call_args.kwargs
        assert call_kwargs["actor"] == mock_admin_user["username"]
        assert call_kwargs["target_user"] == "delete_me"

    @pytest.mark.asyncio
    async def test_change_password(self, user_service, mock_admin_user, mock_auditor, mock_repo):
        """Test user changing their own password and audit logging."""
        from app.core.password import hash_password
        mock_repo.get_by_id.return_value = {
            "id": "u_id",
            "username": "pwd_user",
            "role": "user",
            "password_hash": hash_password("old_password")
        }
        
        await user_service.change_password(
            user_id="u_id",
            current_password="old_password",
            new_password="new_password_123"
        )
        
        # Verify repo update
        mock_repo.update.assert_called_once()
        
        # Verify auditor
        mock_auditor.log_password_change.assert_called_once()
