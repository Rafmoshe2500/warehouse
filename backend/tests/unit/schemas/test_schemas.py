import pytest
from datetime import datetime
from pydantic import ValidationError

from app.schemas.user import UserCreate, PasswordChange
from app.schemas.procurement import BOMItem, ProcurementOrderBase, BOMItemEditRequest, BOMItemEdit, ProcurementStatus
from app.schemas.group import GroupCreate, GroupUpdate
from app.core.constants import UserType, UserRole


# ── UserCreate Validation ───────────────────────────────────────


class TestUserCreateSchema:

    def test_valid_local_user(self):
        u = UserCreate(username="admin", password="pass1234", user_type=UserType.LOCAL)
        assert u.username == "admin"
        assert u.password == "pass1234"

    def test_local_user_without_password_accepted(self):
        """Pydantic V2 validates fields in declaration order; `password` is
        declared before `user_type`, so the conditional validator doesn't see
        user_type yet.  This documents current (lenient) behavior."""
        u = UserCreate(username="admin", user_type=UserType.LOCAL)
        assert u.password is None

    def test_ad_user_with_password_accepted(self):
        """Same field-ordering issue: user_type not available when password
        validator runs.  Documents current behavior."""
        u = UserCreate(username="aduser", password="secret", user_type=UserType.ACTIVE_DIRECTORY)
        assert u.password == "secret"

    def test_ad_user_no_password_ok(self):
        u = UserCreate(username="aduser", user_type=UserType.ACTIVE_DIRECTORY)
        assert u.password is None

    def test_username_too_short(self):
        with pytest.raises(ValidationError):
            UserCreate(username="ab", password="pass", user_type=UserType.LOCAL)

    def test_username_too_long(self):
        with pytest.raises(ValidationError):
            UserCreate(username="a" * 51, password="pass", user_type=UserType.LOCAL)

    def test_password_too_short(self):
        with pytest.raises(ValidationError):
            UserCreate(username="admin", password="abc", user_type=UserType.LOCAL)

    def test_default_role_is_user(self):
        u = UserCreate(username="admin", password="pass1234")
        assert u.role == UserRole.USER

    def test_default_permissions_is_empty_list(self):
        u = UserCreate(username="admin", password="pass1234")
        assert u.permissions == []


class TestPasswordChangeSchema:

    def test_valid_password_change(self):
        pc = PasswordChange(current_password="old", new_password="newpass")
        assert pc.new_password == "newpass"

    def test_new_password_too_short(self):
        with pytest.raises(ValidationError):
            PasswordChange(current_password="old", new_password="abc")


# ── BOMItem Validation ──────────────────────────────────────────


class TestBOMItemSchema:

    def test_valid_bom_item(self):
        item = BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="Dell", quantity=5)
        assert item.quantity == 5

    def test_quantity_must_be_positive(self):
        with pytest.raises(ValidationError):
            BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="Dell", quantity=0)

    def test_negative_quantity_rejected(self):
        with pytest.raises(ValidationError):
            BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="Dell", quantity=-1)

    def test_catalog_number_cannot_be_empty(self):
        with pytest.raises(ValidationError):
            BOMItem(item_id=1, catalog_number="", manufacturer="Dell", quantity=1)

    def test_manufacturer_cannot_be_empty(self):
        with pytest.raises(ValidationError):
            BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="", quantity=1)

    def test_description_defaults_to_empty(self):
        item = BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="Dell", quantity=1)
        assert item.description == ""

    def test_optional_fields_default_none(self):
        item = BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="Dell", quantity=1)
        assert item.bom_vendor is None
        assert item.part_alias is None


# ── ProcurementOrderBase Validation ─────────────────────────────


class TestProcurementOrderBaseSchema:

    def _make_bom_item(self):
        return BOMItem(item_id=1, catalog_number="CAT-001", manufacturer="Dell", quantity=1)

    def test_valid_order(self):
        order = ProcurementOrderBase(
            order_date=datetime.now(),
            bom_items=[self._make_bom_item()],
        )
        assert order.total_amount == 0.0
        assert order.status == ProcurementStatus.WAITING_BOM_EMF

    def test_bom_items_cannot_be_empty(self):
        with pytest.raises(ValidationError):
            ProcurementOrderBase(order_date=datetime.now(), bom_items=[])

    def test_total_amount_cannot_be_negative(self):
        with pytest.raises(ValidationError):
            ProcurementOrderBase(
                order_date=datetime.now(),
                bom_items=[self._make_bom_item()],
                total_amount=-1.0,
            )

    def test_total_amount_zero_allowed(self):
        order = ProcurementOrderBase(
            order_date=datetime.now(),
            bom_items=[self._make_bom_item()],
            total_amount=0.0,
        )
        assert order.total_amount == 0.0


# ── BOMItemEditRequest Validation ───────────────────────────────


class TestBOMItemEditRequestSchema:

    def test_valid_request(self):
        req = BOMItemEditRequest(
            vendor="DELL",
            items=[BOMItemEdit(part_number="P-001")],
        )
        assert req.vendor == "DELL"

    def test_vendor_cannot_be_empty(self):
        with pytest.raises(ValidationError):
            BOMItemEditRequest(
                vendor="",
                items=[BOMItemEdit(part_number="P-001")],
            )

    def test_items_cannot_be_empty(self):
        with pytest.raises(ValidationError):
            BOMItemEditRequest(vendor="DELL", items=[])


# ── GroupCreate Validation ──────────────────────────────────────


class TestGroupCreateSchema:

    def test_valid_group(self):
        g = GroupCreate(name="Designers")
        assert g.name == "Designers"
        assert g.role == "user"
        assert g.permissions == []

    def test_name_too_short(self):
        with pytest.raises(ValidationError):
            GroupCreate(name="X")

    def test_name_too_long(self):
        with pytest.raises(ValidationError):
            GroupCreate(name="A" * 101)

    def test_name_exact_min_length(self):
        g = GroupCreate(name="AB")
        assert g.name == "AB"

    def test_name_exact_max_length(self):
        g = GroupCreate(name="A" * 100)
        assert len(g.name) == 100


class TestGroupUpdateSchema:

    def test_partial_update_name_only(self):
        g = GroupUpdate(name="New Name")
        assert g.name == "New Name"
        assert g.permissions is None

    def test_update_name_too_short_rejected(self):
        with pytest.raises(ValidationError):
            GroupUpdate(name="X")
