import pytest
from datetime import datetime
from app.core.password import hash_password
from app.core.constants import UserRole

@pytest.mark.asyncio
class TestAuthRoutes:
    """API tests for /auth endpoints."""

    async def test_login_route(self, async_client, test_db):
        """POST /auth/login - Login user."""
        # Seed user
        await test_db["test_users"].insert_one({
            "username": "api_user",
            "password_hash": hash_password("api_pass"),
            "role": UserRole.ADMIN,
            "is_active": True
        })
        
        login_data = {"username": "api_user", "password": "api_pass"}
        response = await async_client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert "access_token" in [c.name for c in async_client.cookies.jar]

    async def test_get_me_route(self, async_client):
        """GET /auth/me - Current user details."""
        # async_client fixture overrides authentication to 'test_user'
        response = await async_client.get("/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "test_user"
        assert data["role"] == UserRole.ADMIN

    async def test_logout_route(self, async_client):
        """POST /auth/logout - Logout user."""
        response = await async_client.post("/api/auth/logout")
        
        assert response.status_code == 200
        # Cookie should be deleted (or set to empty/expired)
        # Note: Depending on implementation, cookie might still be in jar but with no value or past expiry
        # But FastAPI sends Set-Cookie with empty value.
        pass

    async def test_change_password_route(self, async_client, test_db):
        """PUT /auth/password - Change own password."""
        # Patch test_user in DB
        from bson import ObjectId
        u_id = ObjectId()
        await test_db["test_users"].insert_one({
            "_id": u_id,
            "username": "test_user",
            "password_hash": hash_password("old_api_pass"),
            "role": UserRole.ADMIN,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Override mock current user to have real ID
        from app.core.security import get_current_user
        from app.main import app
        async def mock_get_current_user():
            return {"sub": "test_user", "username": "test_user", "role": UserRole.ADMIN, "user_id": str(u_id)}
        app.dependency_overrides[get_current_user] = mock_get_current_user
        
        pwd_data = {
            "current_password": "old_api_pass",
            "new_password": "new_api_pass123"
        }
        response = await async_client.put("/api/auth/password", json=pwd_data)
        
        assert response.status_code == 200
        
        # Cleanup override
        del app.dependency_overrides[get_current_user]
