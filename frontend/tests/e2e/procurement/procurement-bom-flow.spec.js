import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers } from '../../fixtures/procurement-data.js';

const api = new ProcurementApiHelper();

test.describe('Procurement BOM Flow', () => {
  test.beforeAll(async () => {
    await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
    await api.cleanupByPrefix('E2E-BOM');
  });

  test.afterAll(async () => {
    await api.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should show order type selection modal when clicking add', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    // Click add order button
    const addBtn = page.locator('button:has-text("הזמנה חדשה")').first();
    await addBtn.click();

    // Order type modal should appear
    const orderTypeModal = page.locator('.order-type-modal');
    await expect(orderTypeModal).toBeVisible({ timeout: 5000 });

    // Should have BOM option
    const bomOption = orderTypeModal.locator('.otm-card', { hasText: 'רכש מ-BOM' });
    await expect(bomOption).toBeVisible();

    // Should have Manual option
    const manualOption = orderTypeModal.locator('.otm-card', { hasText: 'רכש ידני' });
    await expect(manualOption).toBeVisible();
  });

  test('should open manual order form when Manual is selected', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    const addBtn = page.locator('button:has-text("הזמנה חדשה")').first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Click manual option
    const manualOption = page.locator('.order-type-modal .otm-card', { hasText: 'רכש ידני' }).first();
    await manualOption.click();

    // Procurement modal should open with form fields
    await expect(proc.editModal).toBeVisible({ timeout: 5000 });
  });

  test('should open BOM prescan vendor selection when BOM is selected', async ({ page }) => {
    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.waitForOrders();

    const addBtn = page.locator('button:has-text("הזמנה חדשה")').first();
    await addBtn.click();
    await page.waitForTimeout(500);

    // Click BOM option
    const bomOption = page.locator('.order-type-modal .otm-card', { hasText: 'רכש מ-BOM' }).first();
    await bomOption.click();

    // BOM prescan modal should open showing vendor selection
    const prescanModal = page.locator('.bps-overlay, .bps-modal');
    await expect(prescanModal.first()).toBeVisible({ timeout: 5000 });

    // Should show vendor options
    const vendorOptions = page.locator('.bps-vendor-card');
    const count = await vendorOptions.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should show BOM preview for existing BOM order', async ({ page }) => {
    // Create a BOM-based order with data groups
    await api.createOrder({
      bom_vendor: 'netapp',
      order_date: new Date().toISOString(),
      status: 'waiting_bom',
      received_bom: true,
      emf_number: '',
      total_amount: 50000,
      bom_items: [{ catalog_number: 'E2E-BOM-PREV', manufacturer: 'NetApp', quantity: 2, product_name: 'Preview Test' }],
      bom_data: { 
        groups: [{ 
          main: { part_number: 'E2E-BOM-PREV', catalog: { category: 'Test', description_he: 'Test' }, ext_qty: 2 },
          children: [] 
        }] 
      }
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-BOM-PREV');

    const orderCard = proc.orderCards.first();
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Should have BOM preview button
    const bomPreviewBtn = proc.bomPreviewButton(orderCard);
    
    // Wait for button to exist, since it is rendered conditionally
    await expect(bomPreviewBtn).toBeVisible({ timeout: 5000 });
    
    await bomPreviewBtn.click();

    // BOM preview modal should open
    const previewModal = page.locator('.bpv-overlay, .bpv-panel');
    await expect(previewModal.first()).toBeVisible({ timeout: 5000 });
  });
});
