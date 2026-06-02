from datetime import datetime, timezone
from typing import Any, Dict, List
import logging

from app.db.repositories.cart_repository import CartRepository
from app.db.repositories.items import ItemsRepository
from app.schemas.cart import CartItem, CartItemAdd, CartResponse, CheckoutResponse
from app.services.audit.cart_auditor import CartAuditor

logger = logging.getLogger(__name__)

_CHECKOUT_NOTE_TEMPLATE = "נמשך להתקנה באתר {site} על ידי {username}"


def _build_cart_response(doc: Dict[str, Any]) -> CartResponse:
    items = [CartItem(**i) for i in doc.get("items", [])]
    return CartResponse(
        id=doc["id"],
        username=doc["username"],
        items=items,
        expires_at=doc["expires_at"],
        created_at=doc["created_at"],
    )


def _build_email_text(items: List[CartItem], target_site: str) -> str:
    """Format the requisition email body.

    ציוד סריאלי:
    * SERIAL | LOCATION

    ציוד נלווה:
    * CATALOG | כמות: QTY
    """
    serial_items = [i for i in items if i.is_serial]
    non_serial_items = [i for i in items if not i.is_serial]

    sections: List[str] = []

    if serial_items:
        serial_lines = ["ציוד סריאלי:"]
        for item in serial_items:
            location = item.location or ""
            serial_lines.append(f"* {item.serial} | {location}")
        sections.append("\n".join(serial_lines))

    if non_serial_items:
        non_serial_lines = ["ציוד נלווה:"]
        for item in non_serial_items:
            catalog = item.catalog_number or item.item_id
            non_serial_lines.append(f"* {catalog} | כמות: {item.quantity}")
        sections.append("\n".join(non_serial_lines))

    if not sections:
        items_block = "(אין פריטים)"
    else:
        items_block = "\n\n".join(sections)

    return f"{items_block}\n\nהציוד משורין להתקנות באתר: {target_site}"


class CartService:
    def __init__(
        self,
        cart_repo: CartRepository,
        items_repo: ItemsRepository,
        auditor: CartAuditor,
    ) -> None:
        self.cart_repo = cart_repo
        self.items_repo = items_repo
        self.auditor = auditor

    # ── Public API ────────────────────────────────────────────────────────

    async def get_cart(self, username: str) -> CartResponse:
        logger.debug("get_cart username=%s", username)
        doc = await self.cart_repo.get_by_username(username)
        if not doc:
            doc = await self.cart_repo.upsert_cart(username)
        return _build_cart_response(doc)

    async def add_item(
        self, username: str, payload: CartItemAdd, user: Dict[str, Any]
    ) -> CartResponse:
        logger.info(
            "add_item username=%s item_id=%s qty=%d",
            username,
            payload.item_id,
            payload.quantity,
        )
        # Ensure cart exists
        await self.cart_repo.upsert_cart(username)

        # Fetch real item to snapshot its fields
        item = await self.items_repo.get_by_id_or_raise(payload.item_id)

        is_serial = bool(item.get("serial") and str(item["serial"]).strip())

        target_site = (
            payload.target_site_override
            or item.get("target_site")
            or ""
        )

        cart_item = CartItem(
            item_id=payload.item_id,
            catalog_number=item.get("catalog_number"),
            serial=item.get("serial"),
            description=item.get("description"),
            location=item.get("location"),
            target_site=target_site,
            # Serial items are always quantity 1 (each serial is unique)
            quantity=1 if is_serial else payload.quantity,
            added_at=datetime.now(timezone.utc),
        )

        doc = await self.cart_repo.add_or_update_item(
            username, cart_item.model_dump()
        )
        await self.auditor.log_item_added(user, cart_item)
        return _build_cart_response(doc)

    async def remove_item(
        self, username: str, item_id: str, user: Dict[str, Any]
    ) -> CartResponse:
        logger.info("remove_item username=%s item_id=%s", username, item_id)
        # Snapshot item info before removal so the audit log is descriptive
        pre = await self.cart_repo.get_by_username(username)
        removed_item = None
        if pre:
            raw = next(
                (i for i in pre.get("items", []) if i["item_id"] == item_id),
                None,
            )
            if raw:
                removed_item = CartItem(**raw)
        doc = await self.cart_repo.remove_item(username, item_id)
        if not doc:
            doc = await self.cart_repo.upsert_cart(username)
        await self.auditor.log_item_removed(user, item_id, removed_item)
        return _build_cart_response(doc)

    async def clear_cart(self, username: str) -> None:
        logger.info("clear_cart username=%s", username)
        await self.cart_repo.clear_cart(username)

    async def checkout(
        self, username: str, target_site: str, user: Dict[str, Any]
    ) -> CheckoutResponse:
        """Finalise the cart:
        1. Generate the requisition email text.
        2. Update the `notes` field of every **serial** item in the cart.
        3. Clear the cart.
        """
        logger.info(
            "checkout username=%s target_site=%s", username, target_site
        )
        cart = await self.get_cart(username)

        if not cart.items:
            logger.warning("checkout called on empty cart for username=%s", username)

        email_text = _build_email_text(cart.items, target_site)

        # Update serial items in inventory
        serial_items_updated = 0
        note = _CHECKOUT_NOTE_TEMPLATE.format(
            site=target_site, username=username
        )
        for cart_item in cart.items:
            if cart_item.is_serial:
                try:
                    await self.items_repo.update(
                        cart_item.item_id,
                        {
                            "notes": note,
                            "updated_at": datetime.now(timezone.utc),
                        },
                    )
                    serial_items_updated += 1
                    logger.info(
                        "Updated serial item %s note on checkout",
                        cart_item.item_id,
                    )
                except Exception as exc:
                    # Non-fatal — log and continue so checkout still completes
                    logger.error(
                        "Failed to update note on item %s: %s",
                        cart_item.item_id,
                        exc,
                    )

        await self.cart_repo.clear_cart(username)
        logger.info(
            "checkout complete for username=%s — %d items, %d serial updated",
            username,
            len(cart.items),
            serial_items_updated,
        )

        await self.auditor.log_checkout(user, target_site, cart.items, serial_items_updated)

        return CheckoutResponse(
            email_text=email_text,
            items_count=len(cart.items),
            serial_items_updated=serial_items_updated,
        )

    # ── Background task helper ────────────────────────────────────────────────

    async def expire_carts(self) -> int:
        """Find and delete all expired carts, writing a CART_EXPIRED audit log
        for each one.  Returns the number of carts that were expired.

        Intended to be called periodically by the background task in main.py.
        """
        expired = await self.cart_repo.find_and_delete_expired()
        for cart_doc in expired:
            try:
                await self.auditor.log_expired(
                    cart_doc["username"], cart_doc.get("items", [])
                )
            except Exception as exc:
                logger.error(
                    "Failed to write CART_EXPIRED audit log for %s: %s",
                    cart_doc.get("username"),
                    exc,
                )
        if expired:
            logger.info("Expired %d cart(s) and logged them", len(expired))
        return len(expired)
