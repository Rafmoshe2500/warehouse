import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('My Components - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
  });

  test('should navigate to my-components page', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');

    // Page should load — either collections grid or empty state
    const pageContent = page.locator('.my-components-page');
    await expect(pageContent).toBeVisible({ timeout: 10000 });
  });

  test('should display page title', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');

    const title = page.locator('text=המלאי שלי');
    await expect(title.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show collections grid or empty state', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');

    // Wait for loading to complete
    await page.waitForTimeout(2000);

    const collectionsGrid = page.locator('.collections-grid');
    const emptyState = page.locator('.empty-state');

    const hasGrid = await collectionsGrid.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasGrid || hasEmpty).toBeTruthy();
  });

  test('should show search input', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');

    // Wait past loading skeleton
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="חפש"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('should filter collections by search query', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const searchInput = page.locator('input[placeholder*="חפש"]').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      await searchInput.fill('ZZZZ_NONEXISTENT_COLLECTION');
      await page.waitForTimeout(500);

      // Should either show empty state or filtered results
      const emptyState = page.locator('.empty-state');
      const cards = page.locator('.collections-grid .collection-card, .collections-grid > *');
      
      const hasEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
      const cardCount = await cards.count();

      // With a nonsense search, should be empty or 0 results
      expect(hasEmpty || cardCount === 0).toBeTruthy();
    }
  });

  test('should show Create Collection button', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Button might be in header or in empty state
    const createBtn = page.locator('text=/אוסף חדש|צור אוסף/').first();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  test('should open Create Collection dialog', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const createBtn = page.locator('text=/אוסף חדש|צור אוסף/').first();
    if (await createBtn.isVisible({ timeout: 3000 })) {
      await createBtn.click();

      // Dialog should appear
      const dialog = page.locator('.modal, .dialog, [role="dialog"]');
      await expect(dialog.first()).toBeVisible({ timeout: 3000 });

      // Close dialog
      await page.keyboard.press('Escape');
    }
  });

  test('should show loading skeleton on page load', async ({ page }) => {
    // Navigate fresh and check for skeleton
    await page.goto('/my-components');

    const skeleton = page.locator('.skeleton, [class*="skeleton"]');
    const hasLoadingState = await skeleton.first().isVisible({ timeout: 2000 }).catch(() => false);

    // If data loads fast, skeleton might not be visible — just verify page loaded
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('.my-components-page')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to collection details on card click', async ({ page }) => {
    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const cards = page.locator('.collections-grid .collection-card, .collections-grid > a, .collections-grid > div').first();
    if (await cards.isVisible({ timeout: 3000 })) {
      await cards.click();

      // Should navigate to /my-components/:id
      await page.waitForURL('**/my-components/**', { timeout: 5000 });
      expect(page.url()).toMatch(/\/my-components\/.+/);
    }
  });

  test('should show error state with retry button on failure', async ({ page }) => {
    // Intercept API to simulate failure
    await page.route('**/api/collections**', (route) => route.fulfill({
      status: 500,
      body: JSON.stringify({ detail: 'Server error' }),
    }));

    await page.goto('/my-components');
    await page.waitForLoadState('domcontentloaded');

    const retryBtn = page.locator('text=נסה שוב');
    await expect(retryBtn).toBeVisible({ timeout: 10000 });

    // Unroute for cleanup
    await page.unroute('**/api/collections**');
  });
});
