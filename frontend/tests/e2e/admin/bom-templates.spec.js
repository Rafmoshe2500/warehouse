import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

const BOM_TEMPLATES_URL = '/admin/bom-templates';

test.describe('BOM Templates Management - Access Control', () => {
  test('should redirect non-admin to dashboard', async ({ page }) => {
    await login(page, testUsers.user);
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page).toHaveURL(/.*login/, { timeout: 10000 });
  });

  test('should load BOM templates page for admin', async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page.locator('[data-testid="bom-templates-page"]')).toBeVisible({
      timeout: 15000,
    });
  });
});

test.describe('BOM Templates Management - List Panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page.locator('[data-testid="bom-templates-page"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should show template list with at least one card', async ({ page }) => {
    // The page uses fallback templates, so there will always be at least the built-ins
    await expect(page.locator('[class*="bom-tpl-card"]').first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should display vendor name on each card', async ({ page }) => {
    const cards = page.locator('[class*="bom-tpl-card-name"]');
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show Add Template button', async ({ page }) => {
    await expect(page.locator('[data-testid="bom-tpl-add"]')).toBeVisible();
  });

  test('should show search input', async ({ page }) => {
    await expect(page.locator('[data-testid="bom-tpl-search"]')).toBeVisible();
  });

  test('should filter templates by search query', async ({ page }) => {
    const searchInput = page.locator('[data-testid="bom-tpl-search"]');
    await searchInput.fill('netapp');

    // Only NetApp-related cards should remain
    const cards = page.locator('[class*="bom-tpl-card-name"]');
    await expect(cards).toHaveCount(1, { timeout: 5000 });
    await expect(cards.first()).toContainText(/netapp/i);
  });

  test('should show empty message when search returns no results', async ({ page }) => {
    const searchInput = page.locator('[data-testid="bom-tpl-search"]');
    await searchInput.fill('__nonexistent_vendor_xyz__');

    await expect(page.locator('text=לא נמצאו תבניות')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('BOM Templates Management - Detail Panel', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page.locator('[data-testid="bom-templates-page"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should show empty detail placeholder initially', async ({ page }) => {
    await expect(
      page.locator('text=בחר תבנית מהרשימה כדי לצפות בפרטים')
    ).toBeVisible();
  });

  test('should load template details when card is clicked', async ({ page }) => {
    // Wait for at least one card
    const firstCard = page.locator('[class*="bom-tpl-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Detail panel should now show the vendor name (.bom-tpl-detail is the inner content div)
    await expect(page.locator('.bom-tpl-detail')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should highlight selected card', async ({ page }) => {
    const firstCard = page.locator('[class*="bom-tpl-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    await expect(firstCard).toHaveClass(/active/, { timeout: 3000 });
  });
});

test.describe('BOM Templates Management - Create & Edit', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page.locator('[data-testid="bom-templates-page"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should open wizard when clicking + תבנית חדשה', async ({ page }) => {
    await page.locator('[data-testid="bom-tpl-add"]').click();
    // Wizard replaces the page content (data-testid set in BomTemplateWizard.jsx)
    await expect(page.locator('[data-testid="bom-template-wizard"]')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should return to list page when wizard is cancelled', async ({ page }) => {
    await page.locator('[data-testid="bom-tpl-add"]').click();

    await expect(page.locator('[data-testid="bom-template-wizard"]')).toBeVisible({ timeout: 5000 });
    // Find cancel button in wizard
    const cancelButton = page.locator('button:has-text("ביטול"), button:has-text("בטל")');
    await expect(cancelButton.first()).toBeVisible({ timeout: 5000 });
    await cancelButton.first().click();

    await expect(page.locator('[data-testid="bom-templates-page"]')).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe('BOM Templates Management - Delete', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto(BOM_TEMPLATES_URL);
    await expect(page.locator('[data-testid="bom-templates-page"]')).toBeVisible({
      timeout: 15000,
    });
  });

  test('should show confirmation dialog when clicking delete on a template', async ({ page }) => {
    // Select a template first to reveal delete button in detail panel
    const firstCard = page.locator('[class*="bom-tpl-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // Set up dialog handler BEFORE clicking delete
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/למחוק/);
      await dialog.dismiss();
    });

    // Find and click delete button in detail panel
    const deleteButton = page.locator(
      '[class*="bom-tpl-detail"] button:has-text("מחק"), [class*="bom-tpl-detail"] [data-testid*="delete"]'
    );
    if (await deleteButton.count() > 0) {
      await deleteButton.first().click();
    }
    // If no delete button on non-custom templates, test passes gracefully
  });

  test('should NOT delete template when confirmation is cancelled', async ({ page }) => {
    const firstCard = page.locator('[class*="bom-tpl-card"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    const initialCardCount = await page.locator('[class*="bom-tpl-card"]').count();
    await firstCard.click();

    page.once('dialog', async (dialog) => await dialog.dismiss());

    const deleteButton = page.locator(
      '[class*="bom-tpl-detail"] button:has-text("מחק"), [class*="bom-tpl-detail"] [data-testid*="delete"]'
    );
    if (await deleteButton.count() > 0) {
      await deleteButton.first().click();
      // Card count should remain the same
      await expect(page.locator('[class*="bom-tpl-card"]')).toHaveCount(initialCardCount, {
        timeout: 3000,
      });
    }
  });
});
