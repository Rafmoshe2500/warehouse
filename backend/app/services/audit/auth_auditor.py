from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction
from app.config import settings

class AuthAuditor:
    """Handles audit logging logic for Authentication operations."""

    def __init__(self, audit_service: "AuditService"):
        self.audit_service = audit_service

    async def log_login(self, username: str, user_id: str, role: str, ip_address: str = None, user_agent: str = None):
        """Logs a successful login."""
        # Respect config flag to disable login audit entries
        if not settings.AUDIT_LOG_LOGIN:
            return None

        await self.audit_service.log_user_action(
            action=AuditAction.USER_LOGIN,
            actor=username,
            actor_role=role,
            target_user=username,
            target_role=role,
            resource_id=user_id,
            details="User login",
            ip_address=ip_address,
            user_agent=user_agent
        )

    async def log_domain_login(self, username: str, role: str, ip_address: str = None, user_agent: str = None):
        """Logs a successful domain (ADFS) login."""
        if not settings.AUDIT_LOG_LOGIN:
            return None

        await self.audit_service.log_user_action(
            action=AuditAction.USER_DOMAIN_LOGIN,
            actor=username,
            actor_role=role,
            target_user=username,
            target_role=role,
            resource_id="ADFS",
            details="Domain login (ADFS)",
            ip_address=ip_address,
            user_agent=user_agent
        )

    async def log_logout(self, username: str, role: str, ip_address: str = None, user_agent: str = None):
        """Logs a user logout."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_LOGOUT,
            actor=username,
            actor_role=role,
            target_user=username,
            target_role=role,
            details="User logout",
            ip_address=ip_address,
            user_agent=user_agent
        )
