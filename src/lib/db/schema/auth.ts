import { pgTable, text, timestamp, boolean, pgEnum, varchar } from 'drizzle-orm/pg-core';

// Role enum
export const roleEnum = pgEnum('role', ['user', 'admin', 'super_admin']);

// Users table
export const users = pgTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: text('password'), // For credential auth
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  role: roleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Sessions table (for Better Auth)
export const sessions = pgTable('sessions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Accounts table (for Better Auth - OAuth and Credentials)
export const accounts = pgTable('accounts', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(), // The account ID from provider or user ID for credentials
  providerId: text('provider_id').notNull(), // 'credential', 'github', 'google', etc.
  // Legacy fields for compatibility
  provider: varchar('provider', { length: 255 }).notNull(), // Same as providerId
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(), // Same as accountId
  // Token fields
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  // Legacy expires_at for compatibility
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  tokenType: varchar('token_type', { length: 255 }),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  // Password field for credential accounts
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Verification table (for Better Auth)
export const verification = pgTable('verification', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Password reset tokens
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  used: boolean('used').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
