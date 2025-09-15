import { pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Organizations table (for multi-tenancy)
export const organizations = pgTable('organizations', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  website: varchar('website', { length: 500 }),
  maxUsers: integer('max_users').default(5),

  // Billing fields (for Stripe integration later)
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Organization members (join table for users and organizations)
export const organizationMembers = pgTable('organization_members', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member').notNull(), // owner, admin, member
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  projects: many(projects),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
}));

// Import to avoid circular dependency
import { users } from './auth';
import { projects } from './projects';
