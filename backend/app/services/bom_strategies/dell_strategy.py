from typing import Dict, Optional
from .base_strategy import BaseBomStrategy

class DellBomStrategy(BaseBomStrategy):
    @property
    def format_id(self) -> str:
        return "dell_quote"

    def get_column_map(self) -> Dict[str, str]:
        return {
            "Sku": "part_number",
            "SKU": "part_number",
            "Description": "product",
            "Qty": "ext_qty",
            "Quantity": "ext_qty",
            "Total List Price": "ext_list_price",
            "TotalList Price": "ext_list_price",
            "Discount": "net_discount",
            "Total Selling Price": "ext_net_price",
            "TotalSelling Price": "ext_net_price",
            "Category": "mod_group",
            "Unit List Price": "unit_list_price",
            "UnitList Price": "unit_list_price",
            "Unit Selling Price": "unit_net_price",
            "UnitSelling Price": "unit_net_price",
            "Line": "line",
        }

    def find_header_row(self, ws) -> Optional[int]:
        for row_idx in range(1, 26):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and "sku" in cell.value.lower():
                    return row_idx
        return None

    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
        """Dell: yellow fill on the Sku (part_number) cell or entire row."""
        for cell in row:
            if col_map.get("part_number") and cell.column == col_map["part_number"]:
                if self.is_yellow(cell):
                    return True
        for cell in row:
            if cell.value is not None and self.is_yellow(cell):
                return True
        return False
