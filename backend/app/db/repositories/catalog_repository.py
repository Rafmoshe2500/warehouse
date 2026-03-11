from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime, timezone

if TYPE_CHECKING:
    from app.schemas.catalog import CatalogFilter

from app.db.repositories.base import BaseRepository
from app.db.mongodb import MongoDB

class CatalogRepository(BaseRepository):
    def __init__(self, collection):
        super().__init__(collection)
        self.items_collection = MongoDB.get_collection("inventory")

    def _serialize_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        if item and "_id" in item:
            item["_id"] = str(item["_id"])
        return item

    async def upsert(self, catalog_number: str, description: Optional[str] = None, manufacturer: Optional[str] = None):
        """Upsert a catalog item when a new inventory item is added."""
        if not catalog_number:
            return  # Sometimes imports might be missing catalog_number, though it shouldn't happen.
            
        update_doc = {
            "$set": {
                "updated_at": datetime.now(timezone.utc)
            }
        }
        
        set_fields = {}
        if description:
            set_fields["description"] = description
        if manufacturer:
            set_fields["manufacturer"] = manufacturer
            
        if set_fields:
            update_doc["$set"].update(set_fields)
            
        update_doc["$setOnInsert"] = {
            "catalog_number": catalog_number,
            "created_at": datetime.now(timezone.utc)
        }

        await self.collection.update_one(
            {"catalog_number": catalog_number},
            update_doc,
            upsert=True
        )

    async def search(self, filter_params: "CatalogFilter") -> tuple[List[Dict[str, Any]], int]:
        match_stage = {}
        
        if filter_params.search:
            regex = {"$regex": filter_params.search, "$options": "i"}
            match_stage["$or"] = [
                {"catalog_number": regex},
                {"description": regex},
                {"manufacturer": regex}
            ]
            
        if filter_params.catalog_number:
            match_stage["catalog_number"] = {"$regex": filter_params.catalog_number, "$options": "i"}
        if filter_params.description:
            match_stage["description"] = {"$regex": filter_params.description, "$options": "i"}
        if filter_params.manufacturer:
            match_stage["manufacturer"] = {"$regex": filter_params.manufacturer, "$options": "i"}

        # Total count
        total = await self.count(match_stage)

        # Pagination and sorting
        sort_field = filter_params.sort_by or "catalog_number"
        sort_direction = 1 if filter_params.sort_order == "asc" else -1
        skip = (filter_params.page - 1) * filter_params.limit

        pipeline = [
            {"$match": match_stage},
            {"$sort": {sort_field: sort_direction}},
            {"$skip": skip},
            {"$limit": filter_params.limit},
            # Lookup total stock from items
            {
                "$lookup": {
                    "from": "inventory",
                    "let": {"cat_num": "$catalog_number"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$catalog_number", "$$cat_num"]}}}
                    ],
                    "as": "inventory_items"
                }
            },
            {
                "$addFields": {
                    "total_in_stock": {
                        "$reduce": {
                            "input": "$inventory_items",
                            "initialValue": 0,
                            "in": {
                                "$add": [
                                    "$$value",
                                    {
                                        "$cond": {
                                            "if": {"$isNumber": "$$this.current_stock"},
                                            "then": "$$this.current_stock",
                                            "else": {
                                                "$convert": {
                                                    "input": "$$this.current_stock",
                                                    "to": "int",
                                                    "onError": 0,
                                                    "onNull": 0
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    "inventory_items": 0
                }
            }
        ]

        cursor = self.collection.aggregate(pipeline)
        items = await cursor.to_list(length=filter_params.limit)
        
        for item in items:
            self._serialize_item(item)
            
        return items, total
