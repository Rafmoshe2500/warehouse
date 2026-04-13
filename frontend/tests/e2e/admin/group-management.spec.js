import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { AdminPageObject } from '../../utils/page-objects/AdminPage.js';
import { AdminApiHelper } from '../../utils/admin-api-helper.js';
import { testUsers, adminTestData } from '../../fixtures/test-data.js';

const api = new AdminApiHelper();

test.describe('Admin - Group Management', () => {
  test.beforeAll(async () => {
    await api.login(testUsers.admin.username, testUsers.admin.password);
    await api.cleanupGroupsByPrefix(adminTestData.PREFIX);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupGroupsByPrefix(adminTestData.PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should switch to groups tab', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    // Group search and add button should be visible
    await expect(admin.groupSearch).toBeVisible();
    await expect(admin.addGroupBtn).toBeVisible();
  });

  test('should display group list with badges', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    const groupCards = admin.allGroupCards;
    const count = await groupCards.count();

    // There should be at least some groups, or the empty state
    if (count > 0) {
      // Each card should have a badge
      const firstCard = groupCards.first();
      await expect(firstCard.locator('.um-badge')).toBeVisible();
    }
  });

  test('should search groups', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    const groupCards = admin.allGroupCards;
    const totalBefore = await groupCards.count();

    if (totalBefore > 0) {
      // Get the first group's name from the card
      const firstName = await groupCards.first().locator('.um-card-name').textContent();
      await admin.searchGroups(firstName);

      // Filtered list should show at least that one group
      const filteredCount = await admin.allGroupCards.count();
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(totalBefore);
    }
  });

  test('should select group and show details', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    const groupCards = admin.allGroupCards;
    if (await groupCards.count() > 0) {
      await groupCards.first().click();
      await expect(admin.groupForm).toBeVisible({ timeout: 5000 });
    }
  });

  test('should create a new group', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    await admin.addGroupBtn.click();
    await expect(admin.groupForm).toBeVisible({ timeout: 5000 });

    // Fill group form
    await admin.fillGroupForm({ name: adminTestData.newGroup.name });

    // Toggle a permission
    await admin.togglePermission('perm-inventory-ro');

    // Submit
    await admin.groupSubmitBtn.click();
    await admin.waitForToast();
  });

  test('should update group permissions', async ({ page }) => {
    // Create group via API
    await api.createGroup({
      name: `${adminTestData.PREFIX}perm-test`,
      role: 'user',
      permissions: ['inventory:ro'],
      is_active: true,
    });

    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    await admin.searchGroups(`${adminTestData.PREFIX}perm-test`);
    await page.waitForTimeout(500);

    await admin.groupCard(`${adminTestData.PREFIX}perm-test`).click();
    await expect(admin.groupForm).toBeVisible({ timeout: 5000 });

    // Toggle inventory:rw
    await admin.togglePermission('perm-inventory-rw');
    await admin.groupSubmitBtn.click();
    await admin.waitForToast();
  });

  test('should toggle group active status', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    await admin.searchGroups(`${adminTestData.PREFIX}`);
    await page.waitForTimeout(500);

    const cards = admin.allGroupCards;
    if (await cards.count() > 0) {
      await cards.first().click();
      await expect(admin.groupForm).toBeVisible({ timeout: 5000 });

      const toggle = admin.groupActiveToggle;
      if (await toggle.isVisible({ timeout: 3000 })) {
        await toggle.click();
        await admin.groupSubmitBtn.click();
        await admin.waitForToast();
      }
    }
  });

  test('should delete group', async ({ page }) => {
    await api.createGroup({
      name: `${adminTestData.PREFIX}delete-me`,
      role: 'user',
      permissions: [],
      is_active: true,
    });

    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    await admin.searchGroups(`${adminTestData.PREFIX}delete-me`);
    await page.waitForTimeout(500);

    await admin.groupCard(`${adminTestData.PREFIX}delete-me`).click();
    await expect(admin.groupForm).toBeVisible({ timeout: 5000 });

    await admin.groupDeleteBtn.click();
    await expect(admin.groupDeleteModal).toBeVisible({ timeout: 3000 });

    // Confirm delete
    await admin.groupConfirmDeleteBtn.click();
    await admin.waitForToast();
  });

  test('should cancel group deletion', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.groupsTab.click();
    await page.waitForTimeout(500);

    const cards = admin.allGroupCards;
    if (await cards.count() > 0) {
      await cards.first().click();
      await expect(admin.groupForm).toBeVisible({ timeout: 5000 });

      const deleteBtn = admin.groupDeleteBtn;
      if (await deleteBtn.isVisible({ timeout: 3000 })) {
        await deleteBtn.click();
        await expect(admin.groupDeleteModal).toBeVisible({ timeout: 3000 });

        // Cancel
        await admin.groupCancelDeleteBtn.click();
        await expect(admin.groupDeleteModal).not.toBeVisible({ timeout: 3000 });
      }
    }
  });
});
