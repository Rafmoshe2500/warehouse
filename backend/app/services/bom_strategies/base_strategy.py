from abc import ABC, abstractmethod
from typing import Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class BaseBomStrategy(ABC):
    """Base strategy for parsing vendor-specific BOM files."""

    @property
    @abstractmethod
    def format_id(self) -> str:
        """Return the unique identifier for this format (e.g., 'netapp_pricing_template')"""
        pass

    @abstractmethod
    def get_column_map(self) -> Dict[str, str]:
        """Return a mapping of Excel column headers to internal field keys."""
        pass

    @abstractmethod
    def find_header_row(self, ws) -> Optional[int]:
        """Scan the worksheet to find the header row. Return 1-based index or None."""
        pass

    @abstractmethod
    def is_group_header(self, row, col_map: Dict[str, int], prev_part: Optional[str] = None) -> bool:
        """Determine if a given row acts as a parent/group header."""
        pass

    def is_yellow(self, cell) -> bool:
        """
        Check if an openpyxl cell has a yellow fill.
        Commonly used by multiple vendors to denote a parent row.
        """
        try:
            fill = cell.fill
            if fill and fill.fgColor and fill.fgColor.type == "rgb" and fill.fgColor.rgb:
                rgb = fill.fgColor.rgb.upper()
                yellow_shades = {"FFFFFF00", "00FFFF00", "FFFFFF99", "FFFFFF66", "FFFFEB9C", "FFFFFFCC"}
                if rgb in yellow_shades or "FF00" in rgb:
                    return True
        except Exception:
            logger.debug("Could not inspect cell fill", exc_info=True)
        return False
