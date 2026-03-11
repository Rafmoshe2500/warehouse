from typing import Optional, Dict, Any
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction
from app.core.constants import UserRole

class ProcurementAuditor:
    """Handles audit logging logic for Procurement operations."""

    def __init__(self, audit_service: AuditService):
        self.audit_service = audit_service

    async def log_create_order(self, username: str, order_id: str, order_data: Dict[str, Any]):
        """Logs the creation of a new procurement order."""
        await self.audit_service.log_user_action(
            action=AuditAction.PROCUREMENT_CREATE,
            actor=username,
            actor_role=UserRole.ADMIN,  # Assuming admin or authorized user
            target_resource="procurement_order",
            resource_id=order_id,
            changes=order_data
        )

    async def log_update_order(self, username: str, order_id: str, changes: Dict[str, Any]):
        """Logs an update to a procurement order."""
        await self.audit_service.log_user_action(
            action=AuditAction.PROCUREMENT_UPDATE,
            actor=username,
            actor_role="unknown", # user_role is usually not passed in update context easily, keeping generic or "unknown"
            target_resource="procurement_order",
            resource_id=order_id,
            changes=changes
        )

    async def log_delete_order(self, username: str, order_id: str, reason: str = "Deleted by user"):
        """Logs the deletion of a procurement order."""
        await self.audit_service.log_user_action(
            action=AuditAction.PROCUREMENT_DELETE,
            actor=username,
            actor_role="unknown",
            target_resource="procurement_order",
            resource_id=order_id,
            reason=reason
        )

    async def log_upload_file(self, username: str, order_id: str, filename: str):
        """Logs a file upload to an order."""
        await self.audit_service.log_user_action(
            action=AuditAction.PROCUREMENT_FILE_UPLOAD,
            actor=username,
            actor_role="unknown",
            target_resource="procurement_order",
            resource_id=order_id,
            changes={"filename": filename}
        )

    async def log_delete_file(self, username: str, order_id: str, filename: str):
        """Logs a file deletion from an order."""
        await self.audit_service.log_user_action(
            action=AuditAction.PROCUREMENT_FILE_DELETE,
            actor=username,
            actor_role="unknown",
            target_resource="procurement_order",
            resource_id=order_id,
            changes={"filename": filename}
        )

    async def delete_all_order_logs(self, order_id: str):
        """Deletes all audit logs associated to a specific procurement order."""
        await self.audit_service.delete_resource_logs(
            target_resource="procurement_order",
            resource_id=order_id
        )
