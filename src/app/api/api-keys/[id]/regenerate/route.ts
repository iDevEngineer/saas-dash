import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizationMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ApiKeyService } from '@/lib/api-keys/api-key-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/api-keys/[id]/regenerate - Regenerate an API key
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Regenerate API key
    const result = await ApiKeyService.regenerateApiKey(
      userOrg.organizationId,
      id,
      session.user.id,
      { ipAddress: clientIp, userAgent }
    );

    if (!result) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        apiKey: {
          ...result.apiKey,
          keyHash: undefined, // Don't return the hash
        },
        rawKey: result.rawKey, // This is the only time the new raw key is returned
      },
      message: 'API key regenerated successfully. Save the new key as it will not be shown again.',
    });
  } catch (error) {
    console.error('Failed to regenerate API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
