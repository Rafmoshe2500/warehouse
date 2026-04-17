"""
Tests for DynamicBomStrategy – group detection modes, header detection, data row filtering.
"""
import pytest
from openpyxl import Workbook
from app.services.bom_strategies.dynamic_strategy import DynamicBomStrategy


def _make_config(**overrides):
    base = {
        "format_id": "test_vendor",
        "vendor_name": "TestVendor",
        "header_detection": {
            "keyword": "part number",
            "max_scan_rows": 20,
        },
        "column_map": {
            "Part Number": "part_number",
            "Description": "product",
            "Qty": "ext_qty",
        },
        "group_detection": {
            "mode": "all_rows",
            "config": {},
        },
    }
    base.update(overrides)
    return base


class TestDynamicBomStrategyInit:

    def test_creates_with_valid_config(self):
        config = _make_config()
        strategy = DynamicBomStrategy(config)
        assert strategy.format_id == "test_vendor"

    def test_format_id_property(self):
        config = _make_config(format_id="custom_fmt")
        strategy = DynamicBomStrategy(config)
        assert strategy.format_id == "custom_fmt"

    def test_get_column_map_returns_copy(self):
        config = _make_config()
        strategy = DynamicBomStrategy(config)
        cm = strategy.get_column_map()
        assert cm == {"Part Number": "part_number", "Description": "product", "Qty": "ext_qty"}


class TestDynamicBomStrategyHeader:

    def test_find_header_row_by_keyword(self):
        config = _make_config()
        strategy = DynamicBomStrategy(config)
        wb = Workbook()
        ws = wb.active
        ws.append(["Intro row"])
        ws.append(["Part Number", "Description", "Qty"])
        ws.append(["ABC-123", "Widget", 5])
        header_row = strategy.find_header_row(ws)
        assert header_row == 2

    def test_find_header_row_case_insensitive(self):
        config = _make_config()
        strategy = DynamicBomStrategy(config)
        wb = Workbook()
        ws = wb.active
        ws.append(["PART NUMBER", "Desc"])
        assert strategy.find_header_row(ws) == 1

    def test_find_header_row_not_found(self):
        config = _make_config()
        strategy = DynamicBomStrategy(config)
        wb = Workbook()
        ws = wb.active
        ws.append(["Nothing here"])
        ws.append(["Also nothing"])
        header_row = strategy.find_header_row(ws)
        assert header_row is None


class TestDynamicBomStrategyGroupDetection:

    def test_all_rows_mode_returns_true(self):
        config = _make_config(group_detection={"mode": "all_rows", "config": {}})
        strategy = DynamicBomStrategy(config)
        wb = Workbook()
        ws = wb.active
        ws.append(["A-001", "Item A", 1])
        # is_group_header takes (row, col_map, prev_part)
        col_map = {"part_number": 1, "product": 2, "ext_qty": 3}
        assert strategy.is_group_header(ws[1], col_map) is True

    def test_unknown_mode_returns_false(self):
        config = _make_config(group_detection={"mode": "nonexistent", "config": {}})
        strategy = DynamicBomStrategy(config)
        wb = Workbook()
        ws = wb.active
        ws.append(["A-001", "Item", 1])
        col_map = {"part_number": 1}
        assert strategy.is_group_header(ws[1], col_map) is False


class TestDynamicBomStrategyDataRow:

    def test_no_filter_accepts_all(self):
        config = _make_config()
        strategy = DynamicBomStrategy(config)
        wb = Workbook()
        ws = wb.active
        ws.append(["anything", "here"])
        col_map = {"part_number": 1}
        assert strategy.is_data_row(ws[1], col_map) is True
