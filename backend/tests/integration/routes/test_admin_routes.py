"""
Integration tests for Admin API routes.
"""
import pytest
from app.core.constants import UserRole

@pytest.mark.asyncio
class TestAdminRoutes:
    """API tests for /admin endpoints."""

    async def test_get_users_route(self, async_client, test_users_collection):
        """GET /api/admin/users - List all users."""
        response = await async_client.get("/api/admin/users")
        assert response.status_code == 200
        assert "users" in response.json()

    async def test_create_user_route(self, async_client, test_users_collection):
        """POST /api/admin/users - Create user."""
        user_data = {
            "username": "api_new_user",
            "password": "password123",
            "role": UserRole.USER.value
        }
        response = await async_client.post("/api/admin/users", json=user_data)
        
        assert response.status_code == 200
        assert response.json()["username"] == "api_new_user"

    async def test_update_user_route(self, async_client, test_users_collection):
        """PUT /api/admin/users/{id} - Update user."""
        # Create user
        from bson import ObjectId
        from datetime import datetime
        u_id = ObjectId()
        await test_users_collection.insert_one({
            "_id": u_id,
            "username": "to_update",
            "role": "user",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        response = await async_client.put(f"/api/admin/users/{str(u_id)}", json={"username": "updated_name"})
        assert response.status_code == 200
        assert response.json()["username"] == "updated_name"

    async def test_delete_user_route(self, async_client, test_users_collection):
        """DELETE /api/admin/users/{id} - Delete user."""
        from bson import ObjectId
        from datetime import datetime
        u_id = ObjectId()
        await test_users_collection.insert_one({
            "_id": u_id,
            "username": "to_delete",
            "role": "user",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        # Need at least one other admin to avoid "cannot delete last admin" error
        await test_users_collection.insert_one({
            "username": "other_admin",
            "role": "admin",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        response = await async_client.request(
            "DELETE", 
            f"/api/admin/users/{str(u_id)}", 
            json={"reason": "API delete test"}
        )
        assert response.status_code == 200

    async def test_get_user_stats_route(self, async_client, test_users_collection):
        """GET /api/admin/stats - User statistics."""
        response = await async_client.get("/api/admin/stats")
        assert response.status_code == 200
        assert "total_users" in response.json()
