from typing import List, Dict
from datetime import datetime, timezone
from app.db.mongodb import MongoDB

VALID_CATEGORIES = [
    "server-storage",
    "server",
    "switch",
    "io-card",
    "disk",
    "disk-shelf",
    "cable",
    "sfp-qsfp",
    "license",
    "accessory",
    "other",
]

class BomCatalogService:
    """Service dedicated to managing the BOM part catalog DB collection."""
    
    def __init__(self):
        self.collection = MongoDB.get_collection("bom_part_catalog")

    async def check_unknown_parts(self, part_numbers: List[str]) -> List[str]:
        """Return part numbers NOT found in bom_part_catalog."""
        if not part_numbers:
            return []
        cursor = self.collection.find(
            {"part_number": {"$in": part_numbers}},
            {"part_number": 1}
        )
        known = set()
        async for doc in cursor:
            known.add(doc["part_number"])
        return [p for p in part_numbers if p not in known]

    def classify_parts(self, unknown_list: List[Dict]) -> List[Dict]:
        """
        Run the AI classifier on each unknown part's excel_description.
        Enriches each item with:
          - ai_label (str): Hebrew label predicted by the model
          - ai_category (str): internal category slug
          - ai_description_he (str): suggested Hebrew description
          - ai_confidence (float): 0-1 score
          - ai_low_confidence (bool): True when confidence < threshold
        Returns the list in-place (also returns it for convenience).
        """
        try:
            from app.ai.classifier import classify_batch
            descriptions = [item.get("excel_description", "") or "" for item in unknown_list]
            results = classify_batch(descriptions)
            for item, ai in zip(unknown_list, results):
                item["ai_label"] = ai["label"]
                item["ai_category"] = ai["category"]
                item["ai_description_he"] = ai["description_he"]
                item["ai_confidence"] = ai["confidence"]
                item["ai_low_confidence"] = ai["low_confidence"]
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("AI classify_parts failed: %s", exc)
            # Fill neutral fallback so the UI still works
            for item in unknown_list:
                item.setdefault("ai_label", "אחר")
                item.setdefault("ai_category", "other")
                item.setdefault("ai_description_he", "")
                item.setdefault("ai_confidence", 0.0)
                item.setdefault("ai_low_confidence", True)
        return unknown_list


    async def enrich_groups(self, groups: List[Dict]) -> List[Dict]:
        """Add catalog data (description_he, category, important) to each item.
        For parts not yet in the catalog, runs the AI classifier on the Excel
        description so the group card shows the correct category and label.
        """
        # Collect all part numbers and their Excel descriptions
        all_parts: Dict[str, str] = {}   # part_number → excel description
        for group in groups:
            mn = group["main"].get("part_number")
            if mn:
                all_parts[mn] = group["main"].get("product", "")
            for child in group.get("children", []):
                cpn = child.get("part_number")
                if cpn:
                    all_parts[cpn] = child.get("product", "")

        if not all_parts:
            return groups

        # Fetch known parts from catalog
        catalog_map: Dict[str, Dict] = {}
        cursor = self.collection.find({"part_number": {"$in": list(all_parts.keys())}})
        async for doc in cursor:
            catalog_map[doc["part_number"]] = {
                "description_he": doc.get("description_he", ""),
                "category": doc.get("category", "other"),
                "important": doc.get("important", True),
            }

        # For unknown parts, run AI classifier to get a sensible category
        unknown_pns = [pn for pn in all_parts if pn not in catalog_map]
        if unknown_pns:
            try:
                from app.ai.classifier import classify_batch
                descriptions = [all_parts[pn] for pn in unknown_pns]
                ai_results = classify_batch(descriptions)
                for pn, ai in zip(unknown_pns, ai_results):
                    catalog_map[pn] = {
                        "description_he": ai.get("description_he", ""),
                        "category": ai.get("category", "other"),
                        "important": True,
                        "_ai": True,  # flag: this came from AI, not catalog
                    }
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("enrich_groups AI fallback failed: %s", exc)
                # Final fallback: use 'other' (not server-storage)
                for pn in unknown_pns:
                    catalog_map[pn] = {"description_he": "", "category": "other", "important": True}

        # Attach catalog data to every item
        for group in groups:
            pn = group["main"].get("part_number")
            group["main"]["catalog"] = catalog_map.get(pn, {"description_he": "", "category": "other", "important": True})

            for child in group.get("children", []):
                cpn = child.get("part_number")
                child["catalog"] = catalog_map.get(cpn, {"description_he": "", "category": "other", "important": True})

        return groups

    async def save_part(
        self,
        part_number: str,
        description_he: str,
        category: str,
        important: bool,
        excel_description: str = "",
    ) -> Dict:
        """Upsert a part into bom_part_catalog."""
        if category not in VALID_CATEGORIES:
            raise ValueError(f"קטגוריה לא חוקית: {category}")

        doc = {
            "part_number": part_number,
            "description_he": description_he,
            "category": category,
            "important": important,
            "excel_description": excel_description,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }

        await self.collection.update_one(
            {"part_number": part_number},
            {
                "$set": doc,
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()},
            },
            upsert=True,
        )
        return doc

    async def get_all_parts(self) -> List[Dict]:
        """Return all parts in the catalog."""
        parts = []
        cursor = self.collection.find({}, {"_id": 0}).sort("part_number", 1)
        async for doc in cursor:
            parts.append(doc)
        return parts
