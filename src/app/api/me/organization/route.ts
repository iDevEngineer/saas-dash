import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { organizationMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/me/organization - Get current user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const [userOrg] = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, session.user.id))
      .limit(1);

    if (!userOrg) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organizationId: userOrg.organizationId,
      role: userOrg.role,
    });

  } catch (error) {
    console.error('Failed to get user organization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}