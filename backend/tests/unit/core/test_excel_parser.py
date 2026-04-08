import io
import pytest
import pandas as pd
from datetime import datetime
from openpyxl import Workbook

from app.core.excel_parser import ExcelParser
from app.core.exceptions import ExcelFileException


def _make_excel(headers: list, rows: list, *, header_row: int = 0) -> bytes:
    """Helper: build a minimal .xlsx from headers + rows.

    If header_row > 0, empty rows are prepended so headers land at that row.
    """
    wb = Workbook()
    ws = wb.active
    # Prepend blank rows if needed
    for _ in range(header_row):
        ws.append([])
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ── _clean_record ────────────────────────────────────────────────


class TestCleanRecord:

    def test_strips_whitespace(self):
        rec = {"name": "  hello  "}
        result = ExcelParser._clean_record(rec)
        assert result["name"] == "hello"

    def test_nan_becomes_empty_string(self):
        rec = {"val": float("nan")}
        result = ExcelParser._clean_record(rec)
        assert result["val"] == ""

    def test_none_becomes_empty_string(self):
        rec = {"val": None}
        result = ExcelParser._clean_record(rec)
        assert result["val"] == ""

    def test_datetime_formatted(self):
        rec = {"date": datetime(2024, 3, 15, 10, 30)}
        result = ExcelParser._clean_record(rec)
        assert result["date"] == "2024-03-15"

    def test_whole_float_becomes_int_string(self):
        """Serial numbers like 1234567.0 should become '1234567'."""
        rec = {"serial": 1234567.0}
        result = ExcelParser._clean_record(rec)
        assert result["serial"] == "1234567"

    def test_fractional_float_stays_as_string(self):
        rec = {"price": 12.5}
        result = ExcelParser._clean_record(rec)
        assert result["price"] == "12.5"

    def test_nan_string_becomes_empty(self):
        rec = {"val": "nan"}
        result = ExcelParser._clean_record(rec)
        assert result["val"] == ""

    def test_nan_string_case_insensitive(self):
        rec = {"val": "NaN"}
        result = ExcelParser._clean_record(rec)
        assert result["val"] == ""

    def test_integer_value(self):
        rec = {"qty": 5}
        result = ExcelParser._clean_record(rec)
        assert result["qty"] == "5"

    def test_pd_nat_becomes_empty(self):
        rec = {"date": pd.NaT}
        result = ExcelParser._clean_record(rec)
        assert result["date"] == ""


# ── _read_excel_robust ──────────────────────────────────────────


class TestReadExcelRobust:

    def test_reads_header_at_row_0(self):
        contents = _make_excel(["col_a", "col_b"], [["x", 1]])
        df = ExcelParser._read_excel_robust(contents, ["col_a"])
        assert "col_a" in df.columns

    def test_falls_back_to_header_3(self):
        contents = _make_excel(["col_a", "col_b"], [["x", 1]], header_row=3)
        df = ExcelParser._read_excel_robust(contents, ["col_a"])
        assert "col_a" in df.columns

    def test_invalid_file_raises_exception(self):
        with pytest.raises(ExcelFileException):
            ExcelParser._read_excel_robust(b"not-an-excel-file", ["col_a"])


# ── parse_inventory ─────────────────────────────────────────────


