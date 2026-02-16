from enum import Enum
from typing import List, Optional, Any, Dict, Union
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class CollectionRole(str, Enum):
    OWNER = "owner"
    RW = "rw"
    RO = "ro"

class PermissionType(str, Enum):
    USER = "user"
    GROUP = "group"

class CustomFieldType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    SELECT = "select"
    BOOLEAN = "boolean"
    MULTI_SELECT = "multi_select"

class CustomFieldDefinition(BaseModel):
    key: str
    label: str
    type: CustomFieldType
    options: Optional[List[str]] = None
    required: bool = False
    default: Optional[Any] = None

class CollectionPermission(BaseModel):
    type: PermissionType
    id: str  # User ID or Group Name/ID
    level: CollectionRole

class CollectionBase(BaseModel):
    name: str
    description: Optional[str] = None
    group_ids: List[str] = []
    custom_fields: List[CustomFieldDefinition] = []

class CollectionCreate(CollectionBase):
    pass

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    group_ids: Optional[List[str]] = None
    custom_fields: Optional[List[CustomFieldDefinition]] = None

class CollectionInDB(CollectionBase):
    id: str
    owner_id: str
    permissions: List[CollectionPermission] = []
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(populate_by_name=True)

class CollectionResponse(CollectionInDB):
    role: Optional[CollectionRole] = None

class CollectionItemBase(BaseModel):
    item_id: str
    custom_values: Dict[str, Any] = {}

class CollectionItemCreate(CollectionItemBase):
    pass

class CollectionBulkItemCreate(BaseModel):
    item_ids: List[str]
    custom_values: Dict[str, Any] = {}

class CollectionBulkItemDelete(BaseModel):
    item_ids: List[str]

class CollectionItemUpdate(BaseModel):
    custom_values: Optional[Dict[str, Any]] = None

class CollectionItemInDB(CollectionItemBase):
    id: str
    collection_id: str
    assigned_by: str
    assigned_at: datetime
    
    model_config = ConfigDict(populate_by_name=True)

class CollectionItemResponse(CollectionItemInDB):
    # Inventory fields merged from items collection
    catalog_number: Optional[str] = None
    serial: Optional[str] = None
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    location: Optional[str] = None
    current_stock: Optional[str] = None
    warranty_expiry: Optional[str] = None
    project_allocations: Optional[Dict[str, Any]] = None
    target_site: Optional[str] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
