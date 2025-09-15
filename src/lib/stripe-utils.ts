import { db } from '@/lib/db';
import { pricingPlans } from '@/lib/db/schema/pricing';
import { eq } from 'drizzle-orm';

export async function getPlanNameFromPriceId(priceId?: string): Promise<string> {
  if (!priceId) return 'unknown';

  try {
    const [plan] = await db
      .select({ name: pricingPlans.name })
      .from(pricingPlans)
      .where(eq(pricingPlans.stripePriceId, priceId))
      .limit(1);

    return plan?.name.toLowerCase() || 'unknown';
  } catch (error) {
    console.error('Error fetching plan name:', error);
    return 'unknown';
  }
}

export async function getPlanIdFromPriceId(priceId?: string): Promise<string | null> {
  if (!priceId) return null;

  try {
    const [plan] = await db
      .select({ id: pricingPlans.id })
      .from(pricingPlans)
      .where(eq(pricingPlans.stripePriceId, priceId))
      .limit(1);

    return plan?.id || null;
  } catch (error) {
    console.error('Error fetching plan ID:', error);
    return null;
  }
}
