"""
BOM (Bill of Materials) API Routes — Generic Multi-Vendor Excel Scanner
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
import logging
from app.services.bom_service import BomService
from app.services.bom_catalog_service import BomCatalogService
from app.services.s3_service import S3Service
from app.core.security import get_current_user, has_procurement_write_access
from app.core.constants import Permission, UserRole
from app.core.exceptions import ForbiddenException
from app.dependencies import get_s3_service
from app.schemas.procurement import BOMItemEditRequest
from app.db.repositories.procurement_repository import ProcurementRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bom", tags=["BOM"])

# מיפוי פורמט BOM לשם הספק — fallback for built-in formats.
# Dynamic templates carry their own vendor_name, so this is consulted only
# for legacy hard-coded strategies.
_FORMAT_TO_VENDOR = {
    "netapp_pricing_template": "NETAPP",
    "dell_quote":              "DELL",
    "hpe_quote":               "HPE",
    "cisco_quote":             "CISCO",
    "generic_first_col":       "GENERIC",
}


def _resolve_vendor(format_id: str) -> str | None:
    """Resolve vendor name for a given format, checking DB templates first."""
    if format_id in _FORMAT_TO_VENDOR:
        return _FORMAT_TO_VENDOR[format_id]
    # Dynamic templates encode vendor in the format_id slug
    return format_id.replace("_", " ").upper() if format_id else None


def _has_vendor_write(user: dict, vendor: str) -> bool:
    """True if user may create/edit orders for the given vendor (uppercase)."""
    role = user.get("role")
    if role in (UserRole.SUPERADMIN, UserRole.ADMIN):
        return True
    perms = user.get("permissions", [])
    if Permission.PROCUREMENT_RW in perms or Permission.ADMIN in perms:
        return True
    return f"procurement:{vendor.lower()}:rw" in perms


def get_bom_service() -> BomService:
    return BomService()

def get_bom_catalog_service() -> BomCatalogService:
    return BomCatalogService()

def get_procurement_repository() -> ProcurementRepository:
    return ProcurementRepository()


class SavePartRequest(BaseModel):
    description_he: str
    category: str
    important: bool
    excel_description: Optional[str] = ""


@router.post("/scan")
async def scan_bom(
    file: UploadFile = File(...),
    format: str = Query(default="netapp_pricing_template", description="BOM format strategy"),
    current_user: dict = Depends(get_current_user),
    bom_service: BomService = Depends(get_bom_service),
    s3_service: S3Service = Depends(get_s3_service),
):
    """סריקת קובץ BOM — מחזיר קבוצות רכיבים ורשימת חלקים לא מוכרים. גם שומר את הקובץ ב-S3."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="יש להעלות קובץ Excel בלבד (.xlsx)")

    from app.services.bom_strategies import BomStrategyFactory
    supported = BomStrategyFactory.get_supported_formats()
    if format not in supported:
        raise HTTPException(
            status_code=400,
            detail=f"פורמט לא נתמך: {format}. פורמטים זמינים: {', '.join(supported)}"
        )

    # בדיקת הרשאת עריכה לספק המבוקש
    vendor = _resolve_vendor(format)
    if vendor and not _has_vendor_write(current_user, vendor):
        raise ForbiddenException(f"אין לך הרשאת יצירת הזמנות עבור {vendor}")

    file_bytes = await file.read()
    try:
        result = await bom_service.scan_bom(file_bytes, fmt=format)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"שגיאה בסריקת הקובץ: {str(e)}")

    # שמירת קובץ BOM ל-S3 (async, לא חוסם את התוצאה)
    bom_file_s3_key = None
    try:
        upload_result = await s3_service.upload_file(
            file_content=file_bytes,
            filename=file.filename,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        bom_file_s3_key = upload_result.get("s3_key") or upload_result.get("local_path")
    except Exception as upload_err:
        logger.warning(f"Failed to upload BOM file to S3: {upload_err}")

    result["bom_file_s3_key"] = bom_file_s3_key
    result["bom_filename"] = file.filename
    return result


@router.post("/parts/{part_number}")
async def save_part(
    part_number: str,
    body: SavePartRequest,
    current_user: dict = Depends(get_current_user),
    catalog_service: BomCatalogService = Depends(get_bom_catalog_service),
):
    """שמירה/עדכון של Part Number בקטלוג."""
    try:
        doc = await catalog_service.save_part(
            part_number=part_number,
            description_he=body.description_he,
            category=body.category,
            important=body.important,
            excel_description=body.excel_description,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "part": doc}


@router.get("/parts")
async def get_all_parts(
    current_user: dict = Depends(get_current_user),
    catalog_service: BomCatalogService = Depends(get_bom_catalog_service),
):
    """קבלת כל החלקים השמורים בקטלוג."""
    parts = await catalog_service.get_all_parts()
    return {"parts": parts, "total": len(parts)}


@router.patch("/scan/items")
async def edit_bom_items(
    body: BOMItemEditRequest,
    current_user: dict = Depends(get_current_user),
    catalog_service: BomCatalogService = Depends(get_bom_catalog_service),
    procurement_repo: ProcurementRepository = Depends(get_procurement_repository),
):
    """עריכת פריטי BOM לאחר סריקה וסיווג AI — לפני סיום ההזמנה.

    דורש הרשאת כתיבה לספק (vendor-specific write permission).
    העריכות נשמרות גם בקטלוג לשיפור המודל בעתיד.
    כשמועבר order_id, מעדכן גם את bom_data.groups במסמך ההזמנה עצמו.
    """
    vendor = body.vendor.upper()
    if not _has_vendor_write(current_user, vendor):
        logger.warning(
            "BOM item edit denied: user=%s vendor=%s",
            current_user.get("username"),
            vendor,
        )
        raise ForbiddenException(f"אין לך הרשאת עריכה עבור {vendor}")

    try:
        edited_items = [item.model_dump(exclude_none=True) for item in body.items]
        results = await catalog_service.apply_item_edits(edited_items)

        # Also persist the edits directly into the procurement order document so that
        # re-fetching the order (after page reload / modal reopen) returns updated data.
        if body.order_id:
            patched = await procurement_repo.patch_bom_catalog_in_groups(body.order_id, edited_items)
            if not patched:
                logger.warning(
                    "BOM item edit: catalog updated but order bom_data patch skipped (order_id=%s not found)",
                    body.order_id,
                )

        logger.info(
            "BOM items edited: user=%s vendor=%s count=%d order_id=%s",
            current_user.get("username"),
            vendor,
            len(results),
            body.order_id,
        )
        return {"ok": True, "updated": results}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("BOM item edit failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="שגיאה בשמירת העריכות")
