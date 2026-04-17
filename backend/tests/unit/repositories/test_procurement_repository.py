"""
Tests for ProcurementRepository.
Tests order CRUD operations, file management, and filtering.
"""
import pytest
import pytest_asyncio
from datetime import datetime, timezone
from bson import ObjectId

from app.db.repositories.procurement_repository import ProcurementRepository


class TestProcurementRepository:
    """Test suite for ProcurementRepository."""

    # ========== Create Tests ==========

    @pytest.mark.asyncio
    async def test_create_order(self, test_procurement_collection, sample_procurement_data):
        """Test creating a new procurement order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        result = await repo.create_order(sample_procurement_data)

        assert result is not None
        assert "id" in result
        assert len(result["bom_items"]) == 1
        assert result["bom_items"][0]["catalog_number"] == "PROC-001"
        assert result["total_amount"] == 1000.00
        assert result["files"] == []

    @pytest.mark.asyncio
    async def test_create_order_initializes_timestamps(self, test_procurement_collection, sample_procurement_data):
        """Test that created order has timestamps."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        # Remove timestamps from input
        del sample_procurement_data["created_at"]
        del sample_procurement_data["updated_at"]

        result = await repo.create_order(sample_procurement_data)

        assert "created_at" in result
        assert "updated_at" in result

    @pytest.mark.asyncio
    async def test_create_order_default_status(self, test_procurement_collection, sample_procurement_data):
        """Test that order with no EMF/BOM defaults to waiting_bom_emf."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        sample_procurement_data["emf_number"] = None
        sample_procurement_data["received_bom"] = False

        result = await repo.create_order(sample_procurement_data)

        assert result["status"] == "waiting_bom_emf"

    # ========== Read Tests ==========

    @pytest.mark.asyncio
    async def test_get_order_by_id(self, test_procurement_collection, sample_procurement_data):
        """Test getting order by ID."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        result = await repo.get_order_by_id(order_id)

        assert result is not None
        assert result["id"] == order_id
        assert result["bom_items"][0]["catalog_number"] == "PROC-001"

    @pytest.mark.asyncio
    async def test_get_order_by_id_not_found(self, test_procurement_collection):
        """Test getting non-existent order returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        fake_id = str(ObjectId())
        result = await repo.get_order_by_id(fake_id)

        assert result is None

    @pytest.mark.asyncio
    async def test_get_order_by_id_invalid_id(self, test_procurement_collection):
        """Test getting order with invalid ID returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        result = await repo.get_order_by_id("invalid-id")

        assert result is None

    # ========== Pagination & Filter Tests ==========

    @pytest.mark.asyncio
    async def test_get_orders_with_pagination(self, test_procurement_collection, sample_procurement_data):
        """Test getting orders with pagination."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        # Create multiple orders
        for i in range(5):
            data = sample_procurement_data.copy()
            data["bom_items"] = [
                {
                    "item_id": i,
                    "catalog_number": f"PROC-{i:03d}",
                    "manufacturer": "Vendor",
                    "description": "D",
                    "quantity": 1
                }
            ]
            await repo.create_order(data)

        orders, total = await repo.get_orders(skip=0, limit=3)

        assert len(orders) == 3
        assert total == 5

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_catalog_number(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by catalog number (within bom_items)."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        for cat, item_id in [("ALPHA-001", 1), ("BETA-002", 2), ("ALPHA-003", 3)]:
            data = sample_procurement_data.copy()
            data["bom_items"] = [
                {"item_id": item_id, "catalog_number": cat,
                 "manufacturer": "Vendor", "description": "D", "quantity": 1}
            ]
            await repo.create_order(data)

        orders, total = await repo.get_orders(catalog_number="ALPHA")

        assert total == 2
        assert all("ALPHA" in order["bom_items"][0]["catalog_number"] for order in orders)

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_manufacturer(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by manufacturer."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        for mfr, item_id in [("Vendor A", 1), ("Vendor B", 2), ("Vendor A", 3)]:
            data = sample_procurement_data.copy()
            data["bom_items"] = [
                {"item_id": item_id, "catalog_number": f"CAT-{item_id}",
                 "manufacturer": mfr, "description": "D", "quantity": 1}
            ]
            await repo.create_order(data)

        orders, total = await repo.get_orders(manufacturer="Vendor A")

        assert total == 2

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_status_in(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by status list."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        for i, status in enumerate(["waiting_bom_emf", "ordered", "received"]):
            data = sample_procurement_data.copy()
            data["status"] = status
            data["bom_items"] = [
                {"item_id": i, "catalog_number": f"CAT-{status}",
                 "manufacturer": "V", "description": "D", "quantity": 1}
            ]
            await repo.create_order(data)

        orders, total = await repo.get_orders(status_in=["waiting_bom_emf", "ordered"])

        assert total == 2

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_status_ne(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by excluding a status."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        for i, status in enumerate(["waiting_bom_emf", "ordered", "received"]):
            data = sample_procurement_data.copy()
            data["status"] = status
            data["bom_items"] = [
                {"item_id": i, "catalog_number": f"CAT-{status}",
                 "manufacturer": "V", "description": "D", "quantity": 1}
            ]
            await repo.create_order(data)

        orders, total = await repo.get_orders(status_ne="received")

        assert total == 2

    @pytest.mark.asyncio
    async def test_get_orders_filter_by_emf_number(self, test_procurement_collection, sample_procurement_data):
        """Test filtering orders by EMF number."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        # One order with EMF, two without
        data_with_emf = sample_procurement_data.copy()
        data_with_emf["emf_number"] = "EMF-777"
        data_with_emf["bom_items"] = [
            {"item_id": 1, "catalog_number": "WITH-EMF",
             "manufacturer": "V", "description": "D", "quantity": 1}
        ]
        await repo.create_order(data_with_emf)

        for i in range(2):
            data = sample_procurement_data.copy()
            data["emf_number"] = None
            data["bom_items"] = [
                {"item_id": i + 10, "catalog_number": f"NO-EMF-{i}",
                 "manufacturer": "V", "description": "D", "quantity": 1}
            ]
            await repo.create_order(data)

        orders, total = await repo.get_orders(emf_number="EMF-777")

        assert total == 1
        assert orders[0]["emf_number"] == "EMF-777"

    # ========== Update Tests ==========

    @pytest.mark.asyncio
    async def test_update_order(self, test_procurement_collection, sample_procurement_data):
        """Test updating an order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        result = await repo.update_order(order_id, {
            "total_amount": 9999.0,
            "status": "ordered"
        })

        assert result is not None
        assert result["total_amount"] == 9999.0
        assert result["status"] == "ordered"

    @pytest.mark.asyncio
    async def test_update_order_updates_timestamp(self, test_procurement_collection, sample_procurement_data):
        """Test that update modifies updated_at timestamp."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]
        original_updated_at = created["updated_at"]

        import asyncio
        await asyncio.sleep(0.1)

        result = await repo.update_order(order_id, {"total_amount": 20.0})

        assert result["updated_at"] > original_updated_at

    @pytest.mark.asyncio
    async def test_update_order_not_found(self, test_procurement_collection):
        """Test updating non-existent order returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        fake_id = str(ObjectId())
        result = await repo.update_order(fake_id, {"total_amount": 10})

        assert result is None

    # ========== Delete Tests ==========

    @pytest.mark.asyncio
    async def test_delete_order(self, test_procurement_collection, sample_procurement_data):
        """Test deleting an order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        result = await repo.delete_order(order_id)

        assert result is True

        # Verify deletion
        order = await repo.get_order_by_id(order_id)
        assert order is None

    @pytest.mark.asyncio
    async def test_delete_order_not_found(self, test_procurement_collection):
        """Test deleting non-existent order returns False."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        fake_id = str(ObjectId())
        result = await repo.delete_order(fake_id)

        assert result is False

    # ========== File Management Tests ==========

    @pytest.mark.asyncio
    async def test_add_file_to_order(self, test_procurement_collection, sample_procurement_data):
        """Test adding file metadata to order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        file_metadata = {
            "file_id": "file-123",
            "filename": "test.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "uploaded_by": "test_user",
            "uploaded_at": datetime.now(timezone.utc)
        }

        result = await repo.add_file_to_order(order_id, file_metadata)

        assert result is not None
        assert len(result["files"]) == 1
        assert result["files"][0]["file_id"] == "file-123"
        assert result["files"][0]["filename"] == "test.pdf"

    @pytest.mark.asyncio
    async def test_add_multiple_files_to_order(self, test_procurement_collection, sample_procurement_data):
        """Test adding multiple files to order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        for i in range(3):
            file_metadata = {
                "file_id": f"file-{i}",
                "filename": f"test-{i}.pdf",
                "file_type": "application/pdf",
                "file_size": 1024,
                "uploaded_by": "test_user",
                "uploaded_at": datetime.now(timezone.utc)
            }
            await repo.add_file_to_order(order_id, file_metadata)

        order = await repo.get_order_by_id(order_id)
        assert len(order["files"]) == 3

    @pytest.mark.asyncio
    async def test_remove_file_from_order(self, test_procurement_collection, sample_procurement_data):
        """Test removing file from order."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        file_metadata = {
            "file_id": "file-to-remove",
            "filename": "test.pdf",
            "file_type": "application/pdf",
            "file_size": 1024,
            "uploaded_by": "test_user",
            "uploaded_at": datetime.now(timezone.utc)
        }
        await repo.add_file_to_order(order_id, file_metadata)

        result = await repo.remove_file_from_order(order_id, "file-to-remove")

        assert result is not None
        assert len(result["files"]) == 0

    @pytest.mark.asyncio
    async def test_get_file_metadata(self, test_procurement_collection, sample_procurement_data):
        """Test getting specific file metadata."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        file_metadata = {
            "file_id": "file-123",
            "filename": "important.pdf",
            "file_type": "application/pdf",
            "file_size": 2048,
            "uploaded_by": "test_user",
            "uploaded_at": datetime.now(timezone.utc)
        }
        await repo.add_file_to_order(order_id, file_metadata)

        result = await repo.get_file_metadata(order_id, "file-123")

        assert result is not None
        assert result["filename"] == "important.pdf"
        assert result["file_size"] == 2048

    @pytest.mark.asyncio
    async def test_get_file_metadata_not_found(self, test_procurement_collection, sample_procurement_data):
        """Test getting non-existent file metadata returns None."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        result = await repo.get_file_metadata(order_id, "non-existent-file")

        assert result is None
    # ========== Monthly Summary Tests ==========

    @pytest.mark.asyncio
    async def test_get_monthly_summary_empty(self, test_procurement_collection):
        """Monthly summary on empty collection returns zeros."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        result = await repo.get_monthly_summary()

        assert result["total_spend"] == 0
        assert result["order_count"] == 0
        assert result["avg_lead_days"] is None
        assert result["top_vendor"] is None

    @pytest.mark.asyncio
    async def test_get_monthly_summary_counts_and_spend(self, test_procurement_collection):
        """Monthly summary returns correct spend and order count."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        now = datetime.now(timezone.utc)
        await test_procurement_collection.insert_many([
            {
                "order_date": now,
                "total_amount": 500.0,
                "status": "waiting_bom_emf",
                "bom_vendor": "DELL",
                "bom_items": [],
                "created_at": now,
            },
            {
                "order_date": now,
                "total_amount": 1500.0,
                "status": "ordered",
                "bom_vendor": "HPE",
                "bom_items": [],
                "created_at": now,
            },
        ])

        result = await repo.get_monthly_summary()

        assert result["order_count"] == 2
        assert result["total_spend"] == 2000.0

    @pytest.mark.asyncio
    async def test_get_monthly_summary_top_vendor(self, test_procurement_collection):
        """Monthly summary returns the most frequent vendor."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        now = datetime.now(timezone.utc)
        await test_procurement_collection.insert_many([
            {"order_date": now, "total_amount": 100, "status": "ordered", "bom_vendor": "DELL", "bom_items": [], "created_at": now},
            {"order_date": now, "total_amount": 200, "status": "ordered", "bom_vendor": "DELL", "bom_items": [], "created_at": now},
            {"order_date": now, "total_amount": 300, "status": "ordered", "bom_vendor": "HPE", "bom_items": [], "created_at": now},
        ])

        result = await repo.get_monthly_summary()

        assert result["top_vendor"] == "DELL"

    @pytest.mark.asyncio
    async def test_get_monthly_summary_avg_lead_days(self, test_procurement_collection):
        """Monthly summary returns average lead time for received orders."""
        from datetime import timedelta

        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        now = datetime.now(timezone.utc)
        await test_procurement_collection.insert_many([
            {
                "order_date": now - timedelta(days=10),
                "received_at": now,
                "total_amount": 100,
                "status": "received",
                "bom_vendor": "DELL",
                "bom_items": [],
                "created_at": now,
            },
            {
                "order_date": now - timedelta(days=6),
                "received_at": now,
                "total_amount": 200,
                "status": "received",
                "bom_vendor": "HPE",
                "bom_items": [],
                "created_at": now,
            },
        ])

        result = await repo.get_monthly_summary()

        assert result["avg_lead_days"] is not None
        assert 7.5 <= result["avg_lead_days"] <= 8.5  # avg of 10 and 6 = 8

    # ========== patch_bom_catalog_in_groups Tests ==========

    @pytest.mark.asyncio
    async def test_patch_bom_catalog_updates_main_group(self, test_procurement_collection, sample_procurement_data):
        """Editing the main part of a BOM group must persist description_he and category to the DB."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        sample_procurement_data["bom_data"] = {
            "groups": [
                {
                    "main": {
                        "part_number": "SRV-X100",
                        "product": "Server X100",
                        "ext_qty": 1,
                        "catalog": {"description_he": "שרת ישן", "category": "other"},
                    },
                    "children": [],
                    "total_net_price": 1000,
                }
            ]
        }
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        result = await repo.patch_bom_catalog_in_groups(
            order_id,
            [{"part_number": "SRV-X100", "description_he": "שרת חדש", "category": "server"}],
        )

        assert result is True
        refreshed = await repo.get_order_by_id(order_id)
        main_catalog = refreshed["bom_data"]["groups"][0]["main"]["catalog"]
        assert main_catalog["description_he"] == "שרת חדש"
        assert main_catalog["category"] == "server"

    @pytest.mark.asyncio
    async def test_patch_bom_catalog_updates_child(self, test_procurement_collection, sample_procurement_data):
        """Editing a child part must persist its catalog fields without touching the main."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        sample_procurement_data["bom_data"] = {
            "groups": [
                {
                    "main": {
                        "part_number": "SRV-MAIN",
                        "product": "Main",
                        "ext_qty": 1,
                        "catalog": {"description_he": "ראשי", "category": "server"},
                    },
                    "children": [
                        {
                            "part_number": "CHILD-001",
                            "product": "Child",
                            "ext_qty": 2,
                            "catalog": {"description_he": "ילד ישן", "category": "other"},
                        }
                    ],
                    "total_net_price": 500,
                }
            ]
        }
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        result = await repo.patch_bom_catalog_in_groups(
            order_id,
            [{"part_number": "CHILD-001", "description_he": "ילד חדש", "category": "storage"}],
        )

        assert result is True
        refreshed = await repo.get_order_by_id(order_id)
        child_catalog = refreshed["bom_data"]["groups"][0]["children"][0]["catalog"]
        assert child_catalog["description_he"] == "ילד חדש"
        assert child_catalog["category"] == "storage"
        # main must be untouched
        main_catalog = refreshed["bom_data"]["groups"][0]["main"]["catalog"]
        assert main_catalog["description_he"] == "ראשי"

    @pytest.mark.asyncio
    async def test_patch_bom_catalog_persists_part_alias(self, test_procurement_collection, sample_procurement_data):
        """part_alias must also be written into bom_data.groups when provided."""
        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        sample_procurement_data["bom_data"] = {
            "groups": [
                {
                    "main": {
                        "part_number": "SRV-ALIAS",
                        "product": "Alias Test",
                        "ext_qty": 1,
                        "catalog": {},
                    },
                    "children": [],
                    "total_net_price": 0,
                }
            ]
        }
        created = await repo.create_order(sample_procurement_data)
        order_id = created["id"]

        await repo.patch_bom_catalog_in_groups(
            order_id,
            [{"part_number": "SRV-ALIAS", "part_alias": "MY-ALIAS-01"}],
        )

        refreshed = await repo.get_order_by_id(order_id)
        assert refreshed["bom_data"]["groups"][0]["main"]["catalog"]["part_alias"] == "MY-ALIAS-01"

    @pytest.mark.asyncio
    async def test_patch_bom_catalog_unknown_order_returns_false(self, test_procurement_collection):
        """Passing a non-existent order_id must return False gracefully."""
        from bson import ObjectId

        repo = ProcurementRepository()
        repo.collection = test_procurement_collection

        fake_id = str(ObjectId())
        result = await repo.patch_bom_catalog_in_groups(
            fake_id,
            [{"part_number": "ANYTHING", "description_he": "X"}],
        )

        assert result is False