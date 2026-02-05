from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


from app.core.constants import UserRole, Permission


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    role: UserRole = UserRole.USER
    permissions: Optional[list[str]] = []


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    role: Optional[UserRole] = None
    permissions: Optional[list[str]] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    permissions: list[str] = []
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[str] = None  # Username of creator
    last_login: Optional[datetime] = None  # Last login timestamp

    class Config:
        from_attributes = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=4)


class UsersListResponse(BaseModel):
    users: list[UserResponse]
    total: int


class DeleteRequest(BaseModel):
    """Schema for delete request with reason"""
    reason: str = Field(..., min_length=3)
