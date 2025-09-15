import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pricingPlans, pricingFeatures, planFeatures } from '@/lib/db/schema/pricing';
import { eq, asc } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET /api/pricing/plans - Get all active pricing plans
export async function GET() {
  try {
    const plans = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.isActive, true))
      .orderBy(asc(pricingPlans.sortOrder));

    // Get features for each plan
    const plansWithFeatures = await Promise.all(
      plans.map(async (plan) => {
        const features = await db
          .select({
            id: planFeatures.id,
            name: pricingFeatures.name,
            description: pricingFeatures.description,
            category: pricingFeatures.category,
            value: planFeatures.value,
            isIncluded: planFeatures.isIncluded,
            sortOrder: planFeatures.sortOrder,
          })
          .from(planFeatures)
          .innerJoin(pricingFeatures, eq(planFeatures.featureId, pricingFeatures.id))
          .where(eq(planFeatures.planId, plan.id))
          .orderBy(asc(planFeatures.sortOrder));

        return {
          ...plan,
          priceDisplay: plan.price === 0 ? 'Custom' : `$${(plan.price / 100).toFixed(0)}`,
          detailedFeatures: features,
        };
      })
    );

    return NextResponse.json(plansWithFeatures);
  } catch (error) {
    console.error('Error fetching pricing plans:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing plans' }, { status: 500 });
  }
}

// POST /api/pricing/plans - Create a new pricing plan (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you might want to implement proper role checking)
    // For now, we'll assume any authenticated user can create plans
    // In production, add proper admin role validation

    const body = await request.json();
    const {
      name,
      description,
      price,
      currency = 'usd',
      interval = 'month',
      intervalCount = 1,
      trialPeriodDays = 0,
      isPopular = false,
      isActive = true,
      sortOrder = 0,
      features = [],
      metadata = {},
    } = body;

    if (!name || !description || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, price' },
        { status: 400 }
      );
    }

    const [newPlan] = await db
      .insert(pricingPlans)
      .values({
        name,
        description,
        price: Math.round(price * 100), // Convert to cents
        currency,
        interval,
        intervalCount,
        trialPeriodDays,
        isPopular,
        isActive,
        sortOrder,
        features,
        metadata,
      })
      .returning();

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error) {
    console.error('Error creating pricing plan:', error);
    return NextResponse.json({ error: 'Failed to create pricing plan' }, { status: 500 });
  }
}
