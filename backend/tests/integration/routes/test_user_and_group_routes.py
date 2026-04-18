import pytest

@pytest.mark.asyncio
class TestUserAndGroupRoutes:
    
    async def test_search_users(self, async_client, test_users_collection):
        # Insert some test users
        from datetime import datetime, timezone
        await test_users_collection.insert_many([
            {
                "username": "johndoe",
                "email": "john@example.com",
                "role": "user",
                "is_active": True,
                "user_type": "local",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "username": "janedoe",
                "role": "admin",
                "is_active": True,
                "user_type": "local",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ])
        
        # Search by username
        res1 = await async_client.get("/api/users/search?q=john")
        assert res1.status_code == 200
        data1 = res1.json()
        assert len(data1) == 1
        assert data1[0]["username"] == "johndoe"
        
        # Search minimal
        res2 = await async_client.get("/api/users/search?q=doe")
        assert res2.status_code == 200
        data2 = res2.json()
        assert len(data2) == 2

    async def test_search_groups(self, async_client, test_groups_collection):
        from datetime import datetime, timezone
        await test_groups_collection.insert_many([
            {
                "name": "Administrators",
                "type": "AD",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "name": "Developers",
                "type": "local",
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }
        ])
        
        res = await async_client.get("/api/users/groups/search?q=Admin")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["name"] == "Administrators"

    # ------------------------------------------------------------------ #
    #  Group CRUD via /admin/groups                                        #
    # ------------------------------------------------------------------ #

    async def test_list_groups(self, async_client):
        """GET /admin/groups - Admin gets list of groups."""
        res = await async_client.get("/api/admin/groups")
        assert res.status_code == 200
        data = res.json()
        assert "groups" in data or isinstance(data, list)

    async def test_create_group(self, async_client):
        """POST /admin/groups - Admin creates a new group."""
        payload = {"name": "TestGroup", "role": "user"}
        res = await async_client.post("/api/admin/groups", json=payload)
        assert res.status_code == 200 or res.status_code == 201
        data = res.json()
        assert data["name"] == "TestGroup"
        assert "id" in data

    async def test_create_group_non_admin_denied(self, async_client_user):
        """POST /admin/groups - Regular user should get 403."""
        payload = {"name": "ForbiddenGroup", "role": "user"}
        res = await async_client_user.post("/api/admin/groups", json=payload)
        assert res.status_code == 403

    async def test_get_group_by_id(self, async_client):
        """GET /admin/groups/{id} - Returns the group."""
        create_res = await async_client.post("/api/admin/groups", json={"name": "GetGroup", "role": "user"})
        assert create_res.status_code in (200, 201)
        group_id = create_res.json()["id"]

        res = await async_client.get(f"/api/admin/groups/{group_id}")
        assert res.status_code == 200
        assert res.json()["id"] == group_id

    async def test_get_group_not_found(self, async_client):
        """GET /admin/groups/{id} - Returns 404 for nonexistent group."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        res = await async_client.get(f"/api/admin/groups/{fake_id}")
        assert res.status_code == 404

    async def test_update_group(self, async_client):
        """PUT /admin/groups/{id} - Updates the group name."""
        create_res = await async_client.post("/api/admin/groups", json={"name": "OldName", "role": "user"})
        assert create_res.status_code in (200, 201)
        group_id = create_res.json()["id"]

        res = await async_client.put(f"/api/admin/groups/{group_id}", json={"name": "NewName"})
        assert res.status_code == 200
        assert res.json()["name"] == "NewName"

    async def test_delete_group(self, async_client):
        """DELETE /admin/groups/{id} - Deletes a group."""
        create_res = await async_client.post("/api/admin/groups", json={"name": "ToDelete", "role": "user"})
        assert create_res.status_code in (200, 201)
        group_id = create_res.json()["id"]

        res = await async_client.request(
            "DELETE",
            f"/api/admin/groups/{group_id}",
            json={"reason": "Test cleanup"},
        )
        assert res.status_code in (200, 204)

        # Verify gone
        get_res = await async_client.get(f"/api/admin/groups/{group_id}")
        assert get_res.status_code == 404
