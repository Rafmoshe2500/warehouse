"""
AI Model Retrain API Route — Admin-only endpoint to retrain the BOM classifier
from verified MongoDB data merged with the static CSV training set.
"""

from fastapi import APIRouter, HTTPException, Depends
import logging

from app.core.security import get_current_user
from app.core.constants import UserRole
from app.services.ai_training_service import AITrainingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/retrain")
async def retrain_classifier(current_user: dict = Depends(get_current_user)):
    """Retrain the component classifier model from MongoDB + CSV data.

    Requires ADMIN or SUPERADMIN role.
    """
    role = current_user.get("role")
    if role not in (UserRole.SUPERADMIN, UserRole.ADMIN):
        logger.warning(
            "Retrain attempt denied for user=%s role=%s",
            current_user.get("username"),
            role,
        )
        raise HTTPException(status_code=403, detail="Admin access required")

    logger.info(
        "Retrain triggered by user=%s role=%s",
        current_user.get("username"),
        role,
    )
    try:
        service = AITrainingService()
        metrics = await service.retrain_model()
        return {"status": "ok", "metrics": metrics}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error("Retrain failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail="Model retrain failed")
