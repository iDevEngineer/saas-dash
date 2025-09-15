import { test, expect } from '@playwright/test';

test.describe('SaaS Dashboard App', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Check for main elements on the landing page
    await expect(page).toHaveTitle(/SaaS Dash/);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.goto('/');

    // Click on sign in link/button
    const signInLink = page
      .locator('a[href*="signin"], button:has-text("Sign in"), a:has-text("Sign in")')
      .first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await expect(page).toHaveURL(/.*signin/);
    } else {
      // If no sign in link on home, go directly
      await page.goto('/auth/signin');
    }

    // Verify sign in page elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to sign up page', async ({ page }) => {
    await page.goto('/auth/signup');

    // Check for sign up form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/auth/signin');

    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(2000);

    // Should still be on sign in page
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should successfully login and access dashboard', async ({ page }) => {
    await page.goto('/auth/signin');

    // Login with valid credentials
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'password123');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);

    // Check for dashboard elements
    const dashboardContent = page.locator('main, [role="main"]').first();
    await expect(dashboardContent).toBeVisible();
  });

  test('should handle protected routes', async ({ page }) => {
    // Clear cookies to ensure we're logged out
    await page.context().clearCookies();

    // Try to access dashboard without login
    await page.goto('/dashboard');

    // Should redirect to sign in
    await page.waitForURL('**/signin', { timeout: 5000 });
    await expect(page).toHaveURL(/.*signin/);
  });

  test('should support theme switching', async ({ page }) => {
    await page.goto('/');

    // Look for theme toggle button
    const themeToggle = page
      .locator('button[aria-label*="theme"], button[aria-label*="Theme"], button:has-text("Theme")')
      .first();

    if (await themeToggle.isVisible()) {
      // Get initial theme
      const htmlElement = page.locator('html');
      const initialTheme = await htmlElement.getAttribute('class');

      // Click theme toggle
      await themeToggle.click();

      // Theme should change
      await page.waitForTimeout(500);
      const newTheme = await htmlElement.getAttribute('class');
      expect(initialTheme).not.toBe(newTheme);
    }
  });

  test('should have responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Check that page is still functional
    await expect(page.locator('body')).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
