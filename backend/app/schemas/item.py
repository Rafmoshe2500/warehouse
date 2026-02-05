from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class ItemBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    catalog_number: Optional[str] = Field(None, alias='מק"ט')
    description: Optional[str] = Field(None, alias="תאור פריט")
    manufacturer: Optional[str] = Field(None, alias="מספר יצרן | שם יצרן")
    location: Optional[str] = Field(None, alias="מיקום")
    serial: Optional[str] = Field(None, alias="סריאלי")
    current_stock: Optional[str] = Field(None, alias="מלאי קיים")
    warranty_expiry: Optional[str] = Field(None, alias="תוקף אחריות")
    reserved_stock: Optional[str] = Field(None, alias="מלאי משורין") # Kept for backward compat, or display string
    project_allocations: Optional[dict] = Field(default_factory=dict, alias="שריון עבור") # New structured field
    purpose: Optional[str] = Field(None, alias="יעוד")
    target_site: Optional[str] = Field(None, alias="אתר יעד")
    notes: Optional[str] = Field(None, alias="הערות")

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    field: str
    value: str

class BulkUpdate(BaseModel):
    ids: list[str]
    # We now support specific fields for bulk update
    notes: Optional[str] = None
    purpose: Optional[str] = None
    target_site: Optional[str] = None
    
    # Keeping old fields for backward compatibility if needed, but we prefer specific fields now
    field: Optional[str] = None
    value: Optional[str] = None

class ItemInDB(ItemBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True

class ItemResponse(ItemBase):
    created_at: datetime
    updated_at: datetime

class ItemFilter(BaseModel):
    search: Optional[str] = None
    catalog_number: Optional[str] = None
    serial: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    current_stock: Optional[str] = None
    warranty_expiry: Optional[str] = None
    purpose: Optional[str] = None
    target_site: Optional[str] = None
    project_allocations: Optional[str] = None
    notes: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    page: int = 1
    limit: int = 30

class ItemsListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    limit: int
    pages: int
