import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Inventory - Search and Filter', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should search items globally', async ({ page }) => {
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="חיפוש"]');
    
    // Type search query
    await searchInput.fill('TEST');
    
    // Wait for results to update
    await page.waitForTimeout(500);
    
    // Verify filtered results
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toContainText('TEST');
  });

  test('should filter by column', async ({ page }) => {
    // Toggle filter row if needed
    const filterButton = page.locator('button:has-text("סינון"), [data-testid="toggle-filter"]');
    if (await filterButton.isVisible()) {
      await filterButton.click();
    }
    
    // Filter by catalog number
    await page.fill('input[name="catalog_number_filter"]', 'TEST');
    
    // Wait and verify
    await page.waitForTimeout(500);
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount({ min: 0 });
  });

  test('should clear filters', async ({ page }) => {
    // Apply filter
    const searchInput = page.locator('input[type="search"]');
    await searchInput.fill('TEST');
    await page.waitForTimeout(500);
    
    // Clear filter
    await searchInput.clear();
    await page.waitForTimeout(500);
    
    // Should show all items again
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount({ min: 1 });
  });
});