class TestParseInventory:

    def test_basic_parse(self):
        headers = ['מק"ט', 'תאור פריט', 'יצרן', 'סריאלי', 'מלאי קיים']
        rows = [
            ["CAT-001", "Server Rack", "Dell", "SN123", 5],
            ["CAT-002", "Switch", "Cisco", "SN456", 3],
            # Last row is summary, should be stripped
            ["", "סיכום", "", "", 8],
        ]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_inventory(contents)

        assert len(result) == 2
        assert result[0]["catalog_number"] == "CAT-001"
        assert result[0]["description"] == "Server Rack"
        assert result[0]["manufacturer"] == "Dell"
        assert result[0]["serial"] == "SN123"

    def test_serial_float_converted_to_str(self):
        """Serial 1234567.0 from Excel must become '1234567'."""
        headers = ['מק"ט', 'תאור פריט', 'יצרן', 'סריאלי']
        rows = [
            ["CAT-001", "Server", "Dell", 1234567.0],
            ["CAT-002", "Switch", "Cisco", 7654321.0],
            ["", "סיכום", "", ""],  # summary line
        ]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_inventory(contents)
        assert result[0]["serial"] == "1234567"
        assert result[1]["serial"] == "7654321"

    def test_skips_truly_empty_rows(self):
        """Rows where ALL cells are empty strings are skipped."""
        headers = ['מק"ט', 'תאור פריט', 'יצרן', 'סריאלי']
        rows = [
            ["CAT-001", "Server", "Dell", "SN1"],
            ["CAT-002", "Switch", "HP", "SN2"],
            # summary line — stripped by iloc[:-1], so only 2 data rows remain
            ["", "סיכום", "", ""],
        ]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_inventory(contents)
        assert len(result) == 2
        assert result[0]["catalog_number"] == "CAT-001"
        assert result[1]["catalog_number"] == "CAT-002"

    def test_defaults_purpose_and_notes(self):
        headers = ['מק"ט', 'תאור פריט', 'יצרן', 'סריאלי']
        rows = [
            ["CAT-001", "Server", "Dell", "SN1"],
            ["CAT-002", "Switch", "HP", "SN2"],
            ["", "סיכום", "", ""],  # summary
        ]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_inventory(contents)
        assert result[0]["purpose"] == ""
        assert result[0]["notes"] == ""

    def test_missing_required_column_raises_exception(self):
        headers = ['מק"ט', 'תאור פריט']  # missing 'יצרן' and 'סריאלי'
        rows = [["CAT-001", "Server"], ["", ""]]
        contents = _make_excel(headers, rows)
        with pytest.raises(ExcelFileException, match="חסרות העמודות"):
            ExcelParser.parse_inventory(contents)

    def test_alternative_column_names(self):
        """'מק״ט' (geresh) and 'תיאור פריט' should also be recognized."""
        headers = ['מק״ט', 'תיאור פריט', 'מספר יצרן | שם יצרן', 'סריאלי']
        rows = [
            ["CAT-001", "Storage", "NetApp", "SN1"],
            ["CAT-002", "Disk", "Seagate", "SN2"],
            ["", "סיכום", "", ""],
        ]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_inventory(contents)
        assert result[0]["catalog_number"] == "CAT-001"
        assert result[0]["description"] == "Storage"
        assert result[0]["manufacturer"] == "NetApp"


# ── parse_project_allocation ────────────────────────────────────


class TestParseProjectAllocation:

    def test_basic_parse(self):
        headers = ['מק"ט', 'מיקום', 'פרוייקט', 'כמות']
        rows = [
            ["CAT-001", "Building A", "Project X", 10],
            ["CAT-002", "Building B", "Project Y", 5],
        ]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_project_allocation(contents)
        assert len(result) == 2
        assert result[0]["catalog_number"] == "CAT-001"
        assert result[0]["project"] == "Project X"

    def test_alternative_project_spelling(self):
        headers = ['מק"ט', 'מיקום', 'פרויקט', 'כמות']
        rows = [["CAT-001", "Loc", "Proj", 1]]
        contents = _make_excel(headers, rows)
        result = ExcelParser.parse_project_allocation(contents)
        assert result[0]["project"] == "Proj"

    def test_missing_required_column_raises_exception(self):
        headers = ['מק"ט', 'מיקום']  # missing 'פרוייקט' and 'כמות'
        rows = [["CAT-001", "Loc"]]
        contents = _make_excel(headers, rows)
        with pytest.raises(ExcelFileException, match="חסרות העמודות"):
            ExcelParser.parse_project_allocation(contents)


# ── generate_inventory_excel ────────────────────────────────────


class TestGenerateInventoryExcel:

    def test_roundtrip(self):
        """Generate Excel from items and read back to verify."""
        items = [
            {
                "catalog_number": "CAT-001",
                "description": "Server",
                "manufacturer": "Dell",
                "serial": "SN1",
                "current_stock": 5,
                "location": "DC1",
            },
        ]
        output = ExcelParser.generate_inventory_excel(items)
        assert isinstance(output, io.BytesIO)

        df = pd.read_excel(output)
        assert 'מק"ט' in df.columns
        assert 'תאור פריט' in df.columns
        assert df.iloc[0][df.columns[0]] == "CAT-001"

    def test_missing_optional_columns_skipped(self):
        """Columns not in items should not appear in output."""
        items = [{"catalog_number": "CAT-001", "description": "X"}]
        output = ExcelParser.generate_inventory_excel(items)
        df = pd.read_excel(output)
        assert 'תוקף אחריות' not in df.columns

    def test_empty_items_produces_valid_excel(self):
        output = ExcelParser.generate_inventory_excel([])
        assert isinstance(output, io.BytesIO)
        df = pd.read_excel(output)
        assert len(df) == 0
