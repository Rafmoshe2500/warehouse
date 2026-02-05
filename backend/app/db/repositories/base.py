from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId

from app.core.exceptions import InvalidItemIdException

class BaseRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    def _validate_object_id(self, item_id: str) -> ObjectId:
        """המרת string ל-ObjectId עם validation"""
        try:
            return ObjectId(item_id)
        except Exception:
            raise InvalidItemIdException(item_id)

    async def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """קבלת מסמך לפי ID"""
        object_id = self._validate_object_id(item_id)
        return await self.collection.find_one({"_id": object_id})

    async def get_all(
        self,
        query: Dict[str, Any] = {},
        skip: int = 0,
        limit: int = 100,
        sort_field: str = "updated_at",
        sort_direction: int = -1
    ) -> List[Dict[str, Any]]:
        """קבלת כל המסמכים עם פילטור ו-pagination"""
        cursor = self.collection.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)

    async def count(self, query: Dict[str, Any] = {}) -> int:
        """ספירת מסמכים"""
        return await self.collection.count_documents(query)

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """יצירת מסמך חדש"""
        result = await self.collection.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return data

    async def update(self, item_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """עדכון מסמך"""
        object_id = self._validate_object_id(item_id)
        await self.collection.update_one({"_id": object_id}, {"$set": data})
        return await self.get_by_id(item_id)

    async def update_many(self, query: Dict[str, Any], data: Dict[str, Any]) -> int:
        """עדכון מרובה"""
        result = await self.collection.update_many(query, {"$set": data})
        return result.modified_count

    async def delete(self, item_id: str) -> bool:
        """מחיקת מסמך"""
        object_id = self._validate_object_id(item_id)
        result = await self.collection.delete_one({"_id": object_id})
        return result.deleted_count > 0

    async def delete_many(self, query: Dict[str, Any] = {}) -> int:
        """מחיקה מרובה"""
        result = await self.collection.delete_many(query)
        return result.deleted_count
