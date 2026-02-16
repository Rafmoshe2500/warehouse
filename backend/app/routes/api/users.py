from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user
from app.services.user_service import UserService
from app.services.group_service import GroupService
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

from app.dependencies import get_user_service, get_group_service

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Search term (username or email)"),
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Search users by username or email"""
    # Security: Any authenticated user can search for other users to add them to collections
    # We might want to restrict returned fields in UserResponse if it contains sensitive data
    # For now, assumption is UserResponse is safe (id, username, email, role)
    return await user_service.search_users(q)

@router.get("/groups/search", response_model=List[dict])
async def search_groups(
    q: str = Query(..., min_length=2, description="Search term"),
    current_user: dict = Depends(get_current_user),
    group_service: GroupService = Depends(get_group_service)
):
    """Search groups by name"""
    return await group_service.search_groups(q)
