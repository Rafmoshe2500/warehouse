from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from app.core.security import get_current_user, get_current_user_groups
from app.services.collection_service import CollectionService
from app.dependencies import get_collection_service
from app.schemas.collection import (
    CollectionCreate,
    CollectionUpdate,
    CollectionResponse,
    CollectionItemCreate,
    CollectionItemUpdate,
    CollectionItemResponse,
    CollectionItemResponse,
    CollectionPermission,
    CollectionBulkItemCreate,
    CollectionBulkItemDelete
)

router = APIRouter(prefix="/collections", tags=["collections"])
# collection_service = CollectionService()

# --- Collections ---

@router.post("/", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    current_user: dict = Depends(get_current_user),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Create a new collection"""
    return await collection_service.create_collection(data, current_user["username"])

@router.get("/", response_model=List[CollectionResponse])
async def list_collections(
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """List collections visible to current user"""
    return await collection_service.list_collections(current_user["username"], user_groups, current_user.get("role"))

@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Get collection details"""
    return await collection_service.get_collection(collection_id, current_user["username"], user_groups, current_user.get("role"))

@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    data: CollectionUpdate,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Update collection details (Owner/RW)"""
    return await collection_service.update_collection(collection_id, data, current_user["username"], user_groups, current_user.get("role"))

@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: str,
    current_user: dict = Depends(get_current_user),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Delete collection (Owner only)"""
    await collection_service.delete_collection(collection_id, current_user["username"], current_user.get("role"))

# --- Items ---

@router.get("/{collection_id}/items", response_model=List[CollectionItemResponse])
async def list_collection_items(
    collection_id: str,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """List items in collection"""
    return await collection_service.get_collection_items(collection_id, current_user["username"], user_groups, current_user.get("role"))


@router.get("/{collection_id}/export")
async def export_collection_to_excel(
    collection_id: str,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Export items from a collection to Excel"""
    try:
        excel_file = await collection_service.export_collection(
            collection_id, 
            current_user["username"], 
            user_groups, 
            current_user.get("role")
        )

        from datetime import datetime
        date_str = datetime.now().strftime("%Y-%m-%d")
        filename = f"collection_{collection_id}_export_{date_str}.xlsx"

        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except Exception as e:
        from app.core.exceptions import ExcelFileException
        if isinstance(e, ExcelFileException):
            raise HTTPException(status_code=400, detail=str(e))
        import logging
        logging.error(f"Error exporting collection {collection_id}: {e}")
        raise HTTPException(status_code=500, detail="שגיאה פנימית בייצוא האוסף")

@router.post("/{collection_id}/items", response_model=dict, status_code=status.HTTP_201_CREATED)
async def add_item_to_collection(
    collection_id: str,
    data: CollectionItemCreate,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Add item to collection"""
    return await collection_service.add_item(collection_id, data, current_user["username"], user_groups, current_user.get("role"))

@router.post("/{collection_id}/items/bulk", response_model=dict, status_code=status.HTTP_201_CREATED)
async def bulk_add_items_to_collection(
    collection_id: str,
    data: CollectionBulkItemCreate,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Bulk add items to collection"""
    return await collection_service.bulk_add_items(collection_id, data, current_user["username"], user_groups, current_user.get("role"))

@router.put("/{collection_id}/items/{item_id}", response_model=dict)
async def update_collection_item(
    collection_id: str,
    item_id: str,
    data: CollectionItemUpdate,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Update item custom values in collection"""
    return await collection_service.update_item_custom_values(collection_id, item_id, data, current_user["username"], user_groups, current_user.get("role"))

@router.delete("/{collection_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_item_from_collection(
    collection_id: str,
    item_id: str,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Remove item from collection"""
    await collection_service.remove_item(collection_id, item_id, current_user["username"], user_groups, current_user.get("role"))

@router.post("/{collection_id}/items/bulk-delete", response_model=dict)
async def remove_items_bulk_from_collection(
    collection_id: str,
    data: CollectionBulkItemDelete,
    current_user: dict = Depends(get_current_user),
    user_groups: List[str] = Depends(get_current_user_groups),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Bulk remove items from collection"""
    return await collection_service.remove_items_bulk(collection_id, data.item_ids, current_user["username"], user_groups, current_user.get("role"))

# --- Permissions ---

@router.post("/{collection_id}/permissions", response_model=dict)
async def update_collection_permissions(
    collection_id: str,
    permission: CollectionPermission,
    current_user: dict = Depends(get_current_user),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Update permission for a user or group"""
    return await collection_service.update_permissions(collection_id, permission, current_user["username"], current_user.get("role"))

@router.delete("/{collection_id}/permissions/{target_id}", response_model=dict)
async def remove_collection_permission(
    collection_id: str,
    target_id: str,
    current_user: dict = Depends(get_current_user),
    collection_service: CollectionService = Depends(get_collection_service)
):
    """Remove permission for a user or group"""
    return await collection_service.remove_permission(collection_id, target_id, current_user["username"], current_user.get("role"))
