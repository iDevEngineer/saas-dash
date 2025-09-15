import { db } from '@/lib/db';
import { pricingPlans, pricingFeatures, planFeatures } from '@/lib/db/schema/pricing';
import { eq, and } from 'drizzle-orm';

async function seedPricingData() {
  console.log('🌱 Seeding pricing data...');

  // First, create the features
  const features = [
    {
      name: 'Projects',
      description: 'Number of projects you can create',
      category: 'projects',
    },
    {
      name: 'Analytics',
      description: 'Level of analytics and insights',
      category: 'analytics',
    },
    {
      name: 'Support',
      description: 'Level of customer support',
      category: 'support',
    },
    {
      name: 'API Access',
      description: 'Access to our REST API',
      category: 'api',
    },
    {
      name: 'Team Collaboration',
      description: 'Team member management and collaboration',
      category: 'team',
    },
    {
      name: 'Custom Integrations',
      description: 'Build custom integrations',
      category: 'integrations',
    },
    {
      name: 'Dedicated Support',
      description: 'Dedicated customer success manager',
      category: 'support',
    },
    {
      name: 'Custom Contracts',
      description: 'Custom contract terms and pricing',
      category: 'legal',
    },
    {
      name: 'SLA Guarantee',
      description: 'Service level agreement',
      category: 'legal',
    },
    {
      name: 'On-premise Deployment',
      description: 'Deploy on your own infrastructure',
      category: 'deployment',
    },
    {
      name: 'Advanced Security',
      description: 'Enterprise-grade security features',
      category: 'security',
    },
  ];

  const createdFeatures = [];
  for (const feature of features) {
    const [existingFeature] = await db
      .select()
      .from(pricingFeatures)
      .where(eq(pricingFeatures.name, feature.name))
      .limit(1);

    if (!existingFeature) {
      const [newFeature] = await db.insert(pricingFeatures).values(feature).returning();
      createdFeatures.push(newFeature);
    } else {
      createdFeatures.push(existingFeature);
    }
  }

  // Create the pricing plans
  const plans = [
    {
      name: 'Basic',
      description: 'Perfect for individuals and small projects',
      price: 900, // $9.00 in cents
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      trialPeriodDays: 14,
      isPopular: false,
      isActive: true,
      sortOrder: 1,
      features: ['Up to 3 projects', 'Basic analytics', 'Email support', 'API access'],
      metadata: {
        originalId: 'basic',
      },
    },
    {
      name: 'Pro',
      description: 'For growing teams and businesses',
      price: 2900, // $29.00 in cents
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      trialPeriodDays: 14,
      isPopular: true,
      isActive: true,
      sortOrder: 2,
      features: [
        'Unlimited projects',
        'Advanced analytics',
        'Priority support',
        'API access',
        'Team collaboration',
        'Custom integrations',
      ],
      metadata: {
        originalId: 'pro',
      },
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with custom needs',
      price: 0, // Custom pricing
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      trialPeriodDays: 30,
      isPopular: false,
      isActive: true,
      sortOrder: 3,
      features: [
        'Everything in Pro',
        'Dedicated support',
        'Custom contracts',
        'SLA guarantee',
        'On-premise deployment',
        'Advanced security',
      ],
      metadata: {
        originalId: 'enterprise',
        customPricing: true,
      },
    },
  ];

  const createdPlans = [];
  for (const plan of plans) {
    const [existingPlan] = await db
      .select()
      .from(pricingPlans)
      .where(eq(pricingPlans.name, plan.name))
      .limit(1);

    if (!existingPlan) {
      const [newPlan] = await db.insert(pricingPlans).values(plan).returning();
      createdPlans.push(newPlan);
      console.log(`✅ Created plan: ${newPlan.name}`);
    } else {
      createdPlans.push(existingPlan);
      console.log(`ℹ️  Plan already exists: ${existingPlan.name}`);
    }
  }

  // Create plan-feature relationships
  const planFeatureRelations = [
    // Basic plan features
    { planName: 'Basic', featureName: 'Projects', value: 'Up to 3' },
    { planName: 'Basic', featureName: 'Analytics', value: 'Basic' },
    { planName: 'Basic', featureName: 'Support', value: 'Email' },
    { planName: 'Basic', featureName: 'API Access', value: 'Included' },

    // Pro plan features
    { planName: 'Pro', featureName: 'Projects', value: 'Unlimited' },
    { planName: 'Pro', featureName: 'Analytics', value: 'Advanced' },
    { planName: 'Pro', featureName: 'Support', value: 'Priority' },
    { planName: 'Pro', featureName: 'API Access', value: 'Included' },
    { planName: 'Pro', featureName: 'Team Collaboration', value: 'Included' },
    { planName: 'Pro', featureName: 'Custom Integrations', value: 'Included' },

    // Enterprise plan features
    { planName: 'Enterprise', featureName: 'Projects', value: 'Unlimited' },
    { planName: 'Enterprise', featureName: 'Analytics', value: 'Advanced' },
    { planName: 'Enterprise', featureName: 'API Access', value: 'Included' },
    { planName: 'Enterprise', featureName: 'Team Collaboration', value: 'Included' },
    { planName: 'Enterprise', featureName: 'Custom Integrations', value: 'Included' },
    { planName: 'Enterprise', featureName: 'Dedicated Support', value: 'Included' },
    { planName: 'Enterprise', featureName: 'Custom Contracts', value: 'Included' },
    { planName: 'Enterprise', featureName: 'SLA Guarantee', value: '99.9%' },
    { planName: 'Enterprise', featureName: 'On-premise Deployment', value: 'Available' },
    { planName: 'Enterprise', featureName: 'Advanced Security', value: 'Included' },
  ];

  for (const relation of planFeatureRelations) {
    const plan = createdPlans.find((p) => p.name === relation.planName);
    const feature = createdFeatures.find((f) => f.name === relation.featureName);

    if (plan && feature) {
      // Check if relationship already exists
      const [existingRelation] = await db
        .select()
        .from(planFeatures)
        .where(and(eq(planFeatures.planId, plan.id), eq(planFeatures.featureId, feature.id)))
        .limit(1);

      if (!existingRelation) {
        await db.insert(planFeatures).values({
          planId: plan.id,
          featureId: feature.id,
          value: relation.value,
          isIncluded: true,
        });
      }
    }
  }

  console.log('✅ Pricing data seeded successfully!');
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedPricingData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error seeding pricing data:', error);
      process.exit(1);
    });
}

export { seedPricingData };
