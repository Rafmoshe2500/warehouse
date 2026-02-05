
import pytest
from fastapi import HTTPException
from app.core.security import require_permission
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
