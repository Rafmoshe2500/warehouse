import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Inventory - Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should select multiple items', async ({ page }) => {
    // Select first 3 items
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count >= 3) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await checkboxes.nth(2).check();
      
      // Verify they are checked
      await expect(checkboxes.nth(0)).toBeChecked();
      await expect(checkboxes.nth(1)).toBeChecked();
      await expect(checkboxes.nth(2)).toBeChecked();
    }
  });

  test('should select all items', async ({ page }) => {
    // Click select all checkbox in header
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first();
    await selectAllCheckbox.check();
    
    // Wait a moment
    await page.waitForTimeout(500);
    
    // Verify at least some checkboxes are checked
    const checkedBoxes = page.locator('tbody tr input[type="checkbox"]:checked');
    const count = await checkedBoxes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should show bulk edit button when items selected', async ({ page }) => {
    // Select first item
    await page.locator('tbody tr').first().locator('input[type="checkbox"]').check();
    
    // Verify bulk edit button is enabled and visible
    const bulkEditButton = page.locator('[data-testid="bulk-edit-button"]');
    await expect(bulkEditButton).toBeVisible();
    await expect(bulkEditButton).toBeEnabled();
  });

  test('should delete multiple items', async ({ page }) => {
    // Select first 2 items
    const checkboxes = page.locator('tbody tr input[type="checkbox"]');
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();
    
    // Click delete button
    await page.click('button:has-text("מחק"), [data-testid="delete-button"]');
    
    // Fill deletion reason
    await page.fill('textarea[name="reason"], input[name="reason"]', 'מחיקה קבוצתית - בדיקה');
    
    // Confirm
    await page.click('button:has-text("אישור"), button:has-text("מחק")');
    
    // Should show success message
    await expect(page.locator('.toast')).toBeVisible({ timeout: 3000 });
  });
});
