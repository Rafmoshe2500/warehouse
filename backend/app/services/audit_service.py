"""
Service for managing audit logs.
"""
from typing import List, Optional
from datetime import datetime
import logging

from app.db.repositories.audit_repository import AuditRepository
from app.schemas.audit import (
    AuditLogCreate,
    AuditLogResponse,
    AuditLogsListResponse,
    AuditAction
)

logger = logging.getLogger(__name__)


class AuditService:
    """Service for audit log operations (Unified)."""
    
    def __init__(self):
        # Unified Repository for 'warehouse-audit-logs'
        self.repository = AuditRepository()
    
    async def log_user_action(
        self,
        action: AuditAction,
        actor: str,
        actor_role: str,
        target_user: Optional[str] = None,
        target_role: Optional[str] = None,
        target_resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        changes: Optional[dict] = None,
        reason: Optional[str] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """Create an audit log entry for a user action."""
        audit_data = AuditLogCreate(
            action=action,
            actor=actor,
            actor_role=actor_role,
            target_user=target_user,
            target_role=target_role,
            target_resource=target_resource,
            resource_id=resource_id,
            changes=changes,
            reason=reason,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        # Write to unified collection
        log_id = await self.repository.create_audit_log(audit_data)
        
        logger.info(
            f"Audit log created: {action} by {actor} "
            f"{f'on {target_user}' if target_user else ''}"
            f"{f' resource {target_resource}:{resource_id}' if target_resource else ''}"
        )
        
        return log_id
    
    async def create_manual_log(self, log_data: AuditLogCreate) -> str:
        """Create a manual audit log entry (e.g. for UNDO actions)."""
        # Ensure timestamp is set if not provided (it's set in repo, but good practice)
        return await self.repository.create_audit_log(log_data)

    async def get_audit_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        action: Optional[AuditAction] = None,
        actor: Optional[str] = None,
        target_user: Optional[str] = None,
        target_resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> AuditLogsListResponse:
        """Get paginated audit logs from the unified collection."""
        skip = (page - 1) * page_size
        
        logs, total = await self.repository.get_audit_logs(
            skip=skip,
            limit=page_size,
            action=action,
            actor=actor,
            target_user=target_user,
            target_resource=target_resource,
            resource_id=resource_id,
            search=search,
            start_date=start_date,
            end_date=end_date
        )
        
        log_responses = [AuditLogResponse(**log) for log in logs]
        
        return AuditLogsListResponse(
            logs=log_responses,
            total=total,
            page=page,
            page_size=page_size
        )
    
    async def get_user_activity(
        self,
        username: str,
        page: int = 1,
        page_size: int = 50
    ) -> AuditLogsListResponse:
        """Get all activity for a specific user."""
        skip = (page - 1) * page_size
        
        logs, total = await self.repository.get_user_activity(
            username=username,
            skip=skip,
            limit=page_size
        )
        
        log_responses = [AuditLogResponse(**log) for log in logs]
        
        return AuditLogsListResponse(
            logs=log_responses,
            total=total,
            page=page,
            page_size=page_size
        )
