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
