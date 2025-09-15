export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  prices: {
    basic: process.env.STRIPE_PRICE_ID_BASIC || '',
    pro: process.env.STRIPE_PRICE_ID_PRO || '',
    enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
  },
} as const;

export const pricingPlans = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Perfect for individuals and small projects',
    price: '$9',
    priceId: process.env.STRIPE_PRICE_ID_BASIC,
    features: ['Up to 3 projects', 'Basic analytics', 'Email support', 'API access'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For growing teams and businesses',
    price: '$29',
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: [
      'Unlimited projects',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Team collaboration',
      'Custom integrations',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: 'Custom',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom contracts',
      'SLA guarantee',
      'On-premise deployment',
      'Advanced security',
    ],
    popular: false,
  },
] as const;
