from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    """Request payload to add a single item to the cart."""
    item_id: str
    quantity: int = Field(default=1, ge=1)
    target_site_override: Optional[str] = None


class CartItem(BaseModel):
    """A snapshot of an inventory item stored inside the cart."""
    item_id: str
    catalog_number: Optional[str] = None
    serial: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    target_site: Optional[str] = None
    quantity: int = 1
    added_at: datetime = Field(default_factory=datetime.utcnow)

    @property
    def is_serial(self) -> bool:
        return bool(self.serial and self.serial.strip())


class CartResponse(BaseModel):
    """Full cart document returned to the client."""
    id: str
    username: str
    items: List[CartItem] = []
    expires_at: datetime
    created_at: datetime

    model_config = {"populate_by_name": True}


class CheckoutRequest(BaseModel):
    """Request payload for finalising the cart (משיכת ציוד)."""
    target_site: str = Field(..., min_length=1)


class CheckoutResponse(BaseModel):
    """Result returned after checkout — formatted email text."""
    email_text: str
    items_count: int
    serial_items_updated: int
