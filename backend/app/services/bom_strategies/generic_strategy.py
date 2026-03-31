from typing import Dict, Optional
from .base_strategy import BaseBomStrategy

class GenericBomStrategy(BaseBomStrategy):
    """Fallback strategy that tries to guess columns based on common headers."""
    @property
    def format_id(self) -> str:
        return "generic_first_col"

    def get_column_map(self) -> Dict[str, str]:
        # Combines known headers
        return {
            "Part Number": "part_number",
            "Sku": "part_number",
            "SKU": "part_number",
            "UCID": "part_number",
            "Product": "product",
            "Description": "product",
            "Ext Qty": "ext_qty",
            "Qty": "ext_qty",
            "Quantity": "ext_qty",
            "Ext List Price": "ext_list_price",
            "Total List Price": "ext_list_price",
            "MOD Group": "mod_group",
            "Category": "mod_group",
            "Net Discount": "net_discount",
            "Discount": "net_discount",
            "Ext Net Price": "ext_net_price",
            "Total Net Price": "ext_net_price",
            "Total Selling Price": "ext_net_price",
        }

    def find_header_row(self, ws) -> Optional[int]:
        for row_idx in range(1, 26):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and cell.value.strip().lower() in (
                    "part number", "sku", "ucid", "product", "description", "qty"
                ):
                    return row_idx
        return None

    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
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
