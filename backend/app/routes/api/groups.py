from fastapi import APIRouter, Depends

from app.schemas.group import GroupCreate, GroupUpdate, GroupResponse, GroupsListResponse, DeleteRequest
from app.services.group_service import GroupService
from app.services.audit_service import AuditService

def get_audit_service():
    return AuditService()
from app.core.security import require_admin

router = APIRouter(prefix="/admin/groups", tags=["Admin - Groups"])


def get_group_service():
    return GroupService()


@router.get("", response_model=GroupsListResponse)
async def get_groups(
    current_user: dict = Depends(require_admin),
    group_service: GroupService = Depends(get_group_service)
):
    """Get all groups (admin only)"""
    return await group_service.get_groups()


@router.post("", response_model=GroupResponse)
async def create_group(
    group_data: GroupCreate,
    current_user: dict = Depends(require_admin),
    group_service: GroupService = Depends(get_group_service),
    audit_service = Depends(get_audit_service)
):
    """Create new group (admin only)"""
    return await group_service.create_group(
        group_data, 
        created_by=current_user["username"], 
        creator_role=current_user["role"],
        audit_service=audit_service
    )


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: str,
    current_user: dict = Depends(require_admin),
    group_service: GroupService = Depends(get_group_service)
):
    """Get group by ID (admin only)"""
    return await group_service.get_group_by_id(group_id)


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: str,
    update_data: GroupUpdate,
    current_user: dict = Depends(require_admin),
    group_service: GroupService = Depends(get_group_service),
    audit_service = Depends(get_audit_service)
):
    """Update group (admin only)"""
    return await group_service.update_group(
        group_id, 
        update_data,
        updated_by=current_user["username"],
        updater_role=current_user["role"],
        audit_service=audit_service
    )


@router.delete("/{group_id}")
async def delete_group(
    group_id: str,
    delete_data: DeleteRequest,
    current_user: dict = Depends(require_admin),
    group_service: GroupService = Depends(get_group_service),
    audit_service = Depends(get_audit_service)
):
    """Delete group (admin only)"""
    return await group_service.delete_group(
        group_id, 
        delete_data.reason,
        deleted_by=current_user["username"],
        deleter_role=current_user["role"],
        audit_service=audit_service
    )

