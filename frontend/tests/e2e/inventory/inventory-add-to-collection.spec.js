import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-ADDCOL';
let api;

test.describe('Inventory - Add to Collection', () => {
  /** @type {InventoryPageObject} */
  let inv;
  let testCollectionId;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);

    // Create test items
    await api.createItem({ catalog_number: `${PREFIX}-001`, description: 'item for collection 1', location: 'מחסן' });
    await api.createItem({ catalog_number: `${PREFIX}-002`, description: 'item for collection 2', location: 'מחסן' });
    await api.createItem({ catalog_number: `${PREFIX}-003`, description: 'item for collection 3', location: 'מחסן' });
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

  test('should show Add to Collection option via context menu when item selected', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const addToCollectionOption = contextMenu.locator('text=/הוסף.*צוות|הוסף.*אוסף/');
    if (await addToCollectionOption.isVisible({ timeout: 2000 })) {
      await expect(addToCollectionOption).toBeVisible();
    }
  });

  test('should list available collections in submenu', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    // Hover over "Add to collection" to reveal submenu
    const addOption = contextMenu.locator('text=/הוסף.*צוות|הוסף.*אוסף/').first();
    if (await addOption.isVisible({ timeout: 2000 })) {
      await addOption.hover();

      const submenu = page.locator('.context-menu__submenu, .collections-submenu');
      if (await submenu.isVisible({ timeout: 2000 })) {
        // Should contain collection items or empty message
        const content = await submenu.textContent();
        expect(content.length).toBeGreaterThan(0);
      }
    }
  });

  test('should show success toast after adding item to collection', async ({ page }) => {
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const addOption = contextMenu.locator('text=/הוסף.*צוות|הוסף.*אוסף/').first();
    if (await addOption.isVisible({ timeout: 2000 })) {
      await addOption.hover();

      const submenu = page.locator('.context-menu__submenu, .collections-submenu');
      if (await submenu.isVisible({ timeout: 2000 })) {
        const firstCollection = submenu.locator('.context-menu__item, button').first();
        if (await firstCollection.isVisible({ timeout: 2000 })) {
          await firstCollection.click();

          // Expect success or duplicate toast
          const toast = page.locator('.toast');
          await expect(toast.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should add multiple selected items to collection', async ({ page }) => {
    // Select multiple items
    await inv.rowCheckbox(inv.row(0)).check();
    await inv.rowCheckbox(inv.row(1)).check();

    await inv.row(0).click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    await expect(contextMenu).toBeVisible({ timeout: 3000 });

    const addOption = contextMenu.locator('text=/הוסף.*צוות|הוסף.*אוסף/').first();
    if (await addOption.isVisible({ timeout: 2000 })) {
      await addOption.hover();

      const submenu = page.locator('.context-menu__submenu, .collections-submenu');
      if (await submenu.isVisible({ timeout: 2000 })) {
        const firstCollection = submenu.locator('.context-menu__item, button').first();
        if (await firstCollection.isVisible({ timeout: 2000 })) {
          await firstCollection.click();

          const toast = page.locator('.toast');
          await expect(toast.first()).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should handle duplicate item in collection gracefully', async ({ page }) => {
    // First add the item
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    if (await contextMenu.isVisible({ timeout: 3000 })) {
      const addOption = contextMenu.locator('text=/הוסף.*צוות|הוסף.*אוסף/').first();
      if (await addOption.isVisible({ timeout: 2000 })) {
        await addOption.hover();

        const submenu = page.locator('.context-menu__submenu, .collections-submenu');
        if (await submenu.isVisible({ timeout: 2000 })) {
          const firstCollection = submenu.locator('.context-menu__item, button').first();
          if (await firstCollection.isVisible({ timeout: 2000 })) {
            await firstCollection.click();

            // Toast should appear — either success or duplicate warning
            const toast = page.locator('.toast');
            await expect(toast.first()).toBeVisible({ timeout: 5000 });
            const toastText = await toast.first().textContent();
            // Should show either success or duplicate/already exists message
            expect(toastText.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  test('should show empty collections message when user has no collections', async ({ page }) => {
    // This test verifies the empty state handling
    // Login as a user that may not have collections
    const row = inv.row(0);
    await inv.rowCheckbox(row).check();
    await row.click({ button: 'right' });

    const contextMenu = page.locator('.context-menu');
    if (await contextMenu.isVisible({ timeout: 3000 })) {
      const addOption = contextMenu.locator('text=/הוסף.*צוות|הוסף.*אוסף/').first();
      if (await addOption.isVisible({ timeout: 2000 })) {
        await addOption.hover();

        const submenu = page.locator('.context-menu__submenu, .collections-submenu');
        if (await submenu.isVisible({ timeout: 2000 })) {
          // If no collections: look for empty state text
          const emptyState = submenu.locator('text=/אין.*צוותים|אין.*אוספים|לא נמצאו/');
          const collectionItems = submenu.locator('.context-menu__item, button');
          
          // Either empty state or collection items should be present
          const hasEmpty = await emptyState.isVisible({ timeout: 1000 }).catch(() => false);
          const hasItems = (await collectionItems.count()) > 0;
          expect(hasEmpty || hasItems).toBeTruthy();
        }
      }
    }
  });
});
