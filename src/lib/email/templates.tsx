import React from 'react';
import { render } from '@react-email/render';
import type { EmailTemplate, EmailTemplateData } from './types';

// Import all email templates
import { WelcomeEmail } from '@/components/emails/welcome-email';
import { VerificationEmail } from '@/components/emails/verification-email';
import { PasswordResetEmail } from '@/components/emails/password-reset-email';
import { PasswordResetSuccessEmail } from '@/components/emails/password-reset-success-email';
import { MagicLinkEmail } from '@/components/emails/magic-link-email';

export const emailTemplates = {
  welcome: WelcomeEmail,
  'email-verification': VerificationEmail,
  'password-reset': PasswordResetEmail,
  'password-reset-success': PasswordResetSuccessEmail,
  'magic-link': MagicLinkEmail,
} as const;

export interface RenderedTemplate {
  html: string;
  text: string;
}

export async function renderTemplate<T extends EmailTemplate>(
  template: T,
  data: EmailTemplateData[T]
): Promise<RenderedTemplate> {
  const TemplateComponent = emailTemplates[template];

  if (!TemplateComponent) {
    throw new Error(`Email template '${template}' not found`);
  }

  try {
    // Render HTML version
    const html = await render(
      React.createElement(
        TemplateComponent as React.ComponentType<{ data: EmailTemplateData[T] }>,
        { data }
      ),
      {
        pretty: true,
      }
    );

    // Render plain text version
    const text = await render(
      React.createElement(
        TemplateComponent as React.ComponentType<{ data: EmailTemplateData[T] }>,
        { data }
      ),
      {
        plainText: true,
      }
    );

    return {
      html,
      text,
    };
  } catch (error) {
    console.error(`Error rendering email template '${template}':`, error);
    throw new Error(
      `Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getAvailableTemplates(): EmailTemplate[] {
  return Object.keys(emailTemplates) as EmailTemplate[];
}

export function validateTemplateData<T extends EmailTemplate>(
  template: T,
  data: unknown
): data is EmailTemplateData[T] {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  switch (template) {
    case 'welcome':
      return typeof obj.firstName === 'string' && typeof obj.email === 'string';

    case 'email-verification':
      return typeof obj.firstName === 'string' && typeof obj.verificationUrl === 'string';

    case 'password-reset':
      return typeof obj.firstName === 'string' && typeof obj.resetUrl === 'string';

    case 'password-reset-success':
      return typeof obj.firstName === 'string' && typeof obj.email === 'string';

    case 'magic-link':
      return typeof obj.firstName === 'string' && typeof obj.loginUrl === 'string';

    default:
      return false;
  }
}

// Preview function for development/testing
export async function previewTemplate<T extends EmailTemplate>(
  template: T,
  data: EmailTemplateData[T]
): Promise<{ html: string; component: React.ReactElement }> {
  const TemplateComponent = emailTemplates[template];

  if (!TemplateComponent) {
    throw new Error(`Email template '${template}' not found`);
  }

  const component = React.createElement(
    TemplateComponent as React.ComponentType<{ data: EmailTemplateData[T] }>,
    { data }
  );
  const html = await render(component, { pretty: true });

  return {
    html,
    component,
  };
}
