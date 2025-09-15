import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      priceId,
      successUrl: successUrl || `${request.headers.get('origin')}/dashboard/billing?success=true`,
      cancelUrl: cancelUrl || `${request.headers.get('origin')}/dashboard/billing?canceled=true`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
