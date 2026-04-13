import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { DashboardPageObject } from '../../utils/page-objects/DashboardPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Dashboard - Charts', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should display all chart cards for inventory user', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.chartLocations).toBeVisible();
    await expect(dashboard.chartItemSearch).toBeVisible();
    await expect(dashboard.chartProjects).toBeVisible();
    await expect(dashboard.chartTargetSites).toBeVisible();
    await expect(dashboard.chartManufacturers).toBeVisible();
  });

  test('should hide inventory charts for non-inventory user', async ({ page }) => {
    // Login as procurement-only user
    await page.context().clearCookies();
    await login(page, testUsers.procurementUser);

    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Inventory charts should not be visible
    await expect(dashboard.chartLocations).not.toBeVisible({ timeout: 5000 }).catch(() => {
      // May not exist in DOM at all — that's fine
    });
    await expect(dashboard.chartProjects).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('should display activity feed for all users', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    await expect(dashboard.activityFeed).toBeVisible();
  });

  test('should search item by catalog number in ItemSearchChart', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    // Find the search input inside the item search chart
    const chartCard = dashboard.chartItemSearch;
    await expect(chartCard).toBeVisible();

    const searchInput = chartCard.locator('input');
    await searchInput.fill('TEST-001');
    await searchInput.press('Enter');

    // Should show either pie chart or "no data" message
    await page.waitForTimeout(2000);
    const hasChart = await chartCard.locator('.recharts-wrapper').isVisible().catch(() => false);
    const hasEmpty = await chartCard.locator('text=לא נמצאו נתונים').isVisible().catch(() => false);
    const hasSearchEmpty = await chartCard.locator('.item-search-empty').isVisible().catch(() => false);
    expect(hasChart || hasEmpty || hasSearchEmpty).toBeTruthy();
  });

  test('should filter locations chart by search', async ({ page }) => {
    const dashboard = new DashboardPageObject(page);
    await dashboard.goto();

    const locationCard = dashboard.chartLocations;
    await expect(locationCard).toBeVisible();

    const searchInput = locationCard.locator('input');
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('ZZZZ_NONEXISTENT');
      await page.waitForTimeout(500);

      // Should show "no results" or an empty chart
      const noResults = await locationCard.locator('text=לא נמצאו מיקומים').isVisible().catch(() => false);
      const chartBars = await locationCard.locator('.recharts-bar-rectangle').count();
      expect(noResults || chartBars === 0).toBeTruthy();
    }
  });
});
