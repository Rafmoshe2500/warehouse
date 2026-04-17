"""
Tests for BomTemplate Pydantic schemas – validation, defaults, constraints.
"""
import pytest
from pydantic import ValidationError
from app.schemas.bom_template import (
    BomTemplateCreate,
    HeaderDetectionConfig,
    GroupDetectionConfig,
    DataRowFilter,
)


class TestHeaderDetectionConfig:

    def test_valid_config(self):
        cfg = HeaderDetectionConfig(keyword="part number")
        assert cfg.keyword == "part number"
        assert cfg.max_scan_rows == 25  # default

    def test_custom_scan_rows(self):
        cfg = HeaderDetectionConfig(keyword="sku", max_scan_rows=50)
        assert cfg.max_scan_rows == 50


class TestGroupDetectionConfig:

    def test_valid_modes(self):
        for mode in ["color_fill", "color_fill_any", "line_number_depth", "all_rows", "value_change"]:
            cfg = GroupDetectionConfig(mode=mode)
            assert cfg.mode == mode

    def test_invalid_mode_rejected(self):
        with pytest.raises(ValidationError):
            GroupDetectionConfig(mode="invalid_mode")

    def test_config_dict_default_empty(self):
        cfg = GroupDetectionConfig(mode="color_fill")
        assert cfg.config == {}


class TestDataRowFilter:

    def test_valid_regex(self):
        f = DataRowFilter(column="part_number", pattern=r"^\d+")
        assert f.pattern == r"^\d+"

    def test_invalid_regex_rejected(self):
        with pytest.raises(ValidationError):
            DataRowFilter(column="part_number", pattern="[invalid")


class TestBomTemplateCreate:

    def test_valid_create(self):
        t = BomTemplateCreate(
            vendor_name="Acme",
            header_detection=HeaderDetectionConfig(keyword="part"),
            column_map={"Part Number": "part_number", "Description": "product"},
            group_detection=GroupDetectionConfig(mode="all_rows"),
        )
        assert t.vendor_name == "Acme"

    def test_column_map_must_have_part_number(self):
        with pytest.raises(ValidationError):
            BomTemplateCreate(
                vendor_name="Bad",
                header_detection=HeaderDetectionConfig(keyword="x"),
                column_map={"Description": "product"},
                group_detection=GroupDetectionConfig(mode="all_rows"),
            )

    def test_column_map_rejects_unknown_field_keys(self):
        with pytest.raises(ValidationError):
            BomTemplateCreate(
                vendor_name="Bad",
                header_detection=HeaderDetectionConfig(keyword="x"),
                column_map={"PN": "part_number", "Foo": "nonexistent_field"},
                group_detection=GroupDetectionConfig(mode="all_rows"),
            )
