/**
 * Direct API helpers for procurement test data setup & cleanup.
 * Uses fetch so we don't depend on the frontend axios client.
 */

const BASE = 'http://localhost:8000/api';

export class ProcurementApiHelper {
  /** @type {string | null} JWT access token */
  #token = null;
  /** @type {string[]} Order IDs created during this session */
  #createdOrderIds = [];

  // ─── Auth ─────────────────────────────────────────────
  async login(username = 'admin', password = 'password') {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error(`Login failed: ${res.status}`);
    const data = await res.json();
    this.#token = data.access_token;
    return this.#token;
  }

  #headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.#token ? { Authorization: `Bearer ${this.#token}` } : {}),
    };
  }

  // ─── Orders CRUD ──────────────────────────────────────
  async createOrder(order) {
    // Auto-inject item_id into bom_items if missing (required by schema)
    const prepared = { ...order };
    if (Array.isArray(prepared.bom_items)) {
      prepared.bom_items = prepared.bom_items.map((item, idx) => ({
        item_id: idx + 1,
        ...item,
      }));
    }
    const res = await fetch(`${BASE}/procurement/orders`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify(prepared),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Create order failed (${res.status}): ${detail}`);
    }
    const created = await res.json();
    const id = created._id || created.id;
    if (id) this.#createdOrderIds.push(id);
    return created;
  }

  async getOrders(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE}/procurement/orders?${qs}`, {
      headers: this.#headers(),
    });
    if (!res.ok) throw new Error(`Get orders failed: ${res.status}`);
    return res.json();
  }

  async updateOrder(orderId, data) {
    const res = await fetch(`${BASE}/procurement/orders/${orderId}`, {
      method: 'PUT',
      headers: this.#headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Update order failed: ${res.status}`);
    return res.json();
  }

  async deleteOrder(orderId) {
    const res = await fetch(`${BASE}/procurement/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.#headers(),
    });
    return res.ok;
  }

  // ─── Cleanup ──────────────────────────────────────────
  async cleanup() {
    for (const id of this.#createdOrderIds) {
      try {
        await this.deleteOrder(id);
      } catch { /* ignore cleanup errors */ }
    }
    this.#createdOrderIds = [];
  }

  async cleanupByPrefix(prefix) {
    try {
      const data = await this.getOrders({ search: prefix, page_size: 100 });
      const orders = data.orders || [];
      for (const order of orders) {
        const id = order._id || order.id;
        if (id) await this.deleteOrder(id);
      }
    } catch { /* ignore */ }
  }
}
