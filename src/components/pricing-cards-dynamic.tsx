'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceDisplay: string;
  currency: string;
  interval: string;
  intervalCount: number;
  trialPeriodDays: number;
  isPopular: boolean;
  isActive: boolean;
  stripePriceId?: string;
  features: string[];
  detailedFeatures?: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    value: string;
    isIncluded: boolean;
  }>;
}

interface PricingCardsProps {
  currentPlan?: string;
}

export function DynamicPricingCards({ currentPlan }: PricingCardsProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/pricing/plans');
        if (!response.ok) {
          throw new Error('Failed to fetch pricing plans');
        }
        const data = await response.json();
        setPlans(data);
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
        toast.error('Failed to load pricing plans');
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) {
      toast.error('Invalid price ID');
      return;
    }

    setCheckoutLoading(priceId);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setCheckoutLoading('portal');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-1/2 rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-8 w-1/3 rounded bg-gray-200"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 rounded bg-gray-200"></div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 w-full rounded bg-gray-200"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${
            plan.isPopular ? 'border-primary ring-primary ring-2 ring-offset-2' : ''
          }`}
        >
          {plan.isPopular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm font-medium">
                Most Popular
              </span>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
            <div className="text-3xl font-bold">
              {plan.priceDisplay}
              {plan.price > 0 && (
                <span className="text-muted-foreground text-sm font-normal">/{plan.interval}</span>
              )}
            </div>
            {plan.trialPeriodDays > 0 && (
              <div className="text-muted-foreground text-sm">
                {plan.trialPeriodDays} day free trial
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.detailedFeatures && plan.detailedFeatures.length > 0
                ? plan.detailedFeatures.map((feature) => (
                    <li key={feature.id} className="flex items-center gap-2">
                      <Check className="text-primary h-4 w-4" />
                      <span className="text-sm">
                        {feature.value && feature.value !== 'Included'
                          ? `${feature.name}: ${feature.value}`
                          : feature.name}
                      </span>
                    </li>
                  ))
                : plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="text-primary h-4 w-4" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
            </ul>
          </CardContent>
          <CardFooter>
            {currentPlan === plan.id ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={checkoutLoading === 'portal'}
              >
                {checkoutLoading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Subscription
              </Button>
            ) : plan.price === 0 ? (
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            ) : (
              <Button
                className={`w-full ${plan.isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                variant={plan.isPopular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.stripePriceId!)}
                disabled={checkoutLoading === plan.stripePriceId || !plan.stripePriceId}
              >
                {checkoutLoading === plan.stripePriceId && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Get Started
                {plan.trialPeriodDays > 0 && ' - Free Trial'}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
