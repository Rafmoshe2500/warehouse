from fastapi import APIRouter, Depends, UploadFile, File, Query, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.encoders import jsonable_encoder
from io import BytesIO
from typing import Optional, List

from app.core.security import (
    get_current_user, require_permission,
    has_price_permission, strip_price_fields,
    has_procurement_read_access, has_procurement_write_access,
    get_allowed_vendors
)
from app.core.constants import Permission
from app.core.exceptions import ForbiddenException
from app.services.procurement_service import ProcurementService
from app.dependencies import get_procurement_service
from app.schemas.procurement import (
    ProcurementOrderCreate,
    ProcurementOrderUpdate,
    ProcurementOrderResponse,
    ProcurementOrdersListResponse,
    FileUploadResponse
)

router = APIRouter(prefix="/procurement", tags=["procurement"])


@router.get("/orders", response_model=ProcurementOrdersListResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    catalog_number: Optional[str] = None,
    manufacturer: Optional[str] = None,
    emf_number: Optional[str] = None,
    status_in: Optional[List[str]] = Query(None),
    status_ne: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Get all procurement orders"""
    if not has_procurement_read_access(current_user):
        raise ForbiddenException("נדרשת הרשאת קריאה לרכש")

    # סנן לפי ספקים מותרים (None = גלובלי, [] = אין גישה, [...] = רשימת ספקים)
    allowed_vendors = get_allowed_vendors(current_user)
    if allowed_vendors is not None and len(allowed_vendors) == 0:
        # אין למשתמש אף הרשאת ספק ספציפי
        return JSONResponse(content={"orders": [], "total": 0, "page": page, "page_size": page_size})

    orders, total = await procurement_service.get_orders(
        page=page,
        page_size=page_size,
        search=search,
        catalog_number=catalog_number,
        manufacturer=manufacturer,
        emf_number=emf_number,
        status_in=status_in,
        status_ne=status_ne,
        allowed_vendors=allowed_vendors
    )

    show_prices = has_price_permission(current_user)
    encoded_orders = jsonable_encoder(orders)
    if not show_prices:
        serialized = [strip_price_fields(o) for o in encoded_orders]
    else:
        serialized = encoded_orders

    return JSONResponse(content={
        "orders": serialized,
        "total": total,
        "page": page,
        "page_size": page_size
    })


@router.get("/summary")
async def get_procurement_summary(
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Get procurement monthly summary stats for analytics strip"""
    if not has_procurement_read_access(current_user):
        raise ForbiddenException("נדרשת הרשאת קריאה לרכש")

    summary = await procurement_service.get_monthly_summary()
    return JSONResponse(content=summary)


@router.post("/orders", response_model=ProcurementOrderResponse)
async def create_order(
    order_data: ProcurementOrderCreate,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Create new procurement order"""
    if not has_procurement_write_access(current_user):
        raise ForbiddenException("נדרשת הרשאת עריכה לרכש")
    username = current_user.get("username") or current_user.get("sub")
    return await procurement_service.create_order(order_data=order_data, created_by=username)


@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Get procurement order by ID"""
    if not has_procurement_read_access(current_user):
        raise ForbiddenException("נדרשת הרשאת קריאה לרכש")
    order = await procurement_service.get_order_by_id(order_id)
    order_dict = jsonable_encoder(order)
    if not has_price_permission(current_user):
        order_dict = strip_price_fields(order_dict)
    return JSONResponse(content=order_dict)


@router.put("/orders/{order_id}", response_model=ProcurementOrderResponse)
async def update_order(
    order_id: str,
    update_data: ProcurementOrderUpdate,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    if not has_procurement_write_access(current_user):
        raise ForbiddenException("נדרשת הרשאת עריכה לרכש")
    allowed_vendors = get_allowed_vendors(current_user)
    if allowed_vendors is not None:
        order = await procurement_service.get_order_by_id(order_id)
        order_vendor = order.get("bom_vendor")
        if order_vendor and order_vendor not in allowed_vendors:
            raise ForbiddenException("אין הרשאה לעדכן הזמנה של ספק זה")
    username = current_user.get("username") or current_user.get("sub")
    return await procurement_service.update_order(
        order_id=order_id,
        update_data=update_data,
        username=username
    )


@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: str,
    reason: Optional[str] = Query(None, description="סיבת מחיקה"),
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Delete procurement order"""
    if not has_procurement_write_access(current_user):
        raise ForbiddenException("נדרשת הרשאת עריכה לרכש")
    allowed_vendors = get_allowed_vendors(current_user)
    if allowed_vendors is not None:
        order = await procurement_service.get_order_by_id(order_id)
        order_vendor = order.get("bom_vendor")
        if order_vendor and order_vendor not in allowed_vendors:
            raise ForbiddenException("אין הרשאה למחוק הזמנה של ספק זה")
    username = current_user.get("username") or current_user.get("sub")
    await procurement_service.delete_order(order_id=order_id, username=username, reason=reason)
    return {"message": "ההזמנה נמחקה בהצלחה"}


@router.post("/orders/{order_id}/files", response_model=FileUploadResponse)
async def upload_file(
    order_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Upload file to procurement order"""
    if not has_procurement_write_access(current_user):
        raise ForbiddenException("נדרשת הרשאת עריכה לרכש")
    username = current_user.get("username") or current_user.get("sub")
    return await procurement_service.upload_file(order_id=order_id, file=file, uploaded_by=username)


@router.get("/orders/{order_id}/files/{file_id}")
async def download_file(
    order_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Download file from procurement order"""
    if not has_procurement_read_access(current_user):
        raise ForbiddenException("נדרשת הרשאת קריאה לרכש")
    file_content, filename, content_type = await procurement_service.download_file(
        order_id=order_id,
        file_id=file_id
    )
    return StreamingResponse(
        BytesIO(file_content),
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


@router.delete("/orders/{order_id}/files/{file_id}")
async def delete_file(
    order_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Delete file from procurement order"""
    if not has_procurement_write_access(current_user):
        raise ForbiddenException("נדרשת הרשאת עריכה לרכש")
    username = current_user.get("username") or current_user.get("sub")
    await procurement_service.delete_file(order_id=order_id, file_id=file_id, username=username)
    return {"message": "הקובץ נמחק בהצלחה"}
