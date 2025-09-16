import { test, expect } from '@playwright/test';

test.describe('Authentication Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage
    await page.context().clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should load sign-in page', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');

    // Check if sign-in page loads
    await expect(page).toHaveURL(/.*signin/);

    // Take screenshot for debugging
    await page.screenshot({ path: 'tests/screenshots/signin-page.png', fullPage: true });

    // Check for form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[id="email"]');
    const passwordInput = page.locator(
      'input[type="password"], input[name="password"], input[id="password"]'
    );

    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });

    console.log('✅ Sign-in page loaded successfully');
  });

  test('should attempt login with test credentials', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signin');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Find and fill email field
    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[id="email"]')
      .first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('admin@example.com');

    // Find and fill password field
    const passwordInput = page
      .locator('input[type="password"], input[name="password"], input[id="password"]')
      .first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('password123');

    // Take screenshot before submitting
    await page.screenshot({ path: 'tests/screenshots/before-submit.png', fullPage: true });

    // Listen for network requests
    page.on('request', (request) => {
      if (request.url().includes('/api/auth')) {
        console.log('>> Auth Request:', request.method(), request.url());
        console.log('   Headers:', request.headers());
        console.log('   Post Data:', request.postData());
      }
    });

    page.on('response', (response) => {
      if (response.url().includes('/api/auth')) {
        console.log('<< Auth Response:', response.status(), response.url());
        response
          .text()
          .then((body) => {
            console.log('   Response Body:', body);
          })
          .catch(() => {});
      }
    });

    // Find and click submit button
    const submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Sign In")'
      )
      .first();
    await expect(submitButton).toBeVisible();

    // Click with a promise to catch navigation
    const navigationPromise = page
      .waitForNavigation({
        waitUntil: 'networkidle',
        timeout: 10000,
      })
      .catch(() => null);

    await submitButton.click();

    // Wait a bit for the request to complete
    await page.waitForTimeout(3000);

    // Take screenshot after submit
    await page.screenshot({ path: 'tests/screenshots/after-submit.png', fullPage: true });

    // Check for error messages
    const errorMessage = page.locator('[role="alert"], .error, .text-red-500, .text-destructive');
    const hasError = (await errorMessage.count()) > 0;

    if (hasError) {
      const errorText = await errorMessage.first().textContent();
      console.log('❌ Error message found:', errorText);
    }

    // Check if we navigated away from signin
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);

    if (currentUrl.includes('signin')) {
      console.log('❌ Still on sign-in page - authentication likely failed');
    } else {
      console.log('✅ Navigated away from sign-in page');
    }

    await navigationPromise;
  });

  test('should test API endpoint directly', async ({ request }) => {
    // Test the auth endpoint directly
    const response = await request.post('http://localhost:3000/api/auth/sign-in/email', {
      data: {
        email: 'admin@example.com',
        password: 'password123',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('API Response Status:', response.status());
    console.log('API Response Headers:', response.headers());

    const responseBody = await response.text();
    console.log('API Response Body:', responseBody);

    if (response.ok()) {
      console.log('✅ API authentication successful');

      // Check for cookies
      const cookies = await response.headers();
      console.log('Cookies:', cookies['set-cookie']);
    } else {
      console.log('❌ API authentication failed');

      // Try to parse error
      try {
        const error = JSON.parse(responseBody);
        console.log('Error details:', error);
      } catch {
        console.log('Response is not JSON:', responseBody);
      }
    }
  });
});
