from typing import Dict, Any, List, Optional
from app.db.mongodb import MongoDB
from app.db.repositories.catalog_repository import CatalogRepository
from app.schemas.catalog import CatalogFilter, CatalogListResponse

class CatalogService:
    def __init__(self):
        self.repository = CatalogRepository(MongoDB.get_collection("catalog_items"))

    async def search_catalog(self, filter_params: CatalogFilter) -> CatalogListResponse:
        items, total = await self.repository.search(filter_params)
        
        pages = (total + filter_params.limit - 1) // filter_params.limit if total > 0 else 1
        
        return CatalogListResponse(
            items=items,
            total=total,
            page=filter_params.page,
            limit=filter_params.limit,
            pages=pages
        )

    async def upsert_catalog_item(self, catalog_number: str, description: Optional[str] = None, manufacturer: Optional[str] = None):
        if not catalog_number:
            return
        await self.repository.upsert(
            catalog_number=catalog_number,
            description=description,
            manufacturer=manufacturer
        )
