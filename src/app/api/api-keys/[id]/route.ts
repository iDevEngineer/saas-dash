import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ApiKeyService } from '@/lib/api-keys/api-key-service';
import { API_KEY_SCOPES, type ApiKeyScope } from '@/lib/db/schema';
import { z } from 'zod';

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()).optional(),
  rateLimitRpm: z.number().min(1).max(10000).optional(),
  rateLimitRpd: z.number().min(1).max(1000000).optional(),
  expiresAt: z.string().datetime().optional(),
  ipWhitelist: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/api-keys/[id] - Get a specific API key
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const [userOrg] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!userOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions (admin or owner only)
    if (!['admin', 'owner'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get API key
    const apiKey = await ApiKeyService.getApiKeyById(userOrg.organizationId, id);

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Get usage stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await ApiKeyService.getApiKeyStats(userOrg.organizationId, id, {
      start: thirtyDaysAgo,
      end: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          ...apiKey,
          keyHash: undefined, // Don't return the hash
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Failed to get API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/api-keys/[id] - Update an API key
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const [userOrg] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!userOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions (admin or owner only)
    if (!['admin', 'owner'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const validation = updateApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const updates = {
      ...validation.data,
      expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
    };

    // Get client IP and user agent for audit
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Update API key
    const updatedApiKey = await ApiKeyService.updateApiKey(
      userOrg.organizationId,
      id,
      session.user.id,
      updates,
      { ipAddress: clientIp, userAgent }
    );

    if (!updatedApiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          ...updatedApiKey,
          keyHash: undefined, // Don't return the hash
        },
      },
    });
  } catch (error) {
    console.error('Failed to update API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/api-keys/[id] - Delete an API key
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const [userOrg] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!userOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions (admin or owner only)
    if (!['admin', 'owner'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get client IP and user agent for audit
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Delete API key
    const success = await ApiKeyService.deleteApiKey(userOrg.organizationId, id, session.user.id, {
      ipAddress: clientIp,
      userAgent,
    });

    if (!success) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
