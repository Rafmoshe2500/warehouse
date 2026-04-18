from fastapi import APIRouter, Depends, Request
from typing import List

from app.schemas.user import UserCreate, UserUpdate, UserResponse, UsersListResponse, DeleteRequest
from app.services.user_service import UserService
from app.core.security import get_current_user, require_admin

# All routes in this router require admin permissions — enforced at router level
router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_admin)]
)



from app.dependencies import get_user_service


@router.get("/users", response_model=UsersListResponse)
async def get_users(
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Get all users (admin only)"""
    return await user_service.get_users()


@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Create new user (admin only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    return await user_service.create_user(
        user_data=user_data,
        created_by=username,
        creator_role=role,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Get user by ID (admin only)"""
    return await user_service.get_user_by_id(user_id)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    update_data: UserUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Update user (admin only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    return await user_service.update_user(
        user_id=user_id,
        update_data=update_data,
        updated_by=username,
        updater_role=role,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    delete_data: DeleteRequest,
    request: Request,
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Delete user (admin only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    return await user_service.delete_user(
        user_id=user_id,
        reason=delete_data.reason,
        deleted_by=username,
        deleter_role=role,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )


@router.get("/stats")
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """Get user statistics for admin dashboard"""
    return await user_service.get_user_stats()

