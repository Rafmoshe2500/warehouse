import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Inventory - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin user
    await login(page, testUsers.admin);
    
    // Navigate to inventory page
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should display inventory table', async ({ page }) => {
    // Check that table is visible
    await expect(page.locator('table')).toBeVisible();
    
    // Check for table headers
    await expect(page.locator('th')).toContainText(/מק"ט|תאור|יצרן/);
  });

  test('should add new item', async ({ page }) => {
    const timestamp = Date.now();
    const uniqueCatalog = `TEST-ADD-${timestamp}`;
    
    // Click add button
    await page.click('[data-testid="add-item-button"]');
    
    // Fill in item details
    await page.fill('[data-testid="new-item-catalog_number"]', uniqueCatalog);
    await page.fill('[data-testid="new-item-description"]', 'פריט חדש לבדיקה');
    await page.fill('[data-testid="new-item-manufacturer"]', 'יצרן בדיקה');
    await page.fill('[data-testid="new-item-location"]', 'מחסן בדיקה');
    await page.fill('[data-testid="new-item-current_stock"]', '10');
    
    // Save
    await page.click('[data-testid="save-new-item-button"]');
    
    // Wait for success message
    await expect(page.locator('.toast, .success-message')).toContainText(/נוסף|הצלחה/);
    
    // Verify item appears in table
    await expect(page.locator('table')).toContainText(uniqueCatalog);
  });

  test('should edit existing item', async ({ page }) => {
    // Create a unique item to edit
    const timestamp = Date.now();
    const uniqueCatalog = `TEST-EDIT-${timestamp}`;
    
    // Add item first
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="new-item-catalog_number"]', uniqueCatalog);
    await page.fill('[data-testid="new-item-description"]', 'תיאור מקורי');
    await page.click('[data-testid="save-new-item-button"]');
    await expect(page.locator('.toast')).toContainText(/נוסף|הצלחה/);
    
    // Find the row with our item
    const row = page.locator('tbody tr', { hasText: uniqueCatalog });
    
    // Double-click on description cell (2nd column usually, but let's be safe)
    // Assuming description is the 3rd column (index 2) - freezing cols might affect index
    // Best to click a cell we know is editable. Description is good.
    await row.locator('td').nth(2).dblclick();
    
    // Edit the value
    const input = page.locator('input[type="text"]:visible').first();
    await input.fill('תאור מעודכן');
    
    // Press Enter
    await input.press('Enter');
    
    // Wait for success message
    await expect(page.locator('.toast')).toContainText(/עודכן|הצלחה/);
    
    // Verify changes persisted
    await expect(row).toContainText('תאור מעודכן');
  });

  test('should delete item', async ({ page }) => {
    // Create unique item to delete
    const timestamp = Date.now();
    const uniqueCatalog = `TEST-DEL-${timestamp}`;
    
    // Add item first
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="new-item-catalog_number"]', uniqueCatalog);
    await page.click('[data-testid="save-new-item-button"]');
    await expect(page.locator('.toast')).toContainText(/נוסף|הצלחה/);
    
    // Find row
    const row = page.locator('tbody tr', { hasText: uniqueCatalog });
    
    // Check the box
    await row.locator('input[type="checkbox"]').check();
    
    // Click delete button
    await page.click('[data-testid="delete-button"]');
    
    // Confirm deletion in modal
    await page.fill('textarea[name="reason"], input[name="reason"]', 'בדיקה אוטומטית');
    await page.click('button:has-text("אישור"), button:has-text("מחק")');
    
    // Wait for success message
    await expect(page.locator('.toast')).toContainText(/נמחק|הצלחה/);
    
    // Verify item is gone
    await expect(page.locator('tbody')).not.toContainText(uniqueCatalog);
  });

  test('should support undo/redo', async ({ page }) => {
    // Create unique item
    const timestamp = Date.now();
    const uniqueCatalog = `TEST-UNDO-${timestamp}`;
    
    // Add item
    await page.click('[data-testid="add-item-button"]');
    await page.fill('[data-testid="new-item-catalog_number"]', uniqueCatalog);
    await page.fill('[data-testid="new-item-description"]', 'תיאור מקורי');
    await page.click('[data-testid="save-new-item-button"]');
    await expect(page.locator('.toast')).toContainText(/נוסף|הצלחה/);
    
    // Edit
    const row = page.locator('tbody tr', { hasText: uniqueCatalog });
    await row.locator('td').nth(2).dblclick();
    await page.locator('input:visible').first().fill('שינוי זמני');
    await page.keyboard.press('Enter');
    await expect(row).toContainText('שינוי זמני');
    
    // Undo with Ctrl+Z
    await page.keyboard.press('Control+Z');
    
    // Verify original text is back
    await expect(row).toContainText('תיאור מקורי');
  });
});
