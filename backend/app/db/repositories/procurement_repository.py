from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId

from app.db.mongodb import MongoDB


class ProcurementRepository:
    """Repository for procurement operations"""
    
    def __init__(self):
        self.collection = MongoDB.get_collection("procurement_orders")
    
    async def create_order(self, order_data: Dict[str, Any], initial_files: list = None) -> Dict[str, Any]:
        """Create new procurement order"""
        order_doc = {
            **order_data,
            "files": initial_files or [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await self.collection.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id
        
        return self._format_order(order_doc)
    
    async def get_orders(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        catalog_number: Optional[str] = None,
        manufacturer: Optional[str] = None,
        emf_number: Optional[str] = None,
        status_in: Optional[List[str]] = None,
        status_ne: Optional[str] = None,
        allowed_vendors: Optional[List[str]] = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """Get all procurement orders with pagination and filters"""
        filter_query = {}
        
        # Generic search across bom_items and emf_number
        if search:
            words = [w for w in search.strip().split() if w]
            searchable_fields = [
                "bom_items.catalog_number",
                "bom_items.product_name",
                "bom_items.description",
                "bom_items.manufacturer",
                "bom_data.groups.main.part_alias",
                "emf_number",
            ]
            if len(words) == 1:
                r = {"$regex": words[0], "$options": "i"}
                filter_query["$or"] = [{f: r} for f in searchable_fields]
            else:
                filter_query["$and"] = [
                    {"$or": [{f: {"$regex": w, "$options": "i"}} for f in searchable_fields]}
                    for w in words
                ]
        else:
            if catalog_number or manufacturer:
                bom_filter = {}
                if catalog_number:
                    bom_filter["bom_items.catalog_number"] = {"$regex": catalog_number, "$options": "i"}
                if manufacturer:
                    bom_filter["bom_items.manufacturer"] = {"$regex": manufacturer, "$options": "i"}
                filter_query.update(bom_filter)
            if emf_number:
                filter_query["emf_number"] = {"$regex": emf_number, "$options": "i"}
        
        if status_in:
            filter_query["status"] = {"$in": status_in}
        elif status_ne:
            filter_query["status"] = {"$ne": status_ne}

        # סנן לפי ספקים מותרים (None = כל, רשימה = רק אלו)
        if allowed_vendors is not None:
            # תוצאות שבו-vendor מתאימות OR הזמנות ידניות (ללא ספק)
            filter_query["$and"] = filter_query.get("$and", []) + [{
                "$or": [
                    {"bom_vendor": {"$in": allowed_vendors}},
                    {"bom_vendor": {"$exists": False}},
                    {"bom_vendor": None},
                ]
            }]
                    
        total = await self.collection.count_documents(filter_query)
        cursor = self.collection.find(filter_query).sort("order_date", -1).skip(skip).limit(limit)
        orders = await cursor.to_list(length=limit)
        
        return [self._format_order(order) for order in orders], total
    
    async def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get procurement order by ID"""
        try:
            order = await self.collection.find_one({"_id": ObjectId(order_id)})
            return self._format_order(order) if order else None
        except Exception:
            return None
    
    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update procurement order"""
        try:
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": update_data},
                return_document=True
            )
            
            return self._format_order(result) if result else None
        except Exception:
            return None
    
    async def delete_order(self, order_id: str) -> bool:
        """Delete procurement order"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(order_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    async def add_file_to_order(self, order_id: str, file_metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add file metadata to procurement order"""
        try:
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {
                    "$push": {"files": file_metadata},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                },
                return_document=True
            )
            
            return self._format_order(result) if result else None
        except Exception:
            return None
    
    async def remove_file_from_order(self, order_id: str, file_id: str) -> Optional[Dict[str, Any]]:
        """Remove file metadata from procurement order"""
        try:
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {
                    "$pull": {"files": {"file_id": file_id}},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                },
                return_document=True
            )
            
            return self._format_order(result) if result else None
        except Exception:
            return None
    
    async def get_file_metadata(self, order_id: str, file_id: str) -> Optional[Dict[str, Any]]:
        """Get specific file metadata from order"""
        order = await self.get_order_by_id(order_id)
        if not order:
            return None
        
        for file in order.get("files", []):
            if file["file_id"] == file_id:
                return file
        
        return None
    
    def _format_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """Format order document for response"""
        if not order:
            return {}
        
        order["id"] = str(order.pop("_id"))
        return order
