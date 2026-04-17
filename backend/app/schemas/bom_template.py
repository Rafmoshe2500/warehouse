"""
Pydantic schemas for BOM Template CRUD — admin-configurable vendor BOM parsing rules.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
import re


# ── Sub-models ────────────────────────────────────────────────────────────────

class HeaderDetectionConfig(BaseModel):
    keyword: str = Field(..., min_length=1, description="Case-insensitive keyword to locate the header row")
    max_scan_rows: int = Field(default=25, ge=1, le=100, description="How many rows to scan from the top")


class GroupDetectionConfig(BaseModel):
    mode: Literal[
        "color_fill",
        "color_fill_any",
        "line_number_depth",
        "all_rows",
        "value_change",
    ] = Field(..., description="Group detection algorithm")
    config: Dict[str, Any] = Field(default_factory=dict, description="Mode-specific parameters")


class DataRowFilter(BaseModel):
    column: str = Field(..., min_length=1, description="Internal field key to match against")
    pattern: str = Field(..., min_length=1, description="Regex pattern — rows matching are kept")

    @field_validator("pattern")
    @classmethod
    def validate_regex(cls, v: str) -> str:
        try:
            re.compile(v)
        except re.error as exc:
            raise ValueError(f"Invalid regex pattern: {exc}") from exc
        return v


# ── Internal field keys the UI can map Excel columns to ──────────────────────

ALLOWED_FIELD_KEYS = {
    "part_number",
    "product",
    "ext_qty",
    "ext_list_price",
    "ext_net_price",
    "net_discount",
    "mod_group",
    "unit_list_price",
    "unit_net_price",
    "line_number",
    "service_duration",
    "line",
}


# ── Create / Update ──────────────────────────────────────────────────────────

class BomTemplateCreate(BaseModel):
    vendor_name: str = Field(..., min_length=1, max_length=60, description="Vendor display name")
    description: Optional[str] = Field(default=None, max_length=200)
    column_map: Dict[str, str] = Field(
        ...,
        min_length=1,
        description="Mapping of Excel column header → internal field key",
    )
    header_detection: HeaderDetectionConfig
    group_detection: GroupDetectionConfig
    data_row_filter: Optional[DataRowFilter] = None
    color: Optional[str] = Field(default=None, max_length=20, description="UI accent color hex")
    logo: Optional[str] = Field(default=None, max_length=10, description="UI emoji or short label")

    @field_validator("column_map")
    @classmethod
    def validate_column_map(cls, v: Dict[str, str]) -> Dict[str, str]:
        field_values = set(v.values())
        if "part_number" not in field_values:
            raise ValueError("column_map must include at least one mapping to 'part_number'")
        unknown = field_values - ALLOWED_FIELD_KEYS
        if unknown:
            raise ValueError(f"Unknown field keys in column_map: {unknown}")
        return v


class BomTemplateUpdate(BaseModel):
    vendor_name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    description: Optional[str] = Field(default=None, max_length=200)
    column_map: Optional[Dict[str, str]] = None
    header_detection: Optional[HeaderDetectionConfig] = None
    group_detection: Optional[GroupDetectionConfig] = None
    data_row_filter: Optional[DataRowFilter] = None
    is_active: Optional[bool] = None
    color: Optional[str] = Field(default=None, max_length=20)
    logo: Optional[str] = Field(default=None, max_length=10)

    @field_validator("column_map")
    @classmethod
    def validate_column_map(cls, v: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
        if v is None:
            return v
        field_values = set(v.values())
        if "part_number" not in field_values:
            raise ValueError("column_map must include at least one mapping to 'part_number'")
        unknown = field_values - ALLOWED_FIELD_KEYS
        if unknown:
            raise ValueError(f"Unknown field keys in column_map: {unknown}")
        return v


# ── Response ──────────────────────────────────────────────────────────────────

class BomTemplateResponse(BaseModel):
    id: str
    vendor_name: str
    format_id: str
    description: Optional[str] = None
    column_map: Dict[str, str]
    header_detection: HeaderDetectionConfig
    group_detection: GroupDetectionConfig
    data_row_filter: Optional[DataRowFilter] = None
    is_active: bool
    is_builtin: bool
    color: Optional[str] = None
    logo: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime


class BomTemplateListResponse(BaseModel):
    templates: List[BomTemplateResponse]
    total: int
