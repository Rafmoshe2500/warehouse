from fastapi import Depends

from app.db.mongodb import MongoDB
from app.db.repositories.items import ItemsRepository
from app.services.item_service import ItemService
# LogService removed
from app.services.excel_service import ExcelService
from app.services.auth_service import AuthService
from app.services.analytics_service import AnalyticsService
from app.services.audit_service import AuditService
# Collections
from app.db.repositories.collection_repository import CollectionRepository
from app.services.collection_service import CollectionService

# Repositories
def get_items_repository() -> ItemsRepository:
    collection = MongoDB.get_collection("inventory")
    return ItemsRepository(collection)

from app.services.audit.item_auditor import ItemAuditor

# LogService removed

def get_audit_service() -> AuditService:
    return AuditService()

def get_item_auditor(audit_service: AuditService = Depends(get_audit_service)) -> ItemAuditor:
    return ItemAuditor(audit_service)

def get_collection_repository() -> CollectionRepository:
    return CollectionRepository()

from app.services.audit.collection_auditor import CollectionAuditor

def get_collection_auditor(audit_service: AuditService = Depends(get_audit_service)) -> CollectionAuditor:
    return CollectionAuditor(audit_service)

def get_collection_service(
    repo: CollectionRepository = Depends(get_collection_repository),
    items_repo: ItemsRepository = Depends(get_items_repository),
    auditor: CollectionAuditor = Depends(get_collection_auditor)
) -> CollectionService:
    return CollectionService(repo, auditor, items_repo)

def get_item_service(
    items_repo: ItemsRepository = Depends(get_items_repository),
    item_auditor: ItemAuditor = Depends(get_item_auditor),
    collection_repo: CollectionRepository = Depends(get_collection_repository)
) -> ItemService:
    return ItemService(items_repo, item_auditor, collection_repo)

def get_excel_service(
    items_repo: ItemsRepository = Depends(get_items_repository),
    item_auditor: ItemAuditor = Depends(get_item_auditor)
) -> ExcelService:
    return ExcelService(items_repo, item_auditor)


from app.services.user_service import UserService
from app.services.group_service import GroupService
from app.db.repositories.group_repository import GroupRepository
from app.services.audit.group_auditor import GroupAuditor
from app.services.adfs_service import ADFSService


from app.services.audit.user_auditor import UserAuditor
from app.db.repositories.user_repository import UserRepository

def get_user_repository() -> UserRepository:
    return UserRepository()

def get_user_auditor(audit_service: AuditService = Depends(get_audit_service)) -> UserAuditor:
    return UserAuditor(audit_service)

def get_user_service(
    auditor: UserAuditor = Depends(get_user_auditor),
    repo: UserRepository = Depends(get_user_repository)
) -> UserService:
    return UserService(auditor, repo)

def get_group_repository() -> GroupRepository:
    return GroupRepository()

def get_group_auditor(audit_service: AuditService = Depends(get_audit_service)) -> GroupAuditor:
    return GroupAuditor(audit_service)

def get_group_service(
    repo: GroupRepository = Depends(get_group_repository),
    auditor: GroupAuditor = Depends(get_group_auditor)
) -> GroupService:
    return GroupService(repo, auditor)

def get_adfs_service() -> ADFSService:
    return ADFSService()

from app.services.audit.auth_auditor import AuthAuditor

def get_auth_auditor(audit_service: AuditService = Depends(get_audit_service)) -> AuthAuditor:
    return AuthAuditor(audit_service)

def get_auth_service(
    user_service: UserService = Depends(get_user_service),
    group_service: GroupService = Depends(get_group_service),
    adfs_service: ADFSService = Depends(get_adfs_service),
    auth_auditor: AuthAuditor = Depends(get_auth_auditor)
) -> AuthService:
    return AuthService(user_service, group_service, adfs_service, auth_auditor)

def get_analytics_service(
    items_repo: ItemsRepository = Depends(get_items_repository),
    audit_service: AuditService = Depends(get_audit_service)
) -> AnalyticsService:
    return AnalyticsService(items_repo, audit_service)


from app.services.procurement_service import ProcurementService
from app.db.repositories.procurement_repository import ProcurementRepository
from app.services.s3_service import S3Service
from app.services.audit.procurement_auditor import ProcurementAuditor

def get_procurement_repository() -> ProcurementRepository:
    return ProcurementRepository()

def get_s3_service() -> S3Service:
    return S3Service()

def get_procurement_auditor(audit_service: AuditService = Depends(get_audit_service)) -> ProcurementAuditor:
    return ProcurementAuditor(audit_service)

def get_procurement_service(
    repo: ProcurementRepository = Depends(get_procurement_repository),
    s3_service: S3Service = Depends(get_s3_service),
    auditor: ProcurementAuditor = Depends(get_procurement_auditor)
) -> ProcurementService:
    return ProcurementService(repo, s3_service, auditor)


