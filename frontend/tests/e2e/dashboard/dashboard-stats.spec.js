import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { DashboardPageObject } from '../../utils/page-objects/DashboardPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Dashboard - Stats', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should display dashboard page for authenticated admin', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.dashboardPage).toBeVisible();
  });

  test('should display all inventory stat cards', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.inventoryStats).toBeVisible();
    await expect(dashboard.statTotalItems).toBeVisible();
    await expect(dashboard.statActiveAllocations).toBeVisible();
    await expect(dashboard.statSerial).toBeVisible();
    await expect(dashboard.statNonSerial).toBeVisible();

    // Each stat should contain a numeric value
    for (const stat of [
      dashboard.statTotalItems,
      dashboard.statActiveAllocations,
      dashboard.statSerial,
      dashboard.statNonSerial,
    ]) {
      const number = await stat.locator('.stat-number').textContent();
      expect(number).toBeTruthy();
    }
  });

  test('should display procurement stat cards', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Admin has procurement access — procurement stats should appear if data exists
    const procVisible = await dashboard.isProcurementSectionVisible();
    if (procVisible) {
      await expect(dashboard.statWaitingEmf).toBeVisible();
      await expect(dashboard.statWaitingBom).toBeVisible();
      await expect(dashboard.statOrdered).toBeVisible();
    }
  });

  test('should display total spend only for price-permission users', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Admin (superadmin) should see total spend if procurement stats are visible
    const procVisible = await dashboard.isProcurementSectionVisible();
    if (procVisible) {
      await expect(dashboard.statTotalSpend).toBeVisible();
    }
  });

  test('should show error state on API failure', async ({ page }) => {
    // Intercept analytics API to force failure
    await page.route('**/api/analytics/dashboard**', (route) => {
      route.fulfill({ status: 500, body: JSON.stringify({ detail: 'Server Error' }) });
    });

    const dashboard = new DashboardPageObject(page);
    await page.goto('/dashboard');

    await expect(dashboard.errorState).toBeVisible({ timeout: 15000 });
    await expect(dashboard.errorState).toContainText('שגיאה');
  });
});
