/**
 * Authentication helper utilities for Playwright tests
 * SIMPLIFIED VERSION - Focus on making it work!
 */

/**
 * Login as admin user
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} user - User credentials {username, password}
 */
export async function login(page, user) {
  console.log('🔐 Starting login for:', user.username);
  
  // Go to login page
  await page.goto('/login');
  console.log('📍 Navigated to /login');
  
  // Wait for and click local login button
  await page.waitForSelector('[data-testid="local-login-button"]', { state: 'visible', timeout: 10000 });
  console.log('✅ Found local login button');
  
  await page.click('[data-testid="local-login-button"]');
  console.log('👆 Clicked local login button');
  
  // Wait for form
  await page.waitForSelector('[data-testid="username-input"]', { state: 'visible', timeout: 10000 });
  console.log('✅ Form appeared');
  
  // Fill username
  await page.fill('[data-testid="username-input"]', user.username);
  console.log('📝 Filled username:', user.username);
  
  // Fill password
  await page.fill('[data-testid="password-input"]', user.password);
  console.log('📝 Filled password: ****');
  
  // Try pressing Enter
  console.log('⏎ Pressing Enter...');
  await page.press('[data-testid="password-input"]', 'Enter');
  
  // Wait a bit
  await page.waitForTimeout(2000);
  
  // Check current URL
  const currentUrl = page.url();
  console.log('📍 Current URL after Enter:', currentUrl);
  
  // If still on login, try clicking the button
  if (currentUrl.includes('/login')) {
    console.log('⚠️ Still on login page, trying to click button...');
    
    const submitButton = page.locator('[data-testid="login-submit-button"]');
    const isVisible = await submitButton.isVisible();
    const isEnabled = await submitButton.isEnabled();
    
    console.log('🔘 Button visible:', isVisible, 'enabled:', isEnabled);
    
    if (isVisible && isEnabled) {
      await submitButton.click();
      console.log('👆 Clicked submit button');
      await page.waitForTimeout(2000);
    }
  }
  
  // Final URL check
  const finalUrl = page.url();
  console.log('📍 Final URL:', finalUrl);
  
  if (finalUrl.includes('/login')) {
    console.log('❌ Login failed - still on login page');
    
    // Check for error messages
    const errorElement = page.locator('.login-form__error, .error, [class*="error"]');
    if (await errorElement.isVisible({ timeout: 1000 })) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error message:', errorText);
    }
  } else {
    console.log('✅ Login successful - redirected to:', finalUrl);
  }
  
  // Wait for network to settle
  await page.waitForLoadState('networkidle', { timeout: 10000 });
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
