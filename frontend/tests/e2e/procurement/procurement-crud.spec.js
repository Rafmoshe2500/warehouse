import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers, testOrders } from '../../fixtures/procurement-data.js';

const api = new ProcurementApiHelper();

test.describe('Procurement CRUD', () => {
  test.beforeAll(async () => {
    await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
    await api.cleanupByPrefix('E2E-PROC');
  });

  test.afterAll(async () => {
    await api.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should display procurement page with orders tab and status filters', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Status filter buttons (replace old separate tabs)
    await expect(proc.statusFilterButton('in_process')).toBeVisible();
    await expect(proc.statusFilterButton('completed')).toBeVisible();
    // BOM scanner is a sidebar child item
    await expect(page.locator('[data-testid="sidebar-child-bom-netapp"]')).toBeVisible();
  });

  test('should show empty state or existing orders', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Either orders exist or empty state is shown
    const hasOrders = await proc.orderCards.count() > 0;
    const hasEmpty = await proc.emptyState.isVisible().catch(() => false);
    expect(hasOrders || hasEmpty).toBeTruthy();
  });

  test('should create an order via API and display it', async ({ page }) => {
    // Create order via API
    const created = await api.createOrder(testOrders.manual);
    expect(created.id || created._id).toBeTruthy();

    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Verify the order appears (search by catalog number)
    await proc.search('E2E-PROC-001');
    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });
  });

  test('should edit an order', async ({ page }) => {
    // Create order to edit
    const created = await api.createOrder({
      ...testOrders.manual,
      bom_items: [{
        catalog_number: 'E2E-PROC-EDIT',
        manufacturer: 'Test',
        quantity: 1,
        product_name: 'Edit Test',
      }],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-PROC-EDIT');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Click edit button
    await proc.editButton(orderCard).click();
    await expect(proc.editModal).toBeVisible({ timeout: 5000 });

    // Close the modal
    await proc.editModalCloseButton.click();
  });

  test('should delete an order', async ({ page }) => {
    // Create a disposable order
    const created = await api.createOrder({
      ...testOrders.manual,
      bom_items: [{
        catalog_number: 'E2E-PROC-DEL',
        manufacturer: 'Test',
        quantity: 1,
        product_name: 'Delete Test',
      }],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-PROC-DEL');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Click delete
    await proc.deleteButton(orderCard).click();

    // Confirm deletion - fill in reason (required)
    await expect(proc.deleteModal).toBeVisible({ timeout: 5000 });
    const reasonInput = proc.deleteModal.locator('.delete-modal__textarea, .delete-modal__input').first();
    await reasonInput.fill('E2E test cleanup');
    await proc.deleteConfirmButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(2000);

    // Verify order is gone after reload
    await proc.goto();
    await proc.search('E2E-PROC-DEL');
    await expect(proc.orderCards).toHaveCount(0, { timeout: 10000 });
  });

  test('should open files modal', async ({ page }) => {
    const created = await api.createOrder({
      ...testOrders.manual,
      bom_items: [{
        catalog_number: 'E2E-PROC-FILES',
        manufacturer: 'Test',
        quantity: 1,
        product_name: 'Files Test',
      }],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-PROC-FILES');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    await proc.filesButton(orderCard).click();
    await expect(proc.filesModal).toBeVisible({ timeout: 5000 });
  });

  test('should open history modal', async ({ page }) => {
    const created = await api.createOrder({
      ...testOrders.manual,
      bom_items: [{
        catalog_number: 'E2E-PROC-HIST',
        manufacturer: 'Test',
        quantity: 1,
        product_name: 'History Test',
      }],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-PROC-HIST');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    await proc.historyButton(orderCard).click();

    // History modal or panel should appear
    await page.waitForTimeout(2000);
  });

  test('should display order items in card', async ({ page }) => {
    const created = await api.createOrder({
      ...testOrders.manual,
      bom_items: [
        { catalog_number: 'E2E-PROC-ITM1', manufacturer: 'Test', quantity: 5, product_name: 'Item One' },
        { catalog_number: 'E2E-PROC-ITM2', manufacturer: 'Test', quantity: 10, product_name: 'Item Two' },
      ],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-PROC-ITM');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Verify items appear as chips in the card
    const chips = orderCard.locator('.pc-chip');
    await expect(chips).toHaveCount(2, { timeout: 5000 });
  });
});
