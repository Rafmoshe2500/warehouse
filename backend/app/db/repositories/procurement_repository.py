from datetime import datetime
from typing import Optional, Dict, Any, List
from bson import ObjectId

from app.db.mongodb import MongoDB


class ProcurementRepository:
    """Repository for procurement operations"""
    
    def __init__(self):
        self.collection = MongoDB.get_collection("procurement_orders")
    
    async def create_order(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new procurement order"""
        order_doc = {
            **order_data,
            "files": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await self.collection.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id
        
        return self._format_order(order_doc)
    
    async def get_orders(
        self,
        skip: int = 0,
        limit: int = 50,
        catalog_number: Optional[str] = None,
        manufacturer: Optional[str] = None,
        status_in: Optional[List[str]] = None,
        status_ne: Optional[str] = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """Get all procurement orders with pagination and filters"""
        # Build filter
        filter_query = {}
        if catalog_number:
            filter_query["catalog_number"] = {"$regex": catalog_number, "$options": "i"}
        if manufacturer:
            filter_query["manufacturer"] = {"$regex": manufacturer, "$options": "i"}
        
        if status_in:
            filter_query["status"] = {"$in": status_in}
        elif status_ne:
            filter_query["status"] = {"$ne": status_ne}
            
        print(f"DEBUG REPO: filter_query={filter_query}, status_in={status_in}, status_ne={status_ne}")
        
        # Get total count
        total = await self.collection.count_documents(filter_query)
        
        # Get orders
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
            update_data["updated_at"] = datetime.utcnow()
            
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
                    "$set": {"updated_at": datetime.utcnow()}
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
                    "$set": {"updated_at": datetime.utcnow()}
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
