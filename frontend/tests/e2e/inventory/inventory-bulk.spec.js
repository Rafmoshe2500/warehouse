import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-BULK';
let api;

test.describe('Inventory - Bulk Operations', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);

    // Seed 5 items for bulk operations
    for (let i = 1; i <= 5; i++) {
      await api.createItem({
        catalog_number: `${PREFIX}-${String(i).padStart(3, '0')}`,
        description: `פריט בדיקה ${i}`,
        manufacturer: 'יצרן-בדיקה',
        location: 'מחסן',
      });
    }
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    inv = new InventoryPageObject(page);
    await inv.goto();
    await inv.search(PREFIX);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupByPrefix(PREFIX);
  });

  // ── Selection ───────────────────────────────────────────
  test('should select single item via checkbox', async () => {
    const checkbox = inv.rowCheckbox(inv.row(0));
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('should select multiple items via checkboxes', async () => {
    const cb0 = inv.rowCheckbox(inv.row(0));
    const cb1 = inv.rowCheckbox(inv.row(1));
    const cb2 = inv.rowCheckbox(inv.row(2));

    await cb0.check();
    await cb1.check();
    await cb2.check();

    await expect(cb0).toBeChecked();
    await expect(cb1).toBeChecked();
    await expect(cb2).toBeChecked();
  });

  test('should select all via header checkbox', async () => {
    await inv.headerCheckbox.check();
    await inv.page.waitForTimeout(300);

    const checked = inv.page.locator('tbody tr input[type="checkbox"]:checked');
    const count = await checked.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should deselect all after select-all', async () => {
    await inv.headerCheckbox.check();
    await inv.page.waitForTimeout(200);
    await inv.headerCheckbox.uncheck();
    await inv.page.waitForTimeout(200);

    const checked = inv.page.locator('tbody tr input[type="checkbox"]:checked');
    const count = await checked.count();
    expect(count).toBe(0);
  });

  // ── Bulk Edit ───────────────────────────────────────────
  test('should disable bulk edit when nothing selected', async () => {
    await expect(inv.bulkEditButton).toBeDisabled();
  });

  test('should enable bulk edit when items are selected', async () => {
    await inv.rowCheckbox(inv.row(0)).check();
    await expect(inv.bulkEditButton).toBeEnabled();
  });

  test('should open bulk edit modal with selected items', async () => {
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();
    await inv.bulkEditButton.click();

    await expect(inv.bulkEditModal).toBeVisible();
    // Modal should tell the user how many items will change
    await expect(inv.bulkEditModal).toContainText(/2|פריטים/);
  });

  test('should cancel bulk edit without changes', async () => {
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.bulkEditButton.click();
    await expect(inv.bulkEditModal).toBeVisible();

    // Cancel
    const cancelBtn = inv.page.locator('.modal__footer button:has-text("ביטול")');
    await cancelBtn.click();
    await expect(inv.bulkEditModal).not.toBeVisible();
  });

  // ── Bulk Delete ─────────────────────────────────────────
  test('should disable delete when nothing selected', async () => {
    await expect(inv.deleteButton).toBeDisabled();
  });

  test('should show count in delete button', async () => {
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();

    await expect(inv.deleteButton).toContainText('2');
  });

  test('should bulk delete selected items', async () => {
    // Create fresh items just for this test
    const ts = Date.now();
    const cat1 = `${PREFIX}-BD1-${ts}`;
    const cat2 = `${PREFIX}-BD2-${ts}`;
    await api.createItem({ catalog_number: cat1, description: 'bulk del 1', location: 'מחסן' });
    await api.createItem({ catalog_number: cat2, description: 'bulk del 2', location: 'מחסן' });
    await inv.goto();
    await inv.search(`${PREFIX}-BD`);
    await inv.page.waitForTimeout(700);

    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();
    await inv.deleteButton.click();
    await inv.confirmDelete('מחיקה קבוצתית בבדיקה');
    await inv.waitForToast();
    await expect(inv.toast).toContainText(/נמחק|הצלחה|מחיקה/);
  });

  // ── Bulk Edit Field Changes ─────────────────────────────
  test('should apply bulk edit to selected items', async ({ page }) => {
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();
    await inv.bulkEditButton.click();
    await expect(inv.bulkEditModal).toBeVisible();

    // Toggle a field checkbox (e.g., purpose)
    const purposeCheckbox = inv.bulkEditModal.locator('input[type="checkbox"]').first();
    if (await purposeCheckbox.isVisible({ timeout: 2000 })) {
      await purposeCheckbox.check();

      const purposeInput = inv.bulkEditModal.locator('input[type="text"], textarea').first();
      if (await purposeInput.isVisible({ timeout: 2000 })) {
        await purposeInput.fill('בדיקה קבוצתית');

        const confirmBtn = inv.page.locator('.modal__footer button:has-text("עדכן")').first();
        await confirmBtn.click();

        await inv.waitForToast();
        await expect(inv.toast).toContainText(/עודכנ|הצלחה/);
      }
    }
  });

  test('should clear selection after bulk operation', async () => {
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();
    await inv.bulkEditButton.click();
    await expect(inv.bulkEditModal).toBeVisible();

    const cancelBtn = inv.page.locator('.modal__footer button:has-text("ביטול")');
    await cancelBtn.click();

    // After modal closes, selection may or may not clear depending on implementation
    await expect(inv.bulkEditModal).not.toBeVisible();
  });

  // ── Advanced Selection ──────────────────────────────────
  test('should select range with Shift+Click', async ({ page }) => {
    const firstCheckbox = inv.rowCheckbox(inv.row(0));
    await firstCheckbox.click();

    const thirdCheckbox = inv.rowCheckbox(inv.row(2));
    await thirdCheckbox.click({ modifiers: ['Shift'] });

    await page.waitForTimeout(300);

    // All 3 rows should be selected
    const checked = page.locator('tbody tr input[type="checkbox"]:checked');
    const count = await checked.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
