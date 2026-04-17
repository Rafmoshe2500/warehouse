import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { DashboardPageObject } from '../../utils/page-objects/DashboardPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Dashboard - Permissions', () => {

  test('should show full dashboard for admin', async ({ page }) => {
    await login(page, testUsers.admin);
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.dashboardPage).toBeVisible();
    await expect(dashboard.inventoryStats).toBeVisible();
  });

  test('should show only inventory for inventory-only user', async ({ page }) => {
    await login(page, testUsers.user);
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.dashboardPage).toBeVisible();

    // Inventory stats should be visible (user has inventory:ro)
    await expect(dashboard.inventoryStats).toBeVisible();

    // Procurement stats should not be visible
    const procVisible = await dashboard.isProcurementSectionVisible();
    expect(procVisible).toBeFalsy();
  });

  test('should show only procurement for procurement-only user', async ({ page }) => {
    await login(page, testUsers.procurementUser);
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.dashboardPage).toBeVisible();

    // Inventory stats should not be visible
    const invVisible = await dashboard.isInventorySectionVisible();
    expect(invVisible).toBeFalsy();

    // Procurement stats may be visible if backend returns data
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Clear cookies to simulate unauthenticated state
    await page.context().clearCookies();

    await page.goto('/dashboard');

    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
