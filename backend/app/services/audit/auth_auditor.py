from app.services.audit_service import AuditService
from app.schemas.audit import AuditAction

class AuthAuditor:
    """Handles audit logging logic for Authentication operations."""

    def __init__(self, audit_service: "AuditService"):
        self.audit_service = audit_service

    async def log_login(self, username: str, user_id: str, role: str, ip_address: str = None, user_agent: str = None):
        """Logs a successful login."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_LOGIN,
            actor=username,
            actor_role=role,
            target_user=username,
            target_role=role,
            resource_id=user_id,
            details="התחברות למערכת",
            ip_address=ip_address,
            user_agent=user_agent
        )

    async def log_domain_login(self, username: str, role: str, ip_address: str = None, user_agent: str = None):
        """Logs a successful domain (ADFS) login."""
        await self.audit_service.log_user_action(
            action=AuditAction.USER_DOMAIN_LOGIN,
            actor=username,
            actor_role=role,
            target_user=username,
            target_role=role,
            resource_id="ADFS",
            details="התחברות דומיין (ADFS)",
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
            details="התנתקות מהמערכת",
            ip_address=ip_address,
            user_agent=user_agent
        )
