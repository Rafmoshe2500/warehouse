"""
Tests for AuthService.
Tests login, logout, and token generation with mocks.
"""
import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi import Response, Request

from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest
from app.core.exceptions import UnauthorizedException
from app.services.user_service import UserService
from app.services.group_service import GroupService
from app.services.adfs_service import ADFSService


class TestAuthService:
    """Test suite for AuthService."""

    @pytest.fixture
    def mock_user_service(self):
        return AsyncMock(spec=UserService)

    @pytest.fixture
    def mock_group_service(self):
        return AsyncMock(spec=GroupService)
        
    @pytest.fixture
    def mock_adfs_service(self):
        return AsyncMock(spec=ADFSService)

    @pytest.fixture
    def mock_auditor(self):
        return AsyncMock()

    @pytest.fixture
    def auth_service(self, mock_user_service, mock_group_service, mock_adfs_service, mock_auditor):
        return AuthService(mock_user_service, mock_group_service, mock_adfs_service, mock_auditor)

    @pytest.fixture
    def mock_request(self):
        req = MagicMock(spec=Request)
        req.client.host = "127.0.0.1"
        req.headers.get.return_value = "Test Agent"
        return req

    @pytest.mark.asyncio
    async def test_login_success(self, auth_service, mock_user_service, mock_request):
        """Test successful login returns token and sets cookie."""
        from app.core.password import hash_password
        
        # Configure mock user
        mock_user_service.get_user_by_username.return_value = {
            "id": "u_id",
            "username": "tester",
            "password_hash": hash_password("secret"),
            "role": "admin",
            "permissions": [],
            "is_active": True,
            "user_type": "local"
        }
        
        mock_response = MagicMock(spec=Response)
        login_data = LoginRequest(username="tester", password="secret")
        
        result = await auth_service.login(login_data, mock_response, mock_request)
        
        assert "access_token" in result
        assert result["token_type"] == "bearer"
        
        # Verify cookie was set
        mock_response.set_cookie.assert_called_once()
        args, kwargs = mock_response.set_cookie.call_args
        assert kwargs["key"] == "access_token"
        assert kwargs["httponly"] is True
        
        # Verify audit log called
        auth_service.auth_auditor.log_login.assert_called_once()
        call_kwargs = auth_service.auth_auditor.log_login.call_args.kwargs
        assert call_kwargs["username"] == "tester"
        assert call_kwargs["role"] == "admin"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, auth_service, mock_user_service, mock_request):
        """Test login with wrong password raises Unauthorized."""
        from app.core.password import hash_password
        mock_user_service.get_user_by_username.return_value = {
            "username": "tester",
            "password_hash": hash_password("correct"),
            "is_active": True
        }
        
        login_data = LoginRequest(username="tester", password="wrong")
        with pytest.raises(UnauthorizedException):
            await auth_service.login(login_data, MagicMock(), mock_request)

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, auth_service, mock_user_service, mock_request):
        """Test login for inactive user raises Unauthorized."""
        from app.core.password import hash_password
        mock_user_service.get_user_by_username.return_value = {
            "username": "inactive",
            "password_hash": hash_password("pass"),
            "is_active": False
        }
        
        login_data = LoginRequest(username="inactive", password="pass")
        with pytest.raises(UnauthorizedException) as exc:
            await auth_service.login(login_data, MagicMock(), mock_request)
        assert "אינו פעיל" in str(exc.value)

    @pytest.mark.asyncio
    async def test_logout(self, auth_service, mock_request):
        """Test logout deletes cookie."""
        mock_response = MagicMock(spec=Response)
        user = {"username": "tester", "role": "user"}
        
        await auth_service.logout(mock_response, user, mock_request)
        
        mock_response.delete_cookie.assert_called_once_with(key="access_token")
        
        # Verify audit log called
        auth_service.auth_auditor.log_logout.assert_called_once()
