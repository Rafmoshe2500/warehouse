
import pytest
from fastapi import HTTPException
from app.core.security import (
    require_permission,
    require_admin,
    require_superadmin,
    has_price_permission,
    has_procurement_read_access,
    has_procurement_write_access,
    get_allowed_vendors,
    strip_price_fields,
)
from app.core.constants import Permission, UserRole
from app.core.exceptions import ForbiddenException


@pytest.mark.asyncio
class TestSecurityPermissions:
    """Test suite for security permission logic."""

    async def test_exact_permission_match(self):
        """Test allowing access when user has exact permission."""
        # Setup
        dependency = require_permission(Permission.INVENTORY_RO)
        user = {"permissions": [Permission.INVENTORY_RO], "role": UserRole.USER}

        # Execution
        result = await dependency(current_user=user)

        # Assertion
        assert result == user

    async def test_rw_implies_ro_permission(self):
        """Test allowing access to RO when user has RW permission."""
        # Setup: Require RO
        dependency = require_permission(Permission.INVENTORY_RO)
        # User has RW
        user = {"permissions": [Permission.INVENTORY_RW], "role": UserRole.USER}

        # Execution
        result = await dependency(current_user=user)

        # Assertion
        assert result == user

    async def test_missing_permission_raises_forbidden(self):
        """Test denying access when user lacks permission."""
        # Setup
        dependency = require_permission(Permission.INVENTORY_RO)
        user = {"permissions": ["other_permission"], "role": UserRole.USER}

        # Execution & Assertion
        with pytest.raises(ForbiddenException):
            await dependency(current_user=user)

    async def test_superadmin_has_all_permissions(self):
        """Test superadmin bypasses permission check."""
        # Setup
        dependency = require_permission(Permission.INVENTORY_RW)
        user = {"permissions": [], "role": UserRole.SUPERADMIN}

        # Execution
        result = await dependency(current_user=user)

        # Assertion
        assert result == user

    async def test_admin_does_not_have_all_permissions_automatically(self):
        """Test regular admin DOES require permission (unless logic changed)."""
        # Note: logic in security.py line 81 says: if user_role == UserRole.SUPERADMIN: return
        # So Admin needs explicit permission.
        
        dependency = require_permission(Permission.INVENTORY_RO)
        user = {"permissions": [], "role": UserRole.ADMIN}

        with pytest.raises(ForbiddenException):
            await dependency(current_user=user)


# ── require_admin / require_superadmin ──────────────────────────


@pytest.mark.asyncio
class TestRequireAdmin:

    async def test_admin_role_allowed(self):
        user = {"role": UserRole.ADMIN, "permissions": []}
        result = await require_admin(current_user=user)
        assert result == user

    async def test_superadmin_role_allowed(self):
        user = {"role": UserRole.SUPERADMIN, "permissions": []}
        result = await require_admin(current_user=user)
        assert result == user

    async def test_user_with_admin_permission_allowed(self):
        user = {"role": UserRole.USER, "permissions": [Permission.ADMIN]}
        result = await require_admin(current_user=user)
        assert result == user

    async def test_regular_user_denied(self):
        user = {"role": UserRole.USER, "permissions": [Permission.INVENTORY_RW]}
        with pytest.raises(ForbiddenException):
            await require_admin(current_user=user)


@pytest.mark.asyncio
class TestRequireSuperadmin:

    async def test_superadmin_allowed(self):
        user = {"role": UserRole.SUPERADMIN, "permissions": []}
        result = await require_superadmin(current_user=user)
        assert result == user

    async def test_admin_denied(self):
        user = {"role": UserRole.ADMIN, "permissions": []}
        with pytest.raises(ForbiddenException):
            await require_superadmin(current_user=user)

    async def test_regular_user_denied(self):
        user = {"role": UserRole.USER, "permissions": []}
        with pytest.raises(ForbiddenException):
            await require_superadmin(current_user=user)


# ── has_price_permission ────────────────────────────────────────


