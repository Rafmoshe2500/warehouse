from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer

from app.config import settings
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.constants import UserRole, Permission

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """יצירת JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """אימות JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise UnauthorizedException("Could not validate credentials")
        return payload
    except JWTError:
        raise UnauthorizedException("Could not validate credentials")


async def get_current_user(
        request: Request,
        token: Optional[str] = Depends(oauth2_scheme)
) -> dict:
    """קבלת משתמש מחובר"""
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise UnauthorizedException("Not authenticated")

    return verify_token(token)


async def get_current_user_groups(
        current_user: dict = Depends(get_current_user)
) -> list[str]:
    """Get the groups the current user belongs to."""
    groups = current_user.get("groups", [])
    
    # Mock for dev/test if empty AND in development environment
    if not groups and settings.ENVIRONMENT == "development":
        # Default mock groups for everyone
        groups = ["All Users", "Domain Users"]
        
        # Add simpler mock logic based on role for testing
        if current_user.get("role") in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            groups.extend(["Admins", "Management"])
        
        if current_user.get("username") == "user": # Specific mock for 'user'
             groups.extend(["Designers"])
             
    return groups


async def require_admin(
        current_user: dict = Depends(get_current_user)
) -> dict:
    """וידוא שהמשתמש הוא אדמין או סופר-אדמין או בעל הרשאת אדמין"""
    user_role = current_user.get("role")
    user_permissions = current_user.get("permissions", [])
    
    if user_role not in [UserRole.ADMIN, UserRole.SUPERADMIN] and Permission.ADMIN not in user_permissions:
        raise ForbiddenException("נדרשות הרשאות אדמין")
    return current_user


async def require_superadmin(
        current_user: dict = Depends(get_current_user)
) -> dict:
    """וידוא שהמשתמש הוא סופר-אדמין בלבד"""
    if current_user.get("role") != UserRole.SUPERADMIN:
        raise ForbiddenException("נדרשות הרשאות SuperAdmin")
    return current_user


