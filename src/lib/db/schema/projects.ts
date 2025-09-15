import { pgTable, text, timestamp, varchar, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './auth';
import { organizations } from './organizations';

// Project status enum
export const projectStatusEnum = pgEnum('project_status', [
  'draft',
  'active',
  'completed',
  'archived',
  'cancelled',
]);

// Projects table
export const projects = pgTable('projects', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('draft').notNull(),
  organizationId: text('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  priority: integer('priority').default(0), // 0 = low, 1 = medium, 2 = high
  metadata: text('metadata'), // JSON string for flexible data
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  tasks: many(tasks),
}));

// Tasks table (sub-items for projects)
export const tasks = pgTable('tasks', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  completed: timestamp('completed', { withTimezone: true }),
  assigneeId: text('assignee_id').references(() => users.id, { onDelete: 'set null' }),
  order: integer('order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Task relations
export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
}));
