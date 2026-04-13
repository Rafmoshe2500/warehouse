import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { AdminPageObject } from '../../utils/page-objects/AdminPage.js';
import { AdminApiHelper } from '../../utils/admin-api-helper.js';
import { testUsers, adminTestData } from '../../fixtures/test-data.js';

const api = new AdminApiHelper();

test.describe('Admin - User Management', () => {
  test.beforeAll(async () => {
    await api.login(testUsers.admin.username, testUsers.admin.password);
    await api.cleanupUsersByPrefix(adminTestData.PREFIX);
  });

  test.afterAll(async () => {
    await api.cleanup();
    await api.cleanupUsersByPrefix(adminTestData.PREFIX);
  });

  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should display user list', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    // Users tab should be active by default
    await expect(admin.userManagement).toBeVisible();
    const userCards = admin.allUserCards;
    const count = await userCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search users', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.searchUsers('admin');
    await page.waitForTimeout(500);

    // The admin card should be visible
    await expect(admin.userCard('admin')).toBeVisible();
  });

  test('should search with no results', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.searchUsers('ZZZZ_NONEXISTENT_USER');
    await page.waitForTimeout(500);

    // Should show empty state
    const emptyText = page.locator('text=לא נמצאו משתמשים');
    await expect(emptyText).toBeVisible({ timeout: 3000 });
  });

  test('should select user and show details', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    // Click on the admin user card
    await admin.userCard('admin').click();

    // UserForm should appear with the user's details
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state when no user selected', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    // Initially, no user should be selected — empty placeholder should show
    await expect(admin.userEmptyState).toBeVisible();
    await expect(admin.userEmptyState).toContainText('ניהול משתמשים');
  });

  test('should create a new user', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.addUserBtn.click();
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });

    // Fill the user form
    await admin.fillUserForm({
      username: adminTestData.newUser.username,
      password: adminTestData.newUser.password,
      userType: 'local',
    });

    // Toggle inventory:ro permission
    await admin.togglePermission('perm-inventory-ro');

    // Submit
    await admin.userSubmitBtn.click();

    // Wait for success toast
    await admin.waitForToast();
  });

  test('should validate required fields on create', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.addUserBtn.click();
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });

    // Try to submit without filling anything — HTML5 validation should prevent it
    await admin.userSubmitBtn.click();

    // Form should still be visible (not submitted)
    await expect(admin.userForm).toBeVisible();
  });

  test('should update user role', async ({ page }) => {
    // Create a user via API first
    let created;
    try {
      created = await api.createUser({
        username: `${adminTestData.PREFIX}role-test`,
        password: 'TestPass123',
        user_type: 'local',
        role: 'user',
        permissions: [],
        is_active: true,
      });
    } catch {
      // User may already exist from a previous run
    }

    const admin = new AdminPageObject(page);
    await admin.goto();

    // Search and select the user
    await admin.searchUsers(`${adminTestData.PREFIX}role-test`);
    await page.waitForTimeout(500);
    await admin.userCard(`${adminTestData.PREFIX}role-test`).click();
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });

    // Change role to admin
    const roleSelect = admin.roleField;
    if (await roleSelect.isVisible({ timeout: 3000 })) {
      await roleSelect.selectOption('admin');
      await admin.userSubmitBtn.click();
      await admin.waitForToast();
    }
  });

  test('should toggle user active status', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    // Find a test user
    await admin.searchUsers(`${adminTestData.PREFIX}`);
    await page.waitForTimeout(500);

    const cards = admin.allUserCards;
    if (await cards.count() > 0) {
      await cards.first().click();
      await expect(admin.userForm).toBeVisible({ timeout: 5000 });

      const toggle = admin.userActiveToggle;
      if (await toggle.isVisible({ timeout: 3000 })) {
        await toggle.click();
        await admin.userSubmitBtn.click();
        await admin.waitForToast();
      }
    }
  });

  test('should update user permissions', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.searchUsers(`${adminTestData.PREFIX}`);
    await page.waitForTimeout(500);

    const cards = admin.allUserCards;
    if (await cards.count() > 0) {
      await cards.first().click();
      await expect(admin.userForm).toBeVisible({ timeout: 5000 });

      // Toggle inventory:rw permission
      await admin.togglePermission('perm-inventory-rw');
      await admin.userSubmitBtn.click();
      await admin.waitForToast();
    }
  });

  test('should delete user with reason', async ({ page }) => {
    // Create a fresh user to delete
    await api.createUser({
      username: `${adminTestData.PREFIX}delete-me`,
      password: 'TestPass123',
      user_type: 'local',
      role: 'user',
      permissions: [],
      is_active: true,
    });

    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.searchUsers(`${adminTestData.PREFIX}delete-me`);
    await page.waitForTimeout(500);
    await admin.userCard(`${adminTestData.PREFIX}delete-me`).click();
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });

    // Click delete
    await admin.userDeleteBtn.click();
    await expect(admin.userDeleteModal).toBeVisible({ timeout: 3000 });

    // Fill reason and confirm
    await admin.confirmUserDelete('E2E test cleanup');
    await admin.waitForToast();
  });

  test('should require reason for deletion', async ({ page }) => {
    // Create a user to delete
    await api.createUser({
      username: `${adminTestData.PREFIX}noreason`,
      password: 'TestPass123',
      user_type: 'local',
      role: 'user',
      permissions: [],
      is_active: true,
    });

    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.searchUsers(`${adminTestData.PREFIX}noreason`);
    await page.waitForTimeout(500);
    await admin.userCard(`${adminTestData.PREFIX}noreason`).click();
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });

    await admin.userDeleteBtn.click();
    await expect(admin.userDeleteModal).toBeVisible({ timeout: 3000 });

    // Click confirm without filling reason
    await admin.confirmDeleteBtn.click();

    // Modal should still be visible (reason required)
    await expect(admin.userDeleteModal).toBeVisible();
  });

  test('should cancel deletion', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    await admin.searchUsers(`${adminTestData.PREFIX}`);
    await page.waitForTimeout(500);

    const cards = admin.allUserCards;
    if (await cards.count() > 0) {
      await cards.first().click();
      await expect(admin.userForm).toBeVisible({ timeout: 5000 });

      const deleteBtn = admin.userDeleteBtn;
      if (await deleteBtn.isVisible({ timeout: 3000 })) {
        await deleteBtn.click();
        await expect(admin.userDeleteModal).toBeVisible({ timeout: 3000 });

        // Cancel
        await admin.cancelDeleteBtn.click();
        await expect(admin.userDeleteModal).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should not show delete for superadmin', async ({ page }) => {
    const admin = new AdminPageObject(page);
    await admin.goto();

    // Click on the admin (superadmin) user
    await admin.userCard('admin').click();
    await expect(admin.userForm).toBeVisible({ timeout: 5000 });

    // Delete button should NOT be visible for superadmin
    await expect(admin.userDeleteBtn).not.toBeVisible({ timeout: 3000 });
  });
});