def require_permission(permission: str):
    """Dependency factory to require a specific permission."""
    async def permission_dependency(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        user_role = current_user.get("role")
        user_permissions = current_user.get("permissions", [])
        
        # SuperAdmin has all permissions
        if user_role == UserRole.SUPERADMIN:
            return current_user
            
        if permission not in user_permissions:
            # Check for implied permissions (RW implies RO)
            if permission.endswith(":ro"):
                rw_permission = permission.replace(":ro", ":rw")
                if rw_permission in user_permissions:
                    return current_user
            
            raise ForbiddenException(f"נדרשת הרשאה: {permission}")
        return current_user
    
    return permission_dependency


def has_price_permission(user: dict) -> bool:
    """
    Check if user is allowed to view price fields.
    SuperAdmin / Admin always have access.
    Other users need 'procurement:view_prices' or 'procurement:rw'.
    """
    role = user.get("role")
    if role in (UserRole.SUPERADMIN, UserRole.ADMIN):
        return True
    perms = user.get("permissions", [])
    return (
        Permission.PROCUREMENT_VIEW_PRICES in perms
        or Permission.PROCUREMENT_RW in perms
        or Permission.ADMIN in perms
    )


_VENDOR_RO_PERMS = (
    Permission.PROCUREMENT_DELL_RO, Permission.PROCUREMENT_HPE_RO,
    Permission.PROCUREMENT_NETAPP_RO, Permission.PROCUREMENT_CISCO_RO,
    Permission.PROCUREMENT_COMMVAULT_RO,
)
_VENDOR_RW_PERMS = (
    Permission.PROCUREMENT_DELL_RW, Permission.PROCUREMENT_HPE_RW,
    Permission.PROCUREMENT_NETAPP_RW, Permission.PROCUREMENT_CISCO_RW,
    Permission.PROCUREMENT_COMMVAULT_RW,
)


def _is_vendor_perm(perm: str, mode: str = "any") -> bool:
    """Check if a permission string matches the vendor permission pattern.

    mode: 'any' matches both :ro and :rw, 'ro' matches :ro only, 'rw' matches :rw only.
    """
    import re
    if mode == "rw":
        return bool(re.match(r"^procurement:[a-z0-9_-]+:rw$", perm))
    elif mode == "ro":
        return bool(re.match(r"^procurement:[a-z0-9_-]+:ro$", perm))
    return bool(re.match(r"^procurement:[a-z0-9_-]+:(ro|rw)$", perm))


def _extract_vendor_from_perm(perm: str) -> str | None:
    """Extract vendor name from 'procurement:<vendor>:(ro|rw)' permission string."""
    import re
    m = re.match(r"^procurement:([a-z0-9_-]+):(ro|rw)$", perm)
    return m.group(1).upper() if m else None


def has_procurement_read_access(user: dict) -> bool:
    """True if user can read any procurement orders (global or vendor-specific)."""
    role = user.get("role")
    if role in (UserRole.SUPERADMIN, UserRole.ADMIN):
        return True
    perms = user.get("permissions", [])
    if Permission.PROCUREMENT_RO in perms or Permission.PROCUREMENT_RW in perms or Permission.ADMIN in perms:
        return True
    # Legacy enum-based vendor perms
    if any(p in perms for p in _VENDOR_RO_PERMS + _VENDOR_RW_PERMS):
        return True
    # Dynamic string-based vendor perms (procurement:<vendor>:ro/rw)
    return any(_is_vendor_perm(p) for p in perms)


def has_procurement_write_access(user: dict) -> bool:
    """True if user can write/edit any procurement order (global or vendor-specific)."""
    role = user.get("role")
    if role in (UserRole.SUPERADMIN, UserRole.ADMIN):
        return True
    perms = user.get("permissions", [])
    if Permission.PROCUREMENT_RW in perms or Permission.ADMIN in perms:
        return True
    # Legacy enum-based vendor perms
    if any(p in perms for p in _VENDOR_RW_PERMS):
        return True
    # Dynamic string-based vendor perms
    return any(_is_vendor_perm(p, mode="rw") for p in perms)


# Map: vendor name (lowercase, as stored in bom_vendor) -> (ro perm, rw perm)
_VENDOR_PERM_MAP = {
    "DELL":      (Permission.PROCUREMENT_DELL_RO,      Permission.PROCUREMENT_DELL_RW),
    "HPE":       (Permission.PROCUREMENT_HPE_RO,       Permission.PROCUREMENT_HPE_RW),
    "NETAPP":    (Permission.PROCUREMENT_NETAPP_RO,    Permission.PROCUREMENT_NETAPP_RW),
    "CISCO":     (Permission.PROCUREMENT_CISCO_RO,     Permission.PROCUREMENT_CISCO_RW),
    "COMMVAULT": (Permission.PROCUREMENT_COMMVAULT_RO, Permission.PROCUREMENT_COMMVAULT_RW),
}


def get_allowed_vendors(user: dict) -> list[str] | None:
    """
    Return the list of vendor names the user may see.
    - None  → no restriction (global access)
    - [...]  → only these vendors (uppercase, matching bom_vendor field)
    """
    role = user.get("role")
    if role in (UserRole.SUPERADMIN, UserRole.ADMIN):
        return None  # unrestricted
    perms = user.get("permissions", [])
    # Global permissions → no restriction
    if Permission.PROCUREMENT_RO in perms or Permission.PROCUREMENT_RW in perms or Permission.ADMIN in perms:
        return None

    allowed = set()
    # Legacy enum-based perms
    for vendor, (ro, rw) in _VENDOR_PERM_MAP.items():
        if ro in perms or rw in perms:
            allowed.add(vendor)
    # Dynamic string-based perms (procurement:<vendor>:ro/rw)
    for p in perms:
        v = _extract_vendor_from_perm(p)
        if v:
            allowed.add(v)

    return list(allowed)  # may be empty if user has no vendor perms


# Price fields to strip from order-level and BOM data
_ORDER_PRICE_FIELDS = ("total_amount",)
_BOM_ITEM_PRICE_FIELDS = (
    "ext_list_price", "ext_net_price",
    "unit_list_price", "unit_net_price",
    "net_discount",
)


def strip_price_fields(order: dict) -> dict:
    """
    Return a copy of the order dict with all price fields set to None.
    Used when the requesting user lacks the 'procurement:view_prices' permission.
    The response reaches the client but contains no numeric price data,
    so browser DevTools cannot expose prices.
    """
    import copy
    order = copy.deepcopy(order)

    # Order-level price
    for field in _ORDER_PRICE_FIELDS:
        if field in order:
            order[field] = None

    # BOM data (raw scan results stored in bom_data)
    bom_data = order.get("bom_data")
    if isinstance(bom_data, dict):
        for group in bom_data.get("groups", []):
            group["total_net_price"] = None
            for key in ("main",):
                item = group.get(key, {})
                if isinstance(item, dict):
                    for f in _BOM_ITEM_PRICE_FIELDS:
                        if f in item:
                            item[f] = None
            for child in group.get("children", []):
                if isinstance(child, dict):
                    for f in _BOM_ITEM_PRICE_FIELDS:
                        if f in child:
                            child[f] = None

    return order

