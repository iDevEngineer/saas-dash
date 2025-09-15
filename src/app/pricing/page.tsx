import { DynamicPricingCards } from '@/components/pricing-cards-dynamic';

export default function PricingPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Choose the perfect plan for your needs. Upgrade or downgrade at any time.
        </p>
      </div>

      <DynamicPricingCards />

      <div className="mt-16 text-center">
        <h2 className="mb-4 text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="mx-auto grid max-w-4xl gap-6 text-left md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">Can I change plans anytime?</h3>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect
              immediately.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards and debit cards through Stripe.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              Yes, all paid plans come with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Absolutely. Cancel anytime from your billing dashboard. No questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
