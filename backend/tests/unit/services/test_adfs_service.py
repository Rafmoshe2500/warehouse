import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.services.adfs_service import ADFSService


@pytest.fixture
def adfs_service():
    return ADFSService()


@pytest.fixture
def mock_request():
    req = MagicMock()
    req.headers = {"cookie": "session=test123"}
    return req


@pytest.mark.asyncio
class TestADFSService:

    async def test_get_token_success(self, adfs_service, mock_request):
        """Test successful token exchange."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"access_token": "tok_abc", "token_type": "bearer"}
        mock_response.raise_for_status = MagicMock()

        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.return_value = mock_response
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            result = await adfs_service.get_token_from_hashed_token("hash123", mock_request)
            assert result == {"access_token": "tok_abc", "token_type": "bearer"}

    async def test_get_token_failure_returns_empty(self, adfs_service, mock_request):
        """Test that HTTP errors return empty dict."""
        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.side_effect = httpx.HTTPStatusError(
                "503", request=MagicMock(), response=MagicMock()
            )
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            result = await adfs_service.get_token_from_hashed_token("bad_hash", mock_request)
            assert result == {}

    async def test_get_user_information_success(self, adfs_service):
        """Test successful user info retrieval."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"username": "john", "email": "j@test.com"}
        mock_response.raise_for_status = MagicMock()

        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.return_value = mock_response
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            result = await adfs_service.get_user_information("tok_abc")
            assert result["username"] == "john"

    async def test_get_user_information_failure_returns_empty(self, adfs_service):
        """Test that network errors return empty dict."""
        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.side_effect = httpx.ConnectError("Connection refused")
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            result = await adfs_service.get_user_information("bad_token")
            assert result == {}

    async def test_validate_user_in_group_success(self, adfs_service):
        """Test successful group validation returns the group."""
        mock_response = MagicMock()
        mock_response.status_code = 200

        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.return_value = mock_response
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            group = {"name": "warehouse_admins", "role": "admin"}
            result = await adfs_service.validate_user_in_group("john", group)
            assert result == group

    async def test_validate_user_not_in_group(self, adfs_service):
        """Test that non-200 response returns None."""
        mock_response = MagicMock()
        mock_response.status_code = 403

        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.return_value = mock_response
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            result = await adfs_service.validate_user_in_group("john", {"name": "admins"})
            assert result is None

    async def test_validate_user_in_group_error_returns_none(self, adfs_service):
        """Test that connection errors return None."""
        with patch("app.services.adfs_service.httpx.AsyncClient") as MockClient:
            client_instance = AsyncMock()
            client_instance.get.side_effect = Exception("Network error")
            client_instance.__aenter__ = AsyncMock(return_value=client_instance)
            client_instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = client_instance

            result = await adfs_service.validate_user_in_group("john", {"name": "admins"})
            assert result is None
