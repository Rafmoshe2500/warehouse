from fastapi import APIRouter, Depends
from app.services.analytics_service import AnalyticsService
from app.core.security import get_current_user
from app.dependencies import get_analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard")
async def get_dashboard_stats(
    current_user: dict = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.get_dashboard_stats()

@router.get("/activity")
async def get_activity_stats(
    days: int = 7,
    current_user: dict = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.get_activity_stats(days)

@router.get("/item/{catalog_number}")
async def get_item_stats(
    catalog_number: str,
    current_user: dict = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
):
    return await service.get_item_project_stats(catalog_number)



