"""
Tests for ExcelService.
Tests Excel export functionality (import requires complex file mocking).
"""
import pytest
import io
import pandas as pd
from unittest.mock import MagicMock, AsyncMock

from app.services.excel_service import ExcelService
from app.db.repositories.items import ItemsRepository
from app.services.audit_service import AuditService


class TestExcelService:
    """Test suite for ExcelService."""

    @pytest.fixture
    def excel_service(self, test_items_collection):
        items_repo = ItemsRepository(test_items_collection)
        audit_service = MagicMock(spec=AuditService)
        return ExcelService(items_repo, audit_service)

    @pytest.mark.asyncio
    async def test_export_excel(self, excel_service, test_items_collection):
        """Test exporting items to Excel."""
        # Seed items
        await test_items_collection.insert_many([
            {
                "catalog_number": "E1",
                "description": "Item 1",
                "manufacturer": "M1",
                "location": "L1",
                "current_stock": "5",
                "updated_at": datetime.utcnow()
            },
            {
                "catalog_number": "E2",
                "description": "Item 2",
                "manufacturer": "M2",
                "location": "L2",
                "current_stock": "10",
                "updated_at": datetime.utcnow()
            }
        ])
        
        content = await excel_service.export_excel()
        
        # Verify content
        content.seek(0)
        content_bytes = content.getvalue()
        assert len(content_bytes) > 0
        
        # Load back with pandas to verify content
        df = pd.read_excel(content)
        assert len(df) == 2
        # Check columns (using the Hebrew names from ExcelService if applicable)
        # We check values
        assert "E1" in df.values
        assert "E2" in df.values

    def test_normalize_value(self, excel_service):
        """Test value normalization."""
        assert excel_service.normalize_value("  text  ") == "text"
        assert excel_service.normalize_value(None) == ""
        assert excel_service.normalize_value(123) == "123"
        assert excel_service.normalize_value("nan") == ""

from datetime import datetime
