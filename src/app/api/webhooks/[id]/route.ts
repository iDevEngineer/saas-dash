import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webhookEndpoints } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { AuditService } from '@/lib/audit/audit-service';

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  eventTypes: z.array(z.string()).min(1).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
  retryPolicy: z.object({
    maxAttempts: z.number().int().min(1).max(10),
    backoffFactor: z.number().min(1).max(10),
  }).optional(),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/webhooks/[id] - Get specific webhook endpoint
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  try {
    const organizationId = request.headers.get('x-organization-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const [webhook] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, resolvedParams.id),
          eq(webhookEndpoints.organizationId, organizationId)
        )
      );

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { secretToken: _, ...webhookResponse } = webhook;

    return NextResponse.json({ webhook: webhookResponse });

  } catch (error) {
    console.error('Failed to fetch webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/webhooks/[id] - Update webhook endpoint
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  try {
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateWebhookSchema.parse(body);

    // Get existing webhook for audit
    const [existingWebhook] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, resolvedParams.id),
          eq(webhookEndpoints.organizationId, organizationId)
        )
      );

    if (!existingWebhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const [updatedWebhook] = await db
      .update(webhookEndpoints)
      .set({
        ...validatedData,
        headers: validatedData.headers as Record<string, string> | null | undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(webhookEndpoints.id, resolvedParams.id),
          eq(webhookEndpoints.organizationId, organizationId)
        )
      )
      .returning();

    // Record audit event
    const auditContext = AuditService.createContext(
      organizationId,
      userId || undefined,
      undefined,
      {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    await AuditService.recordUserAction(
      auditContext,
      'update_webhook',
      'webhook_endpoint',
      resolvedParams.id,
      {
        changes: validatedData,
        webhook_name: existingWebhook.name,
      }
    );

    // Remove sensitive data
    const { secretToken: _, ...webhookResponse } = updatedWebhook;

    return NextResponse.json({ webhook: webhookResponse });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to update webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/webhooks/[id] - Delete webhook endpoint
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  try {
    const organizationId = request.headers.get('x-organization-id');
    const userId = request.headers.get('x-user-id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Get webhook for audit before deletion
    const [webhook] = await db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, resolvedParams.id),
          eq(webhookEndpoints.organizationId, organizationId)
        )
      );

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    await db
      .delete(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.id, resolvedParams.id),
          eq(webhookEndpoints.organizationId, organizationId)
        )
      );

    // Record audit event
    const auditContext = AuditService.createContext(
      organizationId,
      userId || undefined,
      undefined,
      {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    await AuditService.recordUserAction(
      auditContext,
      'delete_webhook',
      'webhook_endpoint',
      resolvedParams.id,
      {
        webhook_name: webhook.name,
        webhook_url: webhook.url,
      }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to delete webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}