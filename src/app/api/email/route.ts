import { NextResponse } from 'next/server';
import { getAvailableTemplates } from '@/lib/email';

export async function GET() {
  const availableTemplates = getAvailableTemplates();

  return NextResponse.json({
    message: 'SaaS Dash Email API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'POST /api/email/send': {
        description: 'Send emails using templates or custom HTML/text',
        parameters: {
          to: 'string | string[] - Recipient email(s)',
          subject: 'string - Email subject',
          template: 'string - Template name (optional)',
          templateData: 'object - Template data (optional)',
          html: 'string - Custom HTML content (optional)',
          text: 'string - Custom text content (optional)',
          from: 'string - Sender email (optional)',
          replyTo: 'string - Reply-to email (optional)',
          priority: 'string - Email priority: low, normal, high (optional)',
        },
      },
      'GET /api/email/health': {
        description: 'Check email service health and provider status',
      },
      'GET /api/email/preview/[template]': {
        description: 'Preview email templates in browser',
        parameters: {
          template: 'string - Template name (path parameter)',
          data: 'string - JSON-encoded template data (query parameter, optional)',
          format: 'string - Response format: html (default) or json (query parameter, optional)',
        },
      },
      'POST /api/email/preview/[template]': {
        description: 'Preview email templates with custom data',
        parameters: {
          template: 'string - Template name (path parameter)',
          body: 'object - Template data in request body',
        },
      },
    },
    availableTemplates: availableTemplates.map((template) => ({
      name: template,
      previewUrl: `/api/email/preview/${template}`,
      previewUrlWithJson: `/api/email/preview/${template}?format=json`,
    })),
    examples: {
      sendWelcomeEmail: {
        url: 'POST /api/email/send',
        body: {
          to: 'user@example.com',
          subject: 'Welcome to SaaS Dash!',
          template: 'welcome',
          templateData: {
            firstName: 'John',
            email: 'user@example.com',
          },
        },
      },
      sendCustomEmail: {
        url: 'POST /api/email/send',
        body: {
          to: 'user@example.com',
          subject: 'Custom Email',
          html: '<h1>Hello World</h1><p>This is a custom email.</p>',
          text: 'Hello World\n\nThis is a custom email.',
        },
      },
      previewTemplate: {
        url: 'GET /api/email/preview/welcome',
        description: 'Preview welcome email template with default data',
      },
      previewTemplateWithCustomData: {
        url: 'GET /api/email/preview/welcome?data={"firstName":"Jane","email":"jane@example.com"}&format=json',
        description: 'Preview welcome email template with custom data as JSON',
      },
    },
  });
}
