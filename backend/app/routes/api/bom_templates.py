"""
BOM Templates API Routes — admin-configurable vendor BOM parsing rules.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List
import logging

from app.services.bom_template_service import BomTemplateService
from app.services.bom_strategies import BomStrategyFactory
from app.schemas.bom_template import (
    BomTemplateCreate,
    BomTemplateUpdate,
    BomTemplateResponse,
    BomTemplateListResponse,
)
from app.core.security import get_current_user, require_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bom/templates", tags=["BOM Templates"])


def get_template_service() -> BomTemplateService:
    return BomTemplateService()


# ── Read (any authenticated user) ────────────────────────────────────────────

@router.get("/", response_model=BomTemplateListResponse)
async def list_templates(
    current_user: dict = Depends(get_current_user),
    svc: BomTemplateService = Depends(get_template_service),
):
    """Return all active BOM templates (vendor formats)."""
    templates = await svc.get_all_templates()
    return {"templates": templates, "total": len(templates)}


@router.get("/{template_id}", response_model=BomTemplateResponse)
async def get_template(
    template_id: str,
    current_user: dict = Depends(get_current_user),
    svc: BomTemplateService = Depends(get_template_service),
):
    doc = await svc.get_template(template_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")
    return doc


# ── Write (admin only) ───────────────────────────────────────────────────────

@router.post("/", response_model=BomTemplateResponse, status_code=201)
async def create_template(
    body: BomTemplateCreate,
    current_user: dict = Depends(require_admin),
    svc: BomTemplateService = Depends(get_template_service),
):
    """Create a new BOM template (admin only)."""
    try:
        doc = await svc.create_template(body.model_dump(), current_user.get("username", "admin"))
        await BomStrategyFactory.refresh()
        return doc
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{template_id}", response_model=BomTemplateResponse)
async def update_template(
    template_id: str,
    body: BomTemplateUpdate,
    current_user: dict = Depends(require_admin),
    svc: BomTemplateService = Depends(get_template_service),
):
    """Update a BOM template (admin only)."""
    try:
        doc = await svc.update_template(
            template_id,
            body.model_dump(exclude_none=True),
            current_user.get("username", "admin"),
        )
        if not doc:
            raise HTTPException(status_code=404, detail="Template not found")
        await BomStrategyFactory.refresh()
        return doc
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: dict = Depends(require_admin),
    svc: BomTemplateService = Depends(get_template_service),
):
    """Deactivate a BOM template (admin only). Built-in templates are soft-deleted."""
    doc = await svc.delete_template(template_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Template not found")
    await BomStrategyFactory.refresh()
    return {"ok": True, "deactivated": doc.get("format_id")}


# ── Preview & Validate (admin only) ──────────────────────────────────────────

@router.post("/preview-excel")
async def preview_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin),
):
    """Upload an Excel file and return the first rows as JSON (for the template wizard)."""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="יש להעלות קובץ Excel בלבד (.xlsx)")
    file_bytes = await file.read()
    try:
        return BomTemplateService.preview_excel(file_bytes)
    except Exception as e:
        logger.error("Excel preview failed: %s", e, exc_info=True)
        raise HTTPException(status_code=422, detail=f"שגיאה בקריאת הקובץ: {str(e)}")


@router.post("/validate")
async def validate_template(
    file: UploadFile = File(...),
    config: str = Form(..., alias="config"),
    current_user: dict = Depends(require_admin),
):
    """Validate a template config against a sample Excel file.

    Expects multipart/form-data with:
      - ``file``: the sample Excel
      - ``config``: JSON string of the template configuration
    """
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="יש להעלות קובץ Excel בלבד (.xlsx)")

    import json
    try:
        config = json.loads(config)
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid JSON config")

    file_bytes = await file.read()
    try:
        return BomTemplateService.validate_template(config, file_bytes)
    except Exception as e:
        logger.error("Template validation failed: %s", e, exc_info=True)
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
