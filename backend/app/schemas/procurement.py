from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


class ProcurementStatus(str, Enum):
    """Status of procurement order"""
    WAITING_BOM_EMF = "waiting_bom_emf" # מחכה ל-BOM ו-EMF
    WAITING_BOM = "waiting_bom"         # מחכה ל-BOM (יש EMF)
    WAITING_EMF = "waiting_emf"         # מחכה ל-EMF (יש BOM)
    WAITING_ORDER = "waiting_order"     # מחכה שרכש ייצא (יש שניהם)
    ORDERED = "ordered"                 # רכש יצא
    RECEIVED = "received"               # רכש הגיע


class ProcurementFileMetadata(BaseModel):
    """File metadata for procurement order"""
    file_id: str
    filename: str
    file_type: str
    file_size: int
    s3_key: Optional[str] = None
    local_path: Optional[str] = None
    uploaded_by: str
    uploaded_at: datetime


class BOMItem(BaseModel):
    """BOM item within procurement order"""
    item_id: int = Field(..., description="פריט ID")
    catalog_number: str = Field(..., min_length=1, description="מק\"ט")
    manufacturer: str = Field(..., min_length=1, description="יצרן")
    description: str = Field(default="", description="תיאור")
    quantity: int = Field(..., gt=0, description="כמות")


class ProcurementOrderBase(BaseModel):
    """Base procurement order schema"""
    order_date: datetime = Field(..., description="תאריך הזמנה")
    bom_items: List[BOMItem] = Field(..., min_length=1, description="פריטי BOM")
    total_amount: float = Field(..., ge=0, description="סכום כולל")
    status: ProcurementStatus = Field(default=ProcurementStatus.WAITING_BOM_EMF, description="סטטוס הזמנה")
    emf_number: Optional[str] = Field(default=None, description="מספר EMF")
    received_bom: bool = Field(default=False, description="התקבל BOM")


class ProcurementOrderCreate(ProcurementOrderBase):
    """Schema for creating procurement order"""
    pass


class ProcurementOrderUpdate(BaseModel):
    """Schema for updating procurement order"""
    order_date: Optional[datetime] = None
    bom_items: Optional[List[BOMItem]] = None
    total_amount: Optional[float] = Field(None, ge=0)
    status: Optional[ProcurementStatus] = None
    emf_number: Optional[str] = None
    received_bom: Optional[bool] = None




class ProcurementOrderResponse(ProcurementOrderBase):
    """Schema for procurement order response"""
    id: str
    files: List[ProcurementFileMetadata] = []
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProcurementOrdersListResponse(BaseModel):
    """Paginated list of procurement orders"""
    orders: List[ProcurementOrderResponse]
    total: int
    page: int
    page_size: int


class FileUploadResponse(BaseModel):
    """Response after file upload"""
    file_id: str
    filename: str
    message: str
