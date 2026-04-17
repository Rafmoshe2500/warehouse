"""
Repository for bom_templates collection — admin-configurable vendor BOM parsing rules.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import logging

from app.db.repositories.base import BaseRepository
from app.db.mongodb import MongoDB

logger = logging.getLogger(__name__)

COLLECTION_NAME = "bom_templates"


class BomTemplateRepository(BaseRepository):
    def __init__(self):
        collection = MongoDB.get_collection(COLLECTION_NAME)
        super().__init__(collection)

    async def get_by_format_id(self, format_id: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one({"format_id": format_id})

    async def get_by_vendor_name(self, vendor_name: str) -> Optional[Dict[str, Any]]:
        return await self.collection.find_one(
            {"vendor_name": {"$regex": f"^{vendor_name}$", "$options": "i"}}
        )

    async def get_active_templates(self) -> List[Dict[str, Any]]:
        cursor = self.collection.find({"is_active": True}).sort("vendor_name", 1)
        return await cursor.to_list(length=200)

    async def upsert_by_format_id(self, format_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        result = await self.collection.find_one_and_update(
            {"format_id": format_id},
            {
                "$set": {**data, "updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
            return_document=True,
        )
        return self._format_doc(result)

    async def deactivate(self, item_id: str) -> Optional[Dict[str, Any]]:
        doc = await self.update(item_id, {
            "is_active": False,
            "updated_at": datetime.now(timezone.utc),
        })
        return self._format_doc(doc) if doc else None

    @staticmethod
    def _format_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not doc:
            return None
        doc["id"] = str(doc.pop("_id"))
        return doc
