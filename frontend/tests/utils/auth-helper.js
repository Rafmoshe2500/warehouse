/**
 * Authentication helper utilities for Playwright tests
 */

const LOGIN_TIMEOUT = 15000;

/**
 * Login as a given user via the local login form.
 * Waits for a navigation response (token) rather than relying on
 * networkidle or button-enabled state, which caused timeouts.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ username: string, password: string }} user
 */
export async function login(page, user) {
  // Clear any existing session so LoginPage doesn't auto-redirect authenticated users
  await page.context().clearCookies();

  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Click local login button to reveal the credentials form
  await page.locator('[data-testid="local-login-button"]').click({ timeout: LOGIN_TIMEOUT });

  // Wait for credential inputs to appear
  const usernameInput = page.locator('[data-testid="username-input"]');
  await usernameInput.waitFor({ state: 'visible', timeout: LOGIN_TIMEOUT });

  // Fill credentials
  await usernameInput.fill(user.username);
  await page.locator('[data-testid="password-input"]').fill(user.password);

  // Submit — listen for the auth API response, then press Enter
  const authResponse = page.waitForResponse(
    (resp) => resp.url().includes('/auth/login') && resp.status() === 200,
    { timeout: LOGIN_TIMEOUT }
  );

  // Try Enter first; fall back to button click if the button is visible
  await page.locator('[data-testid="password-input"]').press('Enter');

  try {
    await authResponse;
  } catch {
    // If Enter didn't trigger the request, click submit button
    const submitBtn = page.locator('[data-testid="login-submit-button"]');
    if (await submitBtn.isVisible({ timeout: 2000 })) {
      const retryResponse = page.waitForResponse(
        (resp) => resp.url().includes('/auth/login') && resp.status() === 200,
        { timeout: LOGIN_TIMEOUT }
      );
      await submitBtn.click();
      await retryResponse;
    }
  }

  // Wait until we've left the login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: LOGIN_TIMEOUT });
}

/**
 * Logout current user
 */
export async function logout(page) {
  const logoutSelectors = [
    '[data-testid="logout-button"]',
    'button:has-text("התנתק")',
    'button:has-text("יציאה")',
    'a:has-text("התנתק")'
  ];
  
  for (const selector of logoutSelectors) {
    try {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) {
        await element.click();
        break;
      }
    } catch (e) {
      continue;
    }
  }
  
  await page.waitForURL('**/login', { timeout: 5000 });
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page) {
  try {
    const url = page.url();
    return !url.includes('/login');
  } catch {
    return false;
  }
}
