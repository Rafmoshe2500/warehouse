/**
 * Direct API helpers for test data setup & cleanup.
 * Uses fetch so we don't depend on the frontend axios client.
 *
 * Every item created through these helpers is tracked and can be
 * bulk-deleted via `cleanup()`.
 */

const BASE = 'http://localhost:8000/api';

export class TestApiHelper {
  /** @type {string | null} JWT access token */
  #token = null;
  /** @type {string[]} Item IDs created during this session */
  #createdItemIds = [];

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

  // ─── Items CRUD ───────────────────────────────────────
  async createItem(item) {
    const res = await fetch(`${BASE}/items`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Create item failed (${res.status}): ${detail}`);
    }
    const created = await res.json();
    const id = created._id || created.id;
    if (id) this.#createdItemIds.push(id);
    return created;
  }

  async createItems(items) {
    const results = [];
    for (const item of items) {
      results.push(await this.createItem(item));
    }
    return results;
  }

  async getItems(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE}/items?${qs}`, { headers: this.#headers() });
    if (!res.ok) throw new Error(`Get items failed: ${res.status}`);
    return res.json();
  }

  async deleteItem(id, reason = 'test cleanup') {
    const res = await fetch(`${BASE}/items/${id}`, {
      method: 'DELETE',
      headers: this.#headers(),
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  }

  async bulkDelete(ids, reason = 'test cleanup') {
    if (!ids.length) return;
    const res = await fetch(`${BASE}/items/bulk-delete`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify({ ids, reason }),
    });
    return res.ok;
  }

  // ─── Cleanup ──────────────────────────────────────────
  /**
   * Delete every item that was created through this helper instance.
   * Call this in afterAll / afterEach to keep the DB clean.
   */
  async cleanup() {
    if (this.#createdItemIds.length === 0) return;
    await this.bulkDelete([...this.#createdItemIds], 'automated test cleanup');
    this.#createdItemIds = [];
  }

  /**
   * Delete items matching a catalog_number prefix (e.g. "E2E-").
   * Useful as a broad safety-net cleanup.
   */
  async cleanupByPrefix(prefix) {
    const { items = [] } = await this.getItems({ search: prefix, limit: 500 });
    const ids = items.map((i) => i._id || i.id).filter(Boolean);
    if (ids.length) await this.bulkDelete(ids, `cleanup prefix: ${prefix}`);
  }

  // ─── Users ────────────────────────────────────────────
  /**
   * Create a test user. Ignores 400/409 if the user already exists.
   */
  async createTestUser({ username, password, permissions = [] }) {
    const res = await fetch(`${BASE}/admin/users`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify({ username, password, user_type: 'local', permissions }),
    });
    if (!res.ok && res.status !== 400 && res.status !== 409 && res.status !== 422) {
      const detail = await res.text();
      throw new Error(`Create user failed (${res.status}): ${detail}`);
    }
    return res.ok ? res.json() : null;
  }

  async getUsers() {
    const res = await fetch(`${BASE}/admin/users`, { headers: this.#headers() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || data;
  }

  async deleteUserByUsername(username) {
    const users = await this.getUsers();
    const user = users.find((u) => u.username === username);
    if (!user) return;
    const userId = user._id || user.id;
    await fetch(`${BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.#headers(),
      body: JSON.stringify({ reason: 'automated test cleanup' }),
    });
  }
}
