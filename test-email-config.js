// Quick test to verify email configuration
import { emailService } from './src/lib/email/service.js';

async function testEmailConfiguration() {
  console.log('Testing email service configuration...');

  try {
    const result = await emailService.send({
      to: 'delivered@resend.dev',
      subject: 'Test - Database Configuration',
      html: '<h1>Testing database-driven email configuration</h1><p>If you see this, the configuration is working!</p>',
    });

    console.log('✅ Email send result:', result);
  } catch (error) {
    console.error('❌ Email send failed:', error);
  }
}

testEmailConfiguration();
