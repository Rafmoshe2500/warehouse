import logging
from typing import Dict, Any, List

from app.db.mongodb import MongoDB

logger = logging.getLogger(__name__)

ITEMS_SEARCH_FIELDS = [
    "catalog_number", "serial", "description", "manufacturer",
    "item_name", "location", "notes"
]

ORDERS_SEARCH_FIELDS = [
    "emf_number",
    "bom_items.catalog_number",
    "bom_items.product_name",
    "bom_items.manufacturer",
    "bom_items.description",
]

COLLECTIONS_SEARCH_FIELDS = ["name", "description"]


class SearchService:
    """Unified global search across items, procurement orders, and collections"""

    def __init__(self):
        self.items_col = MongoDB.get_collection("inventory")
        self.orders_col = MongoDB.get_collection("procurement_orders")
        self.collections_col = MongoDB.get_collection("collections")

    async def search(self, query: str, limit: int = 5) -> Dict[str, Any]:
        logger.info("Global search query=%s limit=%d", query, limit)

        regex = {"$regex": query, "$options": "i"}

        items, orders, collections = await self._parallel_search(regex, limit)

        return {
            "items": items,
            "orders": orders,
            "collections": collections,
        }

    async def _parallel_search(self, regex: dict, limit: int):
        import asyncio

        items_task = self._search_items(regex, limit)
        orders_task = self._search_orders(regex, limit)
        collections_task = self._search_collections(regex, limit)

        return await asyncio.gather(items_task, orders_task, collections_task)

    async def _search_items(self, regex: dict, limit: int) -> List[Dict[str, Any]]:
        or_conditions = [{f: regex} for f in ITEMS_SEARCH_FIELDS]
        cursor = self.items_col.find(
            {"$or": or_conditions},
            {"catalog_number": 1, "serial": 1, "description": 1, "manufacturer": 1, "item_name": 1, "location": 1}
        ).limit(limit)
        results = await cursor.to_list(length=limit)
        for r in results:
            r["_id"] = str(r["_id"])
        return results

    async def _search_orders(self, regex: dict, limit: int) -> List[Dict[str, Any]]:
        or_conditions = [{f: regex} for f in ORDERS_SEARCH_FIELDS]
        cursor = self.orders_col.find(
            {"$or": or_conditions},
            {"emf_number": 1, "status": 1, "order_date": 1, "bom_vendor": 1, "total_amount": 1}
        ).limit(limit)
        results = await cursor.to_list(length=limit)
        for r in results:
            r["_id"] = str(r["_id"])
            if "order_date" in r and r["order_date"]:
                r["order_date"] = r["order_date"].isoformat()
        return results

    async def _search_collections(self, regex: dict, limit: int) -> List[Dict[str, Any]]:
        or_conditions = [{f: regex} for f in COLLECTIONS_SEARCH_FIELDS]
        cursor = self.collections_col.find(
            {"$or": or_conditions},
            {"name": 1, "description": 1, "owner": 1}
        ).limit(limit)
        results = await cursor.to_list(length=limit)
        for r in results:
            r["_id"] = str(r["_id"])
        return results
