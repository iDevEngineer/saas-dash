import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { stripeConfig } from '@/config/stripe';
import { db } from '@/lib/db';
import { customers, subscriptions, invoices } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getPlanNameFromPriceId } from '@/lib/stripe-utils';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, stripeConfig.webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.created':
      case 'invoice.updated':
        await handleInvoiceUpsert(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // This will be handled when we have user context from checkout session
  console.log('Customer created:', customer.id);
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted) {
    console.error('Customer not found for subscription:', subscription.id);
    return;
  }

  // Find our customer record
  const [customerRecord] = await db
    .select()
    .from(customers)
    .where(eq(customers.stripeCustomerId, customerId))
    .limit(1);

  if (!customerRecord) {
    console.error('Local customer record not found:', subscription.customer);
    return;
  }

  // Get the price to determine the plan name
  const planName = await getPlanNameFromPriceId(subscription.items.data[0]?.price?.id);

  const priceProduct = subscription.items.data[0]?.price?.product;
  const productId = typeof priceProduct === 'string' ? priceProduct : priceProduct?.id;

  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    customerId: customerRecord.id,
    organizationId: customerRecord.id, // For now, using customer ID as org ID
    stripeProductId: productId,
    stripePriceId: subscription.items.data[0]?.price?.id,
    status: subscription.status,
    planName,
    currentPeriodStart: (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000)
      : null,
    currentPeriodEnd: (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : null,
    cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    metadata: subscription.metadata,
    updatedAt: new Date(),
  };

  // Try to update existing subscription, otherwise insert
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (existingSubscription) {
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  } else {
    await db.insert(subscriptions).values(subscriptionData);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
}

async function handleInvoiceUpsert(invoice: Stripe.Invoice) {
  // Find the subscription record
  const subscriptionId =
    typeof (invoice as any).subscription === 'string'
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    console.error('No subscription ID found for invoice:', invoice.id);
    return;
  }

  const [subscriptionRecord] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!subscriptionRecord) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }

  const invoiceData = {
    subscriptionId: subscriptionRecord.id,
    stripeInvoiceId: invoice.id!,
    stripeInvoiceNumber: invoice.number,
    amountPaid: (invoice as any).amount_paid || 0,
    amountDue: (invoice as any).amount_due || 0,
    currency: invoice.currency || 'usd',
    status: invoice.status || 'draft',
    invoicePdf: (invoice as any).invoice_pdf,
    hostedInvoiceUrl: (invoice as any).hosted_invoice_url,
    periodStart: (invoice as any).period_start
      ? new Date((invoice as any).period_start * 1000)
      : null,
    periodEnd: (invoice as any).period_end ? new Date((invoice as any).period_end * 1000) : null,
    paid: (invoice as any).paid || false,
    attemptCount: (invoice as any).attempt_count || 0,
    updatedAt: new Date(),
  };

  // Try to update existing invoice, otherwise insert
  const [existingInvoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, invoice.id!))
    .limit(1);

  if (existingInvoice) {
    await db.update(invoices).set(invoiceData).where(eq(invoices.stripeInvoiceId, invoice.id!));
  } else {
    await db.insert(invoices).values(invoiceData);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  await db
    .update(invoices)
    .set({
      paid: true,
      status: 'paid',
      updatedAt: new Date(),
    })
    .where(eq(invoices.stripeInvoiceId, invoice.id!));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  await db
    .update(invoices)
    .set({
      paid: false,
      status: 'payment_failed',
      attemptCount: (invoice as any).attempt_count || 0,
      updatedAt: new Date(),
    })
    .where(eq(invoices.stripeInvoiceId, invoice.id!));
}

// This function is now imported from stripe-utils.ts
