import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const emailSettings = pgTable('email_settings', {
  id: text('id').primaryKey().default('default'),
  fromEmail: text('from_email').notNull().default('noreply@example.com'),
  provider: text('provider').notNull().default('resend'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type EmailSettings = typeof emailSettings.$inferSelect;
export type InsertEmailSettings = typeof emailSettings.$inferInsert;
