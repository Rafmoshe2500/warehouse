"""
Unit tests for CartService.
Uses real MongoDB test collections for the items repo and a real CartRepository
pointing to the test_carts_collection, while mocking the items_repo for add_item
to avoid coupling to the full ItemService pipeline.
"""
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

from app.services.cart_service import CartService, _build_email_text
from app.services.audit.cart_auditor import CartAuditor
from app.schemas.cart import CartItem, CartItemAdd, CheckoutRequest
from app.db.repositories.cart_repository import CartRepository
from app.db.repositories.items import ItemsRepository


# ── Helpers ───────────────────────────────────────────────────────────────────

_TEST_USER = {"username": "testuser", "role": "user"}


def _make_cart_repo(carts_collection):
    repo = CartRepository()
    repo.collection = carts_collection
    return repo


def _make_items_repo_mock(item_dict: dict):
    repo = MagicMock(spec=ItemsRepository)
    repo.get_by_id_or_raise = AsyncMock(return_value=item_dict)
    repo.update = AsyncMock(return_value=item_dict)
    return repo


def _make_auditor_mock() -> CartAuditor:
    """Return a CartAuditor whose underlying service calls are all no-ops."""
    auditor = MagicMock(spec=CartAuditor)
    auditor.log_item_added = AsyncMock()
    auditor.log_item_removed = AsyncMock()
    auditor.log_checkout = AsyncMock()
    auditor.log_expired = AsyncMock()
    return auditor


# ── Email text builder ────────────────────────────────────────────────────────

class TestBuildEmailText:

    def test_serial_items_format(self):
        items = [
            CartItem(item_id="a", serial="SN001", location="LOC-A", quantity=1),
        ]
        text = _build_email_text(items, "תל אביב")
        assert "ציוד סריאלי:" in text
        assert "* SN001 | LOC-A" in text
        assert "ציוד נלווה:" not in text
        assert "תל אביב" in text

    def test_non_serial_items_format(self):
        items = [
            CartItem(item_id="b", catalog_number="CAT-1", quantity=3),
        ]
        text = _build_email_text(items, "ירושלים")
        assert "ציוד נלווה:" in text
        assert "* CAT-1 | כמות: 3" in text
        assert "ציוד סריאלי:" not in text
        assert "ירושלים" in text

    def test_mixed_items_serial_first(self):
        items = [
            CartItem(item_id="a", catalog_number="CAT-1", quantity=2),
            CartItem(item_id="b", serial="SN002", location="Z1"),
        ]
        text = _build_email_text(items, "חיפה")
        # Serial section must appear before non-serial section
        assert "ציוד סריאלי:" in text
        assert "ציוד נלווה:" in text
        serial_idx = text.index("ציוד סריאלי:")
        non_serial_idx = text.index("ציוד נלווה:")
        assert serial_idx < non_serial_idx

    def test_empty_cart_placeholder(self):
        text = _build_email_text([], "X")
        assert "(אין פריטים)" in text


