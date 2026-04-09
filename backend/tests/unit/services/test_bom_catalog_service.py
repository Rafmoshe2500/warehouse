import pytest
import pytest_asyncio
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
import json

from app.services.bom_catalog_service import BomCatalogService

@pytest_asyncio.fixture
async def catalog_service(mock_mongodb):
    """Fixture providing a BomCatalogService wired to test collections."""
    svc = BomCatalogService()
    await svc.collection.delete_many({})
    return svc

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

    @pytest.mark.asyncio
    async def test_apply_item_edits_valid(self, catalog_service):
        """Test editing items with valid categories updates the catalog."""
        result = await catalog_service.apply_item_edits([
            {"part_number": "EDIT-1", "description_he": "שרת חדש", "category": "server"},
            {"part_number": "EDIT-2", "description_he": "כונן SSD", "category": "disk"},
        ])
        assert len(result) == 2

        # Verify persisted
        all_parts = await catalog_service.get_all_parts()
        pn_map = {p["part_number"]: p for p in all_parts}
        assert "EDIT-1" in pn_map
        assert pn_map["EDIT-1"]["category"] == "server"
        assert pn_map["EDIT-2"]["category"] == "disk"

    @pytest.mark.asyncio
    async def test_apply_item_edits_invalid_category(self, catalog_service):
        """Edits with an invalid category should raise ValueError."""
        with pytest.raises(ValueError, match="קטגוריה לא חוקית"):
            await catalog_service.apply_item_edits([
                {"part_number": "BAD-1", "description_he": "לא חוקי", "category": "nonexistent"}
            ])

    @pytest.mark.asyncio
    async def test_check_unknown_parts_empty_input(self, catalog_service):
        """check_unknown_parts with empty list returns [] immediately."""
        result = await catalog_service.check_unknown_parts([])
        assert result == []

    def test_classify_parts_ai_failure_fallback(self, catalog_service):
        """When AI classifier throws, neutral fallback values are set."""
        unknown_list = [
            {"part_number": "FAIL-1", "excel_description": "Something"},
        ]
        with patch("app.ai.classifier.classify_batch", side_effect=Exception("AI down")):
            result = catalog_service.classify_parts(unknown_list)

        assert len(result) == 1
        assert result[0]["ai_label"] == "אחר"
        assert result[0]["ai_category"] == "other"
        assert result[0]["ai_confidence"] == 0.0
        assert result[0]["ai_low_confidence"] is True

    @pytest.mark.asyncio
    async def test_enrich_groups_empty_parts(self, catalog_service):
        """enrich_groups returns groups unchanged when no part_numbers exist."""
        groups = [
            {"main": {"product": "No PN here"}, "children": []}
        ]
        result = await catalog_service.enrich_groups(groups)
        assert result == groups

    @pytest.mark.asyncio
    async def test_enrich_groups_ai_exception_fallback(self, catalog_service):
        """When AI fails in enrich_groups, 'other' fallback is used."""
        groups = [
            {"main": {"part_number": "NEW-PN", "product": "Mystery"}, "children": []}
        ]
        with patch("app.ai.classifier.classify_batch", side_effect=Exception("AI down")):
            result = await catalog_service.enrich_groups(groups)

        cat = result[0]["main"]["catalog"]
        assert cat["category"] == "other"
        assert cat["description_he"] == ""

    @pytest.mark.asyncio
    async def test_apply_item_edits_skip_empty_part_number(self, catalog_service):
        """Items with empty part_number are skipped."""
        result = await catalog_service.apply_item_edits([
            {"part_number": "", "description_he": "should skip"},
            {"part_number": "  ", "description_he": "also skip"},
            {"part_number": "VALID-1", "description_he": "saved", "category": "disk"},
        ])
        assert len(result) == 1
        assert result[0]["part_number"] == "VALID-1"

    @pytest.mark.asyncio
    async def test_apply_item_edits_partial_fields(self, catalog_service):
        """apply_item_edits with only some optional fields updates correctly."""
        # First save a baseline
        await catalog_service.save_part("PARTIAL-1", "orig desc", "server", True, "orig excel")

        # Now edit only description_he (no category change)
        result = await catalog_service.apply_item_edits([
            {"part_number": "PARTIAL-1", "description_he": "new desc"},
        ])
        assert len(result) == 1
        assert "description_he" in result[0]
        assert result[0]["description_he"] == "new desc"

        # Verify category was NOT overwritten (since not provided)
        all_parts = await catalog_service.get_all_parts()
        pn_map = {p["part_number"]: p for p in all_parts}
        assert pn_map["PARTIAL-1"]["category"] == "server"  # unchanged

    @pytest.mark.asyncio
    async def test_apply_item_edits_with_excel_description(self, catalog_service):
        """apply_item_edits persists excel_description when provided."""
        result = await catalog_service.apply_item_edits([
            {"part_number": "EXCEL-1", "description_he": "desc", "category": "cable", "excel_description": "Cable 10G DAC"},
        ])
        assert len(result) == 1

        all_parts = await catalog_service.get_all_parts()
        pn_map = {p["part_number"]: p for p in all_parts}
        assert pn_map["EXCEL-1"]["excel_description"] == "Cable 10G DAC"
