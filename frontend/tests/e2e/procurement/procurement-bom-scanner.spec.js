import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { procurementTestUsers } from '../../fixtures/procurement-data.js';

test.describe('Procurement BOM Scanner Tab', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should navigate to BOM scanner tab', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    await proc.gotoTab('bom-netapp');
    await page.waitForTimeout(1000);

    // Scanner tab should show vendor selection phase
    const scannerArea = page.locator('.bom-scanner-tab');
    await expect(scannerArea).toBeVisible({ timeout: 5000 });
  });

  test('should display vendor selection options', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('bom-netapp');
    await page.waitForTimeout(1000);

    // Should show vendor cards
    const vendors = page.locator('.bst-vendor-card');
    const count = await vendors.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show file upload zone after vendor selection', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('bom-netapp');
    await page.waitForTimeout(1000);

    // Click on a vendor
    const vendorBtn = page.locator('.bst-vendor-card').first();
    if (await vendorBtn.isVisible()) {
      await vendorBtn.click();
      await page.waitForTimeout(500);

      // Upload dropzone should appear
      const uploadZone = page.locator('.bst-dropzone');
      await expect(uploadZone).toBeVisible({ timeout: 5000 });
    }
  });

  test('should return to vendor selection when back is clicked', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.gotoTab('bom-netapp');
    await page.waitForTimeout(1000);

    // Click vendor to move to upload phase
    const vendorBtn = page.locator('.bst-vendor-card').first();
    if (await vendorBtn.isVisible()) {
      await vendorBtn.click();
      await page.waitForTimeout(500);

      // Click back breadcrumb
      const backBtn = page.locator('.bst-breadcrumb').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(500);

        // Should return to vendor selection
        await expect(vendorBtn).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
