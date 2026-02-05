from fastapi import APIRouter

from app.routes.api import auth, items, excel, admin, groups, analytics, audit, procurement

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(items.router)
# api_router.include_router(logs.router)
api_router.include_router(excel.router)
api_router.include_router(admin.router)
api_router.include_router(groups.router)
api_router.include_router(analytics.router)
api_router.include_router(audit.router)
api_router.include_router(procurement.router)
