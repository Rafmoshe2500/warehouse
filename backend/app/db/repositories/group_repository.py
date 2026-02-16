from typing import List, Optional
from bson import ObjectId
from app.db.mongodb import MongoDB

class GroupRepository:
    def __init__(self):
        self.collection = MongoDB.get_permissions_collection("groups")

    async def list_groups(self) -> List[dict]:
        """Get all groups"""
        groups = []
        async for group in self.collection.find():
            group["id"] = str(group.pop("_id"))
            groups.append(group)
        return groups

    async def get_by_id(self, group_id: str) -> Optional[dict]:
        """Get group by ID"""
        try:
            group = await self.collection.find_one({"_id": ObjectId(group_id)})
            if group:
                group["id"] = str(group.pop("_id"))
            return group
        except Exception:
            return None

    async def get_by_name(self, name: str) -> Optional[dict]:
        """Get group by name"""
        group = await self.collection.find_one({"name": name})
        if group:
            group["id"] = str(group.pop("_id"))
        return group

    async def create(self, group_data: dict) -> dict:
        """Create new group"""
        result = await self.collection.insert_one(group_data)
        group_data["id"] = str(result.inserted_id)
        group_data.pop("_id", None)
        return group_data

    async def update(self, group_id: str, update_data: dict) -> bool:
        """Update group"""
        result = await self.collection.update_one(
            {"_id": ObjectId(group_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete(self, group_id: str) -> bool:
        """Delete group"""
        result = await self.collection.delete_one({"_id": ObjectId(group_id)})
        return result.deleted_count > 0

    async def search(self, query: str, limit: int = 10) -> List[dict]:
        """Search groups by name"""
        regex = {"$regex": query, "$options": "i"}
        cursor = self.collection.find({"name": regex}).limit(limit)
        
        groups = []
        async for group in cursor:
            groups.append({
                "id": str(group["_id"]),
                "name": group["name"],
                "role": group.get("role", "user")
            })
        return groups
