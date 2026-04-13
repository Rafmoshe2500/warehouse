import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { DashboardPageObject } from '../../utils/page-objects/DashboardPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Dashboard - Date Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should show date filter controls', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.dateFilter).toBeVisible();
    await expect(dashboard.dateStart).toBeVisible();
    await expect(dashboard.dateEnd).toBeVisible();
    await expect(dashboard.dateReset).toBeVisible();
  });

  test('should filter data by date range', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Listen for analytics API call with date params
    const apiPromise = page.waitForResponse(
      (resp) => resp.url().includes('/api/analytics/dashboard') && resp.url().includes('start_date'),
      { timeout: 10000 }
    );

    await dashboard.setDateRange('2025-01-01', '2025-12-31');

    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  test('should clear date filter', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Set dates first
    await dashboard.setDateRange('2025-01-01', '2025-12-31');
    await page.waitForTimeout(500);

    // Clear by clicking reset
    await dashboard.clearDateRange();

    // Verify inputs are cleared
    await expect(dashboard.dateStart).toHaveValue('');
    await expect(dashboard.dateEnd).toHaveValue('');
  });

  test('should not allow end date before start date', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Set start date
    await dashboard.dateStart.fill('2025-06-15');
    await page.waitForTimeout(300);

    // End date should have min attribute set to the start date
    const minValue = await dashboard.dateEnd.getAttribute('min');
    expect(minValue).toBe('2025-06-15');
  });
});
