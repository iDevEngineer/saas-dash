import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { emailService, validateTemplateData } from '@/lib/email';
import type { EmailTemplate } from '@/lib/email/types';

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  template: z
    .enum([
      'welcome',
      'email-verification',
      'password-reset',
      'password-reset-success',
      'magic-link',
    ])
    .optional(),
  templateData: z.any().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  from: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('Email send API called');

    let body;
    try {
      body = await request.json();
      console.log('Request body parsed successfully');
    } catch (jsonError) {
      console.error('JSON parsing error in request body:', jsonError);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          details: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error',
        },
        { status: 400 }
      );
    }

    const validatedData = sendEmailSchema.parse(body);

    // Validate template data if template is provided
    if (validatedData.template && validatedData.templateData) {
      const isValidTemplateData = validateTemplateData(
        validatedData.template as EmailTemplate,
        validatedData.templateData
      );

      if (!isValidTemplateData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid template data for the specified template',
            details: 'Template data does not match the expected schema',
          },
          { status: 400 }
        );
      }
    }

    // Check if either template or html/text content is provided
    if (!validatedData.template && !validatedData.html && !validatedData.text) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either template or html/text content must be provided',
        },
        { status: 400 }
      );
    }

    // Send the email
    console.log('Sending email with data:', {
      to: validatedData.to,
      subject: validatedData.subject,
      template: validatedData.template,
    });

    const result = await emailService.send(validatedData);
    console.log('Email service result:', {
      success: result.success,
      error: result.success ? null : result.error,
      provider: result.provider,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider: result.provider,
        timestamp: result.timestamp,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          provider: result.provider,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email send API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for checking API status
export async function GET() {
  return NextResponse.json({
    message: 'Email API is operational',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'POST /api/email/send - Send emails',
      'GET /api/email/health - Check email service health',
      'GET /api/email/preview/[template] - Preview email templates',
    ],
  });
}
