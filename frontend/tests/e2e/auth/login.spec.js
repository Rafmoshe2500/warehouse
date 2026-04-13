import { test, expect } from '@playwright/test';
import { login, logout } from '../../utils/auth-helper.js';
import { testUsers } from '../../fixtures/test-data.js';

test.describe('Login Page - Local Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login selection page', async ({ page }) => {
    // Check page title — scoped to the login‐selection section to avoid the app Header h1
    await expect(page.locator('.login-selection h1')).toContainText(/מערכת ניהול מלאי/);
    
    // Check selection text
    await expect(page.locator('text=בחר אופן התחברות')).toBeVisible();
    
    // Check both login buttons exist (using data-testid)
    await expect(page.locator('[data-testid="local-login-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="domain-login-button"]')).toBeVisible();
  });

  test('should show local login form after clicking local button', async ({ page }) => {
    // Click local login button (using data-testid)
    await page.click('[data-testid="local-login-button"]');
    
    // Form should appear (using data-testid)
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-submit-button"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Use admin user for testing
    await login(page, testUsers.admin);
    
    // Should redirect away from login page
    const url = page.url();
    expect(url).not.toContain('/login');
    
    // Should show navigation
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Click local login (using data-testid)
    await page.click('[data-testid="local-login-button"]');
    
    // Wait for form
    await page.waitForSelector('[data-testid="username-input"]');
    
    // Fill in invalid credentials
    await page.fill('[data-testid="username-input"]', 'invaliduser');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit with Enter key
    await page.press('[data-testid="password-input"]', 'Enter');
    
    // Wait a bit for response
    await page.waitForTimeout(2000);
    
    // Should stay on login page
    const url = page.url();
    expect(url).toContain('login');
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    await login(page, testUsers.admin);
    
    // Verify we're logged in (not on login page)
    let url = page.url();
    expect(url).not.toContain('/login');
    
    // Then logout
    await logout(page);
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});