class TestHasPricePermission:

    def test_superadmin_has_price_access(self):
        user = {"role": UserRole.SUPERADMIN, "permissions": []}
        assert has_price_permission(user) is True

    def test_admin_has_price_access(self):
        user = {"role": UserRole.ADMIN, "permissions": []}
        assert has_price_permission(user) is True

    def test_user_with_view_prices_perm(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_VIEW_PRICES]}
        assert has_price_permission(user) is True

    def test_user_with_procurement_rw(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RW]}
        assert has_price_permission(user) is True

    def test_user_with_admin_perm(self):
        user = {"role": UserRole.USER, "permissions": [Permission.ADMIN]}
        assert has_price_permission(user) is True

    def test_user_without_any_price_perm(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RO]}
        assert has_price_permission(user) is False

    def test_user_with_vendor_ro_only(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_DELL_RO]}
        assert has_price_permission(user) is False


# ── has_procurement_read_access / write_access ──────────────────


class TestProcurementReadAccess:

    def test_superadmin(self):
        assert has_procurement_read_access({"role": UserRole.SUPERADMIN, "permissions": []}) is True

    def test_admin(self):
        assert has_procurement_read_access({"role": UserRole.ADMIN, "permissions": []}) is True

    def test_global_ro(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RO]}
        assert has_procurement_read_access(user) is True

    def test_global_rw(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RW]}
        assert has_procurement_read_access(user) is True

    def test_admin_perm(self):
        user = {"role": UserRole.USER, "permissions": [Permission.ADMIN]}
        assert has_procurement_read_access(user) is True

    def test_vendor_ro_grants_read(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_DELL_RO]}
        assert has_procurement_read_access(user) is True

    def test_vendor_rw_grants_read(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_HPE_RW]}
        assert has_procurement_read_access(user) is True

    def test_no_procurement_perms(self):
        user = {"role": UserRole.USER, "permissions": [Permission.INVENTORY_RO]}
        assert has_procurement_read_access(user) is False


class TestProcurementWriteAccess:

    def test_superadmin(self):
        assert has_procurement_write_access({"role": UserRole.SUPERADMIN, "permissions": []}) is True

    def test_admin(self):
        assert has_procurement_write_access({"role": UserRole.ADMIN, "permissions": []}) is True

    def test_global_rw(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RW]}
        assert has_procurement_write_access(user) is True

    def test_admin_perm(self):
        user = {"role": UserRole.USER, "permissions": [Permission.ADMIN]}
        assert has_procurement_write_access(user) is True

    def test_vendor_rw_grants_write(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_CISCO_RW]}
        assert has_procurement_write_access(user) is True

    def test_global_ro_does_not_grant_write(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RO]}
        assert has_procurement_write_access(user) is False

    def test_vendor_ro_does_not_grant_write(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_NETAPP_RO]}
        assert has_procurement_write_access(user) is False


# ── get_allowed_vendors ─────────────────────────────────────────


class TestGetAllowedVendors:

    def test_superadmin_unrestricted(self):
        user = {"role": UserRole.SUPERADMIN, "permissions": []}
        assert get_allowed_vendors(user) is None

    def test_admin_unrestricted(self):
        user = {"role": UserRole.ADMIN, "permissions": []}
        assert get_allowed_vendors(user) is None

    def test_global_ro_unrestricted(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RO]}
        assert get_allowed_vendors(user) is None

    def test_global_rw_unrestricted(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_RW]}
        assert get_allowed_vendors(user) is None

    def test_admin_perm_unrestricted(self):
        user = {"role": UserRole.USER, "permissions": [Permission.ADMIN]}
        assert get_allowed_vendors(user) is None

    def test_single_vendor_ro(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_DELL_RO]}
        result = get_allowed_vendors(user)
        assert result == ["DELL"]

    def test_single_vendor_rw(self):
        user = {"role": UserRole.USER, "permissions": [Permission.PROCUREMENT_HPE_RW]}
        result = get_allowed_vendors(user)
        assert result == ["HPE"]

    def test_multiple_vendors(self):
        user = {"role": UserRole.USER, "permissions": [
            Permission.PROCUREMENT_DELL_RO,
            Permission.PROCUREMENT_CISCO_RW,
            Permission.PROCUREMENT_NETAPP_RO,
        ]}
        result = get_allowed_vendors(user)
        assert set(result) == {"DELL", "CISCO", "NETAPP"}

    def test_no_vendor_perms_returns_empty_list(self):
        user = {"role": UserRole.USER, "permissions": [Permission.INVENTORY_RW]}
        result = get_allowed_vendors(user)
        assert result == []


