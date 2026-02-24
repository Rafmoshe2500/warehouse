from typing import Dict, Any, Optional
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction

class ItemAuditor:
    """Handles audit logging logic for Item operations."""

    def __init__(self, audit_service: AuditService):
        self.audit_service = audit_service

    def _get_username(self, user: Dict[str, Any]) -> str:
        return user.get("username", user.get("sub", "unknown"))

    def _get_role(self, user: Dict[str, Any]) -> str:
        return user.get("role", "user")

    def _get_resource_name(self, item: Dict[str, Any]) -> str:
        sku = item.get("catalog_number")
        serial = item.get("serial")
        desc = item.get("description")
        
        parts = []
        if sku:
            parts.append(sku)
        if serial:
            parts.append(f"(S/N: {serial})")
        
        main_id = " ".join(parts)
        
        if main_id and desc:
            return f"{main_id} - {desc}"
        return main_id or desc or "פריט ללא מזהה"

    async def log_creation(self, user: Dict[str, Any], item: Dict[str, Any]):
        """Logs the creation of a new item."""
        # Log all relevant fields
        changes = {k: v for k, v in item.items() if k not in ["_id", "created_at", "updated_at"]}
        
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_CREATE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            target_resource_name=self._get_resource_name(item),
            changes=changes,
            details="נוסף פריט חדש למלאי"
        )

    async def log_update(self, user: Dict[str, Any], item: Dict[str, Any], changes: Dict[str, Any], details: str):
        """Logs an update to an item."""
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_UPDATE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            target_resource_name=self._get_resource_name(item),
            changes=changes,
            details=details
        )

    async def log_deletion(self, user: Dict[str, Any], item: Dict[str, Any], reason: str):
        """Logs the deletion of an item."""
        details = f"סיבת מחיקה: {reason}"
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_DELETE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            target_resource_name=self._get_resource_name(item),
            changes={},
            details=details
        )

    async def log_bulk_update_item(self, user: Dict[str, Any], item: Dict[str, Any], update_data: Dict[str, Any], description_parts: list[str]):
        """Logs a bulk update for a single item."""
        # Construct changes dict for logging
        changes_log = {}
        for key, new_val in update_data.items():
            if key == "updated_at": continue
            old_val = item.get(key, "")
            changes_log[key] = {"old": old_val, "new": new_val}

        details = f"עדכון מרובה - {', '.join(description_parts)}"
        
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_UPDATE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id=str(item.get("_id")),
            target_resource_name=self._get_resource_name(item),
            changes=changes_log,
            details=details
        )
    
    async def log_bulk_delete_item(self, user: Dict[str, Any], item: Dict[str, Any], reason: str):
         """Logs a bulk delete for a single item."""
         await self.log_deletion(user, item, reason)
    
    async def log_delete_all(self, user: Dict[str, Any], count: int, reason: str):
        """Logs deletion of all items."""
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_BULK_DELETE,
            actor=self._get_username(user),
            actor_role=self._get_role(user),
            target_resource="item",
            resource_id="ALL",
            details=f"מחיקת כל מסד הנתונים - סיבה: {reason}",
            changes={"deleted_count": count}
        )

    async def log_import_summary(self, user: str, added: int, updated: int, total: int):
        """Logs a summary of an Excel import operation."""
        await self.audit_service.log_user_action(
            action=AuditAction.ITEM_IMPORT,
            actor=user,
            actor_role="unknown",
            target_resource="item",
            resource_id="BULK_IMPORT",
            target_resource_name="Excel Import Summary",
            details=f"יבוא מאקסל: {added} נוספו, {updated} עודכנו",
            changes={"total_rows": total, "added": added, "updated": updated}
        )
