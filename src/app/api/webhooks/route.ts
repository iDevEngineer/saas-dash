import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webhookEndpoints, organizationMembers, type NewWebhookEndpoint } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { AuditService } from '@/lib/audit/audit-service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const createWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  eventTypes: z.array(z.string()).min(1),
  headers: z.record(z.string(), z.string()).optional(),
  retryPolicy: z
    .object({
      maxAttempts: z.number().int().min(1).max(10).default(3),
      backoffFactor: z.number().min(1).max(10).default(2),
    })
    .optional(),
});

// GET /api/webhooks - List webhook endpoints for organization
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const [userOrg] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.organizationId, userOrg.organizationId));

    // Remove sensitive data before sending
    const sanitizedEndpoints = endpoints.map((endpoint) => ({
      ...endpoint,
      secretToken: '***hidden***',
    }));

    return NextResponse.json({ endpoints: sanitizedEndpoints });
  } catch (error) {
    console.error('Failed to fetch webhooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/webhooks - Create new webhook endpoint
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const [userOrg] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found for user' }, { status: 404 });
    }

    // Check if user has admin permissions
    if (userOrg.role !== 'admin' && userOrg.role !== 'owner') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create webhooks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createWebhookSchema.parse(body);

    // Generate a secure secret token
    const secretToken = crypto.randomBytes(32).toString('hex');

    const webhookData: NewWebhookEndpoint = {
      organizationId: userOrg.organizationId,
      name: validatedData.name,
      url: validatedData.url,
      secretToken,
      eventTypes: validatedData.eventTypes,
      headers: validatedData.headers as Record<string, string> | null,
      retryPolicy: validatedData.retryPolicy || { maxAttempts: 3, backoffFactor: 2 },
    };

    const [webhook] = await db.insert(webhookEndpoints).values(webhookData).returning();

    // Record audit event
    const auditContext = AuditService.createContext(
      userOrg.organizationId,
      session.user.id,
      undefined,
      {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || undefined,
      }
    );

    await AuditService.recordUserAction(
      auditContext,
      'create_webhook',
      'webhook_endpoint',
      webhook.id,
      {
        webhook_name: validatedData.name,
        webhook_url: validatedData.url,
        event_types: validatedData.eventTypes,
      }
    );

    // Return webhook without secret token
    const { secretToken: _, ...webhookResponse } = webhook;

    return NextResponse.json(
      {
        webhook: webhookResponse,
        secretToken: secretToken, // Only return once on creation
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Failed to create webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
