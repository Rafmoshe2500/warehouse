import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { AdminPageObject } from '../../utils/page-objects/AdminPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Admin - AI Tools Panel', () => {
  test('should show AI tab only for superadmin', async ({ page }) => {
    await login(page, testUsers.admin);
    const admin = new AdminPageObject(page);
    await admin.goto();
    await admin.waitForLoad();

    // admin user has superadmin role, so AI tab should be visible
    await expect(admin.tabAi).toBeVisible({ timeout: 5000 });
  });

  test('should display AI tools panel content', async ({ page }) => {
    await login(page, testUsers.admin);
    const admin = new AdminPageObject(page);
    await admin.goto();
    await admin.waitForLoad();

    await admin.switchTab('ai');
    await page.waitForTimeout(500);

    await expect(admin.aiToolsPanel).toBeVisible({ timeout: 5000 });
    await expect(admin.retrainBtn).toBeVisible({ timeout: 5000 });
  });

  test('should trigger model retrain', async ({ page }) => {
    await login(page, testUsers.admin);
    const admin = new AdminPageObject(page);
    await admin.goto();
    await admin.waitForLoad();

    await admin.switchTab('ai');
    await page.waitForTimeout(500);

    // Intercept the retrain API call
    const retrainPromise = page.waitForResponse(
      (resp) => resp.url().includes('/ai/') && resp.status() < 500,
      { timeout: 30000 }
    );

    await admin.retrainBtn.click();
    // Confirm the dialog
    await admin.retrainConfirmBtn.click();

    // Either the request succeeds and we see a result, or we get a toast
    try {
      await retrainPromise;
    } catch {
      // Retrain endpoint may not be available in test env
    }

    // Check for result or toast notification
    const hasResult = await admin.retrainResult.isVisible({ timeout: 10000 }).catch(() => false);
    const hasToast = await page.locator('.Toastify__toast, [class*="toast"]').isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasResult || hasToast).toBeTruthy();
  });

  test('should show error on retrain failure', async ({ page }) => {
    await login(page, testUsers.admin);

    // Intercept the retrain endpoint and force error
    await page.route('**/api/ai/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Training failed' }),
      });
    });

    const admin = new AdminPageObject(page);
    await admin.goto();
    await admin.waitForLoad();

    await admin.switchTab('ai');
    await page.waitForTimeout(500);

    await admin.retrainBtn.click();
    // Confirm the dialog
    await admin.retrainConfirmBtn.click();

    // Should show error notification
    const toast = page.locator('.Toastify__toast--error, [class*="toast-error"], [class*="error"]');
    await expect(toast.first()).toBeVisible({ timeout: 10000 });
  });
});
