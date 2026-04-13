import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers, testOrders } from '../../fixtures/procurement-data.js';

const api = new ProcurementApiHelper();

test.describe('Procurement Permissions', () => {
  test.describe('Read-only user restrictions', () => {
    test.beforeAll(async () => {
      await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
      await api.cleanupByPrefix('E2E-PERM');
      // Create a test order visible to read-only user
      await api.createOrder({
        ...testOrders.manual,
        bom_items: [{ catalog_number: 'E2E-PERM-RO', manufacturer: 'Test', quantity: 1, product_name: 'RO Test' }],
      });
    });

    test.afterAll(async () => {
      await api.cleanup();
    });

    test('read-only user should see orders but not edit/delete buttons', async ({ page }) => {
      await login(page, procurementTestUsers.p123ro);
      const proc = new ProcurementPageObject(page);
      await proc.goto();
      await proc.waitForOrders();

      await proc.search('E2E-PERM-RO');
      const orderCard = proc.orderByText('E2E-PERM-RO');
      await expect(orderCard).toBeVisible({ timeout: 10000 });

      // Edit and delete buttons should NOT be visible for read-only user
      const editBtn = proc.editButton(orderCard);
      const deleteBtn = proc.deleteButton(orderCard);
      await expect(editBtn).toHaveCount(0);
      await expect(deleteBtn).toHaveCount(0);
    });

    test('read-only user should not see create button', async ({ page }) => {
      await login(page, procurementTestUsers.p123ro);
      const proc = new ProcurementPageObject(page);
      await proc.goto();

      // Create/add button should not be visible
      const createBtn = page.locator('[data-testid="add-order-btn"], .add-order-btn, button:has-text("הוסף הזמנה")');
      await expect(createBtn).toHaveCount(0);
    });

    test('read-only user should still see files and history buttons', async ({ page }) => {
      await login(page, procurementTestUsers.p123ro);
      const proc = new ProcurementPageObject(page);
      await proc.goto();
      await proc.search('E2E-PERM-RO');

      const orderCard = proc.orderByText('E2E-PERM-RO');
      await expect(orderCard).toBeVisible({ timeout: 10000 });

      // Files and history buttons should still be visible (read operations)
      const filesBtn = proc.filesButton(orderCard);
      const historyBtn = proc.historyButton(orderCard);
      await expect(filesBtn).toBeVisible();
      await expect(historyBtn).toBeVisible();
    });
  });

  test.describe('Vendor-specific access', () => {
    test.beforeAll(async () => {
      await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
      await api.cleanupByPrefix('E2E-VEND');

      // Create orders from different vendors
      await api.createOrder({
        ...testOrders.manual,
        bom_vendor: 'DELL',
        bom_items: [{ catalog_number: 'E2E-VEND-DELL', manufacturer: 'Dell', quantity: 1, product_name: 'Dell Item' }],
      });
      await api.createOrder({
        ...testOrders.manual,
        bom_vendor: 'HPE',
        bom_items: [{ catalog_number: 'E2E-VEND-HPE', manufacturer: 'HPE', quantity: 1, product_name: 'HPE Item' }],
      });
      await api.createOrder({
        ...testOrders.manual,
        bom_vendor: 'NETAPP',
        bom_items: [{ catalog_number: 'E2E-VEND-NAP', manufacturer: 'NetApp', quantity: 1, product_name: 'NetApp Item' }],
      });
    });

    test.afterAll(async () => {
      await api.cleanup();
    });

    test('admin should see edit buttons on all vendor orders', async ({ page }) => {
      await login(page, procurementTestUsers.admin);
      const proc = new ProcurementPageObject(page);
      await proc.goto();

      // Admin (superadmin) should see edit on both
      await proc.search('E2E-VEND-DELL');
      const dellCard = proc.orderByText('E2E-VEND-DELL');
      await expect(dellCard).toBeVisible({ timeout: 10000 });
      await expect(proc.editButton(dellCard)).toBeVisible();

      await proc.clearSearch();
      await proc.search('E2E-VEND-HPE');
      const hpeCard = proc.orderByText('E2E-VEND-HPE');
      await expect(hpeCard).toBeVisible({ timeout: 10000 });
      await expect(proc.editButton(hpeCard)).toBeVisible();
    });

    test('netapp_rw user should see edit on NetApp orders only', async ({ page }) => {
      await login(page, procurementTestUsers.netappRw);
      const proc = new ProcurementPageObject(page);
      await proc.goto();
      await proc.waitForOrders();

      // Should see NetApp order with edit button
      await proc.search('E2E-VEND-NAP');
      const napCard = proc.orderByText('E2E-VEND-NAP');
      await expect(napCard).toBeVisible({ timeout: 10000 });
      await expect(proc.editButton(napCard)).toBeVisible();
    });

    test('netapp_ro user should see NetApp orders but not edit', async ({ page }) => {
      await login(page, procurementTestUsers.netappRo);
      const proc = new ProcurementPageObject(page);
      await proc.goto();
      await proc.waitForOrders();

      await proc.search('E2E-VEND-NAP');
      const napCard = proc.orderByText('E2E-VEND-NAP');
      await expect(napCard).toBeVisible({ timeout: 10000 });

      // RO user should NOT have edit button
      const editBtn = proc.editButton(napCard);
      await expect(editBtn).toHaveCount(0);
    });

    test('dell_rw user should not see NetApp orders', async ({ page }) => {
      await login(page, procurementTestUsers.dellRw);
      const proc = new ProcurementPageObject(page);
      await proc.goto();
      await proc.waitForOrders();

      // Dell user should NOT see NetApp order
      await proc.search('E2E-VEND-NAP');
      await page.waitForTimeout(1500);
      const napCount = await proc.orderByText('E2E-VEND-NAP').count();
      expect(napCount).toBe(0);

      // But SHOULD see Dell order
      await proc.clearSearch();
      await proc.search('E2E-VEND-DELL');
      const dellCard = proc.orderByText('E2E-VEND-DELL');
      await expect(dellCard).toBeVisible({ timeout: 10000 });
    });

    test('multi_vendor_rw should see both NetApp and Dell', async ({ page }) => {
      await login(page, procurementTestUsers.multiVendorRw);
      const proc = new ProcurementPageObject(page);
      await proc.goto();
      await proc.waitForOrders();

      await proc.search('E2E-VEND-NAP');
      await expect(proc.orderByText('E2E-VEND-NAP')).toBeVisible({ timeout: 10000 });

      await proc.clearSearch();
      await proc.search('E2E-VEND-DELL');
      await expect(proc.orderByText('E2E-VEND-DELL')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Analytics tab visibility', () => {
    test('admin should see analytics tab', async ({ page }) => {
      await login(page, procurementTestUsers.admin);
      const proc = new ProcurementPageObject(page);
      await proc.goto();

      const analyticsTab = page.locator('button:has-text("השוואת מחירים"), [data-testid="tab-analytics"]');
      await expect(analyticsTab).toBeVisible({ timeout: 5000 });
    });

    test('price_comparer should see analytics tab', async ({ page }) => {
      await login(page, procurementTestUsers.priceComparer);
      const proc = new ProcurementPageObject(page);
      await proc.goto();

      const analyticsTab = page.locator('button:has-text("השוואת מחירים"), [data-testid="tab-analytics"]');
      await expect(analyticsTab).toBeVisible({ timeout: 5000 });
    });

    test('read-only user should not see analytics tab', async ({ page }) => {
      await login(page, procurementTestUsers.p123ro);
      const proc = new ProcurementPageObject(page);
      await proc.goto();

      const analyticsTab = page.locator('button:has-text("השוואת מחירים"), [data-testid="tab-analytics"]');
      await expect(analyticsTab).toHaveCount(0);
    });

    test('vendor RW user without compare_prices should not see analytics tab', async ({ page }) => {
      await login(page, procurementTestUsers.netappRw);
      const proc = new ProcurementPageObject(page);
      await proc.goto();

      const analyticsTab = page.locator('button:has-text("השוואת מחירים"), [data-testid="tab-analytics"]');
      await expect(analyticsTab).toHaveCount(0);
    });
  });
});
