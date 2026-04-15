from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse

from app.core.security import get_current_user
from app.services.search_service import SearchService
from app.dependencies import get_search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def global_search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
    search_service: SearchService = Depends(get_search_service),
):
    """Unified search across items, orders, and collections"""
    results = await search_service.search(q, limit)
    return JSONResponse(content=results)
