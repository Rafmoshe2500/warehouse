from typing import Optional, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.services.bom_analytics_service import BomAnalyticsService
from app.core.security import get_current_user
from app.dependencies import get_bom_analytics_service  # canonical factory — R1 fix

router = APIRouter(prefix="/bom-analytics", tags=["BOM Analytics"])


@router.post("/seed")
async def seed_historical_data(
    current_user: dict = Depends(get_current_user),
    analytics_service: BomAnalyticsService = Depends(get_bom_analytics_service)
):
    """Initialise historical price data by scanning all existing procurement orders.
    Safe to re-run: each order is processed atomically.
    """
    result = await analytics_service.seed_historical_data()
    return {"message": "Data seeding complete", "data": result}


@router.get("/search-parts")
async def search_parts(
    q: str,
    item_type: Optional[str] = None,
    limit: int = 15,
    current_user: dict = Depends(get_current_user),
    analytics_service: BomAnalyticsService = Depends(get_bom_analytics_service)
):
    """Fast autocomplete search returning distinct part numbers matching 'q'."""
    is_main: Optional[bool] = None
    if item_type == "main":
        is_main = True
    elif item_type == "component":
        is_main = False
        
    parts = await analytics_service.search_part_numbers(query=q, is_main=is_main, limit=limit)
    return {"parts": parts}


@router.get("/trends/{part_number}")
async def get_part_trends(
    part_number: str,
    item_type: Optional[str] = None,   # "main" | "component" | omit (all)
    current_user: dict = Depends(get_current_user),
    analytics_service: BomAnalyticsService = Depends(get_bom_analytics_service)
):
    """Return historical pricing trends for a specific part number."""
    is_main: Optional[bool] = None
    if item_type == "main":
        is_main = True
    elif item_type == "component":
        is_main = False

    trends = await analytics_service.get_part_trends(part_number, is_main=is_main)
    return {"part_number": part_number, "trends": trends, "total_points": len(trends)}


class AggregateRequest(BaseModel):
    main_part: str
    secondary_parts: List[str]


@router.post("/aggregate-trends")
async def get_aggregate_trends(
    body: AggregateRequest,
    current_user: dict = Depends(get_current_user),
    analytics_service: BomAnalyticsService = Depends(get_bom_analytics_service)
):
    """Cross-order aggregation: for each order containing main_part + any secondary_part,
    returns price = (main_total + secondary_total) / main_qty per data point.
    """
    trends = await analytics_service.get_aggregated_trends(
        main_part=body.main_part,
        secondary_parts=body.secondary_parts,
    )
    return {"trends": trends}


@router.get("/vendor-discounts")
async def get_vendor_discounts(
    months: int = 12,
    current_user: dict = Depends(get_current_user),
    analytics_service: BomAnalyticsService = Depends(get_bom_analytics_service)
):
    """Calculate average discount percentages granted by each vendor over the last N months."""
    stats = await analytics_service.get_vendor_discount_stats(months=months)
    return {"stats": stats}


@router.get("/vendor-spending")
async def get_vendor_spending(
    resolution: str = "monthly",
    start_date: Optional[str] = None,
    end_date:   Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    analytics_service: BomAnalyticsService = Depends(get_bom_analytics_service)
):
    """Return total spending per vendor per time bucket.
    resolution: daily | monthly | yearly
    start_date / end_date: ISO date strings (YYYY-MM-DD), optional.
    """
    from datetime import datetime, timezone
    sd = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) if start_date else None
    ed = datetime.strptime(end_date,   "%Y-%m-%d").replace(tzinfo=timezone.utc) if end_date else None
    data = await analytics_service.get_vendor_spending(
        resolution=resolution,
        start_date=sd,
        end_date=ed,
    )
    return {"data": data}
