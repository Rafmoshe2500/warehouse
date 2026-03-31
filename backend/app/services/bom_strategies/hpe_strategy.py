from typing import Dict, Optional
from .base_strategy import BaseBomStrategy

class HpeBomStrategy(BaseBomStrategy):
    @property
    def format_id(self) -> str:
        return "hpe_quote"

    def get_column_map(self) -> Dict[str, str]:
        return {
            "UCID": "part_number",
            "Description": "product",
            "Qty": "ext_qty",
            "Unit List Price": "unit_list_price",
            "Total List Price": "ext_list_price",
            "Unit Net Price": "unit_net_price",
            "Total Net Price": "ext_net_price",
        }

    def find_header_row(self, ws) -> Optional[int]:
        for row_idx in range(1, 26):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and "ucid" in cell.value.lower():
                    return row_idx
        return None

    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
        """HPE files generally contain 1 server item per file, so every valid row is a group header."""
        return True
