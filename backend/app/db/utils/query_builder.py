from typing import Dict, Any, Optional
from app.schemas.item import ItemFilter

class MongoQueryBuilder:
    @staticmethod
    def build_search_query(filter_params: ItemFilter) -> Dict[str, Any]:
        query = {}

        # Global Search across multiple fields
        if filter_params.search:
            search_regex = {"$regex": filter_params.search, "$options": "i"}
            query["$or"] = [
                {"catalog_number": search_regex},
                {"serial": search_regex},
                {"manufacturer": search_regex},
                {"description": search_regex},
                {"location": search_regex},
                {"purpose": search_regex},
                {"target_site": search_regex},
                {"notes": search_regex},
                {"current_stock": search_regex},
                # Add reserved_stock if still relevant or kept for compat
                {"reserved_stock": search_regex}, 
            ]

        # Specific Field Filters
        specific_filters = {
            "catalog_number": filter_params.catalog_number,
            "serial": filter_params.serial,
            "manufacturer": filter_params.manufacturer,
            "description": filter_params.description,
            "location": filter_params.location,
            "current_stock": filter_params.current_stock,
            "warranty_expiry": filter_params.warranty_expiry,
            "purpose": filter_params.purpose,
            "target_site": filter_params.target_site,
            "notes": filter_params.notes
        }

        for field, value in specific_filters.items():
            if value:
                query[field] = {"$regex": value, "$options": "i"}

        # Special handling for project_allocations (mapped to reserved_stock string for search)
        # Special handling for project_allocations
        if filter_params.project_allocations:
             # We search in 'reserved_stock' which should contain the string representation
             # This requires 'reserved_stock' to be kept in sync with 'project_allocations'
             query["reserved_stock"] = {"$regex": filter_params.project_allocations, "$options": "i"}

        return query
