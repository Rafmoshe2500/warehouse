from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class GroupCreate(BaseModel):
    """Schema for creating a new group - no password required"""
    name: str = Field(..., min_length=2, max_length=100)
    role: Optional[str] = "user"
    permissions: Optional[list[str]] = []


class GroupUpdate(BaseModel):
    """Schema for updating a group"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    role: Optional[str] = None
    permissions: Optional[list[str]] = None
    is_active: Optional[bool] = None


class GroupResponse(BaseModel):
    """Schema for group response"""
    id: str
    name: str
    role: str = "user"
    permissions: list[str] = []
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GroupsListResponse(BaseModel):
    """Schema for groups list response"""
    groups: list[GroupResponse]
    total: int


class DeleteRequest(BaseModel):
    """Schema for delete request with reason"""
    reason: str = Field(..., min_length=3)

