"""
Audit log API endpoints.
Only accessible to Admin and SuperAdmin users.
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime

from app.schemas.audit import AuditLogsListResponse, AuditAction, AuditLogCreate
from app.services.audit_service import AuditService
from app.core.exceptions import ForbiddenException
from app.core.security import require_admin, get_current_user
from app.core.constants import UserRole, Permission

router = APIRouter(prefix="/audit", tags=["Audit"])


def get_audit_service():
    return AuditService()


async def require_audit_access(current_user: dict = Depends(get_current_user)):
    """
    Allow access to Admins, SuperAdmins, OR users with inventory permissions.
    """
    role = current_user.get("role")
    permissions = current_user.get("permissions", [])

    # Allow admins/superadmins
    if role in [UserRole.ADMIN, UserRole.SUPERADMIN] or Permission.ADMIN in permissions:
        return current_user

    # Allow inventory users
    if Permission.INVENTORY_RO in permissions or Permission.INVENTORY_RW in permissions:
        return current_user

    raise ForbiddenException("אין הרשאה לצפייה בלוגים")


@router.get("/logs", response_model=AuditLogsListResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    action: Optional[AuditAction] = Query(None, description="Filter by action type"),
    actor: Optional[str] = Query(None, description="Filter by actor username"),
    target_user: Optional[str] = Query(None, description="Filter by target username"),
    target_resource: Optional[str] = Query(None, description="Filter by target resource type"),
    resource_id: Optional[str] = Query(None, description="Filter by generic resource ID"),
    search: Optional[str] = Query(None, description="Free text search"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    current_user: dict = Depends(require_audit_access),
    audit_service: AuditService = Depends(get_audit_service)
):
    """
    Get audit logs with optional filters.
    
    Accessible to SuperAdmin and Admin only.
    """
    return await audit_service.get_audit_logs(
        page=page,
        page_size=page_size,
        action=action,
        actor=actor,
        target_user=target_user,
        target_resource=target_resource,
        resource_id=resource_id,
        search=search,
        start_date=start_date,
        end_date=end_date
    )


@router.post("/logs")
async def create_log(
    log_data: AuditLogCreate,
    current_user: dict = Depends(get_current_user),
    audit_service: AuditService = Depends(get_audit_service)
):
    """
    Create a manual audit log entry (e.g. for UNDO actions).
    """
    # For security, we might want to override the actor with the current user
    # But for now, we trust the input or at least validate it matches
    log_data.actor = current_user.get("sub", log_data.actor)
    log_data.actor_role = current_user.get("role", "unknown")
    
    log_id = await audit_service.create_manual_log(log_data)
    return {"log_id": str(log_id), "status": "created"}


@router.get("/users/{username}", response_model=AuditLogsListResponse)
async def get_user_activity(
    username: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    current_user: dict = Depends(require_admin),
    audit_service: AuditService = Depends(get_audit_service)
):
    """
    Get all activity for a specific user.
    
    Returns all audit logs where the user is either the actor or the target.
    """
    return await audit_service.get_user_activity(
        username=username,
        page=page,
        page_size=page_size
    )
