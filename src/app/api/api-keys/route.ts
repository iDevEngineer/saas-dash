import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ApiKeyService, type CreateApiKeyData } from '@/lib/api-keys/api-key-service';
import { API_KEY_SCOPES, type ApiKeyScope, type ApiKeyEnvironment } from '@/lib/db/schema';
import { z } from 'zod';

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  scopes: z.array(z.string()),
  environment: z.enum(['development', 'staging', 'production'] as const).optional(),
  rateLimitRpm: z.number().min(1).max(10000).optional(),
  rateLimitRpd: z.number().min(1).max(1000000).optional(),
  expiresAt: z.string().datetime().optional(),
  ipWhitelist: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const getApiKeysSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 50)),
  environment: z.enum(['development', 'staging', 'production'] as const).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().optional(),
});

/**
 * GET /api/api-keys - Get API keys for the organization
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const queryValidation = getApiKeysSchema.safeParse(params);

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.error.issues },
        { status: 400 }
      );
    }

    const { page, limit, environment, isActive, search } = queryValidation.data;

    // Get API keys
    const result = await ApiKeyService.getApiKeys(
      userOrg.organizationId,
      { environment, isActive, search },
      { page, limit }
    );

    return NextResponse.json({
      success: true,
      data: {
        apiKeys: result.apiKeys,
        pagination: result.pagination,
        total: result.total,
      },
    });
  } catch (error) {
    console.error('Failed to get API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/api-keys - Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
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
    const validation = createApiKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const data: CreateApiKeyData = {
      ...validation.data,
      expiresAt: validation.data.expiresAt ? new Date(validation.data.expiresAt) : undefined,
    };

    // Get client IP and user agent for audit
    const clientIp =
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create API key
    const result = await ApiKeyService.createApiKey(userOrg.organizationId, session.user.id, data, {
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          apiKey: {
            ...result.apiKey,
            keyHash: undefined, // Don't return the hash
          },
          rawKey: result.rawKey, // This is the only time the raw key is returned
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
