from typing import Dict, Any, Optional
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction

class CollectionAuditor:
    """Handles audit logging logic for Collection operations."""

    def __init__(self, audit_service: AuditService):
        self.audit_service = audit_service

    async def log_create_collection(self, user_id: str, collection_id: str, collection_data: Dict[str, Any]):
        """Logs the creation of a new collection."""
        await self.audit_service.log_user_action(
            action=AuditAction.COLLECTION_CREATE,
            actor=user_id,
            actor_role="user", 
            target_resource="collection",
            resource_id=collection_id,
            changes=collection_data
        )

    async def log_update_collection(self, user_id: str, collection_id: str, changes: Dict[str, Any]):
        """Logs an update to a collection."""
        await self.audit_service.log_user_action(
            action=AuditAction.COLLECTION_UPDATE,
            actor=user_id,
            actor_role="user",
            target_resource="collection",
            resource_id=collection_id,
            changes=changes
        )

    async def log_delete_collection(self, user_id: str, collection_id: str):
        """Logs the deletion of a collection."""
        await self.audit_service.log_user_action(
            action=AuditAction.COLLECTION_DELETE,
            actor=user_id,
            actor_role="user",
            target_resource="collection",
            resource_id=collection_id
        )

    async def log_add_item(self, user_id: str, collection_name: str, item_identifier: str, item_description: Optional[str] = None):
        """Logs adding an item to a collection."""
        await self.audit_service.log_user_action(
            action=AuditAction.COLLECTION_ITEM_ADD,
            actor=user_id,
            actor_role="user",
            target_resource="item",
            resource_id=item_identifier,
            target_resource_name=item_description,
            details=f"שויך לאוסף: {collection_name}",
            changes={"collection_name": collection_name}
        )

    async def log_remove_item(self, user_id: str, collection_name: str, item_identifier: str, item_description: Optional[str] = None):
        """Logs removing an item from a collection."""
        await self.audit_service.log_user_action(
            action=AuditAction.COLLECTION_ITEM_REMOVE,
            actor=user_id,
            actor_role="user",
            target_resource="item",
            resource_id=item_identifier,
            target_resource_name=item_description,
            details=f"הוסר מאוסף: {collection_name}",
            changes={"collection_name": collection_name}
        )
