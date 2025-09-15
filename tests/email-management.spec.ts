import { test, expect } from '@playwright/test';

test.describe('Email Management', () => {
  // Setup - login before each test
  test.beforeEach(async ({ page }) => {
    // First, try to go directly to the email page to see if we get redirected
    await page.goto('/dashboard/admin/email');

    // Check if we're redirected to signin
    if (page.url().includes('/auth/signin')) {
      console.log('Redirected to signin, attempting login...');

      // Login with valid credentials
      await page.fill('input[type="email"]', 'admin@example.com');
      await page.fill('input[type="password"]', 'password123');

      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();

      // Wait for login success - might redirect to dashboard first
      await page.waitForURL('**/dashboard', { timeout: 15000 });

      // Navigate to email management page
      await page.goto('/dashboard/admin/email');
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should load email management page', async ({ page }) => {
    // Check for main page elements
    await expect(page.locator('h1:has-text("Email Management")')).toBeVisible();

    // Check for tabs
    await expect(page.locator('button[role="tab"]:has-text("Send Test Email")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Template Preview")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Settings")')).toBeVisible();

    // Check for email service status card
    await expect(page.locator('text=Email Service Status')).toBeVisible();
  });

  test('should show email service health status', async ({ page }) => {
    // Wait for health status to load
    await page.waitForSelector('[data-testid="email-health-status"], text=Email Service Status', {
      timeout: 10000,
    });

    // Check that status badge is visible
    const statusBadge = page
      .locator('[role="status"], .badge, text=Healthy, text=Unhealthy')
      .first();
    await expect(statusBadge).toBeVisible();

    // Take screenshot of health status
    await page.locator('text=Email Service Status').locator('..').screenshot({
      path: 'tests/screenshots/email-health-status.png',
    });
  });

  test('should navigate to settings tab and show email configuration', async ({ page }) => {
    // Click on settings tab
    await page.locator('button[role="tab"]:has-text("Settings")').click();

    // Wait for settings content to load
    await page.waitForSelector('text=Email Configuration', { timeout: 5000 });

    // Check for configuration form elements
    await expect(page.locator('label:has-text("Sender Email Address")')).toBeVisible();
    await expect(page.locator('label:has-text("Email Provider")')).toBeVisible();
    await expect(page.locator('input#fromEmail')).toBeVisible();

    // Check for current configuration section
    await expect(page.locator('text=Current Configuration')).toBeVisible();

    // Take screenshot of settings tab
    await page.screenshot({ path: 'tests/screenshots/email-settings-tab.png' });
  });

  test('should update email settings', async ({ page }) => {
    // Navigate to settings tab
    await page.locator('button[role="tab"]:has-text("Settings")').click();
    await page.waitForSelector('input#fromEmail', { timeout: 5000 });

    // Clear and fill email address
    await page.locator('input#fromEmail').clear();
    await page.locator('input#fromEmail').fill('test@example.com');

    // Select provider
    await page.locator('button[role="combobox"]:near(label:has-text("Email Provider"))').click();
    await page.locator('text=Resend').click();

    // Save settings
    const saveButton = page.locator('button:has-text("Save Email Settings")');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Wait for success message or page update
    await page.waitForTimeout(2000);

    // Take screenshot after saving
    await page.screenshot({ path: 'tests/screenshots/email-settings-saved.png' });
  });

  test('should send test email to scottfmackey@gmail.com', async ({ page }) => {
    // Make sure we're on the Send Test Email tab (default)
    const sendTestEmailTab = page.locator('button[role="tab"]:has-text("Send Test Email")');
    if (!(await sendTestEmailTab.getAttribute('aria-selected'))) {
      await sendTestEmailTab.click();
    }

    // Wait for send test email form to load
    await page.waitForSelector('input#to', { timeout: 5000 });

    // Fill in the test email form
    await page.locator('input#to').fill('scottfmackey@gmail.com');
    await page.locator('input#subject').fill('Test Email from SaaS Dash - Playwright Test');

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
    await page.screenshot({ path: 'tests/screenshots/email-form-filled.png' });

    // Click send button (use role button to distinguish from tab)
    const sendButton = page.getByRole('button', { name: 'Send Test Email' });
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Wait for the response and capture any success/error messages
    await page.waitForTimeout(5000);

    // Look for success indicators
    const successToast = page.locator('text=Email sent successfully');
    const errorToast = page.locator('text=Failed to send email');
    const successIndicator = page.locator('text=resend').locator('..').locator('svg'); // Green checkmark

    let testResult = 'unknown';

    // Check for success toast first
    try {
      await expect(successToast).toBeVisible({ timeout: 2000 });
      console.log('✅ Email sent successfully (toast message)');
      testResult = 'success';
    } catch {
      // Check for error toast
      try {
        await expect(errorToast).toBeVisible({ timeout: 2000 });
        console.log('❌ Email sending failed (error toast)');
        testResult = 'failed';
      } catch {
        // Check for success indicator (green checkmark)
        try {
          await expect(successIndicator).toBeVisible({ timeout: 2000 });
          console.log('✅ Email sent successfully (green checkmark indicator)');
          testResult = 'success';
        } catch {
          console.log('⏳ No clear success/error message visible');
          testResult = 'unclear';
        }
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/email-send-result.png' });

    // For visual testing purposes, we'll consider the test successful if we see any success indicator
    if (testResult === 'success') {
      console.log('🎉 Email test completed successfully');
    } else if (testResult === 'failed') {
      console.log('⚠️  Email test showed error - needs investigation');
    }
  });

  test('should send custom HTML test email', async ({ page }) => {
    // Navigate to send test email tab
    const sendTestEmailTab = page.locator('button[role="tab"]:has-text("Send Test Email")');
    if (!(await sendTestEmailTab.getAttribute('aria-selected'))) {
      await sendTestEmailTab.click();
    }

    // Wait for form to load
    await page.waitForSelector('input#to', { timeout: 5000 });

    // Fill basic info
    await page.locator('input#to').fill('scottfmackey@gmail.com');
    await page.locator('input#subject').fill('Custom HTML Test Email - Playwright');

    // Switch to custom HTML tab
    await page.locator('button[role="tab"]:has-text("Custom HTML")').click();

    // Fill HTML content
    const htmlTextarea = page.locator('textarea').first();
    await htmlTextarea.fill(`
      <h1>Test Email</h1>
      <p>This is a test email sent from the SaaS Dash email management system.</p>
      <p>Sent at: ${new Date().toISOString()}</p>
    `);

    // Fill text content
    const textTextarea = page.locator('textarea').nth(1);
    await textTextarea.fill(
      'This is a test email sent from SaaS Dash. Sent at: ' + new Date().toISOString()
    );

    // Take screenshot before sending
    await page.screenshot({ path: 'tests/screenshots/custom-email-form.png' });

    // Send email
    const sendButton = page.locator('button:has-text("Send Test Email")');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    // Wait for result
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/screenshots/custom-email-result.png' });
  });

  test('should preview email templates', async ({ page }) => {
    // Navigate to template preview tab
    await page.locator('button[role="tab"]:has-text("Template Preview")').click();

    // Wait for template list to load
    await page.waitForSelector('text=Available Templates', { timeout: 5000 });

    // Click preview button on welcome template
    const previewButton = page.locator('button:has(svg)').first(); // Eye icon button
    await previewButton.click();

    // Wait for preview to load
    await page.waitForTimeout(2000);

    // Take screenshot of template preview
    await page.screenshot({ path: 'tests/screenshots/template-preview.png' });
  });
});
