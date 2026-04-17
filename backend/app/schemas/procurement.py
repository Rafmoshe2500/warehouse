from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from enum import Enum


class ProcurementStatus(str, Enum):
    """Status of procurement order"""
    # ─── Active pipeline (new) ───────────────────────────────
    WAITING_BOM_EMF    = "waiting_bom_emf"    # ממתין לקבלת BOM ו-EMF
    WAITING_SHIPMENT   = "waiting_shipment"   # ממתין לשילוח
    SHIPPED            = "shipped"            # נשלח
    RECEIVED           = "received"           # התקבל
    # ─── Legacy values (old data in DB) ──────────────────────
    WAITING_BOM        = "waiting_bom"        # [legacy]
    WAITING_EMF        = "waiting_emf"        # [legacy]
    WAITING_ORDER      = "waiting_order"      # [legacy]
    ORDERED            = "ordered"            # [legacy]


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
    bom_vendor: Optional[str] = Field(default=None, description="ספק BOM (DELL/NETAPP/HPE)")
    part_alias: Optional[str] = Field(default=None, description="כינוי למק\"ט קריא למשתמש")


class BOMItemEdit(BaseModel):
    """Schema for editing a BOM item after AI scan (before finalization)."""
    part_number: str = Field(..., min_length=1, description="מק\"ט")
    description_he: Optional[str] = Field(default=None, description="תיאור בעברית")
    category: Optional[str] = Field(default=None, description="קטגוריה (slug)")
    part_alias: Optional[str] = Field(default=None, description="כינוי קריא")
    excel_description: Optional[str] = Field(default=None, description="תיאור מקורי מהאקסל")


class BOMItemEditRequest(BaseModel):
    """Request body for batch BOM item edits."""
    vendor: str = Field(..., min_length=1, description="שם ספק (uppercase: DELL/NETAPP/HPE)")
    items: List[BOMItemEdit] = Field(..., min_length=1, description="פריטים לעריכה")
    order_id: Optional[str] = Field(default=None, description="מזהה הזמנה לעדכון bom_data ישיר במסד")


class ProcurementOrderBase(BaseModel):
    """Base procurement order schema"""
    order_date: datetime = Field(..., description="תאריך הזמנה")
    bom_items: List[BOMItem] = Field(..., min_length=1, description="פריטי BOM")
    total_amount: float = Field(default=0.0, ge=0, description="סכום כולל (מתעדכן מ-BOM)")
    status: ProcurementStatus = Field(default=ProcurementStatus.WAITING_BOM_EMF, description="סטטוס הזמנה")
    emf_number: Optional[str] = Field(default=None, description="מספר EMF")
    received_bom: bool = Field(default=False, description="התקבל BOM")
    bom_vendor: Optional[str] = Field(default=None, description="ספק ה-BOM (DELL/NETAPP/HPE)")
    bom_data: Optional[dict] = Field(default=None, description="תוצאות סריקת BOM")
    bom_received_at: Optional[datetime] = Field(default=None, description="תאריך קבלת BOM")
    emf_received_at: Optional[datetime] = Field(default=None, description="תאריך קבלת EMF")
    waiting_shipment_at: Optional[datetime] = Field(default=None, description="תאריך שבו עבר להמתנה לשילוח")
    shipped_at: Optional[datetime] = Field(default=None, description="תאריך שילוח")
    received_at: Optional[datetime] = Field(default=None, description="תאריך קבלת הסחורה")


class ProcurementOrderCreate(ProcurementOrderBase):
    """Schema for creating procurement order"""
    bom_file_s3_key: Optional[str] = Field(default=None, description="S3 key of the pre-scanned BOM file")
    bom_filename: Optional[str] = Field(default=None, description="Original filename of the BOM file")


class ProcurementOrderUpdate(BaseModel):
    """Schema for updating procurement order"""
    order_date: Optional[datetime] = None
    bom_items: Optional[List[BOMItem]] = None
    total_amount: Optional[float] = Field(None, ge=0)
    status: Optional[ProcurementStatus] = None
    emf_number: Optional[str] = None
    received_bom: Optional[bool] = None
    bom_vendor: Optional[str] = None
    bom_data: Optional[dict] = None
    bom_file_s3_key: Optional[str] = None
    bom_filename: Optional[str] = None




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
