"""Audit logging for shopping cart (עגלת קניות) operations."""
from typing import Any, Dict, List, Optional

from app.schemas.audit import AuditAction
from app.schemas.cart import CartItem
from app.services.audit_service import AuditService


class CartAuditor:
    """Wraps AuditService with cart-specific logging helpers."""

    def __init__(self, audit_service: AuditService) -> None:
        self.audit_service = audit_service

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _username(self, user: Dict[str, Any]) -> str:
        return user.get("username", user.get("sub", "unknown"))

    def _role(self, user: Dict[str, Any]) -> str:
        return user.get("role", "user")

    def _display_name(self, item: CartItem) -> str:
        """Human-readable label for a cart item."""
        parts: List[str] = []
        if item.catalog_number:
            parts.append(item.catalog_number)
        if item.is_serial and item.serial:
            parts.append(f"(S/N: {item.serial})")
        elif not item.is_serial and item.quantity > 1:
            parts.append(f"(×{item.quantity})")
        if item.description:
            parts.append(f"- {item.description}")
        return " ".join(parts) if parts else item.item_id

    # ── Public log methods ────────────────────────────────────────────────────

    async def log_item_added(
        self,
        user: Dict[str, Any],
        cart_item: CartItem,
    ) -> None:
        """Log: משתמש הוסיף ציוד לעגלה."""
        display = self._display_name(cart_item)
        await self.audit_service.log_user_action(
            action=AuditAction.CART_ITEM_ADD,
            actor=self._username(user),
            actor_role=self._role(user),
            target_resource="item",
            resource_id=cart_item.item_id,
            target_resource_name=display,
            changes={
                "quantity": cart_item.quantity,
                "target_site": cart_item.target_site,
                "is_serial": cart_item.is_serial,
            },
            details=f"הוסף לעגלה: {display}",
        )

    async def log_item_removed(
        self,
        user: Dict[str, Any],
        item_id: str,
        cart_item: Optional[CartItem],
    ) -> None:
        """Log: משתמש הסיר ציוד מהעגלה."""
        display = self._display_name(cart_item) if cart_item else item_id
        await self.audit_service.log_user_action(
            action=AuditAction.CART_ITEM_REMOVE,
            actor=self._username(user),
            actor_role=self._role(user),
            target_resource="item",
            resource_id=item_id,
            target_resource_name=display,
            details=f"הוסר מהעגלה: {display}",
        )

    async def log_checkout(
        self,
        user: Dict[str, Any],
        target_site: str,
        items: List[CartItem],
        serial_updated: int,
    ) -> None:
        """Log: משתמש ביצע משיכת ציוד."""
        serial_count = sum(1 for i in items if i.is_serial)
        item_summary = "; ".join(self._display_name(i) for i in items)
        await self.audit_service.log_user_action(
            action=AuditAction.CART_CHECKOUT,
            actor=self._username(user),
            actor_role=self._role(user),
            target_resource="item",
            resource_id=self._username(user),
            target_resource_name=f"משיכת ציוד לאתר: {target_site}",
            changes={
                "target_site": target_site,
                "total_items": len(items),
                "serial_items": serial_count,
                "non_serial_items": len(items) - serial_count,
                "serial_items_updated_in_inventory": serial_updated,
            },
            details=(
                f"משיכת {len(items)} פריטים לאתר {target_site}. "
                f"פריטים: {item_summary}"
            ),
        )

    async def log_expired(
        self,
        username: str,
        items: List[Dict[str, Any]],
    ) -> None:
        """Log: עגלת קניות פגה אוטומטית לאחר 24 שעות (TTL)."""
        item_names = "; ".join(
            i.get("catalog_number") or i.get("serial") or i.get("item_id", "?")
            for i in items
        )
        await self.audit_service.log_user_action(
            action=AuditAction.CART_EXPIRED,
            actor="system",
            actor_role="system",
            target_resource="item",
            resource_id=username,
            target_resource_name=f"עגלת קניות של {username}",
            changes={"items_count": len(items)},
            details=(
                f"עגלת הקניות של {username} פגה אוטומטית לאחר 24 שעות "
                f"עם {len(items)} פריטים: {item_names}"
            ),
        )
