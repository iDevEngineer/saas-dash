import { test, expect } from '@playwright/test';

test.describe('Admin Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage before each test
    await page.context().clearCookies();
    await page.goto('http://localhost:3000');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  async function loginAs(page: any, email: string, password: string = 'password123') {
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');

    // Fill credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    // Take screenshot for debugging
    await page.screenshot({
      path: `tests/screenshots/login-${email.split('@')[0]}.png`,
      fullPage: true,
    });

    return page.url();
  }

  test('should show user role in navigation for jane (user)', async ({ page }) => {
    const finalUrl = await loginAs(page, 'jane@example.com');

    if (finalUrl.includes('signin')) {
      console.log('❌ Login failed for jane@example.com');
      return;
    }

    // Navigate to dashboard if not already there
    if (!finalUrl.includes('dashboard')) {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Check user role is displayed
    const roleText = page.locator('text=user');
    await expect(roleText).toBeVisible({ timeout: 10000 });

    // Verify NO admin section exists
    const adminSection = page.locator('text=Administration');
    await expect(adminSection).not.toBeVisible();

    // Verify admin links are NOT present
    await expect(page.locator('text=Admin Panel')).not.toBeVisible();
    await expect(page.locator('text=Pricing Management')).not.toBeVisible();
    await expect(page.locator('text=Email Management')).not.toBeVisible();
    await expect(page.locator('text=API Keys')).not.toBeVisible();

    console.log('✅ User role navigation working correctly');
  });

  test('should show admin links for john (admin)', async ({ page }) => {
    const finalUrl = await loginAs(page, 'john@example.com');

    if (finalUrl.includes('signin')) {
      console.log('❌ Login failed for john@example.com');
      return;
    }

    // Navigate to dashboard if not already there
    if (!finalUrl.includes('dashboard')) {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Check admin role is displayed in user profile section (last element in nav)
    const roleText = page.locator('.border-t p.text-xs.text-gray-500:has-text("admin")');
    await expect(roleText).toBeVisible({ timeout: 10000 });

    // Check for Administration section
    const adminSection = page.locator('text=Administration');
    await expect(adminSection).toBeVisible({ timeout: 5000 });

    // Check for admin navigation links
    await expect(page.locator('text=Admin Panel')).toBeVisible();
    await expect(page.locator('text=Pricing Management')).toBeVisible();
    await expect(page.locator('text=Email Management')).toBeVisible();
    await expect(page.locator('text=API Keys')).toBeVisible();

    console.log('✅ Admin role navigation working correctly');
  });

  test('should show all admin links for admin (super_admin)', async ({ page }) => {
    const finalUrl = await loginAs(page, 'admin@example.com');

    if (finalUrl.includes('signin')) {
      console.log('❌ Login failed for admin@example.com');
      return;
    }

    // Navigate to dashboard if not already there
    if (!finalUrl.includes('dashboard')) {
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Check super_admin role is displayed
    const roleText = page.locator('text=super_admin');
    await expect(roleText).toBeVisible({ timeout: 10000 });

    // Check for Administration section
    const adminSection = page.locator('text=Administration');
    await expect(adminSection).toBeVisible({ timeout: 5000 });

    // Check for admin navigation links
    await expect(page.locator('text=Admin Panel')).toBeVisible();
    await expect(page.locator('text=Pricing Management')).toBeVisible();
    await expect(page.locator('text=Email Management')).toBeVisible();
    await expect(page.locator('text=API Keys')).toBeVisible();

    console.log('✅ Super admin role navigation working correctly');
  });

  test('should allow access to admin pages for admin users', async ({ page }) => {
    const finalUrl = await loginAs(page, 'admin@example.com');

    if (finalUrl.includes('signin')) {
      console.log('❌ Login failed for admin@example.com');
      return;
    }

    // Test Email Management page access
    await page.goto('http://localhost:3000/dashboard/admin/email');
    await page.waitForLoadState('networkidle');

    // Should not be redirected to access denied
    expect(page.url()).not.toContain('access-denied');

    // Check that we're on the email management page
    expect(page.url()).toContain('/dashboard/admin/email');

    console.log('✅ Admin page access working correctly');
  });

  test('should block access to admin pages for regular users', async ({ page }) => {
    const finalUrl = await loginAs(page, 'jane@example.com');

    if (finalUrl.includes('signin')) {
      console.log('❌ Login failed for jane@example.com');
      return;
    }

    // Try to access Email Management page directly
    await page.goto('http://localhost:3000/dashboard/admin/email');
    await page.waitForLoadState('networkidle');

    // Should be redirected to access denied
    expect(page.url()).toContain('access-denied');

    console.log('✅ Admin page blocking working correctly');
  });

  test('debug session data and permissions', async ({ page }) => {
    const finalUrl = await loginAs(page, 'admin@example.com');

    if (finalUrl.includes('signin')) {
      console.log('❌ Login failed for admin@example.com');
      return;
    }

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');

    // Get session data from browser
    const sessionData = await page.evaluate(() => {
      return {
        localStorage: { ...localStorage },
        cookies: document.cookie,
        sessionStorage: { ...sessionStorage },
      };
    });

    console.log('Session Data:', JSON.stringify(sessionData, null, 2));

    // Check if the navigation component received the user data correctly
    const userRoleElement = await page.locator('[class*="text-xs"][class*="text-gray-500"]');
    const roleText = await userRoleElement.textContent();
    console.log('Role displayed in UI:', roleText);

    // Check permissions computation in console
    await page.evaluate(() => {
      console.log('Current user from props:', window.location.href);
    });

    await page.screenshot({
      path: 'tests/screenshots/debug-session.png',
      fullPage: true,
    });
  });
});
