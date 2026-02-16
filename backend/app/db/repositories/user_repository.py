from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import MongoDB
from app.core.exceptions import NotFoundException

class UserRepository:
    def __init__(self):
        self.collection_name = "users"

    def _get_collection(self):
        return MongoDB.get_permissions_collection(self.collection_name)

    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        collection = self._get_collection()
        user = await collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["id"] = str(user.pop("_id"))
            # Keep password_hash for internal checks if needed, but usually we handle verification in service
        return user

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        collection = self._get_collection()
        user = await collection.find_one({"username": username})
        if user:
            user["id"] = str(user.pop("_id"))
        return user

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        collection = self._get_collection()
        user = await collection.find_one({"email": email})
        if user:
            user["id"] = str(user.pop("_id"))
        return user

    async def create(self, user_doc: Dict[str, Any]) -> Dict[str, Any]:
        collection = self._get_collection()
        result = await collection.insert_one(user_doc)
        user_doc["id"] = str(result.inserted_id)
        user_doc.pop("_id", None)
        return user_doc

    async def update(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        collection = self._get_collection()
        result = await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def update_by_username(self, username: str, update_data: Dict[str, Any]) -> bool:
        collection = self._get_collection()
        result = await collection.update_one(
            {"username": username},
            {"$set": update_data}
        )
        return result.modified_count > 0

    async def delete(self, user_id: str) -> bool:
        collection = self._get_collection()
        result = await collection.delete_one({"_id": ObjectId(user_id)})
        return result.deleted_count > 0
    
    async def delete_by_username(self, username: str) -> bool:
        collection = self._get_collection()
        result = await collection.delete_one({"username": username})
        return result.deleted_count > 0

    async def list_users(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        collection = self._get_collection()
        cursor = collection.find().skip(skip).limit(limit)
        users = []
        async for user in cursor:
            user["id"] = str(user.pop("_id"))
            user.pop("password_hash", None)
            users.append(user)
        return users
    
    async def list_all(self) -> List[Dict[str, Any]]:
        return await self.list_users(limit=10000) # Or specific implementation

    async def count(self, filter_query: Dict[str, Any] = {}) -> int:
        collection = self._get_collection()
        return await collection.count_documents(filter_query)

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        collection = self._get_collection()
        regex = {"$regex": query, "$options": "i"}
        cursor = collection.find({
            "$or": [
                {"username": regex},
                {"email": regex}
            ]
        }).limit(limit)
        
        users = []
        async for user in cursor:
            user["id"] = str(user.pop("_id"))
            users.append(user)
        return users
