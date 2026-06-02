from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from bson import ObjectId

from app.db.mongodb import MongoDB

CART_EXPIRY_HOURS = 24


class CartRepository:
    """Manages the `carts` MongoDB collection.

    One document per username:
    {
        _id: ObjectId,
        username: str,
        items: [...],
        expires_at: datetime,   # TTL index field
        created_at: datetime,
    }
    """

    def __init__(self) -> None:
        self.collection = MongoDB.get_collection("carts")

    # ── Helpers ────────────────────────────────────────────────────────────

    def _expiry(self) -> datetime:
        return datetime.now(timezone.utc) + timedelta(hours=CART_EXPIRY_HOURS)

    def _serialize(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        if doc and "_id" in doc:
            doc["id"] = str(doc.pop("_id"))
        return doc

    # ── Read ───────────────────────────────────────────────────────────────

    async def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        doc = await self.collection.find_one({"username": username})
        return self._serialize(doc) if doc else None

    async def get_item_count(self, username: str) -> int:
        doc = await self.collection.find_one({"username": username}, {"items": 1})
        if not doc:
            return 0
        return len(doc.get("items", []))

    # ── Write ──────────────────────────────────────────────────────────────

    async def upsert_cart(self, username: str) -> Dict[str, Any]:
        """Create the cart document if it does not exist; extend expiry if it does."""
        result = await self.collection.find_one_and_update(
            {"username": username},
            {
                "$setOnInsert": {
                    "username": username,
                    "items": [],
                    "created_at": datetime.now(timezone.utc),
                },
                "$set": {"expires_at": self._expiry()},
            },
            upsert=True,
            return_document=True,
        )
        return self._serialize(result)

    async def add_or_update_item(
        self, username: str, item_dict: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Upsert a cart item by item_id.

        If an item with the same item_id already exists update its quantity and
        target_site; otherwise push a new entry.
        """
        item_id = item_dict["item_id"]

        # Try to update the existing item inside the array first
        update_result = await self.collection.update_one(
            {"username": username, "items.item_id": item_id},
            {
                "$set": {
                    "items.$.quantity": item_dict.get("quantity", 1),
                    "items.$.target_site": item_dict.get("target_site"),
                    "items.$.added_at": item_dict.get(
                        "added_at", datetime.now(timezone.utc)
                    ),
                    "expires_at": self._expiry(),
                },
            },
        )

        if update_result.matched_count == 0:
            # Item not yet in cart — push it
            await self.collection.update_one(
                {"username": username},
                {
                    "$push": {"items": item_dict},
                    "$set": {"expires_at": self._expiry()},
                },
                upsert=True,
            )

        return await self.get_by_username(username)

    async def remove_item(self, username: str, item_id: str) -> Dict[str, Any]:
        await self.collection.update_one(
            {"username": username},
            {
                "$pull": {"items": {"item_id": item_id}},
                "$set": {"expires_at": self._expiry()},
            },
        )
        return await self.get_by_username(username)

    async def clear_cart(self, username: str) -> None:
        await self.collection.update_one(
            {"username": username},
            {"$set": {"items": [], "expires_at": self._expiry()}},
        )

    async def ensure_ttl_index(self) -> None:
        """Create the TTL index on `expires_at` (idempotent)."""
        await self.collection.create_index("expires_at", expireAfterSeconds=0)

    async def find_and_delete_expired(self) -> List[Dict[str, Any]]:
        """Find all carts whose `expires_at` is in the past, delete them,
        and return their serialized data for audit logging.

        Called by the background expiry task so logs are written before MongoDB's
        own TTL janitor has a chance to silently delete the documents.
        """
        now = datetime.now(timezone.utc)
        expired = await self.collection.find(
            {"expires_at": {"$lt": now}}
        ).to_list(length=None)

        if expired:
            ids = [doc["_id"] for doc in expired]
            await self.collection.delete_many({"_id": {"$in": ids}})

        result: List[Dict[str, Any]] = []
        for doc in expired:
            doc["id"] = str(doc.pop("_id"))
            result.append(doc)
        return result
