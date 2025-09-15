import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { pricingPlans, pricingFeatures, planFeatures } from '@/lib/db/schema/pricing';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

// GET /api/pricing/plans/[id] - Get a specific pricing plan
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const [plan] = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.id, resolvedParams.id))
      .limit(1);

    if (!plan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    // Get features for this plan
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
      .where(eq(planFeatures.planId, plan.id));

    const planWithFeatures = {
      ...plan,
      priceDisplay: plan.price === 0 ? 'Custom' : `$${(plan.price / 100).toFixed(0)}`,
      detailedFeatures: features,
    };

    return NextResponse.json(planWithFeatures);
  } catch (error) {
    console.error('Error fetching pricing plan:', error);
    return NextResponse.json({ error: 'Failed to fetch pricing plan' }, { status: 500 });
  }
}

// PUT /api/pricing/plans/[id] - Update a pricing plan (admin only)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const {
      name,
      description,
      price,
      currency,
      interval,
      intervalCount,
      trialPeriodDays,
      isPopular,
      isActive,
      sortOrder,
      features,
      metadata,
    } = body;

    // Convert price to cents if provided
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Math.round(price * 100);
    if (currency !== undefined) updateData.currency = currency;
    if (interval !== undefined) updateData.interval = interval;
    if (intervalCount !== undefined) updateData.intervalCount = intervalCount;
    if (trialPeriodDays !== undefined) updateData.trialPeriodDays = trialPeriodDays;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (features !== undefined) updateData.features = features;
    if (metadata !== undefined) updateData.metadata = metadata;

    updateData.updatedAt = new Date();

    const [updatedPlan] = await db
      .update(pricingPlans)
      .set(updateData)
      .where(eq(pricingPlans.id, resolvedParams.id))
      .returning();

    if (!updatedPlan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating pricing plan:', error);
    return NextResponse.json({ error: 'Failed to update pricing plan' }, { status: 500 });
  }
}

// DELETE /api/pricing/plans/[id] - Delete a pricing plan (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    // Instead of deleting, we'll set isActive to false (soft delete)
    const [updatedPlan] = await db
      .update(pricingPlans)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(pricingPlans.id, resolvedParams.id))
      .returning();

    if (!updatedPlan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Pricing plan deactivated successfully' });
  } catch (error) {
    console.error('Error deleting pricing plan:', error);
    return NextResponse.json({ error: 'Failed to delete pricing plan' }, { status: 500 });
  }
}
