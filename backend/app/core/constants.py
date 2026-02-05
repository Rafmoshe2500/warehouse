from enum import Enum

class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    USER = "user"


class Permission(str, Enum):
    INVENTORY_RO = "inventory:ro"
    INVENTORY_RW = "inventory:rw"
    PROCUREMENT_RO = "procurement:ro"
    PROCUREMENT_RW = "procurement:rw"
    ADMIN = "admin"
    
    # Helper to get all permissions as a list
    @classmethod
    def list(cls):
        return list(map(lambda c: c.value, cls))
