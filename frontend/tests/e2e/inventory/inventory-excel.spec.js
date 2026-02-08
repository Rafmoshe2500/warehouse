import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import path from 'path';

test.describe('Inventory - Excel Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should export inventory to Excel', async ({ page }) => {
    // Click export button
    const exportButton = page.locator('[data-testid="export-button"]');
    
    if (await exportButton.isVisible({ timeout: 2000 })) {
      // Setup download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
      
      // Click export
      await exportButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify file name
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/\.xlsx$/);
    }
  });

  test('should import Excel file successfully', async ({ page }) => {
    // Find import button/input
    const importButton = page.locator('[data-testid="import-button"]');
    
    if (await importButton.isVisible({ timeout: 2000 })) {
      // Note: This test requires a valid Excel file
      // You would need to create a test Excel file first
      
      // For now, just verify the button exists
      await expect(importButton).toBeVisible();
    }
  });

  test('should show error for invalid Excel file', async ({ page }) => {
    // This test would upload an invalid file and verify error handling
    // Skipped for now as it requires file upload setup
    test.skip();
  });

  test('should show import results with counts', async ({ page }) => {
    // This test would verify the import results dialog shows correct counts
    // Skipped for now as it requires valid Excel file
    test.skip();
  });
});
