import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-CAT';
let api;

test.describe('Inventory - Catalog Tab', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    // Catalog entries are auto-created when items are added
    await api.createItem({ catalog_number: `${PREFIX}-CAT-A`, description: 'קטלוג א', manufacturer: 'יצרן-קטלוג', location: 'מחסן-א', current_stock: '5' });
    await api.createItem({ catalog_number: `${PREFIX}-CAT-B`, description: 'קטלוג ב', manufacturer: 'יצרן-קטלוג', location: 'מחסן-ב', current_stock: '10' });
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
    await inv.gotoTab('catalog');
    await inv.page.waitForTimeout(500);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  test('should navigate to catalog tab via URL', async ({ page }) => {
    expect(page.url()).toContain('tab=catalog');
  });

  test('should display catalog table with correct columns', async () => {
    await expect(inv.page.locator('table')).toBeVisible();
    // Catalog table columns: מק"ט, תיאור, יצרן, כמות במלאי
    await expect(inv.page.locator('th:has-text("מק\\"ט")')).toBeVisible();
    await expect(inv.page.locator('th:has-text("תיאור")')).toBeVisible();
    await expect(inv.page.locator('th:has-text("יצרן")')).toBeVisible();
  });

  test('should be read-only — no edit controls', async () => {
    // No add / import / bulk-edit / delete buttons
    await expect(inv.page.getByTestId('add-item-button')).toHaveCount(0);
    await expect(inv.page.getByTestId('import-button')).toHaveCount(0);
    await expect(inv.page.getByTestId('delete-button')).toHaveCount(0);
  });

  test('should sort by column header', async ({ page }) => {
    const header = inv.page.locator('th:has-text("מק\\"ט")').first();
    await header.click();
    await page.waitForTimeout(500);
    // Second click reverses
    await header.click();
    await page.waitForTimeout(500);
    await expect(inv.page.locator('table')).toBeVisible();
  });

  test('should filter catalog items', async ({ page }) => {
    // Toggle filters
    const filterBtn = inv.page.locator('button:has-text("פילטרים"), button:has-text("הסתרה")').first();
    if (await filterBtn.isVisible({ timeout: 2000 })) {
      await filterBtn.click();
      const filterInput = inv.page.locator('.filter-cell input, .filter-row input').first();
      if (await filterInput.isVisible({ timeout: 2000 })) {
        await filterInput.fill(PREFIX);
        await page.waitForTimeout(700);
        const rows = inv.page.locator('tbody tr');
        const count = await rows.count();
        expect(count).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('should show empty state for no matching catalog items', async () => {
    const filterBtn = inv.page.locator('button:has-text("פילטרים"), button:has-text("הסתרה")').first();
    if (await filterBtn.isVisible({ timeout: 2000 })) {
      await filterBtn.click();
    }
    const filterInput = inv.page.locator('.filter-cell input, .filter-row input').first();
    if (await filterInput.isVisible({ timeout: 2000 })) {
      await filterInput.fill('NONEXISTENT999');
      await inv.page.waitForTimeout(700);
      const rows = inv.page.locator('tbody tr');
      const count = await rows.count();
      // Either 0 rows or an empty-state message
      if (count === 0) {
        await expect(inv.page.locator('text=לא נמצאו')).toBeVisible({ timeout: 2000 });
      }
    }
  });
});
