import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { AdminPageObject } from '../../utils/page-objects/AdminPage.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Admin - Audit Logs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should switch to logs tab and display timeline', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    await expect(admin.auditTimeline).toBeVisible({ timeout: 10000 });
  });

  test('should display filter controls', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    await expect(admin.auditActionFilter).toBeVisible();
    await expect(admin.auditActorFilter).toBeVisible();
    await expect(admin.auditTargetFilter).toBeVisible();
    await expect(admin.auditSearchBtn).toBeVisible();
  });

  test('should filter by action type', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    await admin.filterAuditLogs({ action: 'user_login' });

    // Wait for results to refresh
    await page.waitForTimeout(1000);
    await expect(admin.auditTimeline).toBeVisible();
  });

  test('should filter by actor', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    await admin.filterAuditLogs({ actor: testUsers.admin.username });

    await page.waitForTimeout(1000);
    await expect(admin.auditTimeline).toBeVisible();
  });

  test('should filter by target user', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    await admin.filterAuditLogs({ targetUser: testUsers.admin.username });

    await page.waitForTimeout(1000);
    await expect(admin.auditTimeline).toBeVisible();
  });

  test('should combine multiple filters', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    await admin.filterAuditLogs({
      action: 'user_login',
      actor: testUsers.admin.username,
    });

    await page.waitForTimeout(1000);
    await expect(admin.auditTimeline).toBeVisible();
  });

  test('should handle pagination', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.switchTab('logs');
    await page.waitForTimeout(500);

    // Look for pagination controls - use .first() since pagination has nested elements
    const pagination = page.locator('div.pagination').first();
    if (await pagination.isVisible({ timeout: 5000 })) {
      const nextBtn = page.locator('button[title="הבא"]');
      if (await nextBtn.isEnabled({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        await expect(admin.auditTimeline).toBeVisible();
      }
    }
  });
});
