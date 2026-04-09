from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from datetime import datetime
import logging

from app.db.repositories.collection_repository import CollectionRepository
from app.db.repositories.items import ItemsRepository
from app.services.audit.collection_auditor import CollectionAuditor
from app.services.item_service import ItemService
from app.schemas.collection import (
    CollectionCreate, 
    CollectionUpdate, 
    CollectionRole, 
    CollectionPermission,
    PermissionType,
    CollectionItemCreate,
    CollectionItemUpdate,
    CollectionBulkItemCreate
)
from app.core.constants import UserRole

logger = logging.getLogger(__name__)

class CollectionService:
    """Service for managing component collections"""
    
    def __init__(self, repository: CollectionRepository, auditor: CollectionAuditor, items_repository: "ItemsRepository"):
        self.repository = repository
        self.auditor = auditor
        self.items_repository = items_repository
        # self.inventory_service = InventoryService() # Circular dependency risk? simplified for now.

    async def create_collection(self, data: CollectionCreate, user_id: str) -> Dict[str, Any]:
        """Create a new collection"""
        logger.info("Creating collection, name=%s, user_id=%s", data.name, user_id)
        collection_data = data.model_dump()
        collection_data["owner_id"] = user_id
        collection_data["permissions"] = [] # Start empty
        
        collection = await self.repository.create_collection(collection_data)
        
        # Audit
        await self.auditor.log_create_collection(
            user_id=user_id,
            collection_id=collection["id"],
            collection_data=collection_data
        )
        return collection

    async def get_collection(self, collection_id: str, user_id: str, user_groups: List[str] = [], user_role: Optional[str] = None) -> Dict[str, Any]:
        """Get collection if user has access"""
        collection = await self.repository.get_collection(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")
            
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        if not role:
             raise HTTPException(status_code=403, detail="Access denied")
             
        collection["role"] = role
        return collection

    async def list_collections(self, user_id: str, user_groups: List[str] = [], user_role: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all collections user has access to"""
        # For now, fetching all relevant and filtering in python might be safer/easier than complex mongo query
        # But for performance (if many collections), we should push to DB.
        # Repository `list_collections` needs update to handle this properly or we filter here.
        # Let's use the repo's efficient find but we might need two queries or complex $or.
        
        # MVP: Get all collections where owner is user, OR user/group is in permissions.
        # Implemented logic in Repo? No, repo is simple.
        # Let's fetch all (with limit) and filter? No, inefficient.
        
        # Let's trust Repository to accept a "filter" that finds:
        # { $or: [ {owner_id: user_id}, { "permissions.id": { $in: [user_id, *groups] } } ] }
        # Since I implemented a simple list in repo, let's update it or just use simple filtering for now.
        
        # Updating logic to use Client-Side filtering for MVP if dataset is small, 
        # or we update Repository to support the $or query.
        # Let's assume we update repo later or use the simple List for now.
        
        all_collections = await self.repository.list_collections(limit=1000)
        # print(f"DEBUG: list_collections fetched {len(all_collections)} total. Filtering for user={user_id}")
        accessible = []
        for col in all_collections:
            # Pass user_role=None to strictly filter by ownership/permissions
            # excluding "Admin Override" visibility in the general list.
            role = self._get_user_role(col, user_id, user_groups, user_role=None)
            # print(f"DEBUG: Collection {col.get('id')} ({col.get('name')}) -> Role: {role}")
            if role:
                col["role"] = role
                accessible.append(col)
        # print(f"DEBUG: Returning {len(accessible)} accessible collections")
        return accessible

    async def update_collection(
        self, 
        collection_id: str, 
        data: CollectionUpdate, 
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update collection details"""
        collection = await self.get_collection(collection_id, user_id, user_groups, user_role)
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        
        if role not in [CollectionRole.OWNER, CollectionRole.RW]:
            raise HTTPException(status_code=403, detail="Write permission required")
            
        update_dict = data.model_dump(exclude_unset=True)
        updated = await self.repository.update_collection(collection_id, update_dict)
        
        # Audit
        await self.auditor.log_update_collection(
            user_id=user_id,
            collection_id=collection_id,
            changes=update_dict
        )
        return updated

    async def delete_collection(self, collection_id: str, user_id: str, user_role: Optional[str] = None) -> bool:
        """Delete collection"""
        logger.info("Deleting collection, collection_id=%s, user_id=%s", collection_id, user_id)
        collection = await self.repository.get_collection(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Not found")
            
        if collection["owner_id"] != user_id and user_role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Only owner can delete")
            
        success = await self.repository.delete_collection(collection_id)
        if success:
             await self.auditor.log_delete_collection(
                user_id=user_id,
                collection_id=collection_id
            )
        return success

    # --- Items ---

    async def add_item(
        self, 
        collection_id: str, 
        item_data: CollectionItemCreate, 
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add item to collection"""
        collection = await self.get_collection(collection_id, user_id, user_groups, user_role)
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        
        if role not in [CollectionRole.OWNER, CollectionRole.RW]:
            raise HTTPException(status_code=403, detail="Write permission required")

        # Check if already exists
        existing = await self.repository.get_item_in_collection(collection_id, item_data.item_id)
        if existing:
            raise HTTPException(status_code=400, detail="Item already in collection")

        data = item_data.model_dump()
        data["collection_id"] = collection_id
        data["assigned_by"] = user_id
        
        # Fetch item details for snapshot
        try:
            item = await self.items_repository.get_by_id(item_data.item_id)
            if not item:
                 item = await self.items_repository.find_by_catalog_number(item_data.item_id)
            
            if item:
                # Snapshot key fields (User requested only SKU and Serial)
                data["catalog_number"] = item.get("catalog_number")
                data["serial"] = item.get("serial")
                # data["description"] = item.get("description") # Removed per user request
                # data["manufacturer"] = item.get("manufacturer")
                # data["location"] = item.get("location")
        except Exception as e:
            logger.warning(f"Error fetching item for snapshot: {e}")

        result = await self.repository.add_item(data)
        
        # Log to inventory audit
        try:
            item_identifier = item.get("catalog_number", item_data.item_id) if item else item_data.item_id
            
            await self.auditor.log_add_item(
                user_id=user_id,
                collection_name=collection.get('name'),
                item_identifier=item_identifier,
                item_description=item.get("description") if item else None
            )
        except Exception as e:
            logger.warning(f"Error logging collection add: {e}")

        return result

    async def bulk_add_items(
        self,
        collection_id: str,
        bulk_data: CollectionBulkItemCreate,
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add multiple items to collection"""
        collection = await self.get_collection(collection_id, user_id, user_groups, user_role)
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        
        if role not in [CollectionRole.OWNER, CollectionRole.RW]:
            raise HTTPException(status_code=403, detail="Write permission required")

        # 1. Get existing items in this collection to avoid duplicates
        existing_items = await self.repository.get_collection_items(collection_id, limit=10000) # Assuming < 10k items
        existing_ids = {str(item["item_id"]) for item in existing_items}
        
        # 2a. Bulk fetch items for snapshot
        try:
            items_map = {}
            # We have mix of IDs and potentially catalog numbers if that logic existed, 
            # but usually bulk_add receives IDs.
            # Convert to list of ObjectIds if possible or strings
            fetched_items = await self.items_repository.get_many_by_ids(list(bulk_data.item_ids))
            for item in fetched_items:
                items_map[str(item["_id"])] = item
        except Exception as e:
            logger.warning(f"Error bulk fetching items for snapshot: {e}")
            items_map = {}

        # 2. Filter out already existing and prepare data
        new_items_data = []
        added_item_ids = []
        for item_id in bulk_data.item_ids:
            if str(item_id) not in existing_ids:
                item_snapshot = items_map.get(str(item_id), {})
                
                new_items_data.append({
                    "collection_id": collection_id,
                    "item_id": item_id,
                    "custom_values": bulk_data.custom_values,
                    "assigned_by": user_id,
                    # Snapshot fields (User requested only SKU and Serial)
                    "catalog_number": item_snapshot.get("catalog_number"),
                    "serial": item_snapshot.get("serial"),
                })
                added_item_ids.append(item_id)
        
        # 3. Bulk insert
        count = await self.repository.add_items_bulk(new_items_data)
        
        # 4. Log audit for each added item
        if count > 0:
             try:
                for item_id in added_item_ids:
                    # Try finding item by ID or catalog number
                    item = await self.items_repository.get_by_id(str(item_id))
                    if not item:
                         item = await self.items_repository.find_by_catalog_number(str(item_id))

                    item_identifier = item.get("catalog_number", str(item_id)) if item else str(item_id)
                    
                    await self.auditor.log_add_item(
                        user_id=user_id,
                        collection_name=collection.get('name'),
                        item_identifier=item_identifier,
                        item_description=item.get("description") if item else None
                    )

             except Exception as e:
                logger.warning(f"Error logging bulk collection add: {e}")

        return {
            "requested": len(bulk_data.item_ids),
            "added": count,
            "skipped": len(bulk_data.item_ids) - count
        }

    async def remove_items_bulk(
        self,
        collection_id: str,
        item_ids: List[str],
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Remove multiple items from collection"""
        collection = await self.get_collection(collection_id, user_id, user_groups, user_role)
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        
        if role not in [CollectionRole.OWNER, CollectionRole.RW]:
             raise HTTPException(status_code=403, detail="Write permission required")

        deleted_count = await self.repository.remove_items_bulk(collection_id, item_ids)
        
        if deleted_count > 0:
             # Log generic bulk action
             await self.auditor.log_update_collection(
                user_id=user_id,
                collection_id=collection_id,
                changes={"deleted_items_count": deleted_count, "deleted_ids": item_ids[:50]}
            )

        return {
            "requested": len(item_ids),
            "deleted": deleted_count
        }

    async def remove_item(
        self, 
        collection_id: str, 
        item_id: str, 
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> bool:
        """Remove item from collection"""
        collection = await self.get_collection(collection_id, user_id, user_groups, user_role)
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        
        if role not in [CollectionRole.OWNER, CollectionRole.RW]:
             raise HTTPException(status_code=403, detail="Write permission required")

        result = await self.repository.remove_item(collection_id, item_id)
        
        if result:
            try:
                # Find item to get catalog number for log
                item = await self.items_repository.get_by_id(item_id)
                if not item:
                     item = await self.items_repository.find_by_catalog_number(item_id)
                
                item_identifier = item.get("catalog_number", item_id) if item else item_id
                
                await self.auditor.log_remove_item(
                    user_id=user_id,
                    collection_name=collection.get('name'),
                    item_identifier=item_identifier,
                    item_description=item.get("description") if item else None
                )
            except Exception as e:
                logger.warning(f"Error logging collection remove: {e}")
                
        return result

    async def get_collection_items(
        self, 
        collection_id: str, 
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """List items in collection with full inventory details"""
        await self.get_collection(collection_id, user_id, user_groups, user_role) # Check access
        
        items = await self.repository.get_collection_items(collection_id)
        
        enriched_items = []
        for item in items:
            item_id = item["item_id"]

            
            # Try to find by _id first (as ObjectId)
            inventory_item = await self.items_repository.get_by_id(str(item_id))
            
            # If not found by _id, try by catalog_number
            if not inventory_item:
                 inventory_item = await self.items_repository.find_by_catalog_number(str(item_id))

            
            if inventory_item:
                # Merge inventory data with collection data
                enriched_item = {
                    "id": item.get("id"),  # Add id from collection_items
                    "collection_id": collection_id,  # Add collection_id
                    "item_id": item_id,
                    "custom_values": item.get("custom_values", {}),
                    "assigned_at": item.get("assigned_at"),
                    "assigned_by": item.get("assigned_by"),
                    # Add all inventory fields
                    "catalog_number": inventory_item.get("catalog_number"),
                    "serial": inventory_item.get("serial"),
                    "description": inventory_item.get("description"),
                    "manufacturer": inventory_item.get("manufacturer"),
                    "location": inventory_item.get("location"),
                    "current_stock": inventory_item.get("current_stock"),
                    "warranty_expiry": inventory_item.get("warranty_expiry"),
                    "project_allocations": inventory_item.get("project_allocations"),
                    "target_site": inventory_item.get("target_site"),
                    "purpose": inventory_item.get("purpose"),
                    "notes": inventory_item.get("notes"),
                }

                enriched_items.append(enriched_item)
            else:
                # Item not found in inventory - try to use snapshot data
                # If snapshot data exists (catalog_number is in item), use it.
                snapshot_sku = item.get("catalog_number")
                
                if snapshot_sku:
                     enriched_item = {
                        "id": item.get("id"),
                        "collection_id": collection_id,
                        "item_id": item_id,
                        "custom_values": item.get("custom_values", {}),
                        "assigned_at": item.get("assigned_at"),
                        "assigned_by": item.get("assigned_by"),
                        # Snapshot values
                        "catalog_number": snapshot_sku,
                        "serial": item.get("serial", "-"),
                        # Non-snapshotted fields as placeholders (Description not saved per user request)
                        "description": "[פריט נמחק]", 
                        "manufacturer": "-",
                        "location": "-",
                        "current_stock": None,
                        "warranty_expiry": None,
                        "project_allocations": None,
                        "target_site": "-",
                        "purpose": "-",
                        "notes": "פריט זה נמחק מהמלאי (מוצג מידע חלקי)",
                    }
                else:
                    # Fallback for old items without snapshot
                    enriched_item = {
                        "id": item.get("id"),  # Add id from collection_items
                        "collection_id": collection_id,  # Add collection_id
                        "item_id": item_id,
                        "custom_values": item.get("custom_values", {}),
                        "assigned_at": item.get("assigned_at"),
                        "assigned_by": item.get("assigned_by"),
                        # Placeholder values
                        "catalog_number": f"[נמחק - {str(item_id)[:8]}...]",
                        "serial": "-",
                        "description": "[פריט זה נמחק מהמלאי]",
                        "manufacturer": "-",
                        "location": "-",
                        "current_stock": None,
                        "warranty_expiry": None,
                        "project_allocations": None,
                        "target_site": "-",
                        "purpose": "-",
                        "notes": "פריט זה לא נמצא במלאי - ייתכן שנמחק",
                    }
                enriched_items.append(enriched_item)
        
        return enriched_items


    async def export_collection(
        self,
        collection_id: str,
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ):
        """Export collection items to Excel"""
        from app.core.excel_parser import ExcelParser
        
        # Reuse existing logic to get fully enriched items, which includes permission checks
        items = await self.get_collection_items(collection_id, user_id, user_groups, user_role)
        
        if not items:
            from app.core.exceptions import ExcelFileException
            raise ExcelFileException("לא נמצאו פריטים לאוסף זה")
            
        return ExcelParser.generate_inventory_excel(items)


    async def update_item_custom_values(
        self,
        collection_id: str,
        item_id: str,
        data: CollectionItemUpdate,
        user_id: str,
        user_groups: List[str] = [],
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update items custom values"""
        collection = await self.get_collection(collection_id, user_id, user_groups, user_role)
        role = self._get_user_role(collection, user_id, user_groups, user_role)
        if role not in [CollectionRole.OWNER, CollectionRole.RW]:
             raise HTTPException(status_code=403, detail="Write permission required")
             
        update_dict = data.model_dump(exclude_unset=True)
        return await self.repository.update_item(collection_id, item_id, update_dict)

    # --- Permissions ---

    def _get_user_role(self, collection: Dict[str, Any], user_id: str, user_groups: List[str], user_role: Optional[str] = None) -> Optional[str]:
        """Determine user's role in collection"""
        
        # Admin Override
        if user_role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            return CollectionRole.OWNER

        owner_id = str(collection.get("owner_id"))
        if owner_id.lower() == str(user_id).lower():
            return CollectionRole.OWNER
            
        # Check permissions
        permissions = collection.get("permissions", [])
        
        # 1. User specific permission
        for perm in permissions:
            perm_id = str(perm["id"])
            match = perm["type"] == PermissionType.USER and perm_id.lower() == str(user_id).lower()
            if match:
                return perm["level"]
                
        # 2. Group permissions (Take the highest if multiple?)
        # For simple logic: return first match or RW if found.
        role = None
        # Normalize user groups for comparison
        normalized_groups = [str(g).lower() for g in user_groups]
        
        for perm in permissions:
            if perm["type"] == PermissionType.GROUP:
                perm_id = str(perm["id"])
                match = perm_id.lower() in normalized_groups
                if match:
                    if perm["level"] == CollectionRole.RW:
                        return CollectionRole.RW
                    role = CollectionRole.RO # At least RO
            
        return role

    async def update_permissions(
        self, 
        collection_id: str, 
        permission: CollectionPermission, 
        user_id: str,
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Add/Update permission"""
        collection = await self.repository.get_collection(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Not found")
            
        if collection["owner_id"] != user_id and user_role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Only owner can manage permissions")
            
        # Logic to update the permissions list in the doc
        current_perms = collection.get("permissions", [])
        
        # Remove existing for this target (case-insensitive check)
        current_perms = [
            p for p in current_perms 
            if not (p["type"] == permission.type and str(p["id"]).lower() == str(permission.id).lower())
        ]
        
        # Add new
        current_perms.append(permission.model_dump())
        
        updated = await self.repository.update_collection(collection_id, {"permissions": current_perms})
        return updated

    async def remove_permission(
        self, 
        collection_id: str, 
        target_id: str, 
        user_id: str,
        user_role: Optional[str] = None
    ) -> Dict[str, Any]:
        """Remove permission"""
        collection = await self.repository.get_collection(collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Not found")
            
        if collection["owner_id"] != user_id and user_role not in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            raise HTTPException(status_code=403, detail="Only owner can manage permissions")
            
        current_perms = collection.get("permissions", [])
        
        # Filter out permission for target_id (case-insensitive)
        new_perms = [p for p in current_perms if str(p["id"]).lower() != str(target_id).lower()]
        
        updated = await self.repository.update_collection(collection_id, {"permissions": new_perms})
        return updated
