from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.schemas.catalog import CatalogFilter, CatalogListResponse
from app.services.catalog_service import CatalogService
from app.core.security import require_permission
from app.core.constants import Permission

router = APIRouter(prefix="/catalog", tags=["Catalog"])

inventory_ro = require_permission(Permission.INVENTORY_RO)

@router.get("", response_model=CatalogListResponse)
async def get_catalog(
    search: Optional[str] = Query(None, description="חיפוש כללי"),
    catalog_number: Optional[str] = Query(None),
    description: Optional[str] = Query(None),
    manufacturer: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: str = Query("asc"),
    page: int = Query(1, ge=1),
    limit: int = Query(30, ge=1, le=100),
    current_user: dict = Depends(inventory_ro)
):
    """קבלת קטלוג פריטים (מק"טים ייחודיים) עם כמות מלאי מחושבת"""
    filter_params = CatalogFilter(
        search=search,
        catalog_number=catalog_number,
        description=description,
        manufacturer=manufacturer,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    
    catalog_service = CatalogService()
    return await catalog_service.search_catalog(filter_params)
