from fastapi import APIRouter, Depends, UploadFile, File, Query, Request
from fastapi.responses import StreamingResponse
from io import BytesIO
from typing import Optional, List

from app.core.security import get_current_user
from app.services.procurement_service import ProcurementService
from app.schemas.procurement import (
    ProcurementOrderCreate,
    ProcurementOrderUpdate,
    ProcurementOrderResponse,
    ProcurementOrdersListResponse,
    FileUploadResponse
)

router = APIRouter(prefix="/procurement", tags=["procurement"])


def get_procurement_service() -> ProcurementService:
    """Dependency to get procurement service"""
    return ProcurementService()


@router.get("/orders", response_model=ProcurementOrdersListResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    catalog_number: Optional[str] = None,
    manufacturer: Optional[str] = None,
    # Use generic Query for list: ?status_in=a&status_in=b
    status_in: Optional[List[str]] = Query(None),
    status_ne: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    print(f"DEBUG ROUTE: status_in={status_in}, status_ne={status_ne}")
    """Get all procurement orders (all authenticated users)"""
    orders, total = await procurement_service.get_orders(
        page=page,
        page_size=page_size,
        catalog_number=catalog_number,
        manufacturer=manufacturer,
        status_in=status_in,
        status_ne=status_ne
    )
    
    return {
        "orders": orders,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/orders", response_model=ProcurementOrderResponse)
async def create_order(
    order_data: ProcurementOrderCreate,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Create new procurement order (admin+ only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    if not procurement_service.can_edit_procurement(role):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="אין לך הרשאה ליצור הזמנות")
    
    return await procurement_service.create_order(
        order_data=order_data,
        created_by=username
    )


@router.get("/orders/{order_id}", response_model=ProcurementOrderResponse)
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Get procurement order by ID (all authenticated users)"""
    return await procurement_service.get_order_by_id(order_id)


@router.put("/orders/{order_id}", response_model=ProcurementOrderResponse)
async def update_order(
    order_id: str,
    update_data: ProcurementOrderUpdate,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Update procurement order (admin+ only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    return await procurement_service.update_order(
        order_id=order_id,
        update_data=update_data,
        user_role=role,
        username=username
    )


@router.delete("/orders/{order_id}")
async def delete_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Delete procurement order (admin+ only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    await procurement_service.delete_order(order_id=order_id, user_role=role, username=username)
    return {"message": "ההזמנה נמחקה בהצלחה"}


@router.post("/orders/{order_id}/files", response_model=FileUploadResponse)
async def upload_file(
    order_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Upload file to procurement order (admin+ only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    return await procurement_service.upload_file(
        order_id=order_id,
        file=file,
        uploaded_by=username,
        user_role=role
    )


@router.get("/orders/{order_id}/files/{file_id}")
async def download_file(
    order_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Download file from procurement order (all authenticated users)"""
    file_content, filename, content_type = await procurement_service.download_file(
        order_id=order_id,
        file_id=file_id
    )
    
    return StreamingResponse(
        BytesIO(file_content),
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@router.delete("/orders/{order_id}/files/{file_id}")
async def delete_file(
    order_id: str,
    file_id: str,
    current_user: dict = Depends(get_current_user),
    procurement_service: ProcurementService = Depends(get_procurement_service)
):
    """Delete file from procurement order (admin+ only)"""
    username = current_user.get("username") or current_user.get("sub")
    role = current_user.get("role", "user")
    
    await procurement_service.delete_file(
        order_id=order_id,
        file_id=file_id,
        user_role=role,
        username=username
    )
    
    return {"message": "הקובץ נמחק בהצלחה"}
