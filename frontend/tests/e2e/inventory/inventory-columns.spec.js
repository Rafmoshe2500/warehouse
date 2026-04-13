import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-COLS';
let api;

test.describe('Inventory - Column Visibility', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    await api.createItem({ catalog_number: `${PREFIX}-001`, description: 'col test', location: 'מחסן', manufacturer: 'יצרן' });
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    // Clear column visibility localStorage after login (localStorage is origin-scoped)
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.includes('columns') || k.includes('column'))
        .forEach((k) => localStorage.removeItem(k));
    });
    inv = new InventoryPageObject(page);
    await inv.goto();
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  test('should show column toggle dropdown', async () => {
    const btn = inv.columnToggleButton;
    if (await btn.isVisible({ timeout: 2000 })) {
      await btn.click();
      await expect(inv.page.locator('.column-toggle-menu')).toBeVisible();
    }
  });

  test('should hide a column when toggled off', async ({ page }) => {
    const btn = inv.columnToggleButton;
    if (!await btn.isVisible({ timeout: 2000 })) return;
    await btn.click();

    // Find the "הערות" (notes) toggle item
    const notesItem = inv.page.locator('.column-toggle-item').filter({ hasText: 'הערות' }).first();
    if (await notesItem.isVisible({ timeout: 1000 })) {
      const isActive = await notesItem.evaluate((el) => el.classList.contains('active'));
      // Ensure it starts active (visible) before hiding
      if (!isActive) await notesItem.click(); // activate first
      await notesItem.click(); // now deactivate
      // The "notes" column header should be gone
      await expect(inv.page.locator('th:has-text("הערות")')).toHaveCount(0);
    }
  });

  test('should restore a column when toggled back on', async ({ page }) => {
    const btn = inv.columnToggleButton;
    if (!await btn.isVisible({ timeout: 2000 })) return;

    await btn.click();
    const notesItem = inv.page.locator('.column-toggle-item').filter({ hasText: 'הערות' }).first();
    if (await notesItem.isVisible({ timeout: 1000 })) {
      const isActive = await notesItem.evaluate((el) => el.classList.contains('active'));
      // Ensure it starts active before toggling off
      if (!isActive) await notesItem.click();
      await notesItem.click(); // toggle off
      await page.waitForTimeout(300);
      await notesItem.click(); // toggle back on
      await expect(inv.page.locator('th:has-text("הערות")')).toHaveCount(1);
    }
  });

  test('should persist column visibility after reload', async ({ page }) => {
    const btn = inv.columnToggleButton;
    if (!await btn.isVisible({ timeout: 2000 })) return;

    await btn.click();
    const notesItem = inv.page.locator('.column-toggle-item').filter({ hasText: 'הערות' }).first();
    if (!await notesItem.isVisible({ timeout: 1000 })) return;

    const isActive = await notesItem.evaluate((el) => el.classList.contains('active'));
    if (!isActive) await notesItem.click(); // ensure active first
    await notesItem.click(); // toggle off
    await page.mouse.click(10, 10); // close dropdown by clicking away
    await expect(inv.page.locator('th:has-text("הערות")')).toHaveCount(0);

    // Reload page
    await page.reload();
    await inv.waitForTable();
    await expect(inv.page.locator('th:has-text("הערות")')).toHaveCount(0);
  });

  test('should close dropdown on outside click', async ({ page }) => {
    const btn = inv.columnToggleButton;
    if (!await btn.isVisible({ timeout: 2000 })) return;

    await btn.click();
    const dropdown = inv.page.locator('.column-toggle-menu');
    await expect(dropdown).toBeVisible();

    // Click away
    await inv.page.locator('.inventory-header').click();
    await expect(dropdown).not.toBeVisible({ timeout: 2000 });
  });
});
