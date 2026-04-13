import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should navigate to all main pages', async ({ page }) => {
    // Dashboard
    await page.click('a[href="/dashboard"], nav a:has-text("דשבורד")');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Inventory
    await page.click('a[href="/inventory"], nav a:has-text("מלאי")');
    await expect(page).toHaveURL(/.*inventory/);
    
    // Admin — use exact href to avoid matching "ניהול רכש" too
    await page.click('a[href="/admin"]');
    await expect(page).toHaveURL(/.*admin/);
    
    // Procurement (if user has permission)
    const procurementLink = page.locator('a[href="/procurement"]');
    if (await procurementLink.isVisible()) {
      await procurementLink.click();
      await expect(page).toHaveURL(/.*procurement/);
    }
  });

  test('should highlight active page in navigation', async ({ page }) => {
    await page.goto('/inventory');
    
    // Check that inventory link is active
    const inventoryLink = page.locator('nav a[href="/inventory"]');
    await expect(inventoryLink).toHaveClass(/active|current/);
  });

  test.skip('should restrict access based on permissions', async ({ page }) => {
    // Logout admin
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Login as regular user
    await login(page, testUsers.user);
    
    // Try to access admin page
    await page.goto('/admin');
    
    // Should redirect to dashboard or show access denied
    await expect(page).not.toHaveURL(/.*admin/);
  });
});
