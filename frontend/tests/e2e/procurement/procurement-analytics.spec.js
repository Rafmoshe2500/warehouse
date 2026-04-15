import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { procurementTestUsers } from '../../fixtures/procurement-data.js';

test.describe('Procurement Analytics Strip', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should show analytics strip at the bottom of the page', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Analytics strip should be visible for admin on the procurement page
    const analyticsStrip = page.locator('.analytics-strip');
    await expect(analyticsStrip).toBeVisible({ timeout: 10000 });
  });

  test('should display required analytic metrics', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    const analyticsStrip = page.locator('.analytics-strip');
    await expect(analyticsStrip).toBeVisible({ timeout: 10000 });

    // Check for "החודש:" label
    await expect(analyticsStrip.locator('text=החודש:')).toBeVisible();

    // Check for "ממוצע:" label
    await expect(analyticsStrip.locator('text=ממוצע:')).toBeVisible();

    // Check for "הזמנות" label
    await expect(analyticsStrip.locator('text=הזמנות')).toBeVisible();

    // Check for "Top:" label
    await expect(analyticsStrip.locator('text=Top:')).toBeVisible();
  });
});
