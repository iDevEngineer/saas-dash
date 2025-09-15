import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, subscriptions, invoices } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { DynamicPricingCards } from '@/components/pricing-cards-dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CalendarDays, CreditCard, FileText } from 'lucide-react';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect('/signin');
  }

  // Get customer and subscription data
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.userId, session.user.id))
    .limit(1);

  let subscription = null;
  let recentInvoices: (typeof invoices.$inferSelect)[] = [];

  if (customer) {
    [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.customerId, customer.id))
      .limit(1);

    if (subscription) {
      recentInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.subscriptionId, subscription.id))
        .orderBy(desc(invoices.createdAt))
        .limit(5);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'canceled':
      case 'incomplete_expired':
        return 'bg-red-100 text-red-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'void':
      case 'uncollectible':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      {resolvedSearchParams.success && (
        <div className="mb-6 rounded-md border border-green-300 bg-green-100 p-4">
          <p className="text-green-800">🎉 Subscription created successfully! Welcome aboard!</p>
        </div>
      )}

      {resolvedSearchParams.canceled && (
        <div className="mb-6 rounded-md border border-yellow-300 bg-yellow-100 p-4">
          <p className="text-yellow-800">Checkout was canceled. No charges were made.</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your current plan and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium capitalize">{subscription.planName} Plan</h3>
                      <p className="text-muted-foreground text-sm">
                        {subscription.status === 'active' && subscription.currentPeriodEnd
                          ? `Next billing date: ${format(
                              new Date(subscription.currentPeriodEnd),
                              'PPP'
                            )}`
                          : ''}
                      </p>
                    </div>
                    <Badge className={getStatusColor(subscription.status)}>
                      {subscription.status}
                    </Badge>
                  </div>

                  {subscription.status === 'active' && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Current Period</p>
                        <p className="text-muted-foreground">
                          {subscription.currentPeriodStart &&
                            format(new Date(subscription.currentPeriodStart), 'PPP')}{' '}
                          -{' '}
                          {subscription.currentPeriodEnd &&
                            format(new Date(subscription.currentPeriodEnd), 'PPP')}
                        </p>
                      </div>
                      {subscription.cancelAt && (
                        <div>
                          <p className="font-medium">Cancels On</p>
                          <p className="text-muted-foreground">
                            {format(new Date(subscription.cancelAt), 'PPP')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <CalendarDays className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 font-medium">No active subscription</h3>
                  <p className="text-muted-foreground mb-4 text-sm">
                    Choose a plan below to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {recentInvoices.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>Your recent billing history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentInvoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between border-b py-2 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">
                          {invoice.stripeInvoiceNumber || `Invoice ${invoice.id}`}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {format(new Date(invoice.createdAt), 'PPP')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${(invoice.amountPaid / 100).toFixed(2)}</p>
                        <Badge className={getInvoiceStatusColor(invoice.status)}>
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {subscription && (
            <Card>
              <CardHeader>
                <CardTitle>Manage Subscription</CardTitle>
                <CardDescription>
                  Update payment method, download invoices, or cancel subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => {
                    fetch('/api/stripe/portal', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        window.location.href = data.url;
                      });
                  }}
                >
                  Open Customer Portal
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">
          {subscription ? 'Change Plan' : 'Choose Your Plan'}
        </h2>
        <DynamicPricingCards currentPlan={subscription?.id} />
      </div>
    </div>
  );
}
