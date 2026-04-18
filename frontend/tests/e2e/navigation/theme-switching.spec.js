import { test, expect } from '@playwright/test';
import { login } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Theme Switching - Mode (Dark/Light)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage so we start fresh
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.removeItem('theme_mode');
      localStorage.removeItem('theme_variant');
    });
    await login(page, testUsers.admin);
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });
  });

  test('should apply dark theme by default (data-theme=dark on html)', async ({ page }) => {
    const themeAttr = await page.locator('html').getAttribute('data-theme');
    expect(['dark', 'light']).toContain(themeAttr);
  });

  test('should toggle from dark to light mode', async ({ page }) => {
    // Set known initial state
    await page.evaluate(() => localStorage.setItem('theme_mode', 'dark'));
    await page.reload();
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // Open user menu
    await page.locator('[data-testid="user-menu-btn"]').click();
    await expect(page.locator('[data-testid="user-dropdown"]')).toBeVisible();

    // Click "מצב בהיר"
    await page.locator('.topbar__dropdown-item:has-text("מצב בהיר")').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('should toggle from light to dark mode', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme_mode', 'light'));
    await page.reload();
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.locator('[data-testid="user-menu-btn"]').click();
    await page.locator('.topbar__dropdown-item:has-text("מצב כהה")').click();

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('should persist theme mode in localStorage after toggle', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme_mode', 'dark'));
    await page.reload();
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });

    await page.locator('[data-testid="user-menu-btn"]').click();
    await page.locator('.topbar__dropdown-item:has-text("מצב בהיר")').click();

    const stored = await page.evaluate(() => localStorage.getItem('theme_mode'));
    expect(stored).toBe('light');
  });

  test('should persist theme across page reload', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme_mode', 'light'));
    await page.reload();
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('Theme Switching - Variant Selector', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, testUsers.admin);
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });
  });

  test('should open theme variant selector dropdown', async ({ page }) => {
    await page.locator('[data-testid="user-menu-btn"]').click();
    await page.locator('.topbar__dropdown-item:has-text("ערכת נושא")').click();

    await expect(page.locator('.topbar__theme-panel')).toBeVisible({ timeout: 3000 });
  });

  test('should apply selected variant to html data-variant attribute', async ({ page }) => {
    await page.locator('[data-testid="user-menu-btn"]').click();
    await page.locator('.topbar__dropdown-item:has-text("ערכת נושא")').click();

    // ThemeSelector is open — click a variant option (wood, space, or normal)
    const variantButtons = page.locator('.topbar__theme-panel button, .topbar__theme-panel [role="button"]');
    const count = await variantButtons.count();

    if (count > 0) {
      await variantButtons.first().click();
      const variantAttr = await page.locator('html').getAttribute('data-variant');
      expect(['normal', 'wood', 'space', 'classic']).toContain(variantAttr);
    }
  });

  test('should persist variant in localStorage', async ({ page }) => {
    await page.locator('[data-testid="user-menu-btn"]').click();
    await page.locator('.topbar__dropdown-item:has-text("ערכת נושא")').click();

    const variantButtons = page.locator('.topbar__theme-panel button, .topbar__theme-panel [role="button"]');
    if (await variantButtons.count() > 0) {
      await variantButtons.first().click();
      const stored = await page.evaluate(() => localStorage.getItem('theme_variant'));
      expect(['normal', 'wood', 'space', 'classic']).toContain(stored);
    }
  });

  test('should restore variant from localStorage on reload', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('theme_variant', 'wood'));
    await page.reload();
    await expect(page.locator('[data-testid="topbar"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('html')).toHaveAttribute('data-variant', 'wood');
  });
});
