import {
  pgTable,
  text,
  varchar,
  boolean,
  jsonb,
  timestamp,
  integer,
  bigserial,
  inet,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './auth';

// API Keys table
export const apiKeys = pgTable(
  'api_keys',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Key identification and storage
    keyId: varchar('key_id', { length: 32 }).notNull().unique(), // Public key identifier (prefix_keyId)
    keyHash: varchar('key_hash', { length: 256 }).notNull().unique(), // SHA-256 hash of full key
    name: varchar('name', { length: 100 }).notNull(), // Human-readable name
    description: text('description'),

    // Permissions and scope management
    scopes: jsonb('scopes').notNull().default('[]').$type<string[]>(), // Array of allowed scopes
    permissions: jsonb('permissions').notNull().default('{}').$type<Record<string, any>>(), // Granular permissions object

    // Rate limiting metadata
    rateLimitRpm: integer('rate_limit_rpm').default(1000), // Requests per minute
    rateLimitRpd: integer('rate_limit_rpd').default(10000), // Requests per day

    // Security and lifecycle
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }), // Optional expiration
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),

    // Environment and access control
    environment: varchar('environment', { length: 20 }).default('production'), // dev, staging, prod
    ipWhitelist: jsonb('ip_whitelist').$type<string[]>(), // Array of allowed IPs/CIDR blocks

    // Metadata
    metadata: jsonb('metadata').default('{}').$type<Record<string, any>>(), // Additional custom fields
  },
  (table) => ({
    keyIdIdx: index('api_keys_key_id_idx').on(table.keyId),
    keyHashIdx: uniqueIndex('api_keys_key_hash_idx').on(table.keyHash),
    orgIdx: index('api_keys_org_idx').on(table.organizationId),
    userIdx: index('api_keys_user_idx').on(table.userId),
    activeIdx: index('api_keys_active_idx').on(table.isActive),
    expiresIdx: index('api_keys_expires_idx').on(table.expiresAt),
  })
);

// API Usage tracking table
export const apiUsage = pgTable(
  'api_usage',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    apiKeyId: text('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Request details
    endpoint: varchar('endpoint', { length: 255 }).notNull(),
    method: varchar('method', { length: 10 }).notNull(),
    statusCode: integer('status_code').notNull(),
    responseTime: integer('response_time'), // milliseconds

    // Client information
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),

    // Timing and aggregation
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(), // For rate limiting windows

    // Resource usage
    bytesTransferred: integer('bytes_transferred'),
    requestSize: integer('request_size'),

    // Error tracking
    errorCode: varchar('error_code', { length: 50 }),
    errorMessage: text('error_message'),

    // Metadata
    metadata: jsonb('metadata').default('{}').$type<Record<string, any>>(),
  },
  (table) => ({
    keyIdIdx: index('api_usage_key_id_idx').on(table.apiKeyId),
    timestampIdx: index('api_usage_timestamp_idx').on(table.timestamp),
    windowIdx: index('api_usage_window_idx').on(table.windowStart),
    endpointIdx: index('api_usage_endpoint_idx').on(table.endpoint),
    statusIdx: index('api_usage_status_idx').on(table.statusCode),
  })
);

// Rate limiting table
export const rateLimits = pgTable(
  'rate_limits',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    apiKeyId: text('api_key_id')
      .notNull()
      .references(() => apiKeys.id, { onDelete: 'cascade' }),

    // Window tracking
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    windowType: varchar('window_type', { length: 20 }).notNull(), // 'minute', 'hour', 'day'

    // Counters
    requestCount: integer('request_count').default(0).notNull(),
    limitValue: integer('limit_value').notNull(),

    // Token bucket algorithm support
    tokensRemaining: integer('tokens_remaining'),
    lastRefill: timestamp('last_refill', { withTimezone: true }).defaultNow(),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyWindowIdx: uniqueIndex('rate_limits_key_window_idx').on(
      table.apiKeyId,
      table.windowStart,
      table.windowType
    ),
    windowStartIdx: index('rate_limits_window_start_idx').on(table.windowStart),
  })
);

// Relations
export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  usage: many(apiUsage),
  rateLimits: many(rateLimits),
}));

export const apiUsageRelations = relations(apiUsage, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [apiUsage.apiKeyId],
    references: [apiKeys.id],
  }),
  organization: one(organizations, {
    fields: [apiUsage.organizationId],
    references: [organizations.id],
  }),
}));

export const rateLimitsRelations = relations(rateLimits, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [rateLimits.apiKeyId],
    references: [apiKeys.id],
  }),
}));

// Types for TypeScript
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

export type ApiUsage = typeof apiUsage.$inferSelect;
export type NewApiUsage = typeof apiUsage.$inferInsert;

export type RateLimit = typeof rateLimits.$inferSelect;
export type NewRateLimit = typeof rateLimits.$inferInsert;

// Common scopes for API keys
export const API_KEY_SCOPES = [
  'read:users',
  'write:users',
  'read:projects',
  'write:projects',
  'read:organizations',
  'write:organizations',
  'read:webhooks',
  'write:webhooks',
  'read:analytics',
  'admin:organization',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

// Environment types
export const API_KEY_ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export type ApiKeyEnvironment = (typeof API_KEY_ENVIRONMENTS)[number];
