import type { EmailConfig } from './types';
import { getEmailSettings } from './settings';

export async function getEmailConfig(): Promise<EmailConfig> {
  const settings = await getEmailSettings();

  return {
    providers: {
      resend: {
        apiKey: process.env.RESEND_API_KEY || '',
        fromEmail: settings.fromEmail,
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY || '',
        fromEmail: settings.fromEmail,
      },
    },
    defaultProvider: settings.provider,
    fallbackProviders: ['sendgrid'],
    retryAttempts: 3,
    timeout: 10000, // 10 seconds
  };
}

// Legacy export for backward compatibility - will use environment variables as fallback
export const emailConfig: EmailConfig = {
  providers: {
    resend: {
      apiKey: process.env.RESEND_API_KEY || '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.EMAIL_FROM || 'noreply@example.com',
    },
  },
  defaultProvider: process.env.EMAIL_PROVIDER || 'resend',
  fallbackProviders: ['sendgrid'],
  retryAttempts: 3,
  timeout: 10000, // 10 seconds
};

export async function validateEmailConfig(): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  const config = await getEmailConfig();

  if (!config.providers.resend?.apiKey && config.defaultProvider === 'resend') {
    errors.push('RESEND_API_KEY is required when using Resend as the default provider');
  }

  if (!config.providers.resend?.fromEmail) {
    errors.push('From email is required for the sender email address');
  }

  if (!config.defaultProvider) {
    errors.push('Email provider must be specified');
  }

  const validProviders = Object.keys(config.providers);
  if (!validProviders.includes(config.defaultProvider)) {
    errors.push(`Email provider must be one of: ${validProviders.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Legacy validation function for backward compatibility
export function validateLegacyEmailConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!emailConfig.providers.resend?.apiKey && emailConfig.defaultProvider === 'resend') {
    errors.push('RESEND_API_KEY is required when using Resend as the default provider');
  }

  if (!emailConfig.providers.resend?.fromEmail) {
    errors.push('EMAIL_FROM is required for the sender email address');
  }

  if (!emailConfig.defaultProvider) {
    errors.push('EMAIL_PROVIDER must be specified');
  }

  const validProviders = Object.keys(emailConfig.providers);
  if (!validProviders.includes(emailConfig.defaultProvider)) {
    errors.push(`EMAIL_PROVIDER must be one of: ${validProviders.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
