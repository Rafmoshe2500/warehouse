from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class CatalogItemBase(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    catalog_number: str = Field(..., alias='מק"ט')
    description: Optional[str] = Field(None, alias="תאור פריט")
    manufacturer: Optional[str] = Field(None, alias="מספר יצרן | שם יצרן")

class CatalogItemCreate(CatalogItemBase):
    pass

class CatalogItemInDB(CatalogItemBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(populate_by_name=True)

class CatalogItemResponse(CatalogItemInDB):
    total_in_stock: int = Field(0, alias="כמות במלאי")

class CatalogFilter(BaseModel):
    search: Optional[str] = None
    catalog_number: Optional[str] = None
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    page: int = 1
    limit: int = 30

class CatalogListResponse(BaseModel):
    items: list[dict]
    total: int
    page: int
    limit: int
    pages: int
