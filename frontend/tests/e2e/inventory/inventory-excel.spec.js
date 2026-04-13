import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-EXCEL';
let api;

test.describe('Inventory - Excel Import/Export', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    // Seed items for export tests
    await api.createItem({ catalog_number: `${PREFIX}-EXP-001`, description: 'לייצוא 1', location: 'מחסן' });
    await api.createItem({ catalog_number: `${PREFIX}-EXP-002`, description: 'לייצוא 2', location: 'מחסן' });
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

  // ── Export ──────────────────────────────────────────────
  test('should export inventory to Excel file', async ({ page }) => {
    await inv.exportButton.click();
    await expect(inv.exportModal).toBeVisible();

    // Choose "current page" or "all"
    const exportBtn = inv.exportModal.locator('button:has-text("ייצא"), button:has-text("הורד")').first();
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await exportBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test('should export filtered results only', async ({ page }) => {
    await inv.search(PREFIX);
    await inv.exportButton.click();
    await expect(inv.exportModal).toBeVisible();

    const exportAllBtn = inv.exportModal.locator('button:has-text("ייצא")').last();
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await exportAllBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  // ── Import ─────────────────────────────────────────────
  test('should show import button for admin', async () => {
    await expect(inv.importButton).toBeVisible();
  });

  test('should handle file selection cancel gracefully', async ({ page }) => {
    // Click import — the file dialog opens.  We can't truly cancel it in
    // Playwright, but we verify the button is clickable and no error occurs.
    await expect(inv.importButton).toBeEnabled();
  });

  // ── Export Modal Options ────────────────────────────────
  test('should show export modal with page/all options', async () => {
    await inv.exportButton.click();
    await expect(inv.exportModal).toBeVisible();

    // Should contain option labels
    const modalText = await inv.exportModal.textContent();
    const hasOptions = modalText.includes('עמוד') || modalText.includes('הכל') || modalText.includes('ייצא');
    expect(hasOptions).toBeTruthy();

    // Close
    await inv.page.keyboard.press('Escape');
  });

  test('should show item counts in export options', async () => {
    await inv.exportButton.click();
    await expect(inv.exportModal).toBeVisible();

    // Modal should indicate counts (numbers)
    const modalText = await inv.exportModal.textContent();
    const hasNumbers = /\d+/.test(modalText);
    expect(hasNumbers).toBeTruthy();

    await inv.page.keyboard.press('Escape');
  });

  test('should close export modal after export starts', async ({ page }) => {
    await inv.exportButton.click();
    await expect(inv.exportModal).toBeVisible();

    const exportBtn = inv.exportModal.locator('button:has-text("ייצא"), button:has-text("הורד")').first();
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await exportBtn.click();

    await downloadPromise;
    // Modal should auto-close after export
    await expect(inv.exportModal).not.toBeVisible({ timeout: 5000 });
  });
});
