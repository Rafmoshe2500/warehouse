"""
Tests for AuthService.
Tests login, logout, and token generation.
"""
import pytest
from unittest.mock import MagicMock
from fastapi import Response

from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest
from app.core.exceptions import UnauthorizedException


class TestAuthService:
    """Test suite for AuthService."""

    @pytest.fixture
    def auth_service(self, mock_mongodb):
        return AuthService()

    @pytest.mark.asyncio
    async def test_login_success(self, auth_service, mock_mongodb):
        """Test successful login returns token and sets cookie."""
        # Setup user
        from app.core.password import hash_password
        db = mock_mongodb
        users = db["test_users"]
        await users.insert_one({
            "username": "tester",
            "password_hash": hash_password("secret"),
            "role": "admin",
            "is_active": True
        })
        
        mock_response = MagicMock(spec=Response)
        login_data = LoginRequest(username="tester", password="secret")
        
        result = await auth_service.login(login_data, mock_response)
        
        assert "access_token" in result
        assert result["token_type"] == "bearer"
        
        # Verify cookie was set
        mock_response.set_cookie.assert_called_once()
        args, kwargs = mock_response.set_cookie.call_args
        assert kwargs["key"] == "access_token"
        assert kwargs["httponly"] is True

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, auth_service, mock_mongodb):
        """Test login with wrong password raises Unauthorized."""
        from app.core.password import hash_password
        users = mock_mongodb["test_users"]
        await users.insert_one({
            "username": "tester",
            "password_hash": hash_password("correct"),
            "is_active": True
        })
        
        login_data = LoginRequest(username="tester", password="wrong")
        with pytest.raises(UnauthorizedException):
            await auth_service.login(login_data, MagicMock())

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, auth_service, mock_mongodb):
        """Test login for inactive user raises Unauthorized."""
        from app.core.password import hash_password
        users = mock_mongodb["test_users"]
        await users.insert_one({
            "username": "inactive",
            "password_hash": hash_password("pass"),
            "is_active": False
        })
        
        login_data = LoginRequest(username="inactive", password="pass")
        with pytest.raises(UnauthorizedException) as exc:
            await auth_service.login(login_data, MagicMock())
        assert "אינו פעיל" in str(exc.value)

    @pytest.mark.asyncio
    async def test_logout(self, auth_service):
        """Test logout deletes cookie."""
        mock_response = MagicMock(spec=Response)
        await auth_service.logout(mock_response)
        
        mock_response.delete_cookie.assert_called_once_with(key="access_token")
