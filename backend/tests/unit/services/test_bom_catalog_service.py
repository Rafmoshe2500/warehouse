import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
import json

from app.services.bom_catalog_service import BomCatalogService

@pytest.fixture
def catalog_service(mock_mongodb):
    """Fixture providing a BomCatalogService wired to test collections."""
    return BomCatalogService()

class TestBomCatalogService:

    @pytest.mark.asyncio
    async def test_save_part_and_get_all(self, catalog_service):
        """Test basic CRUD operations on BOM part catalog."""
        # 1. Save valid part
        saved = await catalog_service.save_part(
            part_number="TEST-PN-001",
            description_he="בדיקה בעברית",
            category="server",
            important=True,
            excel_description="TEST SERVER NODE"
        )
        assert saved["part_number"] == "TEST-PN-001"
        assert saved["category"] == "server"

        # 2. Save invalid category -> raises ValueError
        with pytest.raises(ValueError, match="קטגוריה לא חוקית"):
            await catalog_service.save_part(
                part_number="TEST-PN-002",
                description_he="לא חוקי",
                category="invalid-cat",
                important=False
            )

        # 3. Get all
        all_parts = await catalog_service.get_all_parts()
        assert len(all_parts) == 1
        assert all_parts[0]["part_number"] == "TEST-PN-001"

    @pytest.mark.asyncio
    async def test_check_unknown_parts(self, catalog_service):
        """Test identification of unknown parts."""
        # Seed known
        await catalog_service.save_part("KNOWN-1", "Known Desc", "disk", False)
        
        unknowns = await catalog_service.check_unknown_parts(["KNOWN-1", "UNKNOWN-1", "UNKNOWN-2"])
        assert len(unknowns) == 2
        assert "UNKNOWN-1" in unknowns
        assert "UNKNOWN-2" in unknowns

    def test_classify_parts(self, catalog_service):
        """Test AI classification fallback application."""
        unknown_list = [
            {"part_number": "A1", "excel_description": "Storage Drive 1TB SAS"},
            {"part_number": "A2", "excel_description": "Cisco Network Switch"}
        ]
        
        # Mocking the AI import explicitly within the path it gets loaded
        with patch("app.ai.classifier.classify_batch") as mock_classify:
            mock_classify.return_value = [
                {
                    "label": "כונן", 
                    "category": "disk", 
                    "description_he": "כונן קשיח",
                    "confidence": 0.95,
                    "low_confidence": False
                },
                {
                    "label": "מתג", 
                    "category": "switch", 
                    "description_he": "מתג תקשורת",
                    "confidence": 0.85,
                    "low_confidence": False
                }
            ]
            
            result = catalog_service.classify_parts(unknown_list)
            
            assert len(result) == 2
            assert result[0]["ai_category"] == "disk"
            assert result[1]["ai_category"] == "switch"
            mock_classify.assert_called_once()

    @pytest.mark.asyncio
    async def test_enrich_groups_with_ai(self, catalog_service):
        """Test enriching existing BOM structure with db mapping and AI fallbacks."""
        # Save one known part
        await catalog_service.save_part("KNOWN", "חלק מוכר", "server", True)
        
        boms = [
            {
                "main": {"part_number": "KNOWN", "product": "Known Excel String"},
                "children": [
                    {"part_number": "UNKNOWN-CHILD", "product": "Mystery Component"}
                ]
            }
        ]
        
        with patch("app.ai.classifier.classify_batch") as mock_classify:
            mock_classify.return_value = [
                {
                    "label": "לא ידוע", 
                    "category": "other", 
                    "description_he": "רכיב כלשהו",
                    "confidence": 0.5,
                    "low_confidence": True
                }
            ]
            
            enriched = await catalog_service.enrich_groups(boms)
            
            # The KNOWN part gets matching db info
            assert enriched[0]["main"]["catalog"]["category"] == "server"
            assert enriched[0]["main"]["catalog"]["description_he"] == "חלק מוכר"
            
            # The UNKNOWN part gets AI fallback info flag _ai=True
            child_catalog = enriched[0]["children"][0]["catalog"]
            assert child_catalog["category"] == "other"
            assert child_catalog["_ai"] is True
