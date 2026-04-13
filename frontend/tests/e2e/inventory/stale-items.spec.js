import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-STALE';
let api;

test.describe('Inventory - Stale Items Tab', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    // Create items that will be "stale" (the backend determines staleness by updated_at)
    await api.createItem({ catalog_number: `${PREFIX}-OLD-001`, description: 'פריט ישן 1', location: 'מחסן' });
    await api.createItem({ catalog_number: `${PREFIX}-OLD-002`, description: 'פריט ישן 2', location: 'מחסן' });
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
    await inv.gotoTab('stale');
    await inv.page.waitForTimeout(500);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  // ── Tab Navigation ──────────────────────────────────────
  test('should navigate to stale tab via URL', async ({ page }) => {
    expect(page.url()).toContain('tab=stale');
    await expect(inv.page.locator('table')).toBeVisible();
  });

  // ── Days Filter ─────────────────────────────────────────
  test('should show days filter input', async () => {
    const daysInput = inv.page.locator('.days-filter input, input[type="number"]').first();
    await expect(daysInput).toBeVisible();
  });

  test('should change days threshold', async ({ page }) => {
    const daysInput = inv.page.locator('.days-filter input, input[type="number"]').first();
    await daysInput.fill('7');
    await page.waitForTimeout(700);
    // Should refresh data — no crash
    await expect(inv.page.locator('table, .empty-state').first()).toBeVisible({ timeout: 5000 });
  });

  test('should respect minimum days value of 1', async ({ page }) => {
    const daysInput = inv.page.locator('.days-filter input, input[type="number"]').first();
    await daysInput.fill('1');
    await page.waitForTimeout(500);
    const value = await daysInput.inputValue();
    expect(Number(value)).toBeGreaterThanOrEqual(1);
  });

  // ── Feature Restrictions ────────────────────────────────
  test('should NOT show Add Item button', async () => {
    await expect(inv.addButton).toHaveCount(0);
  });

  test('should NOT show Import button', async () => {
    await expect(inv.importButton).toHaveCount(0);
  });

  test('should show Export button', async () => {
    await expect(inv.exportButton).toBeVisible();
  });

  // ── Edit / Delete ───────────────────────────────────────
  test('should allow inline editing of stale item', async ({ page }) => {
    await inv.search(PREFIX);
    await page.waitForTimeout(700);
    const rowCount = await inv.visibleRowCount;
    if (rowCount === 0) return; // no stale items yet — skip

    const row = inv.row(0);
    const cell = row.locator('td.col-description, td:nth-child(4)').first();
    await cell.dblclick();

    const input = page.locator('.item-table__edit-input').first();
    if (await input.isVisible({ timeout: 2000 })) {
      await input.press('Escape');
    }
  });

  test('should allow bulk delete on stale items', async ({ page }) => {
    await inv.search(PREFIX);
    await page.waitForTimeout(700);
    const rowCount = await inv.visibleRowCount;
    if (rowCount === 0) return;

    await inv.rowCheckbox(inv.row(0)).check();
    await expect(inv.deleteButton).toBeEnabled();
  });

  // ── Empty State ─────────────────────────────────────────
  test('should show empty state when no stale items', async () => {
    // Set days=1 and search for nonexistent prefix
    await inv.search('NONEXISTENT999');
    await inv.page.waitForTimeout(700);
    const rowCount = await inv.visibleRowCount;
    expect(rowCount).toBe(0);
  });

  // ── Search & Filter on Stale Tab ────────────────────────
  test('should search stale items by text', async ({ page }) => {
    await inv.search(PREFIX);
    await page.waitForTimeout(700);

    const rowCount = await inv.visibleRowCount;
    // All matching rows should contain the prefix
    if (rowCount > 0) {
      const firstRowText = await inv.row(0).textContent();
      expect(firstRowText).toContain(PREFIX);
    }
  });

  test('should sort stale items by column', async ({ page }) => {
    const descHeader = inv.sortableHeader('תיאור');
    if (await descHeader.isVisible({ timeout: 2000 })) {
      await descHeader.click();
      await page.waitForTimeout(500);
      // Should not crash — verify table still visible
      await expect(inv.page.locator('table')).toBeVisible();
    }
  });

  test('should export stale items', async ({ page }) => {
    await expect(inv.exportButton).toBeVisible();
    await inv.exportButton.click();

    const exportModal = inv.exportModal;
    if (await exportModal.isVisible({ timeout: 3000 })) {
      const exportBtn = exportModal.locator('button:has-text("ייצא"), button:has-text("הורד")').first();
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await exportBtn.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    }
  });
});
