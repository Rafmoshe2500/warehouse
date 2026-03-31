"""
BOM (Bill of Materials) Service — Generic Multi-Vendor Excel Scanner
Supports pluggable format strategies for different vendor BOM structures.
"""

from typing import List, Dict, Any, Optional, Tuple
import io
import openpyxl
from app.db.mongodb import MongoDB


# ── Format Constants ──────────────────────────────────────────────────────────

FORMAT_NETAPP = "netapp_pricing_template"   # Yellow row = main component
FORMAT_DELL = "dell_quote"                   # Yellow row = main product, different column names
FORMAT_GENERIC_FIRST_COL = "generic_first_col"  # First non-empty col that changes = group separator
FORMAT_HPE = "hpe_quote"                     # Single row summary file
# Add new format IDs here as vendors are supported

SUPPORTED_FORMATS = {
    FORMAT_NETAPP,
    FORMAT_DELL,
    FORMAT_GENERIC_FIRST_COL,
    FORMAT_HPE,
}

VALID_CATEGORIES = [
    "server-storage",
    "server",
    "switch",
    "io-card",
    "disk",
    "disk-shelf",
    "cable",
    "sfp-qsfp",
    "other",
]

HEADER_COLUMNS = {
    "part_number": None,
    "product": None,
    "ext_qty": None,
    "ext_list_price": None,
    "mod_group": None,
    "net_discount": None,
    "ext_net_price": None,
}

# NetApp column name → internal field key
COLUMN_MAP_NETAPP = {
    "Part Number": "part_number",
    "Product": "product",
    "Ext Qty": "ext_qty",
    "Ext List Price": "ext_list_price",
    "MOD Group": "mod_group",
    "Net Discount": "net_discount",
    "Ext Net Price": "ext_net_price",
}

# Dell column name → internal field key
COLUMN_MAP_DELL = {
    "Sku": "part_number",              # SKU is the part number
    "SKU": "part_number",
    "Description": "product",
    "Qty": "ext_qty",
    "Quantity": "ext_qty",
    "Total List Price": "ext_list_price",
    "TotalList Price": "ext_list_price",
    "Discount": "net_discount",
    "Total Selling Price": "ext_net_price",  # Selling price = net price
    "TotalSelling Price": "ext_net_price",   # alt no-space variant
    "Category": "mod_group",           # Dell's Category ≈ NetApp's MOD Group
    "Unit List Price": "unit_list_price",
    "UnitList Price": "unit_list_price",
    "Unit Selling Price": "unit_net_price",
    "UnitSelling Price": "unit_net_price",
    "Line": "line",
}

# HPE column name → internal field key
COLUMN_MAP_HPE = {
    "UCID": "part_number",
    "Description": "product",
    "Qty": "ext_qty",
    "Unit List Price": "unit_list_price",
    "Total List Price": "ext_list_price",
    "Unit Net Price": "unit_net_price",
    "Total Net Price": "ext_net_price",
}

# Combined (used for generic fallback)
COLUMN_MAP = {**COLUMN_MAP_NETAPP, **COLUMN_MAP_DELL, **COLUMN_MAP_HPE}


