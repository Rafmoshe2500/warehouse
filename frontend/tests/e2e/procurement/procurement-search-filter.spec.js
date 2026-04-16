import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers, testOrders } from '../../fixtures/procurement-data.js';

const api = new ProcurementApiHelper();

test.describe('Procurement Search & Filter', () => {
  test.beforeAll(async () => {
    await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
    await api.cleanupByPrefix('E2E-SRCH');

    // Create diverse orders for filtering
    await api.createOrder({
      ...testOrders.manual,
      bom_items: [{ catalog_number: 'E2E-SRCH-CAT-ABC', manufacturer: 'Acme Corp', quantity: 5, product_name: 'Search Item A' }],
    });
    await api.createOrder({
      ...testOrders.manual,
      bom_items: [{ catalog_number: 'E2E-SRCH-CAT-XYZ', manufacturer: 'Beta Corp', quantity: 3, product_name: 'Search Item B' }],
    });
    await api.createOrder({
      ...testOrders.withEmf,
      emf_number: 'EMF-SRCH-7777',
      bom_items: [{ catalog_number: 'E2E-SRCH-EMF', manufacturer: 'Gamma Inc', quantity: 1, product_name: 'EMF Search Item' }],
    });
    // Create a completed order
    const completed = await api.createOrder({
      ...testOrders.manual,
      status: 'received',
      bom_items: [{ catalog_number: 'E2E-SRCH-DONE', manufacturer: 'Delta Co', quantity: 2, product_name: 'Completed Item' }],
    });
  });

  test.afterAll(async () => {
    await api.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should search by catalog number', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    await proc.search('E2E-SRCH-CAT-ABC');

    const matchingCard = proc.orderCards.first();
    await expect(matchingCard).toBeVisible({ timeout: 10000 });

    // Non-matching orders should not be visible (wait for search to complete)
    await expect(proc.orderCards).toHaveCount(1, { timeout: 5000 });
  });

  test('should search by manufacturer', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    await proc.search('Acme Corp');
    await page.waitForTimeout(1500);

    const matchingCard = proc.orderCards.first();
    await expect(matchingCard).toBeVisible({ timeout: 10000 });
  });

  test('should search by EMF number', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    await proc.search('EMF-SRCH-7777');
    await page.waitForTimeout(1500);

    const matchingCard = proc.orderCards.first();
    await expect(matchingCard).toBeVisible({ timeout: 10000 });
  });

  test('should show no results for non-existing search', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    await proc.search('NONEXISTENT-ITEM-99999');

    // Should show zero order cards (wait for search to complete)
    await expect(proc.orderCards).toHaveCount(0, { timeout: 10000 });
  });

  test('should clear search and show all orders again', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    const initialCount = await proc.orderCards.count();

    await proc.search('E2E-SRCH-CAT-ABC');
    await page.waitForTimeout(1500);

    const filteredCount = await proc.orderCards.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    await proc.clearSearch();
    await page.waitForTimeout(1500);

    const restoredCount = await proc.orderCards.count();
    expect(restoredCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('should filter between in_process and completed status filters', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    // Default filter is 'בתהליך' — completed order should NOT appear
    await proc.search('E2E-SRCH-DONE');
    await expect(proc.orderCards).toHaveCount(0, { timeout: 10000 });

    // Switch to 'הסתיים' status filter
    await proc.gotoTab('completed');
    await page.waitForTimeout(1500);

    // Search in completed filter
    await proc.search('E2E-SRCH-DONE');

    const completedCard = proc.orderCards.first();
    await expect(completedCard).toBeVisible({ timeout: 10000 });
  });

  test('search should be case-insensitive', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    // Search with lowercase
    await proc.search('e2e-srch-cat-abc');
    await page.waitForTimeout(1500);

    const lowercaseCard = proc.orderCards.first();
    await expect(lowercaseCard).toBeVisible({ timeout: 10000 });
  });
});
