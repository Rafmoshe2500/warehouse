from typing import Optional, Dict, Any
from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction

class UserAuditor:
    """Handles audit logging logic for User operations."""

    def __init__(self, audit_service: AuditService):
        self.audit_service = audit_service

    async def log_create_user(self, actor: str, actor_role: str, target_user: str, target_role: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        """Logs user creation."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_CREATE,
            actor=actor,
            actor_role=actor_role,
            target_user=target_user,
            target_role=target_role,
            target_resource="user",
            ip_address=ip_address,
            user_agent=user_agent
        )

    async def log_ad_user_creation(self, username: str, role: str):
        """Logs automatic user creation from AD login."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_CREATE,
            actor="system_ad",
            actor_role="system",
            target_user=username,
            target_role=role,
            target_resource="user",
            details=f"Auto-created from AD login"
        )

    async def log_update_user(self, actor: str, actor_role: str, target_user: str, changes: Dict[str, Any]):
        """Logs user update."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_UPDATE,
            actor=actor,
            actor_role=actor_role,
            target_user=target_user,
            target_resource="user",
            changes=changes
        )

    async def log_delete_user(self, actor: str, actor_role: str, target_user: str):
        """Logs user deletion."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_DELETE,
            actor=actor,
            actor_role=actor_role,
            target_user=target_user,
            target_resource="user"
        )

    async def log_password_change(self, actor: str, actor_role: str, target_user: str):
        """Logs password change."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_UPDATE, # Or specific action? Using UPDATE for now as per UserService
            actor=actor,
            actor_role=actor_role,
            target_user=target_user,
            target_resource="user",
            details="Password changed"
        )
