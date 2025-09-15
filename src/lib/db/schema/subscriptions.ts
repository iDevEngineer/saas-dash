import { pgTable, text, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './auth';
import { organizations } from './organizations';

export const customers = pgTable('customers', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull(), // active, canceled, past_due, etc.
  planName: text('plan_name').notNull(), // basic, pro, enterprise
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAt: timestamp('cancel_at'),
  canceledAt: timestamp('canceled_at'),
  trialStart: timestamp('trial_start'),
  trialEnd: timestamp('trial_end'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  subscriptionId: text('subscription_id')
    .notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  stripeInvoiceId: text('stripe_invoice_id').notNull().unique(),
  stripeInvoiceNumber: text('stripe_invoice_number'),
  amountPaid: integer('amount_paid').notNull(), // in cents
  amountDue: integer('amount_due').notNull(), // in cents
  currency: text('currency').notNull().default('usd'),
  status: text('status').notNull(), // draft, open, paid, void, uncollectible
  invoicePdf: text('invoice_pdf'),
  hostedInvoiceUrl: text('hosted_invoice_url'),
  periodStart: timestamp('period_start'),
  periodEnd: timestamp('period_end'),
  paid: boolean('paid').notNull().default(false),
  attemptCount: integer('attempt_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  stripePaymentMethodId: text('stripe_payment_method_id').notNull().unique(),
  type: text('type').notNull(), // card, bank_account, etc.
  card: jsonb('card'), // {brand, last4, exp_month, exp_year}
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usageRecords = pgTable('usage_records', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  subscriptionId: text('subscription_id')
    .notNull()
    .references(() => subscriptions.id, { onDelete: 'cascade' }),
  metric: text('metric').notNull(), // api_calls, storage_gb, etc.
  quantity: integer('quantity').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;
