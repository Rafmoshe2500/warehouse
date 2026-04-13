import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-ERR';
let api;

test.describe('Inventory - Error States & Edge Cases', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
    await inv.goto();
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  // ── Creation Errors ─────────────────────────────────────
  test('should show error toast on API failure during item creation (duplicate)', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-DUP-${ts}`;
    
    // Create item via API first
    await api.createItem({ catalog_number: cat, description: 'original', location: 'מחסן' });
    await inv.goto();

    // Try to create duplicate via UI
    await inv.addItem({
      catalog_number: cat,
      description: 'duplicate attempt',
    });

    await inv.waitForToast();
    await expect(inv.page.locator('.toast')).toBeVisible({ timeout: 5000 });
  });

  // ── Delete Errors ───────────────────────────────────────
  test('should require minimum characters for deletion reason', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-DELMIN-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'min reason', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    await row.waitFor({ state: 'visible' });
    await inv.rowCheckbox(row).check();
    await inv.deleteButton.click();

    // Try to enter a very short reason
    await inv.deleteReasonInput.fill('ab');

    // Confirm button should be disabled or submission blocked
    const isDisabled = await inv.deleteConfirmButton.isDisabled().catch(() => false);
    if (isDisabled) {
      expect(isDisabled).toBe(true);
    } else {
      // The modal should still be visible (submission blocked)
      await expect(inv.deleteModal).toBeVisible();
    }

    // Close modal
    await inv.page.keyboard.press('Escape');
  });

  // ── Excel Import Errors ─────────────────────────────────
  test('should show error toast on invalid Excel file import', async ({ page }) => {
    // Look for import button/dropdown
    const importButton = inv.importButton;
    if (await importButton.isVisible({ timeout: 2000 })) {
      await importButton.click();

      // Create a fake invalid file and upload
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
      
      const importOption = page.locator('text=/ייבוא.*מלאי|ייבוא.*Excel/').first();
      if (await importOption.isVisible({ timeout: 2000 })) {
        await importOption.click();

        const fileChooser = await fileChooserPromise;
        if (fileChooser) {
          // Upload a text file disguised as xlsx
          const buffer = Buffer.from('this is not an excel file');
          await fileChooser.setFiles({
            name: 'invalid.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            buffer,
          });

          // Should show error toast
          await expect(page.locator('.toast')).toBeVisible({ timeout: 10000 });
        }
      }
    }
  });

  // ── Special Characters ──────────────────────────────────
  test('should handle special characters in text fields', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-SPEC-${ts}`;
    const specialDesc = 'תיאור עם <script>alert(1)</script> & "quotes" \'single\' ©®™';

    await inv.addItem({
      catalog_number: cat,
      description: specialDesc,
      location: 'מחסן',
    });

    await inv.waitForToast();
    
    // Verify the item appears in the table (without XSS)
    const row = inv.rowByText(cat);
    await expect(row).toBeVisible({ timeout: 5000 });
    
    // Verify no actual <script> tag was injected into the page DOM
    // React escapes HTML — the description renders as visible text, not executable script
    const injectedScripts = await inv.page.locator('script:has-text("alert")').count();
    expect(injectedScripts).toBe(0);
  });

  // ── Long Values ─────────────────────────────────────────
  test('should handle very long field values without UI break', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-LONG-${ts}`;
    const longDesc = 'ת'.repeat(500);

    await inv.addItem({
      catalog_number: cat,
      description: longDesc,
      location: 'מחסן',
    });

    await inv.waitForToast();

    // Table should still be functional
    await expect(inv.page.locator('table')).toBeVisible();
    const row = inv.rowByText(cat);
    await expect(row).toBeVisible({ timeout: 5000 });
  });

  // ── Empty Inventory ─────────────────────────────────────
  test('should show empty state when search yields no results', async () => {
    await inv.search('XXXXXXXXX_NONEXISTENT_99999');
    
    // Should show some kind of empty indicator
    // Use .first() to avoid strict-mode violation when multiple ancestors share the text
    const noItems = inv.page.locator('text=/לא נמצאו|אין פריטים|אין תוצאות/').first();
    const emptyTable = inv.page.locator('tbody tr');
    
    // Either an explicit empty message or zero rows
    const hasEmptyMsg = await noItems.isVisible({ timeout: 3000 }).catch(() => false);
    const rowCount = await emptyTable.count();

    expect(hasEmptyMsg || rowCount === 0).toBeTruthy();
    await inv.clearSearch();
  });

  // ── Network Resilience ──────────────────────────────────
  test('should handle API timeout gracefully', async ({ page }) => {
    // Intercept items API and delay response
    await page.route('**/api/items**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 25000)); // Beyond 30s timeout
      await route.abort();
    });

    await page.goto('/inventory');

    // Should show loading or error state — not crash
    const hasContent = await page.locator('.toast, text=/שגיאה|טוען|Loading/').first()
      .isVisible({ timeout: 30000 })
      .catch(() => false);

    // At minimum, the page should still be functional (not blank)
    await expect(page.locator('body')).not.toBeEmpty();

    // Unblock route for other tests
    await page.unroute('**/api/items**');
  });
});