# ── CartService ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestCartService:

    @pytest.fixture
    def cart_repo(self, test_carts_collection):
        return _make_cart_repo(test_carts_collection)

    # ── get_cart ──────────────────────────────────────────────────────────────

    async def test_get_cart_creates_if_missing(self, cart_repo):
        items_repo = _make_items_repo_mock({})
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        cart = await service.get_cart("alice")

        assert cart.username == "alice"
        assert cart.items == []

    async def test_get_cart_returns_existing(self, cart_repo):
        items_repo = _make_items_repo_mock({})
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.get_cart("bob")
        cart = await service.get_cart("bob")

        assert cart.username == "bob"

    # ── add_item ──────────────────────────────────────────────────────────────

    async def test_add_serial_item_forces_quantity_one(self, cart_repo):
        serial_item = {
            "_id": "fake_id",
            "catalog_number": "CAT-S",
            "serial": "SN-SERIAL",
            "location": "LOC-1",
            "target_site": "SITE-A",
        }
        items_repo = _make_items_repo_mock(serial_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        payload = CartItemAdd(item_id="fake_id", quantity=5)
        cart = await service.add_item("user1", payload, _TEST_USER)

        assert len(cart.items) == 1
        assert cart.items[0].quantity == 1  # forced to 1
        assert cart.items[0].serial == "SN-SERIAL"

    async def test_add_non_serial_item_keeps_quantity(self, cart_repo):
        non_serial_item = {
            "_id": "ns_id",
            "catalog_number": "CAT-NS",
            "serial": None,
            "location": "LOC-2",
            "target_site": "SITE-B",
        }
        items_repo = _make_items_repo_mock(non_serial_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        payload = CartItemAdd(item_id="ns_id", quantity=4)
        cart = await service.add_item("user2", payload, _TEST_USER)

        assert cart.items[0].quantity == 4

    async def test_add_item_respects_target_site_override(self, cart_repo):
        base_item = {
            "_id": "ov_id",
            "catalog_number": "CAT-OV",
            "serial": None,
            "location": "L1",
            "target_site": "DEFAULT_SITE",
        }
        items_repo = _make_items_repo_mock(base_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        payload = CartItemAdd(
            item_id="ov_id", quantity=1, target_site_override="OVERRIDE_SITE"
        )
        cart = await service.add_item("user3", payload, _TEST_USER)

        assert cart.items[0].target_site == "OVERRIDE_SITE"

    async def test_add_duplicate_item_updates_not_duplicates(self, cart_repo):
        ns_item = {
            "_id": "dup_id",
            "catalog_number": "CAT-DUP",
            "serial": None,
            "location": "L1",
            "target_site": "S1",
        }
        items_repo = _make_items_repo_mock(ns_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.add_item("user4", CartItemAdd(item_id="dup_id", quantity=2), _TEST_USER)
        cart = await service.add_item("user4", CartItemAdd(item_id="dup_id", quantity=5), _TEST_USER)

        assert len(cart.items) == 1
        assert cart.items[0].quantity == 5

    # ── remove_item ───────────────────────────────────────────────────────────

    async def test_remove_item(self, cart_repo):
        ns_item = {
            "_id": "rm_id",
            "catalog_number": "CAT-RM",
            "serial": None,
            "location": "L3",
            "target_site": "S3",
        }
        items_repo = _make_items_repo_mock(ns_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.add_item("user5", CartItemAdd(item_id="rm_id", quantity=1), _TEST_USER)
        cart = await service.remove_item("user5", "rm_id", _TEST_USER)

        assert cart.items == []

    # ── clear_cart ────────────────────────────────────────────────────────────

    async def test_clear_cart(self, cart_repo):
        ns_item = {
            "_id": "cl_id",
            "catalog_number": "CAT-CL",
            "serial": None,
            "location": "L4",
            "target_site": "S4",
        }
        items_repo = _make_items_repo_mock(ns_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.add_item("user6", CartItemAdd(item_id="cl_id", quantity=1), _TEST_USER)
        await service.clear_cart("user6")
        cart = await service.get_cart("user6")

        assert cart.items == []

    # ── checkout ──────────────────────────────────────────────────────────────

    async def test_checkout_generates_email_and_clears_cart(self, cart_repo):
        serial_item = {
            "_id": "ch_ser",
            "catalog_number": "CAT-CH",
            "serial": "SN-CH",
            "location": "L5",
            "target_site": "S5",
        }
        items_repo = _make_items_repo_mock(serial_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.add_item("user7", CartItemAdd(item_id="ch_ser"), _TEST_USER)
        user_dict = {"username": "user7", "role": "user"}
        result = await service.checkout("user7", "SITE-DEST", user_dict)

        assert "SN-CH" in result.email_text
        assert "SITE-DEST" in result.email_text
        assert result.items_count == 1
        assert result.serial_items_updated == 1

        # Cart should be empty
        cart = await service.get_cart("user7")
        assert cart.items == []

    async def test_checkout_updates_serial_item_notes(self, cart_repo):
        serial_item = {
            "_id": "ch_note",
            "catalog_number": "CAT-NOTE",
            "serial": "SN-NOTE",
            "location": "L6",
            "target_site": "S6",
        }
        items_repo = _make_items_repo_mock(serial_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.add_item("user8", CartItemAdd(item_id="ch_note"), _TEST_USER)
        user_dict = {"username": "user8", "role": "user"}
        await service.checkout("user8", "DEST-SITE", user_dict)

        # Verify update was called with the expected note
        items_repo.update.assert_called_once()
        call_args = items_repo.update.call_args
        note = call_args[0][1]["notes"]
        assert "DEST-SITE" in note
        assert "user8" in note

    async def test_checkout_does_not_update_non_serial_items(self, cart_repo):
        ns_item = {
            "_id": "ch_ns",
            "catalog_number": "CAT-NS2",
            "serial": None,
            "location": "L7",
            "target_site": "S7",
        }
        items_repo = _make_items_repo_mock(ns_item)
        service = CartService(cart_repo, items_repo, _make_auditor_mock())

        await service.add_item("user9", CartItemAdd(item_id="ch_ns", quantity=3), _TEST_USER)
        user_dict = {"username": "user9", "role": "user"}
        result = await service.checkout("user9", "SITE-X", user_dict)

        assert result.serial_items_updated == 0
        items_repo.update.assert_not_called()


# ── Audit integration ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestCartServiceAuditCalls:
    """Verify CartService calls the CartAuditor at the right moments."""

    @pytest.fixture
    def cart_repo(self, test_carts_collection):
        return _make_cart_repo(test_carts_collection)

    async def test_add_item_calls_log_item_added(self, cart_repo):
        item = {"_id": "aid", "catalog_number": "C1", "serial": None,
                "location": "L", "target_site": "S"}
        auditor = _make_auditor_mock()
        service = CartService(cart_repo, _make_items_repo_mock(item), auditor)

        await service.add_item("u", CartItemAdd(item_id="aid"), _TEST_USER)

        auditor.log_item_added.assert_awaited_once()

    async def test_remove_item_calls_log_item_removed(self, cart_repo):
        item = {"_id": "rid", "catalog_number": "C2", "serial": None,
                "location": "L", "target_site": "S"}
        auditor = _make_auditor_mock()
        service = CartService(cart_repo, _make_items_repo_mock(item), auditor)

        await service.add_item("u2", CartItemAdd(item_id="rid"), _TEST_USER)
        await service.remove_item("u2", "rid", _TEST_USER)

        auditor.log_item_removed.assert_awaited_once()

    async def test_checkout_calls_log_checkout(self, cart_repo):
        item = {"_id": "cid", "catalog_number": "C3", "serial": "SN3",
                "location": "L", "target_site": "S"}
        auditor = _make_auditor_mock()
        service = CartService(cart_repo, _make_items_repo_mock(item), auditor)

        await service.add_item("u3", CartItemAdd(item_id="cid"), _TEST_USER)
        await service.checkout("u3", "DEST", _TEST_USER)

        auditor.log_checkout.assert_awaited_once()

    async def test_expire_carts_calls_log_expired(self, cart_repo):
        """expire_carts calls log_expired for each expired cart."""
        from datetime import timedelta
        # Manually insert an expired cart document
        past = datetime.now(timezone.utc) - timedelta(hours=25)
        await cart_repo.collection.insert_one({
            "username": "expired_user",
            "items": [{"item_id": "x", "catalog_number": "EX1", "quantity": 1}],
            "expires_at": past,
            "created_at": past,
        })

        auditor = _make_auditor_mock()
        service = CartService(
            cart_repo,
            _make_items_repo_mock({}),
            auditor,
        )
        count = await service.expire_carts()

        assert count == 1
        auditor.log_expired.assert_awaited_once()
        # The expired cart should be gone
        remaining = await cart_repo.get_by_username("expired_user")
        assert remaining is None


# ── CartAuditor unit tests ────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestCartAuditor:
    """Verify CartAuditor formats audit records correctly."""

    def _make_audit_service_mock(self):
        from app.services.audit_service import AuditService
        svc = MagicMock(spec=AuditService)
        svc.log_user_action = AsyncMock()
        return svc

    async def test_log_item_added_uses_cart_item_add_action(self):
        from app.schemas.audit import AuditAction
        audit_svc = self._make_audit_service_mock()
        auditor = CartAuditor(audit_svc)
        cart_item = CartItem(item_id="i1", catalog_number="CAT1", serial="SN1", quantity=1)

        await auditor.log_item_added(_TEST_USER, cart_item)

        audit_svc.log_user_action.assert_awaited_once()
        call_kwargs = audit_svc.log_user_action.call_args.kwargs
        assert call_kwargs["action"] == AuditAction.CART_ITEM_ADD
        assert call_kwargs["actor"] == "testuser"

    async def test_log_item_removed_uses_cart_item_remove_action(self):
        from app.schemas.audit import AuditAction
        audit_svc = self._make_audit_service_mock()
        auditor = CartAuditor(audit_svc)
        cart_item = CartItem(item_id="i2", catalog_number="CAT2", quantity=1)

        await auditor.log_item_removed(_TEST_USER, "i2", cart_item)

        call_kwargs = audit_svc.log_user_action.call_args.kwargs
        assert call_kwargs["action"] == AuditAction.CART_ITEM_REMOVE

    async def test_log_checkout_uses_cart_checkout_action(self):
        from app.schemas.audit import AuditAction
        audit_svc = self._make_audit_service_mock()
        auditor = CartAuditor(audit_svc)
        items = [CartItem(item_id="i3", serial="SN3", quantity=1)]

        await auditor.log_checkout(_TEST_USER, "SITE-A", items, 1)

        call_kwargs = audit_svc.log_user_action.call_args.kwargs
        assert call_kwargs["action"] == AuditAction.CART_CHECKOUT
        assert "SITE-A" in call_kwargs["target_resource_name"]

    async def test_log_expired_uses_cart_expired_action_and_system_actor(self):
        from app.schemas.audit import AuditAction
        audit_svc = self._make_audit_service_mock()
        auditor = CartAuditor(audit_svc)

        await auditor.log_expired("someuser", [{"catalog_number": "C1", "item_id": "i4"}])

        call_kwargs = audit_svc.log_user_action.call_args.kwargs
        assert call_kwargs["action"] == AuditAction.CART_EXPIRED
        assert call_kwargs["actor"] == "system"
        assert call_kwargs["resource_id"] == "someuser"
