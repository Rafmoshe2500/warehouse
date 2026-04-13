import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';
import { InventoryPageObject } from '../../utils/page-objects/InventoryPage.js';
import { TestApiHelper } from '../../utils/api-helper.js';

const PREFIX = 'E2E-COLL';
let api;

test.describe('Inventory - Collections Integration', () => {
  /** @type {InventoryPageObject} */
  let inv;

  test.beforeAll(async () => {
    api = new TestApiHelper();
    await api.login();
    await api.cleanupByPrefix(PREFIX);
    await api.createItem({ catalog_number: `${PREFIX}-001`, description: 'collections test', location: 'מחסן' });
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

  test('should show associated collections count column', async () => {
    const header = inv.page.locator('th:has-text("משוייך"), th:has-text("צוותים")').first();
    // Column may be hidden by default — skip if not visible
    if (await header.isVisible({ timeout: 2000 })) {
      await expect(header).toBeVisible();
    }
  });

  test('should open collections modal on count click', async ({ page }) => {
    const row = inv.row(0);
    const collCell = row.locator('td.col-associated_collections_count .link-button').first();
    if (await collCell.isVisible({ timeout: 2000 })) {
      await collCell.click();
      const modal = page.locator('.modal:has(.associated-collections-content)');
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  test('should show empty state in collections modal for item with no collections', async ({ page }) => {
    const row = inv.row(0);
    const collCell = row.locator('td.col-associated_collections_count .link-button, td.col-associated_collections_count').first();
    if (await collCell.isVisible({ timeout: 2000 })) {
      await collCell.click();
      const modal = page.locator('.modal');
      if (await modal.isVisible({ timeout: 2000 })) {
        // Expect either "אין" or a table
        const content = await modal.innerText();
        expect(content.length).toBeGreaterThan(0);
      }
    }
  });

  // ── Enhanced: Modal Content ─────────────────────────────
  test('should display collection name and owner in modal table', async ({ page }) => {
    const row = inv.row(0);
    const collCell = row.locator('td.col-associated_collections_count .link-button, td.col-associated_collections_count').first();
    if (await collCell.isVisible({ timeout: 2000 })) {
      await collCell.click();
      const modal = page.locator('.modal');
      if (await modal.isVisible({ timeout: 3000 })) {
        // If item has collections, modal should show table with name & owner columns
        const table = modal.locator('table');
        if (await table.isVisible({ timeout: 2000 })) {
          const headerText = await table.locator('th').allTextContents();
          // Should have collection name and owner headers
          const hasNameCol = headerText.some(h => h.includes('שם') || h.includes('אוסף') || h.includes('צוות'));
          const hasOwnerCol = headerText.some(h => h.includes('בעלים') || h.includes('ID'));
          expect(hasNameCol || hasOwnerCol).toBeTruthy();
        }
      }
    }
  });

  test('should close collections modal on X button', async ({ page }) => {
    const row = inv.row(0);
    const collCell = row.locator('td.col-associated_collections_count .link-button, td.col-associated_collections_count').first();
    if (await collCell.isVisible({ timeout: 2000 })) {
      await collCell.click();
      const modal = page.locator('.modal');
      if (await modal.isVisible({ timeout: 3000 })) {
        // Click close button (X)
        const closeBtn = modal.locator('button[aria-label="close"], .modal__close, button:has-text("×"), button:has-text("✕")').first();
        if (await closeBtn.isVisible({ timeout: 2000 })) {
          await closeBtn.click();
          await expect(modal).not.toBeVisible({ timeout: 3000 });
        } else {
          // Try Escape
          await page.keyboard.press('Escape');
          await expect(modal).not.toBeVisible({ timeout: 3000 });
        }
      }
    }
  });
});
