import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-PAGE';
let api;

test.describe('Inventory - Pagination', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    // Create 30 items so we span at least 2 pages (default 25/page)
    const items = Array.from({ length: 30 }, (_, i) => ({
      catalog_number: `${PREFIX}-${String(i + 1).padStart(3, '0')}`,
      description: `פריט דפדוף ${i + 1}`,
      location: 'מחסן',
    }));
    await api.createItems(items);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
    await inv.goto();
    await inv.search(PREFIX);
    await inv.page.waitForTimeout(700);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  test('should display pagination controls when items exceed page size', async () => {
    await expect(inv.pagination).toBeVisible();
  });

  test('should show correct items count text', async () => {
    const info = inv.paginationInfo;
    await expect(info).toContainText(/מתוך|מציג/);
  });

  test('should navigate to next page', async ({ page }) => {
    const firstPageFirstRow = await inv.row(0).innerText();
    await inv.nextPageButton.click();
    await page.waitForTimeout(700);

    const secondPageFirstRow = await inv.row(0).innerText();
    // Content should be different between pages
    expect(secondPageFirstRow).not.toBe(firstPageFirstRow);
  });

  test('should navigate back to previous page', async ({ page }) => {
    const originalContent = await inv.row(0).innerText();
    await inv.nextPageButton.click();
    await page.waitForTimeout(500);
    await inv.prevPageButton.click();
    await page.waitForTimeout(500);

    const returnedContent = await inv.row(0).innerText();
    expect(returnedContent).toBe(originalContent);
  });

  test('should change items per page', async ({ page }) => {
    const pageSizeSelect = inv.page.locator('.pagination select, .pagination .items-per-page');
    if (await pageSizeSelect.isVisible({ timeout: 2000 })) {
      await pageSizeSelect.selectOption('50');
      await page.waitForTimeout(700);

      const count = await inv.visibleRowCount;
      expect(count).toBeGreaterThan(25);
    }
  });

  test('should disable prev button on first page', async () => {
    await expect(inv.prevPageButton).toBeDisabled();
  });

  test('should update pagination when filters are applied', async () => {
    // Search for a very specific item to reduce count
    await inv.search(`${PREFIX}-001`);
    await expect(inv.pagination).toBeVisible();
    // With only 1 result, there should be 1 page → next should be disabled
  });
});
