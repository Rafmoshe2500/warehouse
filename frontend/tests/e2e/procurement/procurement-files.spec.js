import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers, testOrders } from '../../fixtures/procurement-data.js';
import path from 'path';

const api = new ProcurementApiHelper();

test.describe('Procurement Files Management', () => {
  let testOrderId;

  test.beforeAll(async () => {
    await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
    await api.cleanupByPrefix('E2E-FILE');

    const order = await api.createOrder({
      ...testOrders.manual,
      bom_items: [{ catalog_number: 'E2E-FILE-001', manufacturer: 'Test', quantity: 1, product_name: 'File Test Item' }],
    });
    testOrderId = order._id || order.id;
  });

  test.afterAll(async () => {
    await api.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should open files modal from order card', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-FILE-001');

    const orderCard = proc.orderByText('E2E-FILE-001');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    const filesBtn = proc.filesButton(orderCard);
    await expect(filesBtn).toBeVisible();
    await filesBtn.click();

    // Files modal should open
    await expect(proc.filesModal).toBeVisible({ timeout: 5000 });
  });

  test('files modal should show empty state when no files', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-FILE-001');

    const orderCard = proc.orderByText('E2E-FILE-001');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    await proc.filesButton(orderCard).click();
    await expect(proc.filesModal).toBeVisible({ timeout: 5000 });

    // Should show empty state or "no files" message
    const emptyState = proc.filesModal.locator('.no-files, .empty-state');
    const fileCount = await proc.filesModal.locator('.file-item').count();

    // Either empty state message or zero file entries
    const isEmpty = (await emptyState.count()) > 0 || fileCount === 0;
    expect(isEmpty).toBeTruthy();
  });

  test('should close files modal', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-FILE-001');

    const orderCard = proc.orderByText('E2E-FILE-001');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    await proc.filesButton(orderCard).click();
    await expect(proc.filesModal).toBeVisible({ timeout: 5000 });

    // Close modal
    const closeBtn = proc.filesModal.locator('button:has-text("סגור"), button:has-text("×"), .close-btn, [aria-label="close"]').first();
    await closeBtn.click();
    await expect(proc.filesModal).not.toBeVisible({ timeout: 5000 });
  });

  test('files modal should have upload area when user has edit permission', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-FILE-001');

    const orderCard = proc.orderByText('E2E-FILE-001');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    await proc.filesButton(orderCard).click();
    await expect(proc.filesModal).toBeVisible({ timeout: 5000 });

    // Upload section should be visible for admin
    const uploadArea = proc.filesModal.locator('.upload-section, input[type="file"]');
    await expect(uploadArea.first()).toBeVisible({ timeout: 5000 });
  });
});
