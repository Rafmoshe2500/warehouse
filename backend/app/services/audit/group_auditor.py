from typing import Optional, Dict, Any
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction

class GroupAuditor:
    def __init__(self, audit_service: AuditService):
        self.audit_service = audit_service

    async def log_create_group(
        self,
        actor: str,
        actor_role: str,
        group_id: str,
        group_name: str,
        changes: Dict[str, Any]
    ) -> None:
        """Log group creation"""
        await self.audit_service.log_user_action(
            action=AuditAction.GROUP_CREATE,
            actor=actor,
            actor_role=actor_role,
            target_resource="group",
            resource_id=group_id,
            details=f"נוצרה קבוצה: {group_name}",
            changes=changes
        )

    async def log_update_group(
        self,
        actor: str,
        actor_role: str,
        group_id: str,
        group_name: str,
        changes: Dict[str, Any]
    ) -> None:
        """Log group update"""
        await self.audit_service.log_user_action(
            action=AuditAction.GROUP_UPDATE,
            actor=actor,
            actor_role=actor_role,
            target_resource="group",
            resource_id=group_id,
            details=f"עודכנה קבוצה: {group_name}",
            changes=changes
        )

    async def log_delete_group(
        self,
        actor: str,
        actor_role: str,
        group_id: str,
        group_name: str,
        reason: str
    ) -> None:
        """Log group deletion"""
        await self.audit_service.log_user_action(
            action=AuditAction.GROUP_DELETE,
            actor=actor,
            actor_role=actor_role,
            target_resource="group",
            resource_id=group_id,
            details=f"נמחקה קבוצה: {group_name}",
            reason=reason
        )
