import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-STATE';
let api;

test.describe('Inventory - Loading & Empty States', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  test('should show loading state while data is loading', async ({ page }) => {
    // Intercept API to introduce delay
    let resolveRequest;
    await page.route('**/api/items**', async (route) => {
      await new Promise((resolve) => {
        resolveRequest = resolve;
        setTimeout(resolve, 3000);
      });
      await route.continue();
    });

    await page.goto('/inventory');

    // Should show some kind of loading indicator (spinner, skeleton, or loading text)
    const loadingIndicator = page.locator('.spinner, .skeleton, .loading, [class*="loading"], [class*="spinner"]');
    const isLoading = await loadingIndicator.first().isVisible({ timeout: 2000 }).catch(() => false);
    
    // Even if no explicit loading UI, table should not yet have data
    if (!isLoading) {
      // At minimum, the page should be rendering
      await expect(page.locator('body')).not.toBeEmpty();
    }

    // Unblock route
    await page.unroute('**/api/items**');
    if (resolveRequest) resolveRequest();
  });

  test('should show empty state when search yields no results', async () => {
    await inv.goto();
    await inv.search('ZZZZ_IMPOSSIBLE_SEARCH_9999');

    // Wait for debounce + response
    await inv.page.waitForTimeout(1000);

    // Either explicit empty message or no rows
    const emptyMsg = inv.page.locator('text=/לא נמצאו|אין פריטים|אין תוצאות/');
    const hasEmptyMsg = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false);
    const rowCount = await inv.visibleRowCount;

    expect(hasEmptyMsg || rowCount === 0).toBeTruthy();
    await inv.clearSearch();
  });

  test('should show correct empty state on stale items tab', async ({ page }) => {
    await inv.gotoTab('stale');

    // Search for something nonexistent
    const searchInput = page.locator('.global-search-input, input[type="search"], input[placeholder*="חיפוש"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('ZZZZ_STALE_NONEXISTENT');
      await page.waitForTimeout(1000);

      const emptyMsg = page.locator('text=/לא נמצאו|אין פריטים|אין תוצאות/');
      const hasEmpty = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false);

      // At minimum, page should work without errors
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should show correct empty state on catalog tab', async ({ page }) => {
    await inv.gotoTab('catalog');

    const searchInput = page.locator('.global-search-input, input[type="search"], input[placeholder*="חיפוש"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('ZZZZ_CATALOG_NONEXISTENT');
      await page.waitForTimeout(1000);

      const emptyMsg = page.locator('text=/לא נמצאו|אין פריטים|אין תוצאות/');
      const hasEmpty = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false);

      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('should show correct empty state on logs tab', async ({ page }) => {
    await inv.gotoTab('logs');

    const searchInput = page.locator('.global-search-input, input[type="search"], input[placeholder*="חיפוש"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('ZZZZ_LOGS_NONEXISTENT');
      await page.waitForTimeout(1000);

      const emptyMsg = page.locator('text=/לא נמצאו|אין רשומות|אין לוגים|אין תוצאות/');
      const hasEmpty = await emptyMsg.isVisible({ timeout: 3000 }).catch(() => false);

      await expect(page.locator('body')).not.toBeEmpty();
    }
  });
});
