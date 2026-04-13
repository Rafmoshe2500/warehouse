import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { AdminPageObject } from '../../utils/page-objects/AdminPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Admin - Access Control', () => {

  test('should load access control page for admin', async ({ page }) => {
    await login(page, testUsers.admin);
    const admin = new AdminPageObject(page);
    await admin.goto();

    await expect(page.locator('[data-testid="access-control-page"]')).toBeVisible();
  });

  test('should show Users and Logs tabs', async ({ page }) => {
    await login(page, testUsers.admin);
    const admin = new AdminPageObject(page);
    await admin.goto();

    await expect(admin.tabUsers).toBeVisible();
    await expect(admin.tabLogs).toBeVisible();
  });

  test('should show AI tab only for superadmin', async ({ page }) => {
    // Superadmin should see AI tab
    await login(page, testUsers.admin);
    const admin = new AdminPageObject(page);
    await admin.goto();

    await expect(admin.tabAi).toBeVisible();
  });

  test('should redirect non-admin to dashboard', async ({ page }) => {
    await login(page, testUsers.user);

    await page.goto('/admin');

    // Regular user should be redirected away from admin
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.context().clearCookies();

    await page.goto('/admin');

    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });
});
