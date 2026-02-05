from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.schemas.item import ItemCreate, ItemUpdate, BulkUpdate, ItemsListResponse, ItemFilter
from app.schemas.auth import DeleteRequest
from app.services.item_service import ItemService
from app.dependencies import get_item_service
from app.core.security import get_current_user, require_admin, require_permission
from app.core.constants import Permission
from app.core.exceptions import DeleteConfirmationException

router = APIRouter(prefix="/items", tags=["Items"])


inventory_ro = require_permission(Permission.INVENTORY_RO)
inventory_rw = require_permission(Permission.INVENTORY_RW)


@router.get("", response_model=ItemsListResponse)
async def get_items(
        filter_params: ItemFilter = Depends(),
        current_user: dict = Depends(inventory_ro),
        item_service: ItemService = Depends(get_item_service)
):
    """קבלת כל הפריטים עם פילטור, חיפוש ומיון"""
    return await item_service.get_items(filter_params)


@router.get("/stale", response_model=ItemsListResponse)
async def get_stale_items(
        days: int = Query(30, ge=1),
        page: int = Query(1, ge=1),
        limit: int = Query(30, ge=1, le=1000),
        current_user: dict = Depends(inventory_ro),
        item_service: ItemService = Depends(get_item_service)
):
    """קבלת פריטים שלא עודכנו זמן רב (ברירת מחדל: 30 יום)"""
    return await item_service.get_stale_items(days=days, page=page, limit=limit)


@router.post("")
async def create_item(
        item: ItemCreate,
        undo_log_id: Optional[str] = Query(None),
        is_undo: bool = Query(False),
        current_user: dict = Depends(inventory_rw),
        item_service: ItemService = Depends(get_item_service)
):
    """הוספת פריט חדש"""
    import sys
    sys.stderr.write(f"DEBUG: create_item input: {item}\n")
    result = await item_service.create_item(item, current_user, undo_log_id, is_undo)
    sys.stderr.write(f"DEBUG: create_item result: {result}\n")
    return result


@router.patch("/{item_id}")
async def update_item_field(
        item_id: str,
        update: ItemUpdate,
        undo_log_id: Optional[str] = Query(None),
        is_undo: bool = Query(False),
        current_user: dict = Depends(inventory_rw),
        item_service: ItemService = Depends(get_item_service)
):
    """עדכון שדה בודד בפריט"""
    return await item_service.update_item_field(item_id, update, current_user, undo_log_id, is_undo)


@router.post("/bulk-update")
async def bulk_update_items(
        update: BulkUpdate,
        current_user: dict = Depends(inventory_rw),
        item_service: ItemService = Depends(get_item_service)
):
    """עדכון מרובה"""
    print(f"DEBUG: Route POST /items/bulk-update called with: {update}")
    return await item_service.bulk_update_items(update, current_user)


@router.post("/fix-reserved-stock")
async def fix_reserved_stock(
        current_user: dict = Depends(require_admin),
        item_service: ItemService = Depends(get_item_service)
):
    """Migration tool: Fix reserved_stock string for all items"""
    return await item_service.fix_all_reserved_stock()


@router.delete("/{item_id}")
async def delete_item(
        item_id: str,
        delete_request: DeleteRequest,
        current_user: dict = Depends(inventory_rw),
        item_service: ItemService = Depends(get_item_service)
):
    return await item_service.delete_item(
        item_id, 
        current_user, 
        delete_request.reason,
    )


@router.post("/bulk-delete")
async def bulk_delete_items(
        delete_request: DeleteRequest,
        current_user: dict = Depends(inventory_rw),
        item_service: ItemService = Depends(get_item_service)
):
    """מחיקת מספר פריטים"""
    if not delete_request.ids:
        raise DeleteConfirmationException()

    return await item_service.bulk_delete_items(delete_request.ids, current_user, delete_request.reason)


@router.post("/delete-all")
async def delete_all_items(
        delete_request: DeleteRequest,
        current_user: dict = Depends(require_admin),
        item_service: ItemService = Depends(get_item_service)
):
    """מחיקת כל מסד הנתונים"""
    return await item_service.delete_all_items(current_user, delete_request.reason)