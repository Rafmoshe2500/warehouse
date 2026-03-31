from typing import Dict, Optional
from .base_strategy import BaseBomStrategy

class NetAppBomStrategy(BaseBomStrategy):
    @property
    def format_id(self) -> str:
        return "netapp_pricing_template"

    def get_column_map(self) -> Dict[str, str]:
        return {
            "Part Number": "part_number",
            "Product": "product",
            "Ext Qty": "ext_qty",
            "Ext List Price": "ext_list_price",
            "MOD Group": "mod_group",
            "Net Discount": "net_discount",
            "Ext Net Price": "ext_net_price",
        }

    def find_header_row(self, ws) -> Optional[int]:
        for row_idx in range(1, 26):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and "part number" in cell.value.lower():
                    return row_idx
        return None

    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
        """NetApp: a row is a group header if the Part Number cell is yellow-filled."""
        for cell in row:
            if col_map.get("part_number") and cell.column == col_map["part_number"]:
                return self.is_yellow(cell)
        return False
