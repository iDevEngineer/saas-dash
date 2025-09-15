import { pgTable, text, integer, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const pricingPlans = pgTable('pricing_plans', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  stripePriceId: text('stripe_price_id'),
  stripeProductId: text('stripe_product_id'),
  price: integer('price').notNull(), // in cents
  currency: text('currency').notNull().default('usd'),
  interval: text('interval').notNull().default('month'), // month, year
  intervalCount: integer('interval_count').notNull().default(1),
  trialPeriodDays: integer('trial_period_days').default(0),
  isPopular: boolean('is_popular').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  features: jsonb('features').notNull(), // Array of feature strings
  metadata: jsonb('metadata'), // Additional configuration
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const pricingFeatures = pgTable('pricing_features', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // e.g., "storage", "api", "support"
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const planFeatures = pgTable('plan_features', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  planId: text('plan_id')
    .notNull()
    .references(() => pricingPlans.id, { onDelete: 'cascade' }),
  featureId: text('feature_id')
    .notNull()
    .references(() => pricingFeatures.id, { onDelete: 'cascade' }),
  value: text('value'), // e.g., "unlimited", "100GB", "24/7"
  isIncluded: boolean('is_included').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type PricingPlan = typeof pricingPlans.$inferSelect;
export type NewPricingPlan = typeof pricingPlans.$inferInsert;
export type PricingFeature = typeof pricingFeatures.$inferSelect;
export type NewPricingFeature = typeof pricingFeatures.$inferInsert;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type NewPlanFeature = typeof planFeatures.$inferInsert;
