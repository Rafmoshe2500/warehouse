import logging
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta
from app.db.mongodb import MongoDB

logger = logging.getLogger(__name__)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _resolve_datetime(value) -> datetime:
    """Normalise an order_date value to a timezone-aware datetime.

    Handles three cases found in existing documents:
    - Already a datetime object (from MongoDB)
    - ISO 8601 date string ("YYYY-MM-DD")
    - Anything else → fallback to now
    """
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        try:
            return datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            logger.debug("Could not parse date string: %s", value)
    return datetime.now(timezone.utc)

# ── Service ───────────────────────────────────────────────────────────────────

class BomAnalyticsService:
    """Manages price history for procurement BOMs.

    Responsibilities:
    - Record per-system and per-component unit prices from BOM groups
    - Provide trend queries (case-insensitive partial match, optionally filtered by is_main)
    - Retroactively seed history from existing orders
    """

    COLLECTION_NAME = "part_price_history"
    ORDERS_COLLECTION_NAME = "procurement_orders"

    def __init__(self):
        self.history_collection = MongoDB.get_collection(self.COLLECTION_NAME)
        self.orders_collection  = MongoDB.get_collection(self.ORDERS_COLLECTION_NAME)

    # ── Setup ─────────────────────────────────────────────────────────────────

    async def create_indexes(self):
        """Create indexes for fast aggregation queries. Idempotent — safe to call on startup."""
        await self.history_collection.create_index("part_number")
        await self.history_collection.create_index("vendor")
        await self.history_collection.create_index("recorded_at")
        await self.history_collection.create_index("procurement_order_id")

    # ── Write ─────────────────────────────────────────────────────────────────

    async def record_bom_prices(self, order_id: str, recorded_at: datetime, vendor: str, bom_groups: List[Dict]):
        """Store price history for a single order.

        For each BOM group stores:
        - Main system (is_main=True):  unit price = group.total_net_price / main.ext_qty
        - Sub-components (is_main=False): unit price = child.ext_net_price / child.ext_qty
        """
        history_docs = self._extract_price_docs(order_id, recorded_at, vendor, bom_groups)

        if history_docs:
            # Replace all existing records for this order atomically
            await self.history_collection.delete_many({"procurement_order_id": str(order_id)})
            await self.history_collection.insert_many(history_docs)
            mains = sum(1 for d in history_docs if d["is_main"])
            logger.info(
                "Recorded %d price points for order %s (%d systems, %d components)",
                len(history_docs), order_id, mains, len(history_docs) - mains
            )

    async def delete_order_history(self, order_id: str):
        """Remove all price history records belonging to a specific order."""
        result = await self.history_collection.delete_many({"procurement_order_id": str(order_id)})
        logger.info("Deleted %d history records for order %s", result.deleted_count, order_id)

    async def record_manual_prices(self, order_id: str, recorded_at: datetime, vendor: str, bom_items: list):
        """Store price history from manual bom_items (when no BOM file is scanned).

        Each bom_item has: product_name, catalog_number, manufacturer, quantity, (no price).
        We record a 'placeholder' doc so the part_number/product_name becomes searchable
        in the analytics comparison tool, even if prices will be back-filled later.

        Only creates records where total_amount / len(items) can be estimated,
        or when item has no price data — skips silently.
        """
        docs = []
        for item in bom_items:
            pn = (item.get("catalog_number") or "").strip()
            product_name = (item.get("part_alias") or item.get("product_name") or item.get("description") or "").strip()
            if not pn and not product_name:
                continue
            # Use catalog_number as part_number; fall back to product_name slug
            part_number = pn or product_name.replace(" ", "-").upper()
            docs.append({
                "part_number":          part_number,
                "product_name":         product_name,
                "vendor":               vendor or item.get("manufacturer", ""),
                "category":             "other",
                "is_main":              True,          # manual items are treated as main
                "unit_net_price":       0,             # unknown until BOM arrives
                "unit_list_price":      0,
                "discount_percent":     0,
                "quantity":             float(item.get("quantity") or 1),
                "procurement_order_id": str(order_id),
                "recorded_at":          recorded_at,
                "created_at":           datetime.now(timezone.utc),
            })
        if docs:
            await self.history_collection.delete_many({"procurement_order_id": str(order_id)})
            await self.history_collection.insert_many(docs)
            logger.info("Recorded %d manual price placeholders for order %s", len(docs), order_id)

    # ── Seed ─────────────────────────────────────────────────────────────────

    async def seed_historical_data(self) -> Dict[str, Any]:
        """Retroactively scan all existing procurement_orders and populate price history.

        Handles two order types:
        - BOM orders (bom_data + bom_vendor set): extract prices from BOM groups
        - Manual orders (no bom_data, but bom_items set): register product names as placeholders

        Safe to re-run: each order's history is replaced atomically.
        """
        await self.create_indexes()

        bom_processed    = 0
        manual_processed = 0

        async for order in self.orders_collection.find({}):
            raw_date    = order.get("order_date") or order.get("created_at")
            recorded_at = _resolve_datetime(raw_date)
            oid         = str(order["_id"])

            bom_data = order.get("bom_data") or {}
            groups   = bom_data.get("groups", [])
            vendor   = order.get("bom_vendor") or ""

            if groups and vendor:
                # BOM order — extract full price history
                await self.record_bom_prices(order["_id"], recorded_at, vendor, groups)
                bom_processed += 1
            elif order.get("bom_items"):
                # Manual order — register product names so they appear in search
                items  = order["bom_items"]
                vendor = (items[0].get("manufacturer") or "") if items else ""
                await self.record_manual_prices(oid, recorded_at, vendor, items)
                manual_processed += 1

        total_points = await self.history_collection.count_documents({})
        return {
            "bom_orders_processed":    bom_processed,
            "manual_orders_processed": manual_processed,
            "price_points_extracted":  total_points,
        }

    # ── Queries ───────────────────────────────────────────────────────────────

    async def get_part_trends(self, part_number: str, is_main: Optional[bool] = None) -> List[Dict]:
        """Return historical price trends for a part.

        Searches by part_number OR product_name (case-insensitive substring match),
        so users can type the product name (e.g. 'AFF-A90') and get results.
        """
        import re
        safe = re.escape(part_number)
        regex = {"$regex": safe, "$options": "i"}
        query: Dict[str, Any] = {
            "$or": [{"part_number": regex}, {"product_name": regex}]
        }
        if is_main is not None:
            query["is_main"] = is_main

        projection = {
            "_id": 0, "recorded_at": 1, "unit_net_price": 1,
            "unit_list_price": 1, "discount_percent": 1,
            "vendor": 1, "part_number": 1, "is_main": 1,
            "product_name": 1,
        }
        cursor = self.history_collection.find(query, projection).sort("recorded_at", 1)
        return [doc async for doc in cursor]

    async def search_part_numbers(self, query: str, is_main: Optional[bool] = None, limit: int = 15) -> List[Dict]:
        """Return a deduplicated list of {part_number, product_name, vendor} for autocomplete.

        Search priority:
        - Match against product_name first (what the user normally knows)
        - Also match against part_number (for technical users)
        Results ordered: product_name matches first, then part_number matches.
        """
        import re
        safe_part = re.escape(query)
        regex = {"$regex": safe_part, "$options": "i"}

        base_filter: Dict[str, Any] = {}
        if is_main is not None:
            base_filter["is_main"] = is_main

        # Two separate stages: product_name matches get a higher score
        pipeline = [
            {"$match": {**base_filter, "$or": [{"product_name": regex}, {"part_number": regex}]}},
            {"$group": {
                "_id":          "$part_number",
                "product_name": {"$first": "$product_name"},
                "vendor":       {"$first": "$vendor"},
                "name_match":   {"$first": {
                    "$cond": [{"$regexMatch": {"input": {"$ifNull": ["$product_name", ""]}, "regex": safe_part, "options": "i"}}, 1, 0]
                }},
                "count":        {"$sum": 1},
            }},
            # Sort: product_name matches first, then by frequency
            {"$sort": {"name_match": -1, "count": -1, "_id": 1}},
            {"$limit": limit},
        ]

        cursor = self.history_collection.aggregate(pipeline)
        return [
            {
                "part_number":  doc["_id"],
                "product_name": doc.get("product_name") or "",
                "vendor":       doc.get("vendor") or "",
            }
            async for doc in cursor
        ]

    async def get_aggregated_trends(
        self,
        main_part: str,
        secondary_parts: List[str],
    ) -> List[Dict]:
        """Cross-order aggregation for a main part + a list of secondary parts.

        Algorithm per order that contains main_part:
          - Sum all lines matching main_part  → main_total, main_qty
          - Sum all lines matching any secondary_part → secondary_total
          - If secondary_total > 0: data point = (main_total + secondary_total) / main_qty
          - Orders without ANY secondary part are skipped (their main part still
            appears on the individual trend line).

        Returns: [{recorded_at, total_price}] sorted ascending.
        """
        # ── Step 1: per-order totals for the main part (regex, case-insensitive) ──
        main_pipeline = [
            {"$match": {"part_number": {"$regex": f"^{re.escape(main_part)}$", "$options": "i"}}},
            {"$group": {
                "_id":         "$procurement_order_id",
                "main_total":  {"$sum": {"$multiply": ["$unit_net_price", "$quantity"]}},
                "main_qty":    {"$sum": "$quantity"},
                "recorded_at": {"$first": "$recorded_at"},
            }},
        ]
        cursor = self.history_collection.aggregate(main_pipeline)
        order_main: Dict[str, Any] = {}
        async for doc in cursor:
            order_main[doc["_id"]] = {
                "main_total":  doc["main_total"],
                "main_qty":    doc["main_qty"],
                "recorded_at": doc["recorded_at"],
            }

        if not order_main:
            return []

        # ── Step 2: per-order totals for all secondary parts (exact match) ──
        secondary_pipeline = [
            {"$match": {
                "procurement_order_id": {"$in": list(order_main.keys())},
                "part_number": {"$in": secondary_parts},
            }},
            {"$group": {
                "_id":             "$procurement_order_id",
                "secondary_total": {"$sum": {"$multiply": ["$unit_net_price", "$quantity"]}},
            }},
        ]
        cursor2 = self.history_collection.aggregate(secondary_pipeline)
        order_secondary: Dict[str, float] = {}
        async for doc in cursor2:
            order_secondary[doc["_id"]] = doc["secondary_total"]

        # ── Step 3: combine all orders with main; secondary defaults to 0 ──
        results: List[Dict] = []
        for order_id, main_data in order_main.items():
            main_qty = main_data["main_qty"]
            if main_qty <= 0:
                continue
            secondary_total = order_secondary.get(order_id, 0.0)
            total = main_data["main_total"] + secondary_total
            results.append({
                "recorded_at": main_data["recorded_at"],
                "total_price": round(total / main_qty, 2),
            })

        results.sort(key=lambda x: x["recorded_at"])
        return results

    async def get_vendor_discount_stats(self, months: int = 12) -> List[Dict]:
        """Return average/max/min discount by vendor and category over the last N months."""
        cutoff = datetime.now(timezone.utc) - relativedelta(months=months)
        pipeline = [
            {"$match": {"recorded_at": {"$gte": cutoff}, "discount_percent": {"$gt": 0}}},
            {"$group": {
                "_id": {"vendor": "$vendor", "category": "$category"},
                "avg_discount": {"$avg": "$discount_percent"},
                "max_discount": {"$max": "$discount_percent"},
                "min_discount": {"$min": "$discount_percent"},
                "part_count":   {"$sum": 1},
            }},
            {"$sort": {"_id.vendor": 1, "avg_discount": -1}},
        ]
        cursor = self.history_collection.aggregate(pipeline)
        return [
            {
                "vendor":       doc["_id"]["vendor"],
                "category":     doc["_id"]["category"],
                "avg_discount": round(doc["avg_discount"], 2),
                "max_discount": round(doc["max_discount"], 2),
                "min_discount": round(doc["min_discount"], 2),
                "data_points":  doc["part_count"],
            }
            async for doc in cursor
        ]

    async def get_vendor_spending(
        self,
        resolution: str = "monthly",
        start_date: Optional[datetime] = None,
        end_date:   Optional[datetime] = None,
    ) -> List[Dict]:
        """Return total spending per vendor grouped by time bucket.

        Args:
            resolution: 'daily' | 'monthly' | 'yearly'
            start_date: Optional filter start
            end_date:   Optional filter end

        Returns list of { bucket, vendor, total } sorted by bucket then vendor.
        """
        match_filter: Dict[str, Any] = {}
        if start_date or end_date:
            ts_filter: Dict[str, Any] = {}
            if start_date:
                ts_filter["$gte"] = start_date
            if end_date:
                ts_filter["$lte"] = end_date
            match_filter["recorded_at"] = ts_filter

        # Build date bucket format
        if resolution == "daily":
            date_format = "%Y-%m-%d"
        elif resolution == "yearly":
            date_format = "%Y"
        else:  # monthly (default)
            date_format = "%Y-%m"

        pipeline = [
            {"$match": match_filter} if match_filter else {"$match": {}},
            {"$group": {
                "_id": {
                    "bucket": {"$dateToString": {"format": date_format, "date": "$recorded_at"}},
                    "vendor": "$vendor",
                },
                "total": {"$sum": {"$multiply": ["$unit_net_price", "$quantity"]}},
            }},
            {"$project": {
                "_id": 0,
                "bucket": "$_id.bucket",
                "vendor": "$_id.vendor",
                "total":  {"$round": ["$total", 0]},
            }},
            {"$sort": {"bucket": 1, "vendor": 1}},
        ]

        cursor = self.history_collection.aggregate(pipeline)
        return [doc async for doc in cursor]

    # ── Private ───────────────────────────────────────────────────────────────

    def _extract_price_docs(
        self,
        order_id: str,
        recorded_at: datetime,
        vendor: str,
        bom_groups: List[Dict],
    ) -> List[Dict]:
        """Build a flat list of history documents from BOM group data."""
        docs: List[Dict] = []

        def _make_doc(pn: str, item: Dict, is_main: bool, override_price: float = None) -> Optional[Dict]:
            total_price = override_price if override_price is not None else float(item.get("ext_net_price") or 0)
            lst_total   = float(item.get("ext_list_price") or 0)
            disc        = float(item.get("net_discount")   or 0)
            qty         = float(item.get("ext_qty")        or 1)

            if qty <= 0 or (total_price <= 0 and lst_total <= 0):
                return None

            # Product name: prefer user-entered alias (part_alias), then product_name, then product
            product_name = (
                item.get("part_alias") or
                item.get("product_name") or
                item.get("product") or
                item.get("description") or
                ""
            )

            return {
                "part_number":          pn,
                "product_name":         product_name,
                "vendor":               vendor,
                "category":             item.get("catalog", {}).get("category", "other"),
                "is_main":              is_main,
                "unit_net_price":       round(total_price / qty, 2),
                "unit_list_price":      round(lst_total   / qty, 2) if lst_total > 0 else 0,
                "discount_percent":     disc,
                "quantity":             qty,
                "procurement_order_id": str(order_id),
                "recorded_at":          recorded_at,
                "created_at":           datetime.now(timezone.utc),
            }

        for group in bom_groups:
            main = group.get("main") or {}
            pn   = main.get("part_number")
            if not pn:
                continue

            # Main system — use total_net_price (mirrors bpv-card display)
            total_net = float(group.get("total_net_price") or main.get("ext_net_price") or 0)
            doc = _make_doc(pn, main, is_main=True, override_price=total_net)
            if doc:
                docs.append(doc)

            # Sub-components
            for child in group.get("children", []):
                cpn = child.get("part_number")
                if not cpn:
                    continue
                doc = _make_doc(cpn, child, is_main=False)
                if doc:
                    docs.append(doc)

        return docs
