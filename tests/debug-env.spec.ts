import { test, expect } from '@playwright/test';

test.describe('Environment Debug', () => {
  test('should check environment variables', async ({ request }) => {
    const response = await request.get('/api/debug/env');
    const envData = await response.json();

    console.log('Environment Variables:', JSON.stringify(envData, null, 2));

    // Basic assertions
    expect(response.ok()).toBeTruthy();
    expect(envData).toHaveProperty('RESEND_API_KEY');
    expect(envData).toHaveProperty('EMAIL_FROM');
    expect(envData).toHaveProperty('EMAIL_PROVIDER');
  });
});
