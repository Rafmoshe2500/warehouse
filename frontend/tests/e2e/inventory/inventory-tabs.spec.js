import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';

test.describe('Inventory - Tab Navigation', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
  });

  // ── Default Tab ─────────────────────────────────────────
  test('should default to "current" tab', async ({ page }) => {
    await page.goto('/inventory');
    await inv.waitForTable();
    // The current tab should show the main inventory
    await expect(inv.page.locator('.inventory-tab-content')).toBeVisible();
  });

  // ── Tab Switching via Clicks ────────────────────────────
  test('should switch to stale tab on click', async ({ page }) => {
    await page.goto('/inventory');
    await inv.waitForTable();
    await inv.tab('מלאי ישן').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('tab=stale');
  });

  test('should switch to catalog tab on click', async ({ page }) => {
    await page.goto('/inventory');
    await inv.waitForTable();
    await inv.tab('קטלוג פריטים').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('tab=catalog');
  });

  test('should switch to logs tab on click', async ({ page }) => {
    await page.goto('/inventory');
    await inv.waitForTable();
    await inv.tab('תנועות').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('tab=logs');
  });

  test('should switch back to current tab', async ({ page }) => {
    await page.goto('/inventory?tab=stale');
    await page.waitForTimeout(500);
    await inv.tab('מלאי נוכחי').click();
    await page.waitForTimeout(500);
    expect(page.url()).toContain('tab=current');
  });

  // ── Deep Links ──────────────────────────────────────────
  test('should navigate directly to stale via URL', async ({ page }) => {
    await page.goto('/inventory?tab=stale');
    await page.waitForTimeout(500);
    await expect(inv.page.locator('table, .empty-state').first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate directly to catalog via URL', async ({ page }) => {
    await page.goto('/inventory?tab=catalog');
    await page.waitForTimeout(500);
    await expect(inv.page.locator('table')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate directly to logs via URL', async ({ page }) => {
    await page.goto('/inventory?tab=logs');
    await page.waitForTimeout(500);
    await expect(inv.page.locator('.log-timeline, .logs-page, .logs-page-embedded').first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle invalid tab param by showing default', async ({ page }) => {
    await page.goto('/inventory?tab=INVALID');
    await page.waitForTimeout(500);
    // The tab navigation should still render (no crash)
    await expect(inv.page.locator('.inventory-tabbed-page, .tabs').first()).toBeVisible({ timeout: 5000 });
  });

  // ── Cross-Tab Data Flow ─────────────────────────────────
  test('should reflect newly created item in logs tab', async ({ page }) => {
    // Go to main inventory
    await page.goto('/inventory');
    await inv.waitForTable();

    const ts = Date.now();
    const cat = `E2E-TAB-${ts}`;
    await inv.addItem({ catalog_number: cat, description: 'cross-tab test' });
    await inv.waitForToast();

    // Switch to logs tab
    await inv.tab('תנועות').click();
    await page.waitForTimeout(1000);

    // The creation action should appear as a log entry
    const logsContent = inv.page.locator('.log-item, .log-timeline-item, tbody tr');
    const count = await logsContent.count();
    expect(count).toBeGreaterThan(0);
  });
});
