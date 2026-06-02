from fastapi import APIRouter, Depends

from app.schemas.cart import CartItemAdd, CartResponse, CheckoutRequest, CheckoutResponse
from app.services.cart_service import CartService
from app.services.audit.cart_auditor import CartAuditor
from app.services.audit_service import AuditService
from app.db.repositories.cart_repository import CartRepository
from app.db.repositories.items import ItemsRepository
from app.dependencies import get_items_repository
from app.core.security import get_current_user, require_permission
from app.core.constants import Permission

router = APIRouter(prefix="/cart", tags=["Cart"])

inventory_ro = require_permission(Permission.INVENTORY_RO)


# ── Dependency injection ──────────────────────────────────────────────────────

def get_cart_repository() -> CartRepository:
    return CartRepository()


def get_cart_auditor() -> CartAuditor:
    return CartAuditor(AuditService())


def get_cart_service(
    cart_repo: CartRepository = Depends(get_cart_repository),
    items_repo: ItemsRepository = Depends(get_items_repository),
    auditor: CartAuditor = Depends(get_cart_auditor),
) -> CartService:
    return CartService(cart_repo, items_repo, auditor)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=CartResponse)
async def get_cart(
    current_user: dict = Depends(inventory_ro),
    cart_service: CartService = Depends(get_cart_service),
):
    """Return the current user's cart, creating it if it does not exist."""
    return await cart_service.get_cart(current_user["username"])


@router.post("/items", response_model=CartResponse)
async def add_item_to_cart(
    payload: CartItemAdd,
    current_user: dict = Depends(inventory_ro),
    cart_service: CartService = Depends(get_cart_service),
):
    """Add a single inventory item to the cart.

    For serial items `quantity` is forced to 1 regardless of the payload.
    """
    return await cart_service.add_item(current_user["username"], payload, current_user)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_item_from_cart(
    item_id: str,
    current_user: dict = Depends(inventory_ro),
    cart_service: CartService = Depends(get_cart_service),
):
    """Remove one item (by inventory item_id) from the cart."""
    return await cart_service.remove_item(current_user["username"], item_id, current_user)


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout_cart(
    payload: CheckoutRequest,
    current_user: dict = Depends(inventory_ro),
    cart_service: CartService = Depends(get_cart_service),
):
    """Finalise the cart.

    Generates the requisition email text, stamps every serial item in the
    inventory with a 'drawn for installation' note, then clears the cart.
    """
    return await cart_service.checkout(
        current_user["username"], payload.target_site, current_user
    )


@router.delete("", status_code=204)
async def clear_cart(
    current_user: dict = Depends(inventory_ro),
    cart_service: CartService = Depends(get_cart_service),
):
    """Empty the cart without generating email text."""
    await cart_service.clear_cart(current_user["username"])
