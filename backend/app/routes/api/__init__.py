from fastapi import APIRouter

from app.routes.api import auth, items, excel, admin, groups, analytics, audit, procurement, collections, users, catalog, bom, bom_analytics, retrain, search

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(items.router)
api_router.include_router(excel.router)
api_router.include_router(admin.router)
api_router.include_router(groups.router)
api_router.include_router(analytics.router)
api_router.include_router(audit.router)
api_router.include_router(collections.router)
api_router.include_router(procurement.router)
api_router.include_router(users.router)
api_router.include_router(catalog.router)
api_router.include_router(bom.router)
api_router.include_router(bom_analytics.router)
api_router.include_router(retrain.router)
api_router.include_router(search.router)
