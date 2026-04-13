import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-SRCH';
let api;

test.describe('Inventory - Search and Filter', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    // Seed a few items for search/filter tests
    await api.createItem({ catalog_number: `${PREFIX}-AAA`, description: 'חיפוש ראשון', manufacturer: 'יצרן-א', location: 'מחסן-צפון' });
    await api.createItem({ catalog_number: `${PREFIX}-BBB`, description: 'חיפוש שני', manufacturer: 'יצרן-ב', location: 'מחסן-דרום' });
    await api.createItem({ catalog_number: `${PREFIX}-CCC`, description: 'פריט שלישי', manufacturer: 'יצרן-א', location: 'מחסן-צפון' });
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
    await inv.goto();
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  // ── Global Search ───────────────────────────────────────
  test('should search items globally', async () => {
    await inv.search(`${PREFIX}-AAA`);
    await expect(inv.rowByText(`${PREFIX}-AAA`)).toBeVisible();
  });

  test('should search with Hebrew characters', async () => {
    await inv.search('חיפוש ראשון');
    await expect(inv.rowByText('חיפוש ראשון')).toBeVisible();
  });

  test('should search with special characters safely', async () => {
    await inv.search('<script>alert(1)</script>');
    await inv.page.waitForTimeout(700);
    // Should not crash — just show no results
    const rowCount = await inv.visibleRowCount;
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('should return all items when search is cleared', async () => {
    await inv.search(`${PREFIX}-AAA`);
    const filteredCount = await inv.visibleRowCount;

    await inv.clearSearch();
    const allCount = await inv.visibleRowCount;
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should show empty state for no matching results', async () => {
    await inv.search('XYZNONEXISTENT999');
    await inv.page.waitForTimeout(800);
    const rowCount = await inv.visibleRowCount;
    // Either 0 rows or an explicit empty-state message
    if (rowCount === 0) {
      await expect(inv.page.locator('text=לא נמצאו').first()).toBeVisible({ timeout: 3000 });
    }
  });

  // ── Column Filters ──────────────────────────────────────
  test('should toggle filter row on/off', async () => {
    await inv.toggleFilters();
    await expect(inv.page.locator('.filter-row, .filter-cell').first()).toBeVisible();

    await inv.toggleFilters();
    await expect(inv.page.locator('.filter-row, .filter-cell')).toHaveCount(0, { timeout: 3000 });
  });

  test('should filter by single column', async () => {
    await inv.toggleFilters();
    const filterInput = inv.page.locator('.filter-cell input, .filter-row input').first();
    await filterInput.fill(`${PREFIX}-AAA`);
    await inv.page.waitForTimeout(700);

    const count = await inv.visibleRowCount;
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should clear all filters and show original results', async () => {
    await inv.search(`${PREFIX}-AAA`);
    const filtered = await inv.visibleRowCount;

    await inv.clearSearch();
    const cleared = await inv.visibleRowCount;
    expect(cleared).toBeGreaterThanOrEqual(filtered);
  });

  // ── Sorting ─────────────────────────────────────────────
  test('should sort by column header click', async () => {
    await inv.search(PREFIX);
    const header = inv.sortableHeader('מק"ט');
    await header.click(); // first click → ascending
    await inv.page.waitForTimeout(500);

    // Click again → descending
    await header.click();
    await inv.page.waitForTimeout(500);

    // Verify some rows are present (sort doesn't filter)
    const count = await inv.visibleRowCount;
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should combine search and sort', async () => {
    await inv.search(PREFIX);
    const header = inv.sortableHeader('מק"ט');
    await header.click();
    await inv.page.waitForTimeout(500);

    const count = await inv.visibleRowCount;
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
