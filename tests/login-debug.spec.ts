import { test, expect } from '@playwright/test';

test.describe('Login Debug Tests', () => {
  test('debug admin login authentication', async ({ page }) => {
    console.log('🧪 Starting login debug test...');

    // Enable console logging
    page.on('console', msg => console.log(`Browser: ${msg.text()}`));
    page.on('pageerror', error => console.log(`Page error: ${error.message}`));
    page.on('requestfailed', request => console.log(`Request failed: ${request.url()}`));

    // Navigate to signin page
    await page.goto('/auth/signin');
    console.log('✅ Navigated to signin page');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check if the form elements exist
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    console.log('✅ Login form elements are visible');

    // Fill in credentials
    await emailInput.fill('admin@example.com');
    await passwordInput.fill('password123');
    console.log('✅ Filled in credentials');

    // Take screenshot before login
    await page.screenshot({ path: 'tests/screenshots/before-login.png' });

    // Click login button
    await submitButton.click();
    console.log('✅ Clicked login button');

    // Wait for response and check what happens
    await page.waitForTimeout(3000);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'tests/screenshots/after-login-attempt.png' });

    // Check current URL
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Check if we're redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful - redirected to dashboard');

      // Check if admin navigation is visible
      const adminSection = page.locator('text=Administration');
      await expect(adminSection).toBeVisible();
      console.log('✅ Admin navigation section is visible');

      // Check for webhook and audit links
      const webhooksLink = page.locator('a[href="/dashboard/admin/webhooks"]');
      const auditLink = page.locator('a[href="/dashboard/admin/audit"]');

      if (await webhooksLink.isVisible()) {
        console.log('✅ Webhooks link is visible');
      } else {
        console.log('❌ Webhooks link is not visible');
      }

      if (await auditLink.isVisible()) {
        console.log('✅ Audit logs link is visible');
      } else {
        console.log('❌ Audit logs link is not visible');
      }

    } else if (currentUrl.includes('/signin')) {
      console.log('❌ Still on signin page - login failed');

      // Check for error messages
      const errorMessage = page.locator('text="Invalid email or password"').or(page.locator('text="An error occurred"')).or(page.locator('.text-red-600'));
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('❌ Error message:', errorText);
      } else {
        console.log('❌ No visible error message');
      }

      // Check browser network tab for failed requests
      console.log('🔍 Checking for failed authentication requests...');

    } else {
      console.log('⚠️ Unexpected URL:', currentUrl);
    }

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/final-state.png' });
  });

  test('test webhook management page access', async ({ page }) => {
    console.log('🧪 Testing webhook management page access...');

    // Try to access webhook page directly
    await page.goto('/dashboard/admin/webhooks');

    // Should redirect to signin if not authenticated
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/signin')) {
      console.log('✅ Correctly redirected to signin (not authenticated)');

      // Login
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();

      // Wait for redirect
      await page.waitForTimeout(3000);

      if (page.url().includes('/webhooks')) {
        console.log('✅ Successfully accessed webhook management page after login');

        // Check if webhook UI components are loaded
        const createButton = page.locator('button:has-text("Add Webhook")');
        if (await createButton.isVisible()) {
          console.log('✅ Webhook management UI is loaded');
        }
      }
    }
  });

  test('test audit logs page access', async ({ page }) => {
    console.log('🧪 Testing audit logs page access...');

    // Try to access audit page directly
    await page.goto('/dashboard/admin/audit');

    // Should redirect to signin if not authenticated
    await page.waitForLoadState('networkidle');

    if (page.url().includes('/signin')) {
      console.log('✅ Correctly redirected to signin (not authenticated)');

      // Login
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.locator('button[type="submit"]').click();

      // Wait for redirect
      await page.waitForTimeout(3000);

      if (page.url().includes('/audit')) {
        console.log('✅ Successfully accessed audit logs page after login');

        // Check if audit UI components are loaded
        const filterSection = page.locator('text=Filters');
        if (await filterSection.isVisible()) {
          console.log('✅ Audit logs UI is loaded');
        }
      }
    }
  });
});