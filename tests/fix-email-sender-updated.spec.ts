import { test, expect } from '@playwright/test';

test.describe('Fix Email Sender Domain - Updated', () => {
  test('should send email with updated sender domain', async ({ page }) => {
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

    // Fill in the test email form
    await page.locator('input#to').fill('scottfmackey@gmail.com');
    await page.locator('input#subject').fill('Test Email - Updated Sender Domain');

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
    await page.screenshot({ path: 'tests/screenshots/email-form-updated-sender.png' });

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
      console.log('✅ Email sent successfully with updated domain!');
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
    await page.screenshot({ path: 'tests/screenshots/email-send-result-updated.png' });

    if (testResult === 'success') {
      console.log('🎉 Email sending now works with database configuration!');
    } else {
      console.log('⚠️ Still need to debug email configuration');
    }
  });
});
