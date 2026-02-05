from fastapi import APIRouter, Depends, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Optional
import io

from app.services.excel_service import ExcelService
from app.dependencies import get_excel_service
from app.core.security import get_current_user

router = APIRouter(prefix="/items", tags=["Excel"])


@router.post("/import-excel")
async def import_excel(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
        excel_service: ExcelService = Depends(get_excel_service)
):
    """יבוא קובץ Excel"""
    return await excel_service.import_excel(file, current_user.get("sub"))


@router.post("/import-projects")
async def import_project_excel(
        file: UploadFile = File(...),
        current_user: dict = Depends(get_current_user),
        excel_service: ExcelService = Depends(get_excel_service)
):
    """יבוא קובץ הקצאות לפרויקטים (עדכון שדה 'משוריין עבור')"""
    return await excel_service.import_project_excel(file, current_user.get("sub"))


@router.get("/export-excel")
async def export_excel(
        # פילטרים
        search: Optional[str] = Query(None),
        catalog_number: Optional[str] = Query(None),
        serial: Optional[str] = Query(None),
        manufacturer: Optional[str] = Query(None),
        description: Optional[str] = Query(None),
        location: Optional[str] = Query(None),
        current_stock: Optional[str] = Query(None),
        purpose: Optional[str] = Query(None),
        notes: Optional[str] = Query(None),

        # פרמטרים לייצוא (חדש)
        export_mode: str = Query("all", pattern="^(all|current)$"),
        page: int = Query(1, ge=1),
        limit: int = Query(30, ge=1),

        current_user: dict = Depends(get_current_user),
        excel_service: ExcelService = Depends(get_excel_service)
):
    """
    ייצוא לאקסל.
    מקבל את כל הפילטרים + מצב ייצוא (הכל או עמוד נוכחי).
    """

    # אם המצב הוא 'all', נגדיר לימיט ענק ועמוד 1
    final_page = page
    final_limit = limit

    if export_mode == 'all':
        final_page = 1
        final_limit = 1000000  # מספר עצום כדי להביא הכל

    output = await excel_service.export_excel(
        search=search,
        catalog_number=catalog_number,
        serial=serial,
        manufacturer=manufacturer,
        description=description,
        location=location,
        current_stock=current_stock,
        purpose=purpose,
        notes=notes,
        page=final_page,
        limit=final_limit
    )

    filename = "inventory_export.xlsx"

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )