from typing import Optional, List, Dict, Any, TYPE_CHECKING
from datetime import datetime

from app.db.repositories.items import ItemsRepository
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction
from app.schemas.item import ItemCreate, ItemUpdate, BulkUpdate

if TYPE_CHECKING:
    from app.schemas.item import ItemFilter


class ItemService:
    def __init__(self, items_repo: ItemsRepository, audit_service: AuditService):
        self.items_repo = items_repo
        self.audit_service = audit_service

    async def get_items(
            self,
            filter_params: "ItemFilter"
    ):
        """קבלת פריטים עם חיפוש, פילטרים ומיון"""
        from app.schemas.item import ItemFilter  # Local import to avoid circular dep if any

        items, total = await self.items_repo.search(filter_params)

        pages = (total + filter_params.limit - 1) // filter_params.limit

        return {
            "items": items,
            "total": total,
            "page": filter_params.page,
            "limit": filter_params.limit,
            "pages": pages
        }

    async def get_stale_items(self, days: int = 30, page: int = 1, limit: int = 30):
        items, total = await self.items_repo.get_stale_items(days, page, limit)
        pages = (total + limit - 1) // limit
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages
        }

    async def create_item(self, item_data: ItemCreate, user: Dict[str, Any], undo_log_id: Optional[str] = None, is_undo: bool = False):
        item_dict = item_data.dict(by_alias=False)
        item_dict["created_at"] = datetime.utcnow()
        item_dict["updated_at"] = datetime.utcnow()
        
        self._sync_reserved_stock(item_dict)

        created_item = await self.items_repo.create(item_dict)

        # Skip logging if this is an undo operation (log created separately)
        if not is_undo:
            await self._log_creation(user, created_item)
        return created_item

    async def update_item_field(self, item_id: str, update: ItemUpdate, user: Dict[str, Any], undo_log_id: Optional[str] = None, is_undo: bool = False):
        old_item = await self.items_repo.get_by_id_or_raise(item_id)
        old_value = old_item.get(update.field, "")

        update_data = {
            update.field: update.value,
            "updated_at": datetime.utcnow()
        }
        
        # If updating project_allocations, sync reserved_stock string
        if update.field == "project_allocations":
             self._sync_reserved_stock(update_data)

        updated_item = await self.items_repo.update(item_id, update_data)

        # Skip logging if this is an undo operation (log created separately)
        if not is_undo:
            changes = {update.field: {"old": old_value, "new": update.value}}
            await self._log_update(user, updated_item, f"עדכון שדה '{update.field}'", changes)
        
        return updated_item

    async def bulk_update_items(self, update: BulkUpdate, user: Dict[str, Any]):
        # Build update dictionary dynamically from all non-None fields in BulkUpdate
        # excluding 'ids' and 'field'/'value' legacy fields if they are not used
        update_data = update.dict(exclude={"ids", "field", "value"}, exclude_unset=True)
        
        changes_description = []
        for key, val in update_data.items():
            changes_description.append(f"{key} -> {val}")

        # Backward compatibility fallback
        if not update_data and update.field and update.value is not None:
             update_data[update.field] = update.value
             changes_description.append(f"{update.field} -> {update.value}")

        if not update_data:
            return {"message": "No fields to update", "modified_count": 0}
            
        # Sync reserved_stock if allocations is in update
        self._sync_reserved_stock(update_data)

        items_before, modified_count = await self.items_repo.bulk_update_by_ids(
            update.ids,
            update_data
        )

        for item in items_before:
            # Construct changes dict for logging
            changes_log = {}
            for key, new_val in update_data.items():
                if key == "updated_at": continue
                old_val = item.get(key, "")
                changes_log[key] = {"old": old_val, "new": new_val}

            details = f"עדכון מרובה - {', '.join(changes_description)}"
            await self._log_update(user, item, details, changes_log)

        return {
            "message": f"עודכנו {modified_count} פריטים",
            "modified_count": modified_count
        }

    async def delete_item(self, item_id: str, user: Dict[str, Any], reason: str):
        item = await self.items_repo.get_by_id_or_raise(item_id)
        await self.items_repo.delete(item_id)

        await self._log_deletion(user, item, f"סיבת מחיקה: {reason}")
            
        return {"message": "פריט נמחק בהצלחה"}

    async def bulk_delete_items(self, item_ids: List[str], user: Dict[str, Any], reason: str):
        items_before, deleted_count = await self.items_repo.bulk_delete_by_ids(item_ids)

        for item in items_before:
            await self._log_deletion(user, item, f"מחיקה מרובה - סיבה: {reason}")
            
        return {
            "message": f"נמחקו {deleted_count} פריטים",
            "deleted_count": deleted_count
        }

    async def delete_all_items(self, user: Dict[str, Any], reason: str):
        deleted_count = await self.items_repo.delete_many({})

        # Log via audit service (using BULK_DELETE as approximation for DELETE_ALL)
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_BULK_DELETE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id="ALL",
            details=f"מחיקת כל מסד הנתונים - סיבה: {reason}",
            changes={"deleted_count": deleted_count}
        )
        return {
            "message": f"כל מסד הנתונים נמחק! נמחקו {deleted_count} פריטים",
            "deleted_count": deleted_count
        }
    
    async def fix_all_reserved_stock(self):
        """Migration tool: Fix all items to have correct reserved_stock string from project_allocations"""
        cursor = self.items_repo.collection.find({"project_allocations": {"$exists": True, "$ne": {}}})
        count = 0
        async for item in cursor:
            allocations = item.get("project_allocations", {})
            if not isinstance(allocations, dict) or not allocations:
                continue
                
            reserved_stock_str = ", ".join([f"{k}: {v}" for k, v in allocations.items()])
            
            # Update only if different
            if item.get("reserved_stock") != reserved_stock_str:
                await self.items_repo.collection.update_one(
                    {"_id": item["_id"]},
                    {"$set": {"reserved_stock": reserved_stock_str}}
                )
                count += 1
        
        return {"message": f"Fixed reserved_stock for {count} items"}


    # --- Private Helpers ---

    def _sync_reserved_stock(self, data: Dict[str, Any]):
        """Updates reserved_stock string based on project_allocations dict if present"""
        if "project_allocations" in data:
            allocations = data["project_allocations"]
            if not allocations or not isinstance(allocations, dict):
                 data["reserved_stock"] = ""
            else:
                 # Format: "ProjectA: 5, ProjectB: 3"
                 data["reserved_stock"] = ", ".join([f"{k}: {v}" for k, v in allocations.items()])
    
    def _get_username(self, user: Dict[str, Any]) -> str:
        return user.get("username", user.get("sub", "unknown"))

    def _get_role(self, user: Dict[str, Any]) -> str:
        return user.get("role", "user")

    # --- Private Logging Helpers ---

    async def _log_creation(self, user: Dict[str, Any], item: dict):
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_CREATE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            changes={"name": item.get("name"), "description": item.get("description")},
            details="נוסף פריט חדש למלאי"
        )

    async def _log_update(self, user: Dict[str, Any], item: dict, details: str, changes: Dict):
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_UPDATE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            changes=changes,
            details=details
        )

    async def _log_deletion(self, user: Dict[str, Any], item: dict, details: str):
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_DELETE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            changes={"name": item.get("name"), "description": item.get("description")},
            details=details
        )