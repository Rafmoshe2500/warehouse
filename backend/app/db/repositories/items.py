from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime, timedelta
from bson import ObjectId

if TYPE_CHECKING:
    from app.schemas.item import ItemFilter


from app.db.repositories.base import BaseRepository
from app.core.exceptions import ItemNotFoundException


class ItemsRepository(BaseRepository):

    def _serialize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        if item and "_id" in item:
            item["_id"] = str(item["_id"])
        return item

    async def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        item = await super().get_by_id(item_id)
        return self._serialize_item(item) if item else None

    async def get_by_id_or_raise(self, item_id: str) -> Dict[str, Any]:
        item = await self.get_by_id(item_id)
        if not item:
            raise ItemNotFoundException(item_id)
        return item

    async def find_by_serial(self, serial: str) -> Optional[Dict[str, Any]]:
        """מציאת פריט לפי מספר סריאלי (בדיוק מושלם)"""
        item = await self.collection.find_one({"serial": serial})
        return self._serialize_item(item) if item else None

    async def find_by_catalog_number(self, catalog_number: str) -> Optional[Dict[str, Any]]:
        """מציאת פריט לפי מק"ט"""
        item = await self.collection.find_one({"catalog_number": catalog_number})
        return self._serialize_item(item) if item else None

    async def find_by_catalog_and_location(self, catalog_number: str, location: str) -> Optional[Dict[str, Any]]:
        """
        מציאת פריט לפי שילוב של מק"ט ומיקום.
        משמש ליבוא אקסל כאשר אין סריאלי.
        """
        # חיפוש מדויק (Case Insensitive למיקום יכול להיות נחמד, אבל נשמור פשוט כרגע)
        item = await self.collection.find_one({
            "catalog_number": catalog_number,
            "location": location
        })
        return self._serialize_item(item) if item else None

    async def search(
            self,
            filter_params: "ItemFilter"
    ) -> tuple[List[Dict[str, Any]], int]:

        from app.db.utils.query_builder import MongoQueryBuilder

        query = MongoQueryBuilder.build_search_query(filter_params)

        total = await self.count(query)

        cursor = self.collection.find(query)

        if filter_params.sort_by:
            direction = 1 if filter_params.sort_order == "asc" else -1
            cursor = cursor.sort(filter_params.sort_by, direction)
        else:
            cursor = cursor.sort("updated_at", -1)

        cursor = cursor.skip((filter_params.page - 1) * filter_params.limit).limit(filter_params.limit)
        items = await cursor.to_list(length=filter_params.limit)

        for item in items:
            item["_id"] = str(item["_id"])

        return items, total

    async def get_many_by_ids(self, item_ids: List[str]) -> List[Dict[str, Any]]:
        object_ids = [self._validate_object_id(item_id) for item_id in item_ids]
        cursor = self.collection.find({"_id": {"$in": object_ids}})
        items = await cursor.to_list(length=None)
        for item in items:
            item["_id"] = str(item["_id"])
        return items

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        result = await self.collection.insert_one(data)
        data["_id"] = str(result.inserted_id)
        return data

    async def update(self, item_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        object_id = self._validate_object_id(item_id)
        await self.collection.update_one({"_id": object_id}, {"$set": data})
        updated_item = await self.collection.find_one({"_id": object_id})
        return self._serialize_item(updated_item) if updated_item else None

    async def bulk_update_by_ids(
            self,
            item_ids: List[str],
            update_data: Dict[str, Any]
    ) -> tuple[List[Dict[str, Any]], int]:
        object_ids = [self._validate_object_id(item_id) for item_id in item_ids]
        items_before = await self.get_many_by_ids(item_ids)

        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.update_many(
            {"_id": {"$in": object_ids}},
            {"$set": update_data}
        )

        return items_before, result.modified_count

    async def bulk_delete_by_ids(self, item_ids: List[str]) -> tuple[List[Dict[str, Any]], int]:
        items_before = await self.get_many_by_ids(item_ids)
        object_ids = [self._validate_object_id(item_id) for item_id in item_ids]
        result = await self.collection.delete_many({"_id": {"$in": object_ids}})
        return items_before, result.deleted_count

    async def delete_many(self, query: Dict[str, Any]) -> int:
        result = await self.collection.delete_many(query)
        return result.deleted_count

    async def delete(self, item_id: str) -> bool:
        object_id = self._validate_object_id(item_id)
        result = await self.collection.delete_one({"_id": object_id})
        return result.deleted_count > 0

    async def get_stale_items(
            self,
            days: int = 30,
            page: int = 1,
            limit: int = 30
    ) -> tuple[List[Dict[str, Any]], int]:
        """מציאת פריטים שלא עודכנו במשך יותר מ-X ימים"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        query = {"updated_at": {"$lt": cutoff_date}}
        
        total = await self.count(query)
        
        cursor = self.collection.find(query).sort("updated_at", 1).skip((page - 1) * limit).limit(limit)
        items = await cursor.to_list(length=limit)
        
        for item in items:
            item["_id"] = str(item["_id"])
            
        return items, total

    async def update_allocations_by_location(
            self,
            catalog_number: str,
            location: str,
            project_allocations: Dict[str, Any],
            reserved_stock: str
    ) -> int:
        """עדכון הקצאות ושריון לכל הפריטים (סריאליים ולא סריאליים) באותו מיקום ומק"ט"""
        result = await self.collection.update_many(
            {"catalog_number": catalog_number, "location": location},
            {
                "$set": {
                    "project_allocations": project_allocations,
                    "reserved_stock": reserved_stock,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count


