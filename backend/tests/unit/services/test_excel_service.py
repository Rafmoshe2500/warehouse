"""
Tests for ExcelService.
Covers: export, normalize_value, and the critical serial-item import logic
(update vs. create when a serialized item has moved location).
"""
import pytest
import io
import pandas as pd
from datetime import datetime, timezone
from unittest.mock import MagicMock, AsyncMock

from app.services.excel_service import ExcelService
from app.db.repositories.items import ItemsRepository
from app.services.audit.item_auditor import ItemAuditor


class TestExcelService:
    """Test suite for ExcelService."""

    @pytest.fixture
    def mock_auditor(self):
        auditor = MagicMock(spec=ItemAuditor)
        auditor.log_update = AsyncMock()
        auditor.log_creation = AsyncMock()
        auditor.log_import_summary = AsyncMock()
        return auditor

    @pytest.fixture
    def excel_service(self, test_items_collection, mock_auditor):
        items_repo = ItemsRepository(test_items_collection)
        return ExcelService(items_repo, mock_auditor)

    # ------------------------------------------------------------------ #
    #  Export                                                              #
    # ------------------------------------------------------------------ #

    @pytest.mark.asyncio
    async def test_export_excel(self, excel_service, test_items_collection):
        """Test exporting items to Excel."""
        await test_items_collection.insert_many([
            {
                "catalog_number": "E1",
                "description": "Item 1",
                "manufacturer": "M1",
                "location": "L1",
                "current_stock": "5",
                "updated_at": datetime.now(timezone.utc)
            },
            {
                "catalog_number": "E2",
                "description": "Item 2",
                "manufacturer": "M2",
                "location": "L2",
                "current_stock": "10",
                "updated_at": datetime.now(timezone.utc)
            }
        ])

        content = await excel_service.export_excel()

        content.seek(0)
        content_bytes = content.getvalue()
        assert len(content_bytes) > 0

        content.seek(0)
        df = pd.read_excel(content)
        assert len(df) == 2
        assert "E1" in df.values
        assert "E2" in df.values

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def test_normalize_value(self, excel_service):
        """Test value normalization."""
        assert excel_service.normalize_value("  text  ") == "text"
        assert excel_service.normalize_value(None) == ""
        assert excel_service.normalize_value(123) == "123"
        assert excel_service.normalize_value("nan") == ""

    # ------------------------------------------------------------------ #
    #  Serial-item import logic (the reported bug)                         #
    # ------------------------------------------------------------------ #

    @pytest.mark.asyncio
    async def test_serial_item_location_change_updates_not_creates(
        self, excel_service, test_items_collection, mock_auditor
    ):
        """
        BUG REGRESSION: When a serial item has moved to a new location the
        import must UPDATE the existing document, not INSERT a new one.
        """
        # Seed the existing item at its original location
        await test_items_collection.insert_one({
            "catalog_number": "CAT-001",
            "description": "Widget",
            "manufacturer": "AcmeCo",
            "location": "Shelf-A",
            "serial": "SN-XYZ",
            "current_stock": "1",
            "warranty_expiry": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        # Excel record showing the same serial at a NEW location
        records = [{
            "catalog_number": "CAT-001",
            "description": "Widget",
            "manufacturer": "AcmeCo",
            "location": "Shelf-B",          # <-- location changed
            "serial": "SN-XYZ",
            "current_stock": "1",
            "warranty_expiry": "",
            "purpose": "",
            "notes": "",
        }]

        result = await excel_service._execute_import_logic(records, user="tester")

        # Must update, not add
        assert result["updated"] == 1
        assert result["added"] == 0

        # Verify the DB record was updated (not duplicated)
        total = await test_items_collection.count_documents({"serial": "SN-XYZ"})
        assert total == 1, "Duplicate item was created instead of updating the existing one"

        updated = await test_items_collection.find_one({"serial": "SN-XYZ"})
        assert updated["location"] == "Shelf-B", "Location was not updated"

    @pytest.mark.asyncio
    async def test_serial_item_unchanged_is_skipped(
        self, excel_service, test_items_collection
    ):
        """Serial item with no field changes must be counted as skipped, not added."""
        await test_items_collection.insert_one({
            "catalog_number": "CAT-002",
            "description": "Gadget",
            "manufacturer": "BetaCo",
            "location": "Room-Z",
            "serial": "SN-SAME",
            "current_stock": "1",
            "warranty_expiry": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        records = [{
            "catalog_number": "CAT-002",
            "description": "Gadget",
            "manufacturer": "BetaCo",
            "location": "Room-Z",
            "serial": "SN-SAME",
            "current_stock": "1",
            "warranty_expiry": "",
            "purpose": "",
            "notes": "",
        }]

        result = await excel_service._execute_import_logic(records, user="tester")

        assert result["skipped"] == 1
        assert result["added"] == 0
        assert result["updated"] == 0

    @pytest.mark.asyncio
    async def test_new_serial_item_is_created(
        self, excel_service, test_items_collection
    ):
        """A serial not yet in the DB must be inserted as a new item."""
        records = [{
            "catalog_number": "CAT-003",
            "description": "New Device",
            "manufacturer": "GammaCo",
            "location": "Bay-1",
            "serial": "SN-NEW",
            "current_stock": "1",
            "warranty_expiry": "",
            "purpose": "",
            "notes": "",
        }]

        result = await excel_service._execute_import_logic(records, user="tester")

        assert result["added"] == 1
        assert result["updated"] == 0

        total = await test_items_collection.count_documents({"serial": "SN-NEW"})
        assert total == 1

    @pytest.mark.asyncio
    async def test_numeric_serial_normalized_to_integer_string(
        self, excel_service, test_items_collection
    ):
        """
        BUG REGRESSION: Numeric serials stored in Excel as floats (e.g. 1234567.0)
        must be normalised to '1234567' so that find_by_serial finds the existing
        DB record (stored without the decimal) instead of creating a duplicate.
        """
        await test_items_collection.insert_one({
            "catalog_number": "CAT-NUM",
            "description": "Numeric Serial Item",
            "manufacturer": "DeltaCo",
            "location": "Old-Shelf",
            "serial": "1234567",           # stored as clean integer string
            "current_stock": "1",
            "warranty_expiry": "",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        })

        # Simulate what ExcelParser._clean_record produces for a float serial
        records = [{
            "catalog_number": "CAT-NUM",
            "description": "Numeric Serial Item",
            "manufacturer": "DeltaCo",
            "location": "New-Shelf",
            "serial": "1234567",           # after our fix, float 1234567.0 → '1234567'
            "current_stock": "1",
            "warranty_expiry": "",
            "purpose": "",
            "notes": "",
        }]

        result = await excel_service._execute_import_logic(records, user="tester")

        assert result["updated"] == 1
        assert result["added"] == 0

        total = await test_items_collection.count_documents({"serial": "1234567"})
        assert total == 1

    @pytest.mark.asyncio
    async def test_nan_serial_treated_as_no_serial(
        self, excel_service, test_items_collection
    ):
        """
        A record whose serial field is the string 'nan' (residual from pandas)
        must be treated as a non-serial item, NOT looked up via find_by_serial.
        """
        records = [{
            "catalog_number": "CAT-NAN",
            "description": "No-serial product",
            "manufacturer": "EpsilonCo",
            "location": "Floor-1",
            "serial": "nan",               # the problematic residual value
            "current_stock": "5",
            "warranty_expiry": "",
            "purpose": "",
            "notes": "",
        }]

        result = await excel_service._execute_import_logic(records, user="tester")

        # Must fall into the non-serial branch (catalog+location lookup)
        # and create a new item (catalog CAT-NAN doesn't exist yet)
        assert result["added"] == 1

        # The stored document must NOT have 'nan' as serial
        doc = await test_items_collection.find_one({"catalog_number": "CAT-NAN"})
        assert doc is not None
        stored_serial = doc.get("serial", "")
        assert stored_serial != "nan", "The string 'nan' was incorrectly stored as a serial"
