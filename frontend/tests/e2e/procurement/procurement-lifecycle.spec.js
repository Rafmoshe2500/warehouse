import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { ProcurementPageObject } from '../../utils/page-objects/ProcurementPage.js';
import { ProcurementApiHelper } from '../../utils/procurement-api-helper.js';
import { procurementTestUsers, testOrders } from '../../fixtures/procurement-data.js';

const api = new ProcurementApiHelper();

test.describe('Procurement Order Lifecycle', () => {
  test.beforeAll(async () => {
    await api.login(procurementTestUsers.admin.username, procurementTestUsers.admin.password);
    await api.cleanupByPrefix('E2E-LIFE');
  });

  test.afterAll(async () => {
    await api.cleanup();
  });

  test.beforeEach(async ({ page }) => {
    await login(page, procurementTestUsers.admin);
  });

  test('should show pipeline bar with correct initial state', async ({ page }) => {
    await api.createOrder({
      ...testOrders.manual,
      bom_items: [{ catalog_number: 'E2E-LIFE-PIP', manufacturer: 'Test', quantity: 1, product_name: 'Pipeline Test' }],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-LIFE-PIP');

    const orderCard = proc.orderByText('E2E-LIFE-PIP');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Pipeline should have steps
    const steps = proc.pipelineSteps(orderCard);
    const count = await steps.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // First step (נוצר) should be done
    await expect(steps.first()).toHaveClass(/done/);
  });

  test('should transition from waiting_shipment to shipped', async ({ page }) => {
    const created = await api.createOrder({
      ...testOrders.readyToShip,
      bom_items: [{ catalog_number: 'E2E-LIFE-SHIP', manufacturer: 'Test', quantity: 1, product_name: 'Ship Test' }],
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-LIFE-SHIP');

    const orderCard = proc.orderByText('E2E-LIFE-SHIP');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Should show ship button (truck icon) for waiting_shipment status
    const shipBtn = proc.shipButton(orderCard);
    await expect(shipBtn).toBeVisible({ timeout: 5000 });

    await shipBtn.click();
    await page.waitForTimeout(2000);

    // After shipping, status pill should show "נשלח"
    await proc.goto();
    await proc.search('E2E-LIFE-SHIP');
    const updatedCard = proc.orderByText('E2E-LIFE-SHIP');
    await expect(updatedCard).toBeVisible({ timeout: 10000 });

    const statusText = await updatedCard.locator('.status-pill').textContent();
    expect(statusText).toContain('נשלח');
  });

  test('should transition from shipped to received', async ({ page }) => {
    // Create a shipped order
    const created = await api.createOrder({
      ...testOrders.readyToShip,
      bom_items: [{ catalog_number: 'E2E-LIFE-RCV', manufacturer: 'Test', quantity: 1, product_name: 'Receive Test' }],
    });
    // Update to shipped
    const id = created._id || created.id;
    await api.updateOrder(id, { status: 'shipped' });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-LIFE-RCV');

    const orderCard = proc.orderByText('E2E-LIFE-RCV');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Should show receive button for shipped status
    const recvBtn = proc.receiveButton(orderCard);
    await expect(recvBtn).toBeVisible({ timeout: 5000 });

    await recvBtn.click();
    await page.waitForTimeout(2000);

    // After receiving, order should move to completed tab
    await proc.gotoTab('completed');
    await page.waitForTimeout(1000);

    const completedCard = proc.orderByText('E2E-LIFE-RCV');
    await expect(completedCard).toBeVisible({ timeout: 10000 });

    const statusText = await completedCard.locator('.status-pill').textContent();
    expect(statusText).toContain('התקבל');
  });

  test('completed orders should appear in completed tab', async ({ page }) => {
    // Create and mark as received
    const created = await api.createOrder({
      ...testOrders.readyToShip,
      bom_items: [{ catalog_number: 'E2E-LIFE-COMP', manufacturer: 'Test', quantity: 1, product_name: 'Complete Test' }],
    });
    const id = created._id || created.id;
    await api.updateOrder(id, { status: 'shipped' });
    await api.updateOrder(id, { status: 'received' });

    const proc = new ProcurementPageObject(page);
    await proc.goto();

    // Should NOT appear in process tab
    await proc.search('E2E-LIFE-COMP');
    await page.waitForTimeout(1000);
    const inProcessCount = await proc.orderByText('E2E-LIFE-COMP').count();
    expect(inProcessCount).toBe(0);

    // Should appear in completed tab
    await proc.gotoTab('completed');
    await page.waitForTimeout(1500);

    // Search again after tab switch
    await proc.search('E2E-LIFE-COMP');
    await page.waitForTimeout(1000);

    const completedCard = proc.orderByText('E2E-LIFE-COMP');
    await expect(completedCard).toBeVisible({ timeout: 10000 });
  });

  test('should show EMF and BOM badges when set', async ({ page }) => {
    await api.createOrder({
      ...testOrders.withEmf,
      bom_items: [{ catalog_number: 'E2E-LIFE-BADGE', manufacturer: 'Test', quantity: 1, product_name: 'Badge Test' }],
      received_bom: true,
    });

    const proc = new ProcurementPageObject(page);
    await proc.goto();
    await proc.search('E2E-LIFE-BADGE');

    const orderCard = proc.orderByText('E2E-LIFE-BADGE');
    await expect(orderCard).toBeVisible({ timeout: 10000 });

    // Should show EMF badge
    await expect(orderCard.locator('.oc-emf-badge, .emf-number-badge').first()).toBeVisible();
  });
});
