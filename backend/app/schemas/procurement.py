from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class ProcurementStatus(str, Enum):
    """Status of procurement order"""
    WAITING_FOR_EMF = "waiting_emf"  # מחכה ל-EMF
    WAITING_FOR_BOM = "waiting_bom"  # מחכה ל-BOM
    ORDERED = "ordered"              # רכש יצא
    RECEIVED = "received"            # רכש הגיע


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


class ProcurementOrderBase(BaseModel):
    """Base procurement order schema"""
    catalog_number: str = Field(..., min_length=1, description="מק\"ט")
    manufacturer: str = Field(..., min_length=1, description="יצרן")
    description: str = Field(..., description="תיאור")
    quantity: int = Field(..., gt=0, description="כמות")
    order_date: datetime = Field(..., description="תאריך הזמנה")
    amount: float = Field(..., ge=0, description="סכום")
    status: ProcurementStatus = Field(default=ProcurementStatus.WAITING_FOR_EMF, description="סטטוס הזמנה")
    received_emf: bool = Field(default=False, description="התקבל EMF")
    received_bom: bool = Field(default=False, description="התקבל BOM")


class ProcurementOrderCreate(ProcurementOrderBase):
    """Schema for creating procurement order"""
    pass


class ProcurementOrderUpdate(BaseModel):
    """Schema for updating procurement order"""
    catalog_number: Optional[str] = None
    manufacturer: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[int] = Field(None, gt=0)
    order_date: Optional[datetime] = None
    amount: Optional[float] = Field(None, ge=0)
    status: Optional[ProcurementStatus] = None
    received_emf: Optional[bool] = None
    received_bom: Optional[bool] = None


class ProcurementOrderResponse(ProcurementOrderBase):
    """Schema for procurement order response"""
    id: str
    files: List[ProcurementFileMetadata] = []
    created_by: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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
