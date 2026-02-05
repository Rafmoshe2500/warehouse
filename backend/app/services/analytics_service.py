from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio
import logging

from app.db.repositories.items import ItemsRepository
from app.services.audit_service import AuditService

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Service for analytics and dashboard statistics."""
    
    def __init__(self, items_repo: ItemsRepository, audit_service: AuditService):
        """Initialize analytics service with repositories."""
        self.items_repo = items_repo
        self.audit_service = audit_service

    async def get_dashboard_stats(self) -> Dict[str, Any]:
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
        
        Returns:
            Dictionary containing all dashboard statistics
        """
        logger.debug("Fetching dashboard stats...")
        
        # Execute parallel queries for better performance
        (
            project_stats,
            total_items,
            active_allocations,
            serial_equipment,
            non_serial_equipment,
            target_sites,
            manufacturers,
            locations
        ) = await asyncio.gather(
            self._calculate_project_distribution(),
            self.items_repo.count({}),
            self._calculate_total_allocations(),
            self.items_repo.count({"serial": {"$exists": True, "$nin": ["", None]}}),
            self.items_repo.count({
                "$or": [
                    {"serial": {"$exists": False}},
                    {"serial": ""},
                    {"serial": None}
                ]
            }),
            self._calculate_target_site_distribution(),
            self._calculate_manufacturer_distribution(),
            self._calculate_location_distribution()
        )

        return {
            "projects": project_stats,
            "total_items": total_items,
            "active_allocations": active_allocations,
            "serial_equipment": serial_equipment,
            "non_serial_equipment": non_serial_equipment,
            "target_sites": target_sites,
            "manufacturers": manufacturers,
            "locations": locations
        }

    async def get_activity_stats(self, days: int = 7) -> Dict[str, int]:
        """
        מחזיר כמות פעולות (יצירה, עדכון, מחיקה) בטווח הימים האחרונים
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        repo = self.audit_service.repository.collection
        
        # Helper to build OR query for all wrappers
        def build_action_query(actions):
            wrappers = ["user_action", "item_action", "procurement_action", "general_action"]
            conditions = []
            for w in wrappers:
                conditions.append({
                    f"{w}.timestamp": {"$gte": start_date},
                    f"{w}.action": {"$in": actions}
                })
            return {"$or": conditions}

        created_query = build_action_query(["item_create", "procurement_create", "user_create"])
        updated_query = build_action_query(["item_update", "item_bulk_update", "procurement_update", "user_update", "password_change", "role_change"])
        deleted_query = build_action_query(["item_delete", "item_bulk_delete", "procurement_delete", "user_delete"])
        
        created = await repo.count_documents(created_query)
        updated = await repo.count_documents(updated_query)
        deleted = await repo.count_documents(deleted_query)
        
        return {
            "created": created,
            "updated": updated,
            "deleted": deleted,
            "days": days
        }

    async def get_item_project_stats(self, catalog_number: str) -> List[Dict[str, Any]]:
        """
        מחזיר התפלגות פרויקטים עבור מק"ט ספציפי
        מסנן כפילויות לפי (מק"ט, מיקום).
        """
        # מביא פריטים עם המק"ט (Regex)
        cursor = self.items_repo.collection.find(
            {
                "catalog_number": {"$regex": catalog_number, "$options": "i"},
                "project_allocations": {"$exists": True, "$ne": {}}
            },
            {"project_allocations": 1, "catalog_number": 1, "location": 1}
        )
        
        project_totals = {}
        processed_locations = set() # Set of locations for this catalog number
        
        async for item in cursor:
            location = item.get("location")
            allocations = item.get("project_allocations", {})
            
            if not isinstance(allocations, dict) or not allocations:
                continue

            # Deduplication logic: If we saw this location already for this catalog search, skip.
            if location:
                # Normalize location string just in case
                loc_key = location.strip()
                if loc_key in processed_locations:
                    continue
                processed_locations.add(loc_key)

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

    async def _calculate_project_distribution(self) -> List[Dict[str, Any]]:
        """
        סורק את כל הפריטים שיש להם 'project_allocations',
        וסוכם לפי פרויקט.
        """
        cursor = self.items_repo.collection.find(
            {"project_allocations": {"$exists": True, "$ne": {}}},
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

    async def _calculate_total_allocations(self) -> int:
        """
        מחשב את מספר הפרויקטים השונים שיש להם שריונים פעילים.
        """
        cursor = self.items_repo.collection.find(
            {"project_allocations": {"$exists": True, "$ne": {}}},
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

    async def _calculate_target_site_distribution(self) -> List[Dict[str, Any]]:
        """
        סורק את כל הפריטים שיש להם 'target_site',
        וסוכם לפי אתר יעד.
        """
        pipeline = [
            {"$match": {"target_site": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$target_site", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        cursor = self.items_repo.collection.aggregate(pipeline)
        
        results = []
        async for doc in cursor:
            results.append({"name": doc["_id"], "value": doc["count"]})
            
        return results

    async def _calculate_manufacturer_distribution(self) -> List[Dict[str, Any]]:
        """
        התפלגות לפי יצרן - לוקח את מה שאחרי | בשם היצרן
        """
        pipeline = [
            {"$match": {"manufacturer": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$manufacturer", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 15}  # Top 15 manufacturers
        ]
        
        cursor = self.items_repo.collection.aggregate(pipeline)
        results = []
        
        async for doc in cursor:
            manufacturer_name = doc["_id"]
            if "|" in manufacturer_name:
                manufacturer_name = manufacturer_name.split("|")[1].strip()
            results.append({"name": manufacturer_name, "value": doc["count"]})
        
        return results

    async def _calculate_location_distribution(self) -> List[Dict[str, Any]]:
        """
        התפלגות לפי מיקום
        """
        pipeline = [
            {"$match": {"location": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        cursor = self.items_repo.collection.aggregate(pipeline)
        results = []
        
        async for doc in cursor:
            results.append({"name": doc["_id"], "value": doc["count"]})
        
        return results


