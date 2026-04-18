from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from bson import ObjectId

from app.db.mongodb import MongoDB


class ProcurementRepository:
    """Repository for procurement operations"""
    
    def __init__(self):
        self.collection = MongoDB.get_collection("procurement_orders")
    
    async def create_order(self, order_data: Dict[str, Any], initial_files: list = None) -> Dict[str, Any]:
        """Create new procurement order"""
        order_doc = {
            **order_data,
            "files": initial_files or [],
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        
        result = await self.collection.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id
        
        return self._format_order(order_doc)
    
    async def get_orders(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        catalog_number: Optional[str] = None,
        manufacturer: Optional[str] = None,
        emf_number: Optional[str] = None,
        status_in: Optional[List[str]] = None,
        status_ne: Optional[str] = None,
        allowed_vendors: Optional[List[str]] = None
    ) -> tuple[List[Dict[str, Any]], int]:
        """Get all procurement orders with pagination and filters"""
        filter_query = {}
        
        # Generic search across bom_items and emf_number
        if search:
            words = [w for w in search.strip().split() if w]
            searchable_fields = [
                "bom_items.catalog_number",
                "bom_items.product_name",
                "bom_items.description",
                "bom_items.manufacturer",
                "bom_data.groups.main.part_alias",
                "emf_number",
            ]
            if len(words) == 1:
                r = {"$regex": words[0], "$options": "i"}
                filter_query["$or"] = [{f: r} for f in searchable_fields]
            else:
                filter_query["$and"] = [
                    {"$or": [{f: {"$regex": w, "$options": "i"}} for f in searchable_fields]}
                    for w in words
                ]
        else:
            if catalog_number or manufacturer:
                bom_filter = {}
                if catalog_number:
                    bom_filter["bom_items.catalog_number"] = {"$regex": catalog_number, "$options": "i"}
                if manufacturer:
                    bom_filter["bom_items.manufacturer"] = {"$regex": manufacturer, "$options": "i"}
                filter_query.update(bom_filter)
            if emf_number:
                filter_query["emf_number"] = {"$regex": emf_number, "$options": "i"}
        
        if status_in:
            filter_query["status"] = {"$in": status_in}
        elif status_ne:
            filter_query["status"] = {"$ne": status_ne}

        # סנן לפי ספקים מותרים (None = כל, רשימה = רק אלו)
        if allowed_vendors is not None:
            # תוצאות שבו-vendor מתאימות OR הזמנות ידניות (ללא ספק)
            filter_query["$and"] = filter_query.get("$and", []) + [{
                "$or": [
                    {"bom_vendor": {"$in": allowed_vendors}},
                    {"bom_vendor": {"$exists": False}},
                    {"bom_vendor": None},
                ]
            }]
                    
        total = await self.collection.count_documents(filter_query)
        cursor = self.collection.find(filter_query).sort("order_date", -1).skip(skip).limit(limit)
        orders = await cursor.to_list(length=limit)
        
        return [self._format_order(order) for order in orders], total
    
    async def get_order_by_id(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Get procurement order by ID"""
        try:
            order = await self.collection.find_one({"_id": ObjectId(order_id)})
            return self._format_order(order) if order else None
        except Exception:
            return None
    
    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update procurement order"""
        try:
            update_data["updated_at"] = datetime.now(timezone.utc)
            
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {"$set": update_data},
                return_document=True
            )
            
            return self._format_order(result) if result else None
        except Exception:
            return None
    
    async def patch_bom_catalog_in_groups(
        self,
        order_id: str,
        changed_items: List[Dict[str, Any]],
    ) -> bool:
        """Apply catalog field edits (description_he, category, part_alias) directly into
        bom_data.groups inside the procurement_orders document so the data persists across
        page reloads.  Returns True on success, False if the order was not found."""
        import logging
        logger = logging.getLogger(__name__)
        try:
            order = await self.get_order_by_id(order_id)
            if not order or not order.get("bom_data"):
                logger.warning("patch_bom_catalog_in_groups: order %s not found or has no bom_data", order_id)
                return False

            by_pn: Dict[str, Dict] = {item["part_number"]: item for item in changed_items if item.get("part_number")}
            if not by_pn:
                return True  # nothing to do

            def _apply(item_dict: Dict[str, Any]) -> Dict[str, Any]:
                pn = item_dict.get("part_number")
                if not pn or pn not in by_pn:
                    return item_dict
                edit = by_pn[pn]
                catalog = dict(item_dict.get("catalog") or {})
                if "description_he" in edit and edit["description_he"] is not None:
                    catalog["description_he"] = edit["description_he"]
                if "category" in edit and edit["category"] is not None:
                    catalog["category"] = edit["category"]
                if "part_alias" in edit and edit["part_alias"] is not None:
                    catalog["part_alias"] = edit["part_alias"]
                return {**item_dict, "catalog": catalog}

            updated_groups = []
            for g in order["bom_data"].get("groups", []):
                updated_g = dict(g)
                if g.get("main"):
                    updated_g["main"] = _apply(g["main"])
                updated_g["children"] = [_apply(c) for c in g.get("children", [])]
                updated_groups.append(updated_g)

            updated_bom_data = {**order["bom_data"], "groups": updated_groups}
            await self.collection.update_one(
                {"_id": ObjectId(order_id)},
                {"$set": {"bom_data": updated_bom_data, "updated_at": datetime.now(timezone.utc)}},
            )
            logger.info("patch_bom_catalog_in_groups: patched %d parts in order %s", len(by_pn), order_id)
            return True
        except Exception as e:
            logger.error("patch_bom_catalog_in_groups failed for order %s: %s", order_id, e, exc_info=True)
            return False

    async def delete_order(self, order_id: str) -> bool:
        """Delete procurement order"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(order_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    async def add_file_to_order(self, order_id: str, file_metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Add file metadata to procurement order"""
        try:
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {
                    "$push": {"files": file_metadata},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                },
                return_document=True
            )
            
            return self._format_order(result) if result else None
        except Exception:
            return None
    
    async def remove_file_from_order(self, order_id: str, file_id: str) -> Optional[Dict[str, Any]]:
        """Remove file metadata from procurement order"""
        try:
            result = await self.collection.find_one_and_update(
                {"_id": ObjectId(order_id)},
                {
                    "$pull": {"files": {"file_id": file_id}},
                    "$set": {"updated_at": datetime.now(timezone.utc)}
                },
                return_document=True
            )
            
            return self._format_order(result) if result else None
        except Exception:
            return None
    
    async def get_file_metadata(self, order_id: str, file_id: str) -> Optional[Dict[str, Any]]:
        """Get specific file metadata from order"""
        order = await self.get_order_by_id(order_id)
        if not order:
            return None
        
        for file in order.get("files", []):
            if file["file_id"] == file_id:
                return file
        
        return None
    
    def _format_order(self, order: Dict[str, Any]) -> Dict[str, Any]:
        """Format order document for response"""
        if not order:
            return {}
        
        order["id"] = str(order.pop("_id", None) or "")
        return order

    async def get_monthly_summary(self) -> Dict[str, Any]:
        """Get procurement summary stats for the current month"""
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        pipeline = [
            {"$match": {"order_date": {"$gte": month_start}}},
            {"$facet": {
                "totals": [
                    {"$group": {
                        "_id": None,
                        "total_spend": {"$sum": "$total_amount"},
                        "order_count": {"$sum": 1}
                    }}
                ],
                "top_vendor": [
                    {"$match": {"bom_vendor": {"$ne": None}}},
                    {"$group": {"_id": "$bom_vendor", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 1}
                ],
                "lead_times": [
                    {"$match": {
                        "status": "received",
                        "received_at": {"$ne": None}
                    }},
                    {"$project": {
                        "lead_days": {
                            "$divide": [
                                {"$subtract": ["$received_at", "$order_date"]},
                                86400000
                            ]
                        }
                    }},
                    {"$group": {
                        "_id": None,
                        "avg_lead_days": {"$avg": "$lead_days"}
                    }}
                ]
            }}
        ]

        results = await self.collection.aggregate(pipeline).to_list(length=1)
        if not results:
            return {"total_spend": 0, "order_count": 0, "avg_lead_days": None, "top_vendor": None}

        facets = results[0]
        totals = facets["totals"][0] if facets["totals"] else {"total_spend": 0, "order_count": 0}
        top_vendor = facets["top_vendor"][0]["_id"] if facets["top_vendor"] else None
        avg_lead = facets["lead_times"][0]["avg_lead_days"] if facets["lead_times"] else None

        return {
            "total_spend": totals.get("total_spend", 0),
            "order_count": totals.get("order_count", 0),
            "avg_lead_days": round(avg_lead, 1) if avg_lead is not None else None,
            "top_vendor": top_vendor
        }