class BomService:
    def __init__(self):
        self.collection = MongoDB.get_collection("bom_part_catalog")

    # ── Excel Parsing ─────────────────────────────────────────────────────────

    def _is_yellow(self, cell) -> bool:
        """
        Check if a cell has a yellow fill.
        Updated to support multiple shades of yellow commonly used by different vendors.
        """
        try:
            fill = cell.fill
            if fill and fill.fgColor and fill.fgColor.type == "rgb" and fill.fgColor.rgb:
                rgb = fill.fgColor.rgb.upper()
                # Common yellow hex codes: standard, light yellow, Dell yellow variations
                yellow_shades = {"FFFFFF00", "00FFFF00", "FFFFFF99", "FFFFFF66", "FFFFEB9C", "FFFFFFCC"}
                if rgb in yellow_shades or "FF00" in rgb:
                    return True
        except Exception:
            pass
        return False

    def _find_header_row(self, ws, fmt: str = FORMAT_NETAPP) -> Optional[int]:
        """Scan rows 1–25 to find the header row based on vendor format."""
        # NetApp: look for 'Part Number'
        # Dell: look for 'Sku' (case-insensitive)
        # HPE: look for 'UCID'
        search_term = "Sku" if fmt == FORMAT_DELL else "UCID" if fmt == FORMAT_HPE else "Part Number"
        for row_idx in range(1, 26):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and search_term.lower() in cell.value.lower():
                    return row_idx
        # Fallback: try any recognizable header
        for row_idx in range(1, 26):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and cell.value.strip().lower() in (
                    "part number", "sku", "ucid", "product", "description", "qty"
                ):
                    return row_idx
        return None

    def _parse_headers(self, ws, header_row: int, fmt: str = FORMAT_NETAPP) -> Dict[str, int]:
        """
        Return mapping of field_key → column index (1-based) for the given format.
        Matching is case-insensitive and whitespace-normalized.
        """
        if fmt == FORMAT_DELL:
            col_map_source = COLUMN_MAP_DELL
        elif fmt == FORMAT_HPE:
            col_map_source = COLUMN_MAP_HPE
        else:
            col_map_source = COLUMN_MAP_NETAPP

        def _normalize(s: str) -> str:
            """Strip outer whitespace and collapse inner spaces."""
            return ' '.join(s.strip().split()).lower()

        # Build a normalized lookup table {normalized_excel_name: field_key}
        normalized_source = {_normalize(k): v for k, v in col_map_source.items()}

        col_map = {}
        for cell in ws[header_row]:
            if not isinstance(cell.value, str):
                continue
            cell_norm = _normalize(cell.value)
            if not cell_norm:
                continue

            # Exact match first (after normalization)
            if cell_norm in normalized_source:
                field_key = normalized_source[cell_norm]
                col_map.setdefault(field_key, cell.column)
                continue

            # Partial/substring match as fallback (first match wins)
            for excel_norm, field_key in normalized_source.items():
                if excel_norm in cell_norm or cell_norm in excel_norm:
                    col_map.setdefault(field_key, cell.column)
                    break

        return col_map

    def _get_cell_value(self, row, col_index: Optional[int]):
        """Get cell value by 1-based column index. Returns None if index is None or not found."""
        if col_index is None:
            return None
        for cell in row:
            if cell.column == col_index:
                v = cell.value
                # Return stripped string or raw value
                if isinstance(v, str):
                    return v.strip() or None
                return v
        return None

    # ── Format-Specific Group Detection ───────────────────────────────────────

    def _is_group_header_netapp(self, row, col_map: Dict) -> bool:
        """NetApp: a row is a group header if the Part Number cell is yellow-filled."""
        for cell in row:
            if col_map.get("part_number") and cell.column == col_map["part_number"]:
                return self._is_yellow(cell)
        return False

    def _is_group_header_generic(self, row, col_map: Dict, prev_part: Optional[str]) -> bool:
        """
        Generic fallback: a row is a group header when the part number value
        changes AND qty == 1 (typical for a parent line in a quote).
        """
        pn = None
        qty = None
        for cell in row:
            if col_map.get("part_number") and cell.column == col_map["part_number"]:
                pn = str(cell.value or "").strip()
            if col_map.get("ext_qty") and cell.column == col_map["ext_qty"]:
                try:
                    qty = float(cell.value or 0)
                except (ValueError, TypeError):
                    qty = 0
        return pn is not None and pn != prev_part and qty == 1

    def _is_group_header_dell(self, row, col_map: Dict) -> bool:
        """Dell: same as NetApp — yellow fill on the Sku (part_number) cell."""
        for cell in row:
            if col_map.get("part_number") and cell.column == col_map["part_number"]:
                if self._is_yellow(cell):
                    return True
        # Also check entire row — Dell sometimes fills all cells yellow
        for cell in row:
            if cell.value is not None and self._is_yellow(cell):
                return True
        return False

    def _is_group_header_hpe(self, row, col_map: Dict) -> bool:
        """HPE files generally contain 1 server item per file, so every valid row is a group header."""
        return True

    def _is_group_header(self, row, col_map: Dict, fmt: str, prev_part: Optional[str] = None) -> bool:
        """Dispatch to the correct format strategy."""
        if fmt == FORMAT_NETAPP:
            return self._is_group_header_netapp(row, col_map)
        elif fmt == FORMAT_DELL:
            return self._is_group_header_dell(row, col_map)
        elif fmt == FORMAT_HPE:
            return self._is_group_header_hpe(row, col_map)
        elif fmt == FORMAT_GENERIC_FIRST_COL:
            return self._is_group_header_generic(row, col_map, prev_part)
        # Default: netapp style
        return self._is_group_header_netapp(row, col_map)

    # ── Main Excel Parsing ────────────────────────────────────────────────────

    def parse_excel(self, file_bytes: bytes, fmt: str = FORMAT_NETAPP) -> Tuple[List[Dict], List[str], Dict[str, str]]:
        """
        Parse a BOM Excel file according to the given format strategy.

        Returns:
            groups: List of BOM group dicts (main + sub items)
            unknown_part_numbers: List of unique part numbers not in catalog
            extracted_descriptions: Dict mapping part_number to its product description (raw from excel)
        """
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), data_only=True)
        ws = wb.active

        header_row = self._find_header_row(ws, fmt)
        if not header_row:
            raise ValueError("לא נמצאה שורת כותרות באקסל")

        col_map = self._parse_headers(ws, header_row, fmt)
        part_num_key = "part_number"
        if part_num_key not in col_map:
            raise ValueError("עמודת Part Number / Sku לא נמצאה")

        groups: List[Dict] = []
        current_group: Optional[Dict] = None
        seen_part_numbers: set = set()
        
        extracted_descriptions: Dict[str, str] = {}
        prev_part: Optional[str] = None

        for row in ws.iter_rows(min_row=header_row + 1):
            # Skip fully empty rows
            row_values = [cell.value for cell in row if cell.value is not None]
            if not row_values:
                continue

            part_number_cell = None
            for cell in row:
                if col_map.get("part_number") and cell.column == col_map["part_number"]:
                    part_number_cell = cell
                    break

            # אנו לא מדלגים מיד אם חסר מק"ט, שומרים אותו כריק עבור דל
            part_number = ""
            if part_number_cell is not None and part_number_cell.value is not None:
                part_number = str(part_number_cell.value).strip()

            is_header = self._is_group_header(row, col_map, fmt, prev_part)

            # זורקים את השורה רק אם היא גם לא כותרת וגם אין לה מק"ט
            if not is_header and not part_number:
                continue

            # Build row data
            row_data = {
                "part_number": part_number,
                "product": self._get_cell_value(row, col_map.get("product")),
                "ext_qty": self._get_cell_value(row, col_map.get("ext_qty")),
                "ext_list_price": self._get_cell_value(row, col_map.get("ext_list_price")),
                "mod_group": self._get_cell_value(row, col_map.get("mod_group")),
                "net_discount": self._get_cell_value(row, col_map.get("net_discount")),
                "ext_net_price": self._get_cell_value(row, col_map.get("ext_net_price")),
            }

            # Convert numeric fields
            for field in ("ext_qty", "ext_list_price", "net_discount", "ext_net_price"):
                try:
                    row_data[field] = float(row_data[field]) if row_data[field] is not None else 0.0
                except (ValueError, TypeError):
                    row_data[field] = 0.0

            if part_number:
                seen_part_numbers.add(part_number)
                if part_number not in extracted_descriptions and row_data["product"]:
                    extracted_descriptions[part_number] = str(row_data["product"]).strip()

            if is_header:
                # מתחילים קבוצה חדשה - לוקחים בחשבון את המחיר כבר כאן
                current_group = {
                    "main": row_data,
                    "children": [],
                    "total_net_price": row_data.get("ext_net_price", 0.0) or 0.0,
                }
                groups.append(current_group)
            else:
                # הוספת תת-רכיב לקבוצה הנוכחית
                if current_group is not None:
                    
                    # שאיבת המק"ט לשורת הכותרת אם הוא חסר (ספציפית ל-Dell)
                    if not current_group["main"]["part_number"] and part_number:
                        current_group["main"]["part_number"] = part_number
                        if current_group["main"]["product"]:
                            extracted_descriptions[part_number] = str(current_group["main"]["product"]).strip()

                    current_group["children"].append(row_data)
                    if row_data["ext_net_price"] and row_data["ext_net_price"] > 0:
                        current_group["total_net_price"] += row_data["ext_net_price"]

            if part_number:
                prev_part = part_number

        # ניקוי קבוצות שאולי נוצרו אבל נשארו ריקות לחלוטין ממק"ט עד סוף התהליך
        valid_groups = [g for g in groups if g["main"]["part_number"]]

        return valid_groups, list(seen_part_numbers), extracted_descriptions

    # ── Catalog Lookup ────────────────────────────────────────────────────────

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

    async def enrich_groups(self, groups: List[Dict]) -> List[Dict]:
        """Add catalog data to each item. For parts not in catalog, run AI classifier."""
        # Collect all part numbers + their Excel description
        all_parts: Dict[str, str] = {}
        for group in groups:
            pn = group["main"].get("part_number")
            if pn:
                all_parts[pn] = group["main"].get("product", "")
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
                "category":       doc.get("category", "other"),
                "important":      doc.get("important", True),
            }

        # AI fallback for parts not yet in catalog
        unknown_pns = [pn for pn in all_parts if pn not in catalog_map]
        if unknown_pns:
            import logging as _log
            _logger = _log.getLogger(__name__)
            try:
                from app.ai.classifier import classify_batch
                descriptions = [all_parts[pn] for pn in unknown_pns]
                ai_results   = classify_batch(descriptions)
                for pn, desc, ai in zip(unknown_pns, descriptions, ai_results):
                    _logger.info(
                        "[AI] %-35s | %3d%% | %-15s | %s",
                        pn[:35], int(ai['confidence'] * 100),
                        ai['category'], (desc or '')[:60]
                    )
                    catalog_map[pn] = {
                        "description_he": ai.get("description_he", ""),
                        "category":       ai.get("category", "other"),
                        "important":      True,
                        "_ai":            True,
                    }
            except Exception as exc:
                _logger.warning("enrich_groups AI fallback: %s", exc)
                for pn in unknown_pns:
                    catalog_map[pn] = {"description_he": "", "category": "other", "important": True}


        # Attach to each item
        for group in groups:
            pn = group["main"].get("part_number")
            group["main"]["catalog"] = catalog_map.get(pn, {"description_he": "", "category": "other", "important": True})
            for child in group.get("children", []):
                cpn = child.get("part_number")
                child["catalog"] = catalog_map.get(cpn, {"description_he": "", "category": "other", "important": True})

        return groups

    # ── Scan Entry Point ──────────────────────────────────────────────────────

    async def scan_bom(self, file_bytes: bytes, fmt: str = FORMAT_NETAPP) -> Dict:
        """
        Full BOM scan pipeline:
        1. Parse Excel using the given format strategy
        2. Check which parts are unknown in the catalog
        3. Enrich known parts with catalog data
        4. Run AI classifier on unknown parts (pre-fill suggestions)
        5. Return result
        """
        groups, all_part_numbers, extracted_descriptions = self.parse_excel(file_bytes, fmt)
        unknown_parts = await self.check_unknown_parts(all_part_numbers)

        enriched_groups = await self.enrich_groups(groups)

        unknown_list = [
            {"part_number": pn, "excel_description": extracted_descriptions.get(pn, "")}
            for pn in unknown_parts if pn
        ]

        # ── AI Classification ───────────────────────────────────────────────
        # Classify unknown parts using the ML model so the UI can pre-fill
        # the category and Hebrew description fields for the user.
        if unknown_list:
            try:
                from app.ai.classifier import classify_batch
                descriptions = [item["excel_description"] for item in unknown_list]
                ai_results = classify_batch(descriptions)
                for item, ai in zip(unknown_list, ai_results):
                    item["ai_label"] = ai["label"]
                    item["ai_category"] = ai["category"]
                    item["ai_description_he"] = ai["description_he"]
                    item["ai_confidence"] = ai["confidence"]
                    item["ai_low_confidence"] = ai["low_confidence"]
                    item["ai_attributes"] = ai.get("attributes", {})
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("AI classification skipped: %s", exc)

        return {
            "groups": enriched_groups,
            "unknown_parts": unknown_list,
            "total_groups": len(enriched_groups),
        }

    # ── Catalog CRUD ──────────────────────────────────────────────────────────

    async def save_part(
        self,
        part_number: str,
        description_he: str,
        category: str,
        important: bool,
        excel_description: str = "",
    ) -> Dict:
        """Upsert a part into bom_part_catalog."""
        from datetime import datetime, timezone

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