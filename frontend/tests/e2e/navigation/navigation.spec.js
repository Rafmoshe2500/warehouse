import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Navigation - Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should render sidebar navigation', async ({ page }) => {
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible();
  });

  test('should navigate to all main pages via sidebar', async ({ page }) => {
    // Dashboard
    await page.click('[data-testid="sidebar-item-dashboard"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Inventory
    await page.click('[data-testid="sidebar-item-inventory"]');
    await expect(page).toHaveURL(/.*inventory/);
    
    // Admin
    await page.click('[data-testid="sidebar-item-admin"]');
    await expect(page).toHaveURL(/.*admin/);
    
    // Procurement
    const procurementItem = page.locator('[data-testid="sidebar-item-procurement"]');
    if (await procurementItem.isVisible()) {
      await procurementItem.click();
      await expect(page).toHaveURL(/.*procurement/);
    }
  });

  test('should highlight active page in sidebar', async ({ page }) => {
    await page.goto('/inventory');
    
    const inventoryItem = page.locator('[data-testid="sidebar-item-inventory"]');
    await expect(inventoryItem).toHaveClass(/active/);
  });

  test('should toggle sidebar collapse/expand', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]');
    const toggleBtn = page.locator('[data-testid="sidebar-toggle"]');
    
    // Initially expanded (on desktop)
    await expect(sidebar).toHaveClass(/sidebar--expanded/);
    
    // Collapse
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/sidebar--collapsed/);
    
    // Expand
    await toggleBtn.click();
    await expect(sidebar).toHaveClass(/sidebar--expanded/);
  });

  test('should show sub-items for pages with children', async ({ page }) => {
    // Click inventory to expand sub-items
    await page.click('[data-testid="sidebar-item-inventory"]');
    await page.waitForTimeout(300);
    
    // Verify sub-items are visible
    await expect(page.locator('[data-testid="sidebar-child-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-child-stale"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-child-catalog"]')).toBeVisible();
    await expect(page.locator('[data-testid="sidebar-child-logs"]')).toBeVisible();
  });

  test('should navigate to sub-item via sidebar', async ({ page }) => {
    await page.goto('/inventory?tab=current');
    await page.waitForTimeout(300);
    
    // Click stale sub-item
    await page.click('[data-testid="sidebar-child-stale"]');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('tab=stale');
  });

  test.skip('should restrict access based on permissions', async ({ page }) => {
    // Logout admin
    await page.click('[data-testid="user-menu-btn"]');
    await page.click('[data-testid="logout-button"]');
    
    // Login as regular user
    await login(page, testUsers.user);
    
    // Try to access admin page
    await page.goto('/admin');
    
    // Should redirect to dashboard or show access denied
    await expect(page).not.toHaveURL(/.*admin/);
  });
});
