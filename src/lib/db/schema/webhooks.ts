import {
  pgTable,
  text,
  varchar,
  boolean,
  jsonb,
  timestamp,
  integer,
  uuid,
  date,
  bigserial,
  inet,
  check,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

// Webhook endpoints registration
export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  secretToken: text('secret_token').notNull(),
  eventTypes: text('event_types').array().notNull(),
  isActive: boolean('is_active').notNull().default(true),
  retryPolicy: jsonb('retry_policy')
    .notNull()
    .$type<{ maxAttempts: number; backoffFactor: number }>()
    .default({ maxAttempts: 3, backoffFactor: 2 }),
  headers: jsonb('headers').$type<Record<string, string>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for org + name combination
  orgNameUnique: {
    name: 'webhook_endpoints_org_name_unique',
    columns: [table.organizationId, table.name],
  },
}));

// Webhook events (source events that trigger webhooks)
export const webhookEvents = pgTable('webhook_events', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventVersion: varchar('event_version', { length: 10 }).notNull().default('1.0'),
  aggregateId: text('aggregate_id').notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull().$type<Record<string, any>>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdMonth: date('created_month'),
});

// Webhook delivery attempts
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  webhookEndpointId: text('webhook_endpoint_id')
    .notNull()
    .references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
  webhookEventId: text('webhook_event_id')
    .notNull()
    .references(() => webhookEvents.id, { onDelete: 'cascade' }),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Delivery tracking
  attemptNumber: integer('attempt_number').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  httpStatusCode: integer('http_status_code'),
  responseBody: text('response_body'),
  responseHeaders: jsonb('response_headers').$type<Record<string, string>>(),
  errorMessage: text('error_message'),

  // Timing information
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdMonth: date('created_month'),
});

// Relations
export const webhookEndpointsRelations = relations(webhookEndpoints, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhookEndpoints.organizationId],
    references: [organizations.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookEventsRelations = relations(webhookEvents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [webhookEvents.organizationId],
    references: [organizations.id],
  }),
  deliveries: many(webhookDeliveries),
}));

export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  organization: one(organizations, {
    fields: [webhookDeliveries.organizationId],
    references: [organizations.id],
  }),
  endpoint: one(webhookEndpoints, {
    fields: [webhookDeliveries.webhookEndpointId],
    references: [webhookEndpoints.id],
  }),
  event: one(webhookEvents, {
    fields: [webhookDeliveries.webhookEventId],
    references: [webhookEvents.id],
  }),
}));

// Types for TypeScript
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

export type WebhookStatus = 'pending' | 'success' | 'failed' | 'retrying';