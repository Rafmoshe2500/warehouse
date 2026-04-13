import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-PERM';
let api;

test.describe('Inventory - Permissions', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    // Ensure test users exist (creates them if not, silently ignores if they do)
    await api.createTestUser({ username: 'm123ro', password: 'password', permissions: ['inventory:ro'] });
    await api.createTestUser({ username: 'm123rw', password: 'password', permissions: ['inventory:rw'] });
    await api.cleanupByPrefix(PREFIX);
    await api.createItem({ catalog_number: `${PREFIX}-001`, description: 'הרשאות', location: 'מחסן' });
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  // ── Read-Only User ──────────────────────────────────────
  test.describe('Read-Only user (inventory:ro)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.user); // m123ro
      inv = new InventoryPageObject(page);
      await inv.goto();
    });

    test('should see the inventory table', async () => {
      await expect(inv.page.locator('table')).toBeVisible();
    });

    test('should see search input', async () => {
      await expect(inv.searchInput).toBeVisible();
    });

    test('should see export button', async () => {
      await expect(inv.exportButton).toBeVisible();
    });

    test('should NOT see add item button', async () => {
      await expect(inv.addButton).toHaveCount(0);
    });

    test('should NOT see import button', async () => {
      await expect(inv.importButton).toHaveCount(0);
    });

    test('should NOT see bulk edit button', async () => {
      await expect(inv.bulkEditButton).toHaveCount(0);
    });

    test('should NOT see delete button', async () => {
      await expect(inv.deleteButton).toHaveCount(0);
    });

    test('should NOT allow inline cell edit', async ({ page }) => {
      await inv.search(PREFIX);
      const row = inv.row(0);
      const cell = row.locator('td.col-description, td:nth-child(4)').first();
      await cell.dblclick();

      // No input should appear for RO user
      const input = page.locator('.item-table__edit-input');
      const inputCount = await input.count();
      expect(inputCount).toBe(0);
    });
  });

  // ── Read-Write User ─────────────────────────────────────
  test.describe('Read-Write user (inventory:rw)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.inventoryManager); // m123rw
      inv = new InventoryPageObject(page);
      await inv.goto();
    });

    test('should see all action buttons', async () => {
      await expect(inv.addButton).toBeVisible();
      await expect(inv.importButton).toBeVisible();
      await expect(inv.exportButton).toBeVisible();
      await expect(inv.bulkEditButton).toBeVisible();
      await expect(inv.deleteButton).toBeVisible();
    });

    test('should allow inline cell edit', async ({ page }) => {
      await inv.search(PREFIX);
      const row = inv.row(0);
      const cell = row.locator('td.col-description, td:nth-child(4)').first();
      await cell.dblclick();

      const input = page.locator('.item-table__edit-input').first();
      await expect(input).toBeVisible({ timeout: 2000 });
      await page.keyboard.press('Escape');
    });
  });
});
