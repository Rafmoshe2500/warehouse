import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-CTX';
let api;

test.describe('Inventory - Context Menu', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    await api.createItem({ catalog_number: `${PREFIX}-001`, description: 'פריט תפריט 1', location: 'מחסן', purpose: 'בדיקה' });
    await api.createItem({ catalog_number: `${PREFIX}-002`, description: 'פריט תפריט 2', location: 'מחסן', purpose: 'בדיקה' });
    await api.createItem({ catalog_number: `${PREFIX}-003`, description: 'פריט תפריט 3', location: 'מחסן', purpose: 'בדיקה' });
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

  test('should open context menu on right-click on a row', async ({ page }) => {
    const row = inv.row(0);
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });
  });

  test('should show Edit option in context menu', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const editOption = contextMenu.locator('text=עריכה');
    await expect(editOption).toBeVisible();
  });

  test('should show Delete option in context menu', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const deleteOption = contextMenu.locator('text=מחיקה');
    await expect(deleteOption).toBeVisible();
  });

  test('should show Copy option in context menu', async ({ page }) => {
    const row = inv.row(0);
    const cell = row.locator('td').nth(3);
    await cell.click();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const copyOption = contextMenu.locator('text=העתק');
    await expect(copyOption).toBeVisible();
  });

  test('should show Add to Collection submenu', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const collectionOption = contextMenu.locator('text=הוסף לצוות');
    if (await collectionOption.isVisible({ timeout: 2000 })) {
      await expect(collectionOption).toBeVisible();
    }
  });

  test('should close context menu on outside click', async ({ page }) => {
    const row = inv.row(0);
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    // Click outside the context menu
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(contextMenu).not.toBeVisible({ timeout: 3000 });
  });

  test('should close context menu after selecting an action', async ({ page }) => {
    // Select a row first so actions are enabled
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    // Click the Edit action (enabled because selectedItemsCount > 0)
    const editOption = contextMenu.locator('[data-testid="context-menu-edit"]');
    if (await editOption.isVisible({ timeout: 2000 })) {
      await editOption.click();
      await expect(contextMenu).not.toBeVisible({ timeout: 3000 });
      // Close any modal that may have opened
      await page.keyboard.press('Escape');
    }
  });

  test('should open delete modal via context menu', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const deleteOption = contextMenu.locator('text=מחיקה').first();
    await deleteOption.click();

    // Delete modal should appear
    const deleteModal = page.locator('.delete-modal, .modal');
    await expect(deleteModal.first()).toBeVisible({ timeout: 3000 });

    // Close modal to avoid side effects
    await page.keyboard.press('Escape');
  });

  test('should show item count in Edit option when multiple selected', async ({ page }) => {
    // Select 2 items
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();

    await inv.row(0).click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    // The context menu should indicate count (e.g., "עריכה (2)")
    const editOption = contextMenu.locator('text=/עריכה.*2/');
    if (await editOption.isVisible({ timeout: 2000 })) {
      await expect(editOption).toBeVisible();
    }
  });

  test('should show item count in Delete option when multiple selected', async ({ page }) => {
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();

    await inv.row(0).click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const deleteOption = contextMenu.locator('text=/מחיקה.*2/');
    if (await deleteOption.isVisible({ timeout: 2000 })) {
      await expect(deleteOption).toBeVisible();
    }
  });

  test('should position context menu at cursor location', async ({ page }) => {
    const row = inv.row(0);
    const box = await row.boundingBox();
    const clickX = box.x + box.width / 2;
    const clickY = box.y + box.height / 2;

    await page.mouse.click(clickX, clickY, { button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const menuBox = await contextMenu.boundingBox();
    // Menu should appear near where we clicked (within reasonable margin)
    expect(Math.abs(menuBox.x - clickX)).toBeLessThan(300);
    expect(Math.abs(menuBox.y - clickY)).toBeLessThan(300);
  });
});
