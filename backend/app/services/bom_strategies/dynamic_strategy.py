"""
DynamicBomStrategy — a config-driven BOM parsing strategy loaded from the DB.

Instead of hardcoding vendor-specific logic in Python classes, this strategy
reads its behaviour from a ``bom_templates`` document, making it possible for
admins to add new vendor formats without code changes.
"""
import re
from typing import Dict, Optional
import logging

from .base_strategy import BaseBomStrategy

logger = logging.getLogger(__name__)


class DynamicBomStrategy(BaseBomStrategy):
    """BOM strategy whose rules are defined by a template config dict."""

    def __init__(self, template: dict):
        self._template = template
        self._format_id = template["format_id"]
        self._column_map = template["column_map"]
        self._header = template["header_detection"]
        self._group = template["group_detection"]
        self._data_filter = template.get("data_row_filter")

    # ── BaseBomStrategy interface ─────────────────────────────────────────────

    @property
    def format_id(self) -> str:
        return self._format_id

    def get_column_map(self) -> Dict[str, str]:
        return dict(self._column_map)

    def find_header_row(self, ws) -> Optional[int]:
        keyword = self._header["keyword"].strip().lower()
        max_rows = self._header.get("max_scan_rows", 25)
        for row_idx in range(1, max_rows + 1):
            for cell in ws[row_idx]:
                if isinstance(cell.value, str) and keyword in cell.value.lower():
                    return row_idx
        return None

    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
        mode = self._group["mode"]
        cfg = self._group.get("config", {})

        dispatch = {
            "color_fill":        self._is_group_by_color_fill,
            "color_fill_any":    self._is_group_by_color_fill_any,
            "line_number_depth": self._is_group_by_line_depth,
            "all_rows":          self._is_group_by_all_rows,
            "value_change":      self._is_group_by_value_change,
        }
        handler = dispatch.get(mode)
        if handler is None:
            logger.warning("Unknown group detection mode '%s' — defaulting to False", mode)
            return False
        return handler(row, col_map, prev_part, cfg)

    def is_data_row(self, row, col_map: Dict[str, int]) -> bool:
        if not self._data_filter:
            return True
        col_key = self._data_filter["column"]
        pattern = self._data_filter["pattern"]
        col_idx = col_map.get(col_key)
        if not col_idx:
            return True
        for cell in row:
            if cell.column == col_idx:
                raw = str(cell.value).strip() if cell.value is not None else ""
                return bool(re.match(pattern, raw))
        return True

    # ── Private: group detection modes ────────────────────────────────────────

    def _is_group_by_color_fill(
        self, row, col_map: Dict[str, int], prev_part: Optional[str], cfg: dict
    ) -> bool:
        """Check if the target column cell has a coloured fill."""
        target = cfg.get("target_column", "part_number")
        col_idx = col_map.get(target)
        if not col_idx:
            return False
        colors = set(cfg.get("colors", []))
        for cell in row:
            if cell.column == col_idx:
                if colors:
                    return self._cell_has_colors(cell, colors)
                return self.is_yellow(cell)
        return False

    def _is_group_by_color_fill_any(
        self, row, col_map: Dict[str, int], prev_part: Optional[str], cfg: dict
    ) -> bool:
        """Check if ANY cell in the row with a value has a coloured fill."""
        # First check the part_number column specifically (like Dell does)
        colors = set(cfg.get("colors", []))
        pn_col = col_map.get("part_number")
        if pn_col:
            for cell in row:
                if cell.column == pn_col:
                    if colors and self._cell_has_colors(cell, colors):
                        return True
                    if not colors and self.is_yellow(cell):
                        return True
                    break

        # Then check any cell with a value
        for cell in row:
            if cell.value is not None:
                if colors and self._cell_has_colors(cell, colors):
                    return True
                if not colors and self.is_yellow(cell):
                    return True
        return False

    def _is_group_by_line_depth(
        self, row, col_map: Dict[str, int], prev_part: Optional[str], cfg: dict
    ) -> bool:
        """Group header when line number matches the group pattern (e.g. 2-segment = group)."""
        line_col_key = cfg.get("line_column", "line_number")
        group_pattern = cfg.get("group_pattern", r"^\d+\.\d+$")
        col_idx = col_map.get(line_col_key)
        if not col_idx:
            return False
        for cell in row:
            if cell.column == col_idx:
                raw = str(cell.value).strip() if cell.value is not None else ""
                return bool(re.match(group_pattern, raw))
        return False

    @staticmethod
    def _is_group_by_all_rows(
        row, col_map: Dict[str, int], prev_part: Optional[str], cfg: dict
    ) -> bool:
        """Every valid row is a group (HPE pattern)."""
        return True

    @staticmethod
    def _is_group_by_value_change(
        row, col_map: Dict[str, int], prev_part: Optional[str], cfg: dict
    ) -> bool:
        """Group when the watched column value changes AND condition column matches."""
        watch_col = cfg.get("watch_column", "part_number")
        cond_col = cfg.get("condition_column", "ext_qty")
        cond_value = cfg.get("condition_value", 1)

        watch_idx = col_map.get(watch_col)
        cond_idx = col_map.get(cond_col)

        pn = None
        qty = None
        for cell in row:
            if watch_idx and cell.column == watch_idx:
                pn = str(cell.value or "").strip()
            if cond_idx and cell.column == cond_idx:
                try:
                    qty = float(cell.value or 0)
                except (ValueError, TypeError):
                    qty = 0
        return pn is not None and pn != prev_part and qty == cond_value

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _cell_has_colors(cell, colors: set) -> bool:
        """Check if a cell's fill matches any of the given RGB hex strings."""
        try:
            fill = cell.fill
            if fill and fill.fgColor and fill.fgColor.type == "rgb" and fill.fgColor.rgb:
                rgb = fill.fgColor.rgb.upper()
                if rgb in colors:
                    return True
                # Also check if any color substring matches (e.g. "FF00" pattern)
                for c in colors:
                    if len(c) <= 4 and c in rgb:
                        return True
        except Exception:
            pass
        return False
