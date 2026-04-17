"""
Seed the ``bom_templates`` collection with the 5 built-in vendor formats.

Run once after initial deployment:
    python -m migrations.seed_bom_templates

Existing templates with the same ``format_id`` are updated (upsert).
"""
import asyncio
import logging
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BUILTIN_TEMPLATES = [
    # ─── NetApp ───────────────────────────────────────────────────────────────
    {
        "format_id": "netapp_pricing_template",
        "vendor_name": "NetApp",
        "is_builtin": True,
        "is_active": True,
        "header_detection": {
            "mode": "keyword_scan",
            "keywords": ["part number"],
            "scan_rows": 25,
        },
        "column_map": {
            "Part Number":    "part_number",
            "Product":        "product",
            "Ext Qty":        "ext_qty",
            "Ext List Price": "ext_list_price",
            "MOD Group":      "mod_group",
            "Net Discount":   "net_discount",
            "Ext Net Price":  "ext_net_price",
        },
        "group_detection": {
            "mode": "color_fill",
            "fill_colors": [
                "FFFFFF00", "00FFFF00", "FFFFFF99",
                "FFFFFF66", "FFFFEB9C", "FFFFFFCC",
            ],
        },
        "data_row_filter": None,
    },

    # ─── Dell ─────────────────────────────────────────────────────────────────
    {
        "format_id": "dell_quote",
        "vendor_name": "Dell",
        "is_builtin": True,
        "is_active": True,
        "header_detection": {
            "mode": "keyword_scan",
            "keywords": ["sku"],
            "scan_rows": 25,
        },
        "column_map": {
            "Sku":                 "part_number",
            "SKU":                 "part_number",
            "Description":         "product",
            "Qty":                 "ext_qty",
            "Quantity":            "ext_qty",
            "Total List Price":    "ext_list_price",
            "TotalList Price":     "ext_list_price",
            "Discount":            "net_discount",
            "Total Selling Price": "ext_net_price",
            "TotalSelling Price":  "ext_net_price",
            "Category":            "mod_group",
            "Unit List Price":     "unit_list_price",
            "UnitList Price":      "unit_list_price",
            "Unit Selling Price":  "unit_net_price",
            "UnitSelling Price":   "unit_net_price",
            "Line":                "line",
        },
        "group_detection": {
            "mode": "color_fill_any",
            "fill_colors": [
                "FFFFFF00", "00FFFF00", "FFFFFF99",
                "FFFFFF66", "FFFFEB9C", "FFFFFFCC",
            ],
        },
        "data_row_filter": None,
    },

    # ─── HPE ──────────────────────────────────────────────────────────────────
    {
        "format_id": "hpe_quote",
        "vendor_name": "HPE",
        "is_builtin": True,
        "is_active": True,
        "header_detection": {
            "mode": "keyword_scan",
            "keywords": ["ucid"],
            "scan_rows": 25,
        },
        "column_map": {
            "UCID":             "part_number",
            "Description":      "product",
            "Qty":              "ext_qty",
            "Unit List Price":  "unit_list_price",
            "Total List Price": "ext_list_price",
            "Unit Net Price":   "unit_net_price",
            "Total Net Price":  "ext_net_price",
        },
        "group_detection": {
            "mode": "all_rows",
        },
        "data_row_filter": None,
    },

    # ─── Cisco ────────────────────────────────────────────────────────────────
    {
        "format_id": "cisco_quote",
        "vendor_name": "Cisco",
        "is_builtin": True,
        "is_active": True,
        "header_detection": {
            "mode": "keyword_scan",
            "keywords": ["line number"],
            "scan_rows": 39,
        },
        "column_map": {
            "Line Number":               "line_number",
            "Part Number":               "part_number",
            "Description":               "product",
            "Qty":                       "ext_qty",
            "Unit List Price":           "unit_list_price",
            "Original Unit List Price":  "unit_list_price",
            "Unit Net Price":            "unit_net_price",
            "Extended Net Price":        "ext_net_price",
            "Disc(%)":                   "net_discount",
            "Service Duration (Months)": "service_duration",
        },
        "group_detection": {
            "mode": "line_number_depth",
            "line_number_regex": r"^\d+\.\d+$",
        },
        "data_row_filter": {
            "mode": "regex",
            "field": "line_number",
            "pattern": r"^\d+[\.\d]*$",
        },
    },

    # ─── Generic (fallback) ──────────────────────────────────────────────────
    {
        "format_id": "generic_first_col",
        "vendor_name": "Generic",
        "is_builtin": True,
        "is_active": True,
        "header_detection": {
            "mode": "keyword_scan",
            "keywords": ["part number", "sku", "ucid", "product", "description", "qty"],
            "scan_rows": 25,
        },
        "column_map": {
            "Part Number":        "part_number",
            "Sku":                "part_number",
            "SKU":                "part_number",
            "UCID":               "part_number",
            "Product":            "product",
            "Description":        "product",
            "Ext Qty":            "ext_qty",
            "Qty":                "ext_qty",
            "Quantity":           "ext_qty",
            "Ext List Price":     "ext_list_price",
            "Total List Price":   "ext_list_price",
            "MOD Group":          "mod_group",
            "Category":           "mod_group",
            "Net Discount":       "net_discount",
            "Discount":           "net_discount",
            "Ext Net Price":      "ext_net_price",
            "Total Net Price":    "ext_net_price",
            "Total Selling Price":"ext_net_price",
        },
        "group_detection": {
            "mode": "value_change",
        },
        "data_row_filter": None,
    },
]


async def seed():
    from app.db.mongodb import MongoDB
    await MongoDB.connect()

    db = MongoDB.get_db()
    collection = db["bom_templates"]

    now = datetime.now(timezone.utc)

    for tmpl in BUILTIN_TEMPLATES:
        tmpl["created_at"] = now
        tmpl["updated_at"] = now
        tmpl["created_by"] = "system"

        result = await collection.update_one(
            {"format_id": tmpl["format_id"]},
            {"$set": tmpl},
            upsert=True,
        )
        action = "inserted" if result.upserted_id else "updated"
        logger.info("Template %s: %s", tmpl["format_id"], action)

    # Create unique index
    await collection.create_index("format_id", unique=True)
    logger.info("Done — %d built-in templates seeded.", len(BUILTIN_TEMPLATES))

    await MongoDB.close()


if __name__ == "__main__":
    asyncio.run(seed())
