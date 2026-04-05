from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorCollection
from bson import ObjectId
import logging

from app.core.exceptions import InvalidItemIdException

logger = logging.getLogger(__name__)

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
        try:
            return await self.collection.find_one({"_id": object_id})
        except Exception as e:
            logger.error(f"Query failed: get_by_id on collection {self.collection.name} for id={item_id} - {e}")
            raise

    async def get_all(
        self,
        query: Dict[str, Any] = None,
        skip: int = 0,
        limit: int = 100,
        sort_field: str = "updated_at",
        sort_direction: int = -1
    ) -> List[Dict[str, Any]]:
        """קבלת כל המסמכים עם פילטור ו-pagination"""
        if query is None:
            query = {}
        try:
            cursor = self.collection.find(query).sort(sort_field, sort_direction).skip(skip).limit(limit)
            return await cursor.to_list(length=limit)
        except Exception as e:
            logger.error(f"Query failed: get_all on collection {self.collection.name} - {e}")
            raise

    async def count(self, query: Dict[str, Any] = None) -> int:
        """ספירת מסמכים"""
        if query is None:
            query = {}
        try:
            return await self.collection.count_documents(query)
        except Exception as e:
            logger.error(f"Query failed: count on collection {self.collection.name} - {e}")
            raise

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """יצירת מסמך חדש"""
        try:
            result = await self.collection.insert_one(data)
            # Make sure we don't mutate input aggressively if we don't need to,
            # but the existing code attached _id directly. We will preserve it.
            data["_id"] = str(result.inserted_id)
            return data
        except Exception as e:
            logger.error(f"Query failed: create on collection {self.collection.name} - {e}")
            raise

    async def update(self, item_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """עדכון מסמך"""
        object_id = self._validate_object_id(item_id)
        try:
            await self.collection.update_one({"_id": object_id}, {"$set": data})
            return await self.get_by_id(item_id)
        except Exception as e:
            logger.error(f"Query failed: update on collection {self.collection.name} for id={item_id} - {e}")
            raise

    async def update_many(self, query: Dict[str, Any], data: Dict[str, Any]) -> int:
        """עדכון מרובה"""
        try:
            result = await self.collection.update_many(query, {"$set": data})
            return result.modified_count
        except Exception as e:
            logger.error(f"Query failed: update_many on collection {self.collection.name} - {e}")
            raise

    async def delete(self, item_id: str) -> bool:
        """מחיקת מסמך"""
        object_id = self._validate_object_id(item_id)
        try:
            result = await self.collection.delete_one({"_id": object_id})
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Query failed: delete on collection {self.collection.name} for id={item_id} - {e}")
            raise

    async def delete_many(self, query: Dict[str, Any] = None) -> int:
        """מחיקה מרובה"""
        if query is None:
            query = {}
        try:
            result = await self.collection.delete_many(query)
            return result.deleted_count
        except Exception as e:
            logger.error(f"Query failed: delete_many on collection {self.collection.name} - {e}")
            raise
