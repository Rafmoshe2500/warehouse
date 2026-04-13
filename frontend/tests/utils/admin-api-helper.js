/**
 * Direct API helpers for admin test data setup & cleanup.
 * Uses fetch so we don't depend on the frontend axios client.
 */

const BASE = 'http://localhost:8000/api';

export class AdminApiHelper {
  /** @type {string | null} JWT access token */
  #token = null;
  /** @type {string[]} User IDs created during this session */
  #createdUserIds = [];
  /** @type {string[]} Group IDs created during this session */
  #createdGroupIds = [];

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

  // ─── Users CRUD ───────────────────────────────────────
  async getUsers() {
    const res = await fetch(`${BASE}/admin/users`, {
      headers: this.#headers(),
    });
    if (!res.ok) throw new Error(`Get users failed: ${res.status}`);
    return res.json();
  }

  async createUser(userData) {
    const res = await fetch(`${BASE}/admin/users`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Create user failed (${res.status}): ${detail}`);
    }
    const created = await res.json();
    const id = created._id || created.id;
    if (id) this.#createdUserIds.push(id);
    return created;
  }

  async updateUser(userId, data) {
    const res = await fetch(`${BASE}/admin/users/${userId}`, {
      method: 'PUT',
      headers: this.#headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Update user failed: ${res.status}`);
    return res.json();
  }

  async deleteUser(userId, reason = 'test cleanup') {
    const res = await fetch(`${BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: this.#headers(),
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  }

  // ─── Groups CRUD ──────────────────────────────────────
  async getGroups() {
    const res = await fetch(`${BASE}/admin/groups`, {
      headers: this.#headers(),
    });
    if (!res.ok) throw new Error(`Get groups failed: ${res.status}`);
    return res.json();
  }

  async createGroup(groupData) {
    const res = await fetch(`${BASE}/admin/groups`, {
      method: 'POST',
      headers: this.#headers(),
      body: JSON.stringify(groupData),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Create group failed (${res.status}): ${detail}`);
    }
    const created = await res.json();
    const id = created._id || created.id;
    if (id) this.#createdGroupIds.push(id);
    return created;
  }

  async updateGroup(groupId, data) {
    const res = await fetch(`${BASE}/admin/groups/${groupId}`, {
      method: 'PUT',
      headers: this.#headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`Update group failed: ${res.status}`);
    return res.json();
  }

  async deleteGroup(groupId, reason = 'test cleanup') {
    const res = await fetch(`${BASE}/admin/groups/${groupId}`, {
      method: 'DELETE',
      headers: this.#headers(),
      body: JSON.stringify({ reason }),
    });
    return res.ok;
  }

  // ─── Audit ────────────────────────────────────────────
  async getAuditLogs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE}/audit/logs?${qs}`, {
      headers: this.#headers(),
    });
    if (!res.ok) throw new Error(`Get audit logs failed: ${res.status}`);
    return res.json();
  }

  // ─── Cleanup ──────────────────────────────────────────
  async cleanup() {
    for (const id of this.#createdUserIds) {
      try { await this.deleteUser(id); } catch { /* ignore */ }
    }
    this.#createdUserIds = [];

    for (const id of this.#createdGroupIds) {
      try { await this.deleteGroup(id); } catch { /* ignore */ }
    }
    this.#createdGroupIds = [];
  }

  async cleanupUsersByPrefix(prefix) {
    try {
      const data = await this.getUsers();
      const users = data.users || [];
      for (const user of users) {
        if (user.username?.startsWith(prefix)) {
          const id = user._id || user.id;
          if (id) await this.deleteUser(id);
        }
      }
    } catch { /* ignore */ }
  }

  async cleanupGroupsByPrefix(prefix) {
    try {
      const data = await this.getGroups();
      const groups = data.groups || [];
      for (const group of groups) {
        if (group.name?.startsWith(prefix)) {
          const id = group._id || group.id;
          if (id) await this.deleteGroup(id);
        }
      }
    } catch { /* ignore */ }
  }
}
