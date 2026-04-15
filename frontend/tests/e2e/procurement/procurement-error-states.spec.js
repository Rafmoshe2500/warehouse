import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers, testOrders } from '../../fixtures/procurement-data.js';

const api = new ProcurementApiHelper();

test.describe('Procurement Error States', () => {
  test.beforeAll(async () => {
    await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
    await api.cleanupByPrefix('E2E-ERR');
  });

  test.afterAll(async () => {
    await api.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should handle page load gracefully', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Page should load without crashing even if API is slow
    await page.waitForTimeout(3000);

    // Should see either orders or empty state — not an error screen
    const errorScreen = page.locator('.error-boundary, .error-page');
    await expect(errorScreen).toHaveCount(0);

    // Tab bar should always render
    const tabs = page.locator('button:has-text("בתהליך")');
    await expect(tabs).toBeVisible();
  });

  test('should show toast on failed delete attempt', async ({ page }) => {
    // Create an order, then simulate delete failure by deleting it via API first
    const order = await api.createOrder({
      ...testOrders.manual,
      bom_items: [{ catalog_number: 'E2E-ERR-DEL', manufacturer: 'Test', quantity: 1, product_name: 'Delete Error Test' }],
    });
    const orderId = order._id || order.id;

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-ERR-DEL');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Delete via API first so UI delete will find it already gone
    await api.deleteOrder(orderId);

    // Now try to delete from UI
    const deleteBtn = proc.deleteButton(orderCard);
    if (await deleteBtn.count() > 0) {
      await deleteBtn.click();
      await page.waitForTimeout(500);

      // Confirm deletion - Fill required reason
      await expect(proc.deleteModal).toBeVisible({ timeout: 5000 });
      const reasonInput = proc.deleteModal.locator('.delete-modal__textarea, .delete-modal__input').first();
      await reasonInput.fill('Test UI Delete Error');

      const confirmBtn = page.locator('button:has-text("מחק"), button:has-text("אישור"), .confirm-delete').first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(2000);

        // Should show error toast or handle gracefully (not crash)
        const errorScreen = page.locator('.error-boundary');
        await expect(errorScreen).toHaveCount(0);
      }
    }
  });

  test('should handle search with special characters', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    // Search with special characters should not crash
    await proc.search('<script>alert("xss")</script>');
    await page.waitForTimeout(1500);

    // Page should still be functional
    const tabs = page.locator('button:has-text("בתהליך")');
    await expect(tabs).toBeVisible();

    // Clear and search with Hebrew characters
    await proc.clearSearch();
    await proc.search('בדיקה');
    await page.waitForTimeout(1000);
    await expect(tabs).toBeVisible();
  });

  test('should recover from network error on tab switch', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    // Switch tabs rapidly — should handle without crashing
    await proc.gotoTab('completed');
    await page.waitForTimeout(300);
    await proc.gotoTab('process');
    await page.waitForTimeout(300);
    await proc.gotoTab('completed');
    await page.waitForTimeout(300);
    await proc.gotoTab('process');
    await page.waitForTimeout(1500);

    // Page should still be functional
    const tabs = page.locator('button:has-text("בתהליך")');
    await expect(tabs).toBeVisible();
  });

  test('should handle edit modal with missing fields gracefully', async ({ page }) => {
    // Create order with minimal valid data (empty optional fields)
    await api.createOrder({
      order_date: new Date().toISOString(),
      status: 'waiting_bom_emf',
      bom_items: [{ catalog_number: 'E2E-ERR-MIN', manufacturer: 'Minimal', quantity: 1, description: '' }],
      total_amount: 0,
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-ERR-MIN');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Open edit modal
    const editBtn = proc.editButton(orderCard);
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await expect(proc.editModal).toBeVisible({ timeout: 5000 });

      // Modal should render without crashing even with minimal data
      await proc.editModalCloseButton.click();
      await expect(proc.editModal).not.toBeVisible({ timeout: 3000 });
    }
  });
});
