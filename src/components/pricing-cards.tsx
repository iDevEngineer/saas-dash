'use client';

import { useState } from 'react';
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
import { pricingPlans } from '@/config/stripe';
import { toast } from 'sonner';

interface PricingCardsProps {
  currentPlan?: string;
}

export function PricingCards({ currentPlan }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) {
      toast.error('Invalid price ID');
      return;
    }

    setLoading(priceId);

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
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('portal');

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
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
      {pricingPlans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${
            plan.popular ? 'border-primary ring-primary ring-2 ring-offset-2' : ''
          }`}
        >
          {plan.popular && (
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
              {plan.price}
              {plan.price !== 'Custom' && (
                <span className="text-muted-foreground text-sm font-normal">/month</span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
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
                disabled={loading === 'portal'}
              >
                {loading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Subscription
              </Button>
            ) : plan.id === 'enterprise' ? (
              <Button variant="outline" className="w-full">
                Contact Sales
              </Button>
            ) : (
              <Button
                className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan.priceId!)}
                disabled={loading === plan.priceId || !plan.priceId}
              >
                {loading === plan.priceId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Started
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
