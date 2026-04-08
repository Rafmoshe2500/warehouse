"""
Tests for BaseBomStrategy – abstract interface, is_yellow helper.
"""
import pytest
from unittest.mock import MagicMock
from app.services.bom_strategies.base_strategy import BaseBomStrategy


class ConcreteStrategy(BaseBomStrategy):
    """Minimal concrete implementation for testing the base class."""

    @property
    def format_id(self) -> str:
        return "test_format"

    def get_column_map(self):
        return {"Part Number": "part_number"}

    def find_header_row(self, ws):
        return 1

    def is_group_header(self, row, col_map, prev_part=None):
        return False


class TestBaseBomStrategy:

    @pytest.fixture
    def strategy(self):
        return ConcreteStrategy()

    def test_format_id(self, strategy):
        assert strategy.format_id == "test_format"

    def test_get_column_map(self, strategy):
        assert strategy.get_column_map() == {"Part Number": "part_number"}

    def test_find_header_row(self, strategy):
        assert strategy.find_header_row(None) == 1

    def test_is_group_header_returns_false(self, strategy):
        assert strategy.is_group_header([], {}) is False


class TestIsYellow:

    @pytest.fixture
    def strategy(self):
        return ConcreteStrategy()

    def _make_cell(self, rgb_value, color_type="rgb"):
        cell = MagicMock()
        cell.fill.fgColor.type = color_type
        cell.fill.fgColor.rgb = rgb_value
        return cell

    def test_yellow_FFFFFF00(self, strategy):
        assert strategy.is_yellow(self._make_cell("FFFFFF00")) is True

    def test_yellow_00FFFF00(self, strategy):
        assert strategy.is_yellow(self._make_cell("00FFFF00")) is True

    def test_yellow_FFFFFF99(self, strategy):
        assert strategy.is_yellow(self._make_cell("FFFFFF99")) is True

    def test_yellow_FFFFFFCC(self, strategy):
        assert strategy.is_yellow(self._make_cell("FFFFFFCC")) is True

    def test_yellow_FFFFEB9C(self, strategy):
        assert strategy.is_yellow(self._make_cell("FFFFEB9C")) is True

    def test_yellow_FF00_in_rgb(self, strategy):
        assert strategy.is_yellow(self._make_cell("12FF0034")) is True

    def test_red_matches_due_to_FF00_substring(self, strategy):
        # "FFFF0000" contains "FF00" substring, so is_yellow is True by design
        assert strategy.is_yellow(self._make_cell("FFFF0000")) is True

    def test_blue_matches_due_to_FF00_substring(self, strategy):
        # "FF0000FF" contains "FF00" substring at the start
        assert strategy.is_yellow(self._make_cell("FF0000FF")) is True

    def test_not_yellow_dark_grey(self, strategy):
        # "44444444" contains no "FF00" substring
        assert strategy.is_yellow(self._make_cell("44444444")) is False

    def test_not_yellow_white(self, strategy):
        assert strategy.is_yellow(self._make_cell("FFFFFFFF")) is False

    def test_not_yellow_none_rgb(self, strategy):
        cell = MagicMock()
        cell.fill.fgColor.type = "rgb"
        cell.fill.fgColor.rgb = None
        assert strategy.is_yellow(cell) is False

    def test_not_yellow_theme_type(self, strategy):
        assert strategy.is_yellow(self._make_cell("FFFFFF00", color_type="theme")) is False

    def test_handles_exception_gracefully(self, strategy):
        cell = MagicMock()
        cell.fill = None
        assert strategy.is_yellow(cell) is False

    def test_handles_no_fill(self, strategy):
        cell = MagicMock()
        cell.fill.fgColor = None
        assert strategy.is_yellow(cell) is False
