from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId

from app.db.mongodb import MongoDB
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionItemCreate, CollectionItemUpdate

class CollectionRepository:
    """Repository for Collection and CollectionItem operations"""
    
    def __init__(self):
        self.collections = MongoDB.get_collection("collections")
        self.items = MongoDB.get_collection("collection_items")
    
    # --- Collection Operations ---
    
    async def create_collection(self, collection_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new collection"""
        doc = {
            **collection_data,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        result = await self.collections.insert_one(doc)
        doc["_id"] = result.inserted_id
        return self._format_doc(doc)

    async def get_collection(self, collection_id: str) -> Optional[Dict[str, Any]]:
        """Get collection by ID"""
        try:
            doc = await self.collections.find_one({"_id": ObjectId(collection_id)})
            return self._format_doc(doc) if doc else None
        except Exception:
            return None

    async def list_collections(
        self, 
        owner_id: Optional[str] = None,
        group_ids: Optional[List[str]] = None,
        skip: int = 0, 
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List collections based on access (Owner OR Group access)"""
        
        # This is a simplified query. The Service layer handles the full permission logic
        # by passing the relevant user/group IDs to filter.
        
        # Logic: Show if Owner OR (Permission.id IN [user_id, group_ids...])
        # Since permissions are array of objects, complex query is needed.
        # For MVP, we might fetch more and filter in code, or use $or query.
        
        filter_query = {}
        
        # If we want to filter by specific criteria (e.g. "My Collections")
        if owner_id:
             filter_query["owner_id"] = owner_id
        
        # Note: The service will likely need a more complex query using $or to handle shared collections
        # defaulting to returning all provided query params match
        
        cursor = self.collections.find(filter_query).sort("created_at", -1).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [self._format_doc(doc) for doc in docs]

    async def update_collection(self, collection_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update collection details"""
        try:
            update_data["updated_at"] = datetime.now(timezone.utc)
            result = await self.collections.find_one_and_update(
                {"_id": ObjectId(collection_id)},
                {"$set": update_data},
                return_document=True
            )
            return self._format_doc(result) if result else None
        except Exception:
            return None

    async def delete_collection(self, collection_id: str) -> bool:
        """Delete collection and its items"""
        try:
            # 1. Delete items
            await self.items.delete_many({"collection_id": ObjectId(collection_id)})
            # 2. Delete collection
            result = await self.collections.delete_one({"_id": ObjectId(collection_id)})
            return result.deleted_count > 0
        except Exception:
            return False

    # --- Item Operations ---

    async def add_item(self, item_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add item to collection"""
        # Ensure collection_id is ObjectId
        if isinstance(item_data.get("collection_id"), str):
            item_data["collection_id"] = ObjectId(item_data["collection_id"])
            
        item_data["assigned_at"] = datetime.now(timezone.utc)
        
        # Check if already exists? Service layer should handle specific business logic, 
        # but uniqueness on (collection_id, item_id) is good practice.
        # For now, just insert.
        
        result = await self.items.insert_one(item_data)
        item_data["_id"] = result.inserted_id
        return self._format_doc(item_data)

    async def add_items_bulk(self, items_data: List[Dict[str, Any]]) -> int:
        """Add multiple items to collection"""
        if not items_data:
            return 0
            
        # Ensure collection_id is ObjectId for all
        for item in items_data:
            if isinstance(item.get("collection_id"), str):
                item["collection_id"] = ObjectId(item["collection_id"])
            item["assigned_at"] = datetime.now(timezone.utc)
            
        result = await self.items.insert_many(items_data)
        return len(result.inserted_ids)

    async def get_collection_items(self, collection_id: str, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get items in a collection"""
        try:
            cursor = self.items.find({"collection_id": ObjectId(collection_id)}).skip(skip).limit(limit)
            docs = await cursor.to_list(length=limit)
            return [self._format_doc(doc) for doc in docs]
        except Exception:
            return []
            
    async def get_item_in_collection(self, collection_id: str, item_id: str) -> Optional[Dict[str, Any]]:
        """Get specific item assignment"""
        try:
            doc = await self.items.find_one({
                "collection_id": ObjectId(collection_id),
                "item_id": item_id
            })
            return self._format_doc(doc) if doc else None
        except Exception:
            return None

    async def update_item(self, collection_id: str, item_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update item custom values in collection"""
        try:
            result = await self.items.find_one_and_update(
                {"collection_id": ObjectId(collection_id), "item_id": item_id},
                {"$set": update_data},
                return_document=True
            )
            return self._format_doc(result) if result else None
        except Exception:
            return None

    async def remove_item(self, collection_id: str, item_id: str) -> bool:
        """Remove item from collection"""
        try:
            result = await self.items.delete_one({
                "collection_id": ObjectId(collection_id),
                "item_id": item_id
            })
            return result.deleted_count > 0
        except Exception:
            return False

    async def remove_items_bulk(self, collection_id: str, item_ids: List[str]) -> int:
        """Remove multiple items from collection"""
        try:
            # Ensure item_ids are strings (or match how they are stored)
            # In add_item, item_id is stored as is (likely string from frontend)
            
            result = await self.items.delete_many({
                "collection_id": ObjectId(collection_id),
                "item_id": {"$in": item_ids}
            })
            return result.deleted_count
        except Exception as e:
            print(f"Error removing items bulk: {e}")
            return 0

    async def get_item_collections(self, item_id: str) -> List[Dict[str, Any]]:
        """Get all collections an item belongs to"""
        cursor = self.items.find({"item_id": item_id})
        docs = await cursor.to_list(length=100)
        return [self._format_doc(doc) for doc in docs]

    def _format_doc(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        """Format document for response"""
        if not doc:
            return {}
        doc["id"] = str(doc.pop("_id"))
        if "collection_id" in doc and isinstance(doc["collection_id"], ObjectId):
            doc["collection_id"] = str(doc["collection_id"])
        return doc
