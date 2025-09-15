import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { previewTemplate, getAvailableTemplates } from '@/lib/email';
import type { EmailTemplate, EmailTemplateData } from '@/lib/email/types';

const templateDataSchemas = {
  welcome: z.object({
    firstName: z.string(),
    email: z.string().email(),
  }),
  'email-verification': z.object({
    firstName: z.string(),
    verificationUrl: z.string().url(),
    expiresIn: z.string().optional(),
  }),
  'password-reset': z.object({
    firstName: z.string(),
    resetUrl: z.string().url(),
    expiresIn: z.string().optional(),
  }),
  'password-reset-success': z.object({
    firstName: z.string(),
    email: z.string().email(),
  }),
  'magic-link': z.object({
    firstName: z.string(),
    loginUrl: z.string().url(),
    expiresIn: z.string().optional(),
  }),
};

const defaultTemplateData: EmailTemplateData = {
  welcome: {
    firstName: 'John Doe',
    email: 'john@example.com',
  },
  'email-verification': {
    firstName: 'John Doe',
    verificationUrl: 'https://example.com/verify?token=sample-token',
    expiresIn: '24 hours',
  },
  'password-reset': {
    firstName: 'John Doe',
    resetUrl: 'https://example.com/reset?token=sample-token',
    expiresIn: '1 hour',
  },
  'password-reset-success': {
    firstName: 'John Doe',
    email: 'john@example.com',
  },
  'magic-link': {
    firstName: 'John Doe',
    loginUrl: 'https://example.com/magic-login?token=sample-token',
    expiresIn: '15 minutes',
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  try {
    const resolvedParams = await params;
    const template = resolvedParams.template as EmailTemplate;
    const availableTemplates = getAvailableTemplates();

    if (!availableTemplates.includes(template)) {
      return NextResponse.json(
        {
          error: 'Template not found',
          availableTemplates,
        },
        { status: 404 }
      );
    }

    // Get template data from query params or use defaults
    const url = new URL(request.url);
    const customData = url.searchParams.get('data');

    let templateData = defaultTemplateData[template];

    if (customData) {
      try {
        const parsedData = JSON.parse(customData);
        const schema = templateDataSchemas[template];
        templateData = schema.parse(parsedData) as EmailTemplateData[EmailTemplate];
      } catch (error) {
        return NextResponse.json(
          {
            error: 'Invalid template data',
            details: error instanceof Error ? error.message : 'Unknown error',
            expectedSchema: templateDataSchemas[template]._def,
          },
          { status: 400 }
        );
      }
    }

    const { html } = await previewTemplate(
      template,
      templateData as EmailTemplateData[EmailTemplate]
    );

    // Return HTML for direct preview
    const format = url.searchParams.get('format');
    if (format === 'json') {
      return NextResponse.json({
        template,
        html,
        templateData,
        timestamp: new Date().toISOString(),
      });
    }

    // Return HTML directly for browser preview
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Email preview error:', error);

    return NextResponse.json(
      {
        error: 'Failed to preview template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint for previewing with custom data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  try {
    const resolvedParams = await params;
    const template = resolvedParams.template as EmailTemplate;
    const availableTemplates = getAvailableTemplates();

    if (!availableTemplates.includes(template)) {
      return NextResponse.json(
        {
          error: 'Template not found',
          availableTemplates,
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    const schema = templateDataSchemas[template];
    const templateData = schema.parse(body) as EmailTemplateData[EmailTemplate];

    const { html } = await previewTemplate(
      template,
      templateData as EmailTemplateData[EmailTemplate]
    );

    return NextResponse.json({
      template,
      html,
      templateData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Email preview POST error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid template data',
          details: error instanceof z.ZodError ? error.issues : 'Unknown validation error',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to preview template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
