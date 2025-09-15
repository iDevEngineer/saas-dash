import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCustomerPortalSession } from '@/lib/stripe';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the customer record
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, session.user.id))
      .limit(1);

    if (!customer) {
      return NextResponse.json({ error: 'No customer found' }, { status: 404 });
    }

    const { returnUrl } = await request.json();

    const portalSession = await createCustomerPortalSession({
      customerId: customer.stripeCustomerId,
      returnUrl: returnUrl || `${request.headers.get('origin')}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
