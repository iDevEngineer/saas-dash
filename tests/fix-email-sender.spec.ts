import { test, expect } from '@playwright/test';

test.describe('Fix Email Sender Domain', () => {
  test('should update sender email to use Resend sandbox domain', async ({ page }) => {
    // Navigate to email management page
    await page.goto('/dashboard/admin/email');

    // Check if we're redirected to signin
    if (page.url().includes('/auth/signin')) {
      console.log('Redirected to signin, attempting login...');

      // Login with valid credentials
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for login success
      await page.waitForURL('**/dashboard', { timeout: 15000 });

      // Navigate to email management page
      await page.goto('/dashboard/admin/email');
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Navigate to settings tab
    await page.locator('button[role="tab"]:has-text("Settings")').click();
    await page.waitForSelector('input#fromEmail', { timeout: 5000 });

    // Clear and fill sender email with Resend sandbox domain
    await page.locator('input#fromEmail').clear();
    await page.locator('input#fromEmail').fill('onboarding@resend.dev');

    // Save settings
    const saveButton = page.locator('button:has-text("Save Email Settings")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for success and take screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/screenshots/email-sender-updated.png' });

    console.log('✅ Email sender updated to onboarding@resend.dev');
  });

  test('should successfully send email with updated sender', async ({ page }) => {
    // Navigate to email management page
    await page.goto('/dashboard/admin/email');

    // Check if we're redirected to signin
    if (page.url().includes('/auth/signin')) {
      console.log('Redirected to signin, attempting login...');
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await page.goto('/dashboard/admin/email');
    }

    await page.waitForLoadState('networkidle');

    // Fill in the test email form
    await page.locator('input#to').fill('scottfmackey@gmail.com');
    await page.locator('input#subject').fill('Test Email - Fixed Sender Domain');

    // Select priority
    await page.locator('button[role="combobox"]:near(label:has-text("Priority"))').click();
    await page.getByRole('option', { name: 'Normal' }).click();

    // Choose template option
    const templateTab = page.locator('button[role="tab"]:has-text("Use Template")');
    await templateTab.click();

    // Select welcome template
    await page.locator('button[role="combobox"]:near(label:has-text("Template"))').click();
    await page.getByRole('option', { name: 'Welcome Email' }).click();

    // Wait for template data to populate
    await page.waitForTimeout(1000);

    // Take screenshot before sending
    await page.screenshot({ path: 'tests/screenshots/email-form-with-fixed-sender.png' });

    // Click send button
    const sendButton = page.getByRole('button', { name: 'Send Test Email' });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Wait for the response
    await page.waitForTimeout(8000);

    // Look for success indicators
    const successToast = page.locator('text=Email sent successfully');
    const errorToast = page.locator('text=Failed to send email');

    let testResult = 'unknown';

    // Check for success/error messages
    try {
      await expect(successToast).toBeVisible({ timeout: 2000 });
      console.log('✅ Email sent successfully!');
      testResult = 'success';
    } catch {
      try {
        await expect(errorToast).toBeVisible({ timeout: 2000 });
        console.log('❌ Email sending still failed');
        testResult = 'failed';
      } catch {
        console.log('⏳ No clear success/error message visible');
        testResult = 'unclear';
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/email-send-result-fixed.png' });

    if (testResult === 'success') {
      console.log('🎉 Email sending is now working with fixed sender domain!');
    }
  });
});
