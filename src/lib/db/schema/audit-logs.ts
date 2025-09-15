import {
  pgTable,
  text,
  varchar,
  jsonb,
  timestamp,
  integer,
  bigserial,
  inet,
  date,
  check,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

// Audit events (immutable event store for comprehensive audit trail)
export const auditEvents = pgTable('audit_events', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  eventId: text('event_id')
    .notNull()
    .unique()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Event metadata
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventVersion: varchar('event_version', { length: 10 }).notNull().default('1.0'),
  aggregateId: text('aggregate_id').notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateVersion: integer('aggregate_version').notNull().default(1),

  // Event data
  eventData: jsonb('event_data').notNull().$type<Record<string, any>>(),
  metadata: jsonb('metadata').notNull().default({}).$type<Record<string, any>>(),

  // Actor information
  actorId: text('actor_id'), // User or system that performed the action
  actorType: varchar('actor_type', { length: 50 }).notNull().default('user'),
  sessionId: text('session_id'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),

  // Timing and correlation
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  correlationId: text('correlation_id'), // For tracing related events
  causationId: text('causation_id'), // ID of the event that caused this event

  // Partitioning key
  occurredMonth: date('occurred_month'),
});

// Audit snapshots (for performance optimization)
export const auditSnapshots = pgTable('audit_snapshots', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  aggregateId: text('aggregate_id').notNull(),
  aggregateType: varchar('aggregate_type', { length: 100 }).notNull(),
  aggregateVersion: integer('aggregate_version').notNull(),
  snapshotData: jsonb('snapshot_data').notNull().$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for aggregate + version combination
  aggregateUnique: {
    name: 'audit_snapshots_aggregate_unique',
    columns: [table.aggregateId, table.aggregateVersion],
  },
}));

// Traditional audit log for simple tracking
export const auditLogs = pgTable('audit_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Action details
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: text('record_id').notNull(),
  action: varchar('action', { length: 10 }).notNull(),

  // Change tracking
  oldValues: jsonb('old_values').$type<Record<string, any>>(),
  newValues: jsonb('new_values').$type<Record<string, any>>(),
  changedFields: text('changed_fields').array(),

  // Actor and context
  userId: text('user_id'),
  sessionId: text('session_id'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  apiKeyId: text('api_key_id'),

  // Timing
  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),

  // Partitioning
  performedMonth: date('performed_month'),
});

// Relations
export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditEvents.organizationId],
    references: [organizations.id],
  }),
}));

export const auditSnapshotsRelations = relations(auditSnapshots, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditSnapshots.organizationId],
    references: [organizations.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.organizationId],
    references: [organizations.id],
  }),
}));

// Types for TypeScript
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;

export type AuditSnapshot = typeof auditSnapshots.$inferSelect;
export type NewAuditSnapshot = typeof auditSnapshots.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';
export type ActorType = 'user' | 'system' | 'api_key' | 'webhook';