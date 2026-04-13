import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-CRUD';
let api;

test.describe('Inventory - CRUD Operations', () => {
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

  // ── Display ─────────────────────────────────────────────
  test('should display inventory table with headers', async () => {
    await expect(inv.page.locator('table')).toBeVisible();
    await expect(inv.page.locator('th').first()).toBeVisible();
  });

  // ── Create ──────────────────────────────────────────────
  test('should add new item with all fields', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-FULL-${ts}`;

    await inv.addItem({
      catalog_number: cat,
      description: 'פריט מלא',
      manufacturer: 'יצרן בדיקה',
      location: 'מחסן א',
      current_stock: '10',
    });

    await inv.waitForToast();
    await expect(inv.toast).toContainText(/נוסף|הצלחה/);
    await expect(inv.rowByText(cat)).toBeVisible();
  });

  test('should add item with only required fields', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-MIN-${ts}`;

    await inv.startAdd();
    await inv.newItemInput('catalog_number').fill(cat);
    await inv.newItemInput('description').fill('תיאור מינימלי');
    await inv.saveNewItemButton.click();

    await inv.waitForToast();
    await expect(inv.toast).toContainText(/נוסף|הצלחה/);
  });

  test('should fail to create item without catalog_number', async () => {
    await inv.startAdd();
    await inv.newItemInput('description').fill('ללא מקט');
    await inv.saveNewItemButton.click();

    await inv.waitForToast();
    await expect(inv.toast).toContainText(/חובה|מק"ט|שגיאה/);
  });

  test('should cancel inline add with Escape', async ({ page }) => {
    await inv.startAdd();
    await inv.newItemInput('catalog_number').fill(`${PREFIX}-CANCEL`);
    await page.keyboard.press('Escape');

    await expect(inv.page.locator('.new-item-row')).toHaveCount(0, { timeout: 3000 });
  });

  // ── Edit ────────────────────────────────────────────────
  test('should edit item inline (description)', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-EDIT-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'לפני עריכה', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    await row.waitFor({ state: 'visible' });

    const descCell = row.locator('td.col-description, td:nth-child(4)').first();
    await descCell.dblclick();

    const input = inv.page.locator('.item-table__edit-input').first();
    await input.fill('אחרי עריכה');
    await input.press('Enter');

    await inv.waitForToast();
    await expect(row).toContainText('אחרי עריכה');
  });

  test('should cancel inline edit with Escape', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-EDITESC-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'ערך מקורי', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    const descCell = row.locator('td.col-description, td:nth-child(4)').first();
    await descCell.dblclick();

    const input = inv.page.locator('.item-table__edit-input').first();
    await input.fill('ערך שלא ישמר');
    await input.press('Escape');

    await expect(row).toContainText('ערך מקורי');
  });

  test('should copy immutable field on double-click', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-COPY-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'copy test', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    const catCell = row.locator('td.col-catalog_number, td:nth-child(2)').first();
    await catCell.dblclick();

    await expect(inv.page.locator('.toast')).toBeVisible({ timeout: 3000 });
  });

  // ── Delete ──────────────────────────────────────────────
  test('should delete item with valid reason', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-DEL-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'למחיקה', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    await inv.rowCheckbox(row).check();
    await inv.deleteButton.click();

    await inv.confirmDelete('מחיקה בבדיקה אוטומטית');
    await inv.waitForToast();
    await expect(inv.toast).toContainText(/נמחק|הצלחה|מחיקה/);
    await expect(inv.page.locator('tbody')).not.toContainText(cat);
  });

  test('should reject delete with short reason', async () => {
    const ts = Date.now();
    const cat = `${PREFIX}-DELSHORT-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'סיבה קצרה', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    await inv.rowCheckbox(row).check();
    await inv.deleteButton.click();

    await inv.deleteReasonInput.fill('ab');
    const confirmBtn = inv.deleteConfirmButton;
    const isDisabled = await confirmBtn.isDisabled().catch(() => false);
    if (!isDisabled) {
      await confirmBtn.click();
      await expect(inv.deleteModal).toBeVisible();
    }
  });

  // ── Undo / Redo ─────────────────────────────────────────
  test('should undo edit with Ctrl+Z', async ({ page }) => {
    const ts = Date.now();
    const cat = `${PREFIX}-UNDO-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'ערך מקורי', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    const descCell = row.locator('td.col-description, td:nth-child(4)').first();
    await descCell.dblclick();

    const input = page.locator('.item-table__edit-input').first();
    await input.fill('ערך זמני');
    await input.press('Enter');
    await inv.waitForToast();

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1000);

    await expect(row).toContainText('ערך מקורי');
  });

  test('should redo after undo with Ctrl+Y', async ({ page }) => {
    const ts = Date.now();
    const cat = `${PREFIX}-REDO-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'לפני', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    const descCell = row.locator('td.col-description, td:nth-child(4)').first();
    await descCell.dblclick();

    const input = page.locator('.item-table__edit-input').first();
    await input.fill('אחרי');
    await input.press('Enter');
    await inv.waitForToast();

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1000);
    await expect(row).toContainText('לפני');

    await page.keyboard.press('Control+y');
    await page.waitForTimeout(1000);
    await expect(row).toContainText('אחרי');
  });

  test('should undo delete and restore item', async ({ page }) => {
    const ts = Date.now();
    const cat = `${PREFIX}-UNDODEL-${ts}`;
    await api.createItem({ catalog_number: cat, description: 'לשחזור', location: 'מחסן' });
    await inv.goto();

    const row = inv.rowByText(cat);
    await inv.rowCheckbox(row).check();
    await inv.deleteButton.click();
    await inv.confirmDelete('מחיקה זמנית');
    await inv.waitForToast();

    await page.keyboard.press('Control+z');
    await page.waitForTimeout(1500);

    await expect(inv.rowByText(cat)).toBeVisible({ timeout: 5000 });
  });
});
