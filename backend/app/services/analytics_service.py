from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
import logging

from app.db.repositories.items import ItemsRepository
from app.db.repositories.procurement_repository import ProcurementRepository
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for analytics and dashboard statistics."""
    
    def __init__(self, items_repo: ItemsRepository, audit_service: AuditService, procurement_repo: ProcurementRepository):
        """Initialize analytics service with repositories."""
        self.items_repo = items_repo
        self.audit_service = audit_service
        self.procurement_repo = procurement_repo

    def _build_date_filter(self, start_date: Optional[str], end_date: Optional[str], date_field: str) -> Dict[str, Any]:
        """Builds a MongoDB query filter for a given date field based on start and end dates."""
        date_query = {}
        if start_date:
            try:
                date_query["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except ValueError:
                logger.debug("Invalid start_date format: %s", start_date)
        if end_date:
            try:
                date_query["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            except ValueError:
                logger.debug("Invalid end_date format: %s", end_date)
        
        return {date_field: date_query} if date_query else {}

    async def get_dashboard_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get all dashboard statistics.
        
        Returns comprehensive dashboard data including:
        - Project distribution (reserved inventory)
        - Total items count
        - Active allocations count
        - Serial equipment count
        - Non-serial equipment count
        - Target site distribution
        - Manufacturer distribution
        - Location distribution
        - Procurement stats (KPIs)
        
        Returns:
            Dictionary containing all dashboard statistics
        """
        logger.debug("Fetching dashboard stats...")
        
        # Build global item date filter for inventory (using created_at)
        inventory_filter = self._build_date_filter(start_date, end_date, "created_at")
        
        serial_filter = {"serial": {"$exists": True, "$nin": ["", None]}, **inventory_filter}
        non_serial_filter = {
            "$or": [
                {"serial": {"$exists": False}},
                {"serial": ""},
                {"serial": None}
            ]
        }
        if inventory_filter:
            # Safely combine $or with other conditions using $and
            non_serial_filter = {"$and": [non_serial_filter, inventory_filter]}
        
        # Execute parallel queries for better performance
        (
            project_stats,
            total_items,
            active_allocations,
            serial_equipment,
            non_serial_equipment,
            target_sites,
            manufacturers,
            locations,
            procurement_stats
        ) = await asyncio.gather(
            self._calculate_project_distribution(inventory_filter),
            self.items_repo.count(inventory_filter),
            self._calculate_total_allocations(inventory_filter),
            self.items_repo.count(serial_filter),
            self.items_repo.count(non_serial_filter),
            self._calculate_target_site_distribution(inventory_filter),
            self._calculate_manufacturer_distribution(inventory_filter),
            self._calculate_location_distribution(inventory_filter),
            self._calculate_procurement_stats(start_date, end_date)
        )

        return {
            "projects": project_stats,
            "total_items": total_items,
            "active_allocations": active_allocations,
            "serial_equipment": serial_equipment,
            "non_serial_equipment": non_serial_equipment,
            "target_sites": target_sites,
            "manufacturers": manufacturers,
            "locations": locations,
            "procurement": procurement_stats
        }

    async def get_activity_stats(self, days: int = 7) -> Dict[str, int]:
        """
        מחזיר כמות פעולות (יצירה, עדכון, מחיקה) בטווח הימים האחרונים
        """
        created = await self.audit_service.get_action_count(
            ["item_create", "procurement_create", "user_create", "group_create"], 
            days
        )
        updated = await self.audit_service.get_action_count(
            ["item_update", "item_bulk_update", "procurement_update", "user_update", 
             "password_change", "role_change", "group_update"], 
            days
        )
        deleted = await self.audit_service.get_action_count(
            ["item_delete", "item_bulk_delete", "procurement_delete", "user_delete", "group_delete"], 
            days
        )
        
        return {
            "created": created,
            "updated": updated,
            "deleted": deleted,
            "days": days
        }

    async def get_item_project_stats(self, catalog_number: str) -> Dict[str, Any]:
        """
        מחזיר התפלגות פרויקטים עבור מק"ט ספציפי.
        כולל: סה"כ כמות במלאי, כמות משוריינת לכל פרויקט, וכמות לא משוריינת.
        מסנן כפילויות לפי (מק"ט, מיקום).
        """
        logger.debug("Fetching item project stats for catalog_number: %s", catalog_number)

        # ── 1. Aggregate total inventory quantity (all matching items) ──────────
        # For serial items: each document = 1 unit.
        # For non-serial items: current_stock is a string, we try to parse as int.
        all_items_cursor = self.items_repo.collection.find(
            {"catalog_number": {"$regex": catalog_number, "$options": "i"}},
            {"catalog_number": 1, "location": 1, "current_stock": 1,
             "serial": 1, "project_allocations": 1}
        )

        total_quantity = 0
        project_totals: Dict[str, int] = {}
        processed_locations: set = set()

        async for item in all_items_cursor:
            location = item.get("location")
            serial = item.get("serial")
            current_stock_raw = item.get("current_stock")
            allocations = item.get("project_allocations") or {}

            # Determine the quantity this document represents
            is_serial = bool(serial)
            if is_serial:
                item_qty = 1
            else:
                # Non-serial: current_stock is stored as a string (e.g. "30")
                try:
                    item_qty = int(current_stock_raw) if current_stock_raw is not None else 1
                except (ValueError, TypeError):
                    item_qty = 1

            total_quantity += item_qty

            # Deduplication: only count allocations once per location
            if not isinstance(allocations, dict) or not allocations:
                continue

            if location:
                loc_key = location.strip()
                if loc_key in processed_locations:
                    continue
                processed_locations.add(loc_key)

            for project, qty in allocations.items():
                project_totals[project] = project_totals.get(project, 0) + qty

        total_allocated = sum(project_totals.values())
        unallocated = max(0, total_quantity - total_allocated)

        projects_list = [
            {"name": name, "value": total}
            for name, total in project_totals.items()
        ]
        projects_list.sort(key=lambda x: x["value"], reverse=True)

        result = {
            "total_quantity": total_quantity,
            "total_allocated": total_allocated,
            "unallocated": unallocated,
            "projects": projects_list,
        }
        logger.debug(
            "Item stats for '%s': total=%d, allocated=%d, unallocated=%d, projects=%d",
            catalog_number, total_quantity, total_allocated, unallocated, len(projects_list)
        )
        return result

    async def _calculate_project_distribution(self, date_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        סורק את כל הפריטים שיש להם 'project_allocations',
        וסוכם לפי פרויקט.
        """
        query = {"project_allocations": {"$exists": True, "$ne": {}}}
        if date_filter:
            query.update(date_filter)
            
        cursor = self.items_repo.collection.find(
            query,
            {"project_allocations": 1, "catalog_number": 1, "location": 1}
        )
        
        project_totals = {}
        processed_combinations = set() # Set of (catalog_number, location)
        
        async for item in cursor:
            catalog = item.get("catalog_number")
            location = item.get("location")
            allocations = item.get("project_allocations", {})
            
            if not isinstance(allocations, dict) or not allocations:
                continue

            # Unique Key Composition: (Catalog, Location)
            if catalog and location:
                unique_key = (catalog, location)
                if unique_key in processed_combinations:
                    continue
                processed_combinations.add(unique_key)
                
            for project, qty in allocations.items():
                if project in project_totals:
                    project_totals[project] += qty
                else:
                    project_totals[project] = qty
                        
        results = [
            {"name": name, "value": total}
            for name, total in project_totals.items()
        ]
        results.sort(key=lambda x: x["value"], reverse=True)
        return results

    async def _calculate_total_allocations(self, date_filter: Optional[Dict[str, Any]] = None) -> int:
        """
        מחשב את מספר הפרויקטים השונים שיש להם שריונים פעילים.
        """
        query = {"project_allocations": {"$exists": True, "$ne": {}}}
        if date_filter:
            query.update(date_filter)
            
        cursor = self.items_repo.collection.find(
            query,
            {"project_allocations": 1, "catalog_number": 1, "location": 1}
        )
        
        unique_projects = set()  # Set of unique project names
        processed_combinations = set()  # Set of (catalog_number, location)
        
        async for item in cursor:
            catalog = item.get("catalog_number")
            location = item.get("location")
            allocations = item.get("project_allocations", {})
            
            if not isinstance(allocations, dict) or not allocations:
                continue

            if catalog and location:
                unique_key = (catalog, location)
                if unique_key in processed_combinations:
                    continue
                processed_combinations.add(unique_key)
                
            for project in allocations.keys():
                unique_projects.add(project)
                        
        return len(unique_projects)

    async def _calculate_target_site_distribution(self, date_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        סורק את כל הפריטים שיש להם 'target_site',
        וסוכם לפי אתר יעד.
        """
        match_query = {"target_site": {"$exists": True, "$ne": None, "$nin": ["", None]}}
        if date_filter:
            match_query.update(date_filter)
            
        pipeline = [
            {"$match": match_query},
            {"$group": {"_id": "$target_site", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        cursor = self.items_repo.collection.aggregate(pipeline)
        
        results = []
        async for doc in cursor:
            results.append({"name": doc["_id"], "value": doc["count"]})
            
        return results

    async def _calculate_manufacturer_distribution(self, date_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        התפלגות לפי יצרן - לוקח את מה שאחרי | בשם היצרן
        """
        match_query = {"manufacturer": {"$exists": True, "$ne": None, "$nin": ["", None]}}
        if date_filter:
            match_query.update(date_filter)
            
        pipeline = [
            {"$match": match_query},
            {"$group": {"_id": "$manufacturer", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 15}  # Top 15 manufacturers
        ]
        
        cursor = self.items_repo.collection.aggregate(pipeline)
        results = []
        
        async for doc in cursor:
            manufacturer_name = doc["_id"]
            if manufacturer_name and "|" in manufacturer_name:
                parts = manufacturer_name.split("|")
                if len(parts) > 1:
                    manufacturer_name = parts[1].strip()
            results.append({"name": manufacturer_name, "value": doc["count"]})
        
        return results

    async def _calculate_location_distribution(self, date_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        התפלגות לפי מיקום
        """
        match_query = {"location": {"$exists": True, "$ne": None, "$nin": ["", None]}}
        if date_filter:
            match_query.update(date_filter)
            
        pipeline = [
            {"$match": match_query},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        cursor = self.items_repo.collection.aggregate(pipeline)
        results = []
        
        async for doc in cursor:
            results.append({"name": doc["_id"], "value": doc["count"]})
        
        return results

    async def _calculate_procurement_stats(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Calculates KPIs for procurement: waiting EMF, waiting BOM, ordered, and total spend.
        Optionally filters by order_date.
        """
        pipeline = []
        
        # Add date filter if provided
        match_stage = {}
        if start_date or end_date:
            date_filter = {}
            if start_date:
                # Convert ISO string to datetime object if needed, though usually string comparison works for ISO 8601,
                # but MongoDB dates are stored as ISODate (datetime).
                try:
                    date_filter["$gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                except ValueError:
                    logger.debug("Invalid start_date format in procurement stats: %s", start_date)
            if end_date:
                try:
                    # To include the whole end day we might want to adjust it, 
                    # but simple fromisoformat is a good start. 
                    date_filter["$lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                except ValueError:
                    logger.debug("Invalid end_date format in procurement stats: %s", end_date)
            
            if date_filter:
                match_stage["order_date"] = date_filter
                
        if match_stage:
            pipeline.append({"$match": match_stage})

        # Execute grouping for statuses and sum for total_amount in an aggregation query
        pipeline.append(
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_spend": {"$sum": "$total_amount"}
            }}
        )
        
        cursor = self.procurement_repo.collection.aggregate(pipeline)
        
        stats = {
            "waiting_emf": 0,
            "waiting_bom": 0,
            "ordered": 0,
            "received": 0,
            "total_spend": 0.0
        }
        
        async for doc in cursor:
            status = doc["_id"]
            count = doc["count"]
            
            # waiting_emf: need EMF (either both missing, or only EMF missing)
            if status in ["waiting_bom_emf", "waiting_emf"]:
                stats["waiting_emf"] += count
            # waiting_bom: only the legacy status where EMF was received but BOM is still missing
            # waiting_bom_emf is already shown in waiting_emf, no need to double-count
            if status == "waiting_bom":
                stats["waiting_bom"] += count
            if status in ["waiting_shipment", "shipped", "ordered", "waiting_order"]:
                stats["ordered"] += count
            if status == "received":
                stats["received"] += count
                
            # Add to total spend regardless of status
            stats["total_spend"] += doc.get("total_spend", 0.0)

            
        return stats
