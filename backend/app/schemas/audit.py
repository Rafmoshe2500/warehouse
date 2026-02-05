"""
Audit log schemas for tracking user management operations.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AuditAction(str, Enum):
    """Types of auditable actions."""
    # User Management
    USER_CREATE = "user_create"
    USER_UPDATE = "user_update"
    USER_DELETE = "user_delete"
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    PASSWORD_CHANGE = "password_change"
    ROLE_CHANGE = "role_change"
    
    # Group Management
    GROUP_CREATE = "group_create"
    GROUP_UPDATE = "group_update"
    GROUP_DELETE = "group_delete"
    
    # Procurement
    PROCUREMENT_CREATE = "procurement_create"
    PROCUREMENT_UPDATE = "procurement_update"
    PROCUREMENT_DELETE = "procurement_delete"
    PROCUREMENT_FILE_UPLOAD = "procurement_file_upload"
    PROCUREMENT_FILE_DELETE = "procurement_file_delete"

    # Inventory Items
    ITEM_CREATE = "item_create"
    ITEM_UPDATE = "item_update"
    ITEM_DELETE = "item_delete"
    ITEM_BULK_UPDATE = "item_bulk_update"
    ITEM_BULK_DELETE = "item_bulk_delete"
    ITEM_IMPORT = "item_import"
    UNDO = "undo"


class AuditLogCreate(BaseModel):
    """Schema for creating an audit log entry."""
    action: AuditAction
    actor: str  # Username who performed the action
    actor_role: str  # Role of the actor
    
    # Target User (for user management)
    target_user: Optional[str] = None  # Username affected by the action
    target_role: Optional[str] = None  # Role of the affected user
    
    # Target Resource (generic)
    target_resource: Optional[str] = None  # e.g., "procurement_order"
    resource_id: Optional[str] = None  # ID of the resource
    
    changes: Optional[Dict[str, Any]] = None  # What changed (for updates)
    reason: Optional[str] = None  # Reason for action (especially for deletes)
    details: Optional[str] = None  # Additional text details
    ip_address: Optional[str] = None  # Client IP address
    user_agent: Optional[str] = None  # Client user agent


class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    id: str
    timestamp: datetime
    action: str
    actor: str
    actor_role: str
    target_user: Optional[str] = None
    target_role: Optional[str] = None
    target_resource: Optional[str] = None
    resource_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    reason: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogsListResponse(BaseModel):
    """Schema for paginated audit logs list."""
    logs: list[AuditLogResponse]
    total: int
    page: int
    page_size: int


class AuditLogFilters(BaseModel):
    """Schema for filtering audit logs."""
    action: Optional[AuditAction] = None
    actor: Optional[str] = None
    target_user: Optional[str] = None
    target_resource: Optional[str] = None
    resource_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
