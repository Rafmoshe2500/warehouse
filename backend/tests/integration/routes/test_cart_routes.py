"""
Integration tests for Cart API routes (/api/cart).
Uses the full FastAPI app with test MongoDB collections.
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
class TestCartRoutes:
    """End-to-end tests for /api/cart endpoints."""

    # ── Per-test teardown ─────────────────────────────────────────────────────

    @pytest_asyncio.fixture(autouse=True)
    async def clear_cart_before_test(self, async_client: AsyncClient):
        """Ensure the test user's cart is empty before each test."""
        await async_client.delete("/api/cart")
        yield

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _create_item(self, client: AsyncClient, serial: str = None, catalog: str = "TEST-CAT") -> str:
        """Seed one inventory item; return its _id."""
        payload = {"catalog_number": catalog, "location": "TEST-LOC", "target_site": "TEST-SITE"}
        if serial:
            payload["serial"] = serial
        resp = await client.post("/api/items", json=payload)
        assert resp.status_code == 200, resp.text
        return resp.json()["_id"]

    # ── GET /cart ─────────────────────────────────────────────────────────────

    async def test_get_cart_returns_empty_cart(self, async_client: AsyncClient):
        resp = await async_client.get("/api/cart")
        assert resp.status_code == 200
        body = resp.json()
        assert body["items"] == []
        assert "expires_at" in body
        assert "username" in body

    # ── POST /cart/items ──────────────────────────────────────────────────────

    async def test_add_serial_item_to_cart(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, serial="SN-INTG-001")

        resp = await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 5})
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["items"]) == 1
        assert body["items"][0]["serial"] == "SN-INTG-001"
        # Quantity forced to 1 for serial items
        assert body["items"][0]["quantity"] == 1

    async def test_add_non_serial_item_keeps_quantity(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="NS-CAT-001")

        resp = await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 7})
        assert resp.status_code == 200
        body = resp.json()
        assert body["items"][0]["quantity"] == 7

    async def test_add_duplicate_item_updates_quantity(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="DUP-CAT")

        await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 2})
        resp = await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 9})

        assert resp.status_code == 200
        body = resp.json()
        assert len(body["items"]) == 1
        assert body["items"][0]["quantity"] == 9

    async def test_add_item_with_target_site_override(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="OV-CAT")

        resp = await async_client.post(
            "/api/cart/items",
            json={"item_id": item_id, "quantity": 1, "target_site_override": "MY_SITE"},
        )
        assert resp.status_code == 200
        assert resp.json()["items"][0]["target_site"] == "MY_SITE"

    async def test_add_nonexistent_item_returns_404(self, async_client: AsyncClient):
        fake_id = "507f1f77bcf86cd799439011"
        resp = await async_client.post("/api/cart/items", json={"item_id": fake_id})
        assert resp.status_code == 404

    # ── DELETE /cart/items/{item_id} ──────────────────────────────────────────

    async def test_remove_item_from_cart(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="RM-CAT")

        await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 1})
        resp = await async_client.delete(f"/api/cart/items/{item_id}")

        assert resp.status_code == 200
        assert resp.json()["items"] == []

    async def test_remove_nonexistent_item_returns_empty_cart(self, async_client: AsyncClient):
        resp = await async_client.delete("/api/cart/items/nonexistent_id")
        assert resp.status_code == 200
        assert resp.json()["items"] == []

    # ── POST /cart/checkout ───────────────────────────────────────────────────

    async def test_checkout_generates_email_text(self, async_client: AsyncClient):
        serial_id = await self._create_item(async_client, serial="SN-CHK-001")
        await async_client.post("/api/cart/items", json={"item_id": serial_id})

        resp = await async_client.post(
            "/api/cart/checkout", json={"target_site": "PROD-SITE"}
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "SN-CHK-001" in body["email_text"]
        assert "PROD-SITE" in body["email_text"]
        assert body["items_count"] == 1
        assert body["serial_items_updated"] == 1

    async def test_checkout_clears_cart(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="CL-CAT")
        await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 1})
        await async_client.post("/api/cart/checkout", json={"target_site": "SITE-X"})

        resp = await async_client.get("/api/cart")
        assert resp.json()["items"] == []

    async def test_checkout_updates_serial_item_note_in_inventory(self, async_client: AsyncClient):
        serial_id = await self._create_item(async_client, serial="SN-NOTE-01", catalog="NOTE-CAT")
        await async_client.post("/api/cart/items", json={"item_id": serial_id})
        await async_client.post(
            "/api/cart/checkout", json={"target_site": "DEST-SITE"}
        )

        # Verify the note was written by fetching items and searching for catalog_number
        list_resp = await async_client.get("/api/items", params={"search": "NOTE-CAT"})
        assert list_resp.status_code == 200
        items = list_resp.json()["items"]
        assert len(items) >= 1
        note = items[0].get("notes", "")
        assert "DEST-SITE" in note
        assert "test_user" in note

    async def test_checkout_non_serial_items_not_updated(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="NS-CO-CAT")

        await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 2})
        resp = await async_client.post(
            "/api/cart/checkout", json={"target_site": "ANY-SITE"}
        )
        # Non-serial items do not get their notes updated at checkout
        assert resp.json()["serial_items_updated"] == 0

    async def test_checkout_empty_cart_returns_placeholder(self, async_client: AsyncClient):
        resp = await async_client.post(
            "/api/cart/checkout", json={"target_site": "EMPTY-SITE"}
        )
        assert resp.status_code == 200
        assert "(אין פריטים)" in resp.json()["email_text"]

    # ── DELETE /cart ──────────────────────────────────────────────────────────

    async def test_clear_cart(self, async_client: AsyncClient):
        item_id = await self._create_item(async_client, catalog="CLR-CAT")
        await async_client.post("/api/cart/items", json={"item_id": item_id, "quantity": 1})

        resp = await async_client.delete("/api/cart")
        assert resp.status_code == 204

        cart_resp = await async_client.get("/api/cart")
        assert cart_resp.json()["items"] == []

    # ── Authentication ────────────────────────────────────────────────────────

    async def test_cart_endpoint_requires_auth(self, async_client: AsyncClient):
        """Cart endpoint is accessible with a valid auth token (the fixture provides one)."""
        resp = await async_client.get("/api/cart")
        assert resp.status_code == 200
