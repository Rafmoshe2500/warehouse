from fastapi import Depends

from app.db.mongodb import MongoDB
from app.db.repositories.items import ItemsRepository
from app.services.item_service import ItemService
# LogService removed
from app.services.excel_service import ExcelService
from app.services.auth_service import AuthService
from app.services.analytics_service import AnalyticsService
from app.services.audit_service import AuditService

# Repositories
def get_items_repository() -> ItemsRepository:
    collection = MongoDB.get_collection("inventory")
    return ItemsRepository(collection)

# LogService removed

def get_audit_service() -> AuditService:
    return AuditService()

def get_item_service(
    items_repo: ItemsRepository = Depends(get_items_repository),
    audit_service: AuditService = Depends(get_audit_service)
) -> ItemService:
    return ItemService(items_repo, audit_service)

def get_excel_service(
    items_repo: ItemsRepository = Depends(get_items_repository),
    audit_service: AuditService = Depends(get_audit_service)
) -> ExcelService:
    return ExcelService(items_repo, audit_service)

def get_auth_service() -> AuthService:
    return AuthService()

def get_analytics_service(
    items_repo: ItemsRepository = Depends(get_items_repository),
    audit_service: AuditService = Depends(get_audit_service)
) -> AnalyticsService:
    return AnalyticsService(items_repo, audit_service)
