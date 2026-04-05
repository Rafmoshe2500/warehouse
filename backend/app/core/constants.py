from enum import Enum

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    USER = "user"


class UserType(str, Enum):
    LOCAL = "local"
    ACTIVE_DIRECTORY = "ad"



class Permission(str, Enum):
    INVENTORY_RO = "inventory:ro"
    INVENTORY_RW = "inventory:rw"
    PROCUREMENT_RO = "procurement:ro"
    PROCUREMENT_RW = "procurement:rw"
    ADMIN = "admin"

    # ── Advanced Procurement Permissions ─────────────────────────
    # מחירים
    PROCUREMENT_VIEW_PRICES   = "procurement:view_prices"    # לראות מחירי הזמנה ורכיבים
    PROCUREMENT_COMPARE_PRICES = "procurement:compare_prices"  # השוואת מחירים

    # הרשאות ספקים — קריאה
    PROCUREMENT_DELL_RO      = "procurement:dell:ro"
    PROCUREMENT_HPE_RO       = "procurement:hpe:ro"
    PROCUREMENT_NETAPP_RO    = "procurement:netapp:ro"
    PROCUREMENT_CISCO_RO     = "procurement:cisco:ro"
    PROCUREMENT_COMMVAULT_RO = "procurement:commvault:ro"

    # הרשאות ספקים — עריכה
    PROCUREMENT_DELL_RW      = "procurement:dell:rw"
    PROCUREMENT_HPE_RW       = "procurement:hpe:rw"
    PROCUREMENT_NETAPP_RW    = "procurement:netapp:rw"
    PROCUREMENT_CISCO_RW     = "procurement:cisco:rw"
    PROCUREMENT_COMMVAULT_RW = "procurement:commvault:rw"

    # Helper to get all permissions as a list
    @classmethod
    def list(cls):
        return list(map(lambda c: c.value, cls))
