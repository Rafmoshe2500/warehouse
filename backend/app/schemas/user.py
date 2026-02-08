from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum


from app.core.constants import UserRole, Permission, UserType


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=4)
    user_type: UserType = UserType.LOCAL
    role: UserRole = UserRole.USER
    permissions: Optional[list[str]] = []
    
    @validator('password')
    def validate_password(cls, v, values):
        if values.get('user_type') == UserType.LOCAL and not v:
            raise ValueError('Password is required for local users')
        if values.get('user_type') == UserType.ACTIVE_DIRECTORY and v:
            raise ValueError('Password should not be provided for AD users')
        return v


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    role: Optional[UserRole] = None
    permissions: Optional[list[str]] = None
    is_active: Optional[bool] = None
    user_type: Optional[UserType] = None


class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    user_type: str
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
