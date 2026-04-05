import re
from typing import Dict, Optional
from .base_strategy import BaseBomStrategy

# Matches top-level line numbers: 1.0, 1.1, 2.0, 10.3 — exactly two dot-separated segments
_TOP_LEVEL_RE = re.compile(r"^\d+\.\d+$")


class CiscoBomStrategy(BaseBomStrategy):
    @property
    def format_id(self) -> str:
        return "cisco_quote"

    def get_column_map(self) -> Dict[str, str]:
        return {
            "Line Number": "line_number",
            "Part Number": "part_number",
            "Description": "product",
            "Qty": "ext_qty",
            "Unit List Price": "unit_list_price",
            "Original Unit List Price": "unit_list_price",
            "Unit Net Price": "unit_net_price",
            "Extended Net Price": "ext_net_price",
            "Disc(%)": "net_discount",
            "Service Duration (Months)": "service_duration",
        }

    def find_header_row(self, ws) -> Optional[int]:
        for row_idx in range(1, 40):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and "line number" in cell.value.lower():
                    return row_idx
        return None

    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
        """
        Cisco: a row is a group header when its Line Number has exactly two
        dot-separated segments (e.g. '1.0', '1.1', '2.3').
        Rows with three or more segments (e.g. '1.1.1', '1.3.10') are children.
        Rows with no Line Number value are metadata/notes and should be skipped.
        """
        line_col = col_map.get("line_number")
        if not line_col:
            return False
        for cell in row:
            if cell.column == line_col:
                raw = str(cell.value).strip() if cell.value is not None else ""
                return bool(_TOP_LEVEL_RE.match(raw))
        return False

    def is_data_row(self, row, col_map: Dict[str, int]) -> bool:
        """
        Return True for any row that has a Line Number value (parent or child).
        Rows without a Line Number are metadata (group name banners, term lines,
        disclaimers) and should be skipped entirely by the parser.
        """
        line_col = col_map.get("line_number")
        if not line_col:
            return True  # no line column mapped — let the parser decide
        for cell in row:
            if cell.column == line_col:
                raw = str(cell.value).strip() if cell.value is not None else ""
                # Any non-empty value that looks like a dotted number is a data row
                return bool(re.match(r"^\d+[\.\d]*$", raw))
        return False