# ── strip_price_fields ──────────────────────────────────────────


class TestStripPriceFields:

    def test_strips_total_amount(self):
        order = {"total_amount": 50000, "status": "active"}
        result = strip_price_fields(order)
        assert result["total_amount"] is None
        assert result["status"] == "active"

    def test_original_order_unchanged(self):
        order = {"total_amount": 50000}
        result = strip_price_fields(order)
        assert order["total_amount"] == 50000
        assert result["total_amount"] is None

    def test_strips_bom_main_prices(self):
        order = {
            "bom_data": {
                "groups": [{
                    "total_net_price": 1000,
                    "main": {
                        "ext_list_price": 100,
                        "ext_net_price": 80,
                        "unit_list_price": 50,
                        "unit_net_price": 40,
                        "net_discount": 20,
                        "description": "Server",
                    },
                    "children": [],
                }]
            }
        }
        result = strip_price_fields(order)
        grp = result["bom_data"]["groups"][0]
        assert grp["total_net_price"] is None
        assert grp["main"]["ext_list_price"] is None
        assert grp["main"]["ext_net_price"] is None
        assert grp["main"]["unit_list_price"] is None
        assert grp["main"]["unit_net_price"] is None
        assert grp["main"]["net_discount"] is None
        assert grp["main"]["description"] == "Server"

    def test_strips_children_prices(self):
        order = {
            "bom_data": {
                "groups": [{
                    "total_net_price": 500,
                    "main": {},
                    "children": [
                        {"ext_list_price": 10, "ext_net_price": 8, "part": "RAM"},
                        {"unit_list_price": 5, "unit_net_price": 4, "part": "SSD"},
                    ],
                }]
            }
        }
        result = strip_price_fields(order)
        children = result["bom_data"]["groups"][0]["children"]
        assert children[0]["ext_list_price"] is None
        assert children[0]["ext_net_price"] is None
        assert children[0]["part"] == "RAM"
        assert children[1]["unit_list_price"] is None
        assert children[1]["unit_net_price"] is None
        assert children[1]["part"] == "SSD"

    def test_no_bom_data_handled(self):
        order = {"total_amount": 100}
        result = strip_price_fields(order)
        assert result["total_amount"] is None
        assert "bom_data" not in result

    def test_bom_data_not_dict_ignored(self):
        order = {"bom_data": "invalid"}
        result = strip_price_fields(order)
        assert result["bom_data"] == "invalid"

    def test_empty_groups_list(self):
        order = {"bom_data": {"groups": []}}
        result = strip_price_fields(order)
        assert result["bom_data"]["groups"] == []

    def test_multiple_groups(self):
        order = {
            "total_amount": 9999,
            "bom_data": {
                "groups": [
                    {"total_net_price": 100, "main": {"ext_list_price": 50}, "children": []},
                    {"total_net_price": 200, "main": {"unit_net_price": 30}, "children": [
                        {"ext_net_price": 10}
                    ]},
                ]
            }
        }
        result = strip_price_fields(order)
        assert result["total_amount"] is None
        assert result["bom_data"]["groups"][0]["total_net_price"] is None
        assert result["bom_data"]["groups"][0]["main"]["ext_list_price"] is None
        assert result["bom_data"]["groups"][1]["total_net_price"] is None
        assert result["bom_data"]["groups"][1]["main"]["unit_net_price"] is None
        assert result["bom_data"]["groups"][1]["children"][0]["ext_net_price"] is None
