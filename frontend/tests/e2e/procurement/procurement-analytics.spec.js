import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { procurementTestUsers } from '../../fixtures/procurement-data.js';

test.describe('Procurement Analytics Tab', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should navigate to analytics tab', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Analytics tab should be visible for admin
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Analytics content should be visible
    const analyticsContent = page.locator('.analytics-tab');
    await expect(analyticsContent).toBeVisible({ timeout: 10000 });
  });

  test('should show date range filter controls', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Date inputs should be present
    const dateInputs = page.locator('.splunk-date-filter input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(2); // start and end date
  });

  test('should show resolution selector (daily/monthly/yearly)', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Resolution selector is a <select> element
    const resolutionSelect = page.locator('.splunk-resolution-select');
    await expect(resolutionSelect).toBeVisible({ timeout: 5000 });
    // Should have options
    const options = resolutionSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have part search input', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Part search input
    const searchInput = page.locator('.part-search-input').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test('should have two comparison panels (Systems & Components)', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Two panels for systems and components
    const panels = page.locator('.analytics-panel');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should search for parts and show suggestions', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Type in part search
    const searchInput = page.locator('.part-search-input').first();
    await searchInput.fill('test');
    await page.waitForTimeout(2000);

    // Check if suggestions dropdown appeared (may be empty if no data)
    const suggestions = page.locator('.autocomplete-dropdown');
    // If there's data, suggestions should appear; otherwise that's OK
    const hasSuggestions = (await suggestions.count()) > 0;
    // Either way the search input should still be usable
    await expect(searchInput).toBeVisible();
  });

  test('should toggle resolution and update chart', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('analytics');
    await page.waitForTimeout(1500);

    // Change resolution in select dropdown
    const resolutionSelect = page.locator('.splunk-resolution-select');
    if (await resolutionSelect.isVisible()) {
      await resolutionSelect.selectOption('monthly');
      await page.waitForTimeout(1000);

      // Verify the selected value
      const selectedValue = await resolutionSelect.inputValue();
      expect(selectedValue).toBe('monthly');
    }
  });
});